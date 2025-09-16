export interface BackupData {
  version: string
  timestamp: string
  tables: {
    [tableName: string]: Record<string, unknown>[]
  }
  metadata: {
    totalRecords: number
    tablesCount: number
    databaseVersion: string
  }
}

export interface BackupOptions {
  includeData?: boolean
  includeSchema?: boolean
  compress?: boolean
  tables?: string[]
}

export const createBackup = async (options: BackupOptions = {}): Promise<BackupData> => {
  const {
    includeData = true,
    includeSchema = true,
    compress = false,
    tables = [],
  } = options

  try {
    // Get all table data
    const tableData: { [tableName: string]: Record<string, unknown>[] } = {}
    let totalRecords = 0

    // List of all tables in the system
    const allTables = [
      'customers',
      'units',
      'contracts',
      'partners',
      'safes',
      'vouchers',
      'installments',
      'transfers',
      'brokers',
      'brokerDues',
      'partnerDebts',
      'partnerGroups',
      'partnerGroupPartners',
      'unitPartnerGroups',
      'auditLogs',
      'settings',
      'keyVals',
      'users',
      'notifications',
    ]

    const tablesToBackup = tables.length > 0 ? tables : allTables

    for (const tableName of tablesToBackup) {
      try {
        const response = await fetch(`/api/backup/${tableName}`)
        if (response.ok) {
          const data = await response.json()
          tableData[tableName] = data.data || []
          totalRecords += data.data?.length || 0
        }
      } catch (error) {
        console.warn(`Failed to backup table ${tableName}:`, error)
        tableData[tableName] = []
      }
    }

    const backupData: BackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      tables: tableData,
      metadata: {
        totalRecords,
        tablesCount: Object.keys(tableData).length,
        databaseVersion: '1.0.0',
      },
    }

    return backupData
  } catch (error) {
    throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const downloadBackup = (backupData: BackupData, filename?: string) => {
  const dataStr = JSON.stringify(backupData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = filename || `backup_${new Date().toISOString().split('T')[0]}.json`
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export const uploadBackup = (file: File): Promise<BackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const backupData = JSON.parse(content) as BackupData
        
        // Validate backup data structure
        if (!backupData.version || !backupData.timestamp || !backupData.tables) {
          throw new Error('Invalid backup file format')
        }
        
        resolve(backupData)
      } catch (error) {
        reject(new Error(`Failed to parse backup file: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read backup file'))
    }
    
    reader.readAsText(file)
  })
}

export const restoreBackup = async (backupData: BackupData): Promise<void> => {
  try {
    // Validate backup data
    if (!backupData.tables || Object.keys(backupData.tables).length === 0) {
      throw new Error('No data found in backup file')
    }

    // Restore each table
    for (const [tableName, records] of Object.entries(backupData.tables)) {
      if (records.length === 0) continue

      try {
        const response = await fetch(`/api/backup/restore/${tableName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: records }),
        })

        if (!response.ok) {
          throw new Error(`Failed to restore table ${tableName}`)
        }
      } catch (error) {
        console.warn(`Failed to restore table ${tableName}:`, error)
        // Continue with other tables
      }
    }
  } catch (error) {
    throw new Error(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const validateBackup = (backupData: BackupData): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!backupData.version) {
    errors.push('Backup version is missing')
  }

  if (!backupData.timestamp) {
    errors.push('Backup timestamp is missing')
  }

  if (!backupData.tables || typeof backupData.tables !== 'object') {
    errors.push('Backup tables data is missing or invalid')
  }

  if (!backupData.metadata) {
    errors.push('Backup metadata is missing')
  }

  if (backupData.metadata && typeof backupData.metadata.totalRecords !== 'number') {
    errors.push('Invalid total records count')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export const getBackupInfo = (backupData: BackupData) => {
  return {
    version: backupData.version,
    timestamp: new Date(backupData.timestamp).toLocaleDateString('ar-EG'),
    totalRecords: backupData.metadata?.totalRecords || 0,
    tablesCount: backupData.metadata?.tablesCount || 0,
    tables: Object.keys(backupData.tables || {}),
  }
}