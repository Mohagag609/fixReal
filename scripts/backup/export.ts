#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as tar from 'tar'
// Simple database manager for scripts
const getDatabaseConfig = () => {
  const databaseType = process.env.DATABASE_TYPE as 'postgresql-cloud' | 'postgresql-local' | 'sqlite'
  
  if (!databaseType) {
    throw new Error('DATABASE_TYPE environment variable is required')
  }

  let url: string
  let provider: 'postgresql' | 'sqlite'

  switch (databaseType) {
    case 'postgresql-cloud':
      url = process.env.DATABASE_URL_POSTGRES_CLOUD || process.env.DATABASE_URL || ''
      provider = 'postgresql'
      break
    case 'postgresql-local':
      url = process.env.DATABASE_URL_POSTGRES_LOCAL || process.env.DATABASE_URL || ''
      provider = 'postgresql'
      break
    case 'sqlite':
      url = process.env.DATABASE_URL_SQLITE || process.env.DATABASE_URL || ''
      provider = 'sqlite'
      break
    default:
      throw new Error(`Unsupported DATABASE_TYPE: ${databaseType}`)
  }

  if (!url) {
    throw new Error(`Database URL not found for type: ${databaseType}`)
  }

  return { type: databaseType, url, provider }
}

// TODO: Update this list when adding new models to schema.prisma
// You can also extract this automatically from the schema if needed
const MODELS = [
  'User',
  'Customer', 
  'Unit',
  'Contract',
  'Installment',
  'Voucher',
  'Safe',
  'Partner',
  'Broker',
  'Transfer',
  'UnitPartner',
  'BrokerDue',
  'PartnerDebt',
  'PartnerGroup',
  'PartnerGroupPartner',
  'AuditLog'
] as const

// type ModelName = typeof MODELS[number]

interface BackupManifest {
  backup_version: string
  app_version: string
  schema: {
    provider: 'postgresql' | 'sqlite'
    prisma_migration_id: string
    models: readonly string[]
  }
  database_type: string
  created_at: string
  count_by_model: Record<string, number>
}

interface ExportOptions {
  outputDir?: string
  batchSize?: number
}

export async function runExport(options: ExportOptions = {}): Promise<string> {
  const { outputDir = './backups', batchSize = 1000 } = options
  
  console.log('🚀 Starting database export...')
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const config = getDatabaseConfig()
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.url
      }
    }
  })
  
  console.log(`📊 Database type: ${config.type}`)
  console.log(`🔗 Provider: ${config.provider}`)

  // Create temporary directory for backup data
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const tempDir = path.join(outputDir, `backup-${config.type}-${timestamp}`)
  const dataDir = path.join(tempDir, 'data')
  
  fs.mkdirSync(dataDir, { recursive: true })

  const countByModel: Record<string, number> = {}

  try {
    // Export each model
    for (const modelName of MODELS) {
      console.log(`📦 Exporting ${modelName}...`)
      
      const model = (prisma as any)[modelName.toLowerCase()]
      if (!model) {
        console.warn(`⚠️  Model ${modelName} not found in Prisma client`)
        continue
      }

      const filePath = path.join(dataDir, `${modelName}.ndjson`)
      const writeStream = fs.createWriteStream(filePath)
      
      let totalCount = 0
      let skip = 0
      let hasMore = true

      while (hasMore) {
        const records = await model.findMany({
          skip,
          take: batchSize,
          orderBy: { id: 'asc' }
        })

        if (records.length === 0) {
          hasMore = false
        } else {
          for (const record of records) {
            writeStream.write(JSON.stringify(record) + '\n')
            totalCount++
          }
          skip += batchSize
        }
      }

      writeStream.end()
      countByModel[modelName] = totalCount
      console.log(`✅ ${modelName}: ${totalCount} records`)
    }

    // Create manifest
    const manifest: BackupManifest = {
      backup_version: '1.1.0',
      app_version: process.env.APP_VERSION || 'dev',
      schema: {
        provider: config.provider,
        prisma_migration_id: process.env.PRISMA_MIGRATION_ID || 'unknown',
        models: MODELS
      },
      database_type: config.type,
      created_at: new Date().toISOString(),
      count_by_model: countByModel
    }

    const manifestPath = path.join(tempDir, 'manifest.json')
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

    // Create tar.gz archive
    const archivePath = path.join(outputDir, `backup-${config.type}-${timestamp}.tar.gz`)
    console.log('📦 Creating archive...')
    
    await tar.create(
      {
        gzip: true,
        file: archivePath,
        cwd: tempDir
      },
      ['.']
    )

    // Clean up temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true })

    const stats = fs.statSync(archivePath)
    console.log(`✅ Export completed: ${archivePath}`)
    console.log(`📊 Archive size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`📈 Total records: ${Object.values(countByModel).reduce((a, b) => a + b, 0)}`)

    return archivePath

  } catch (error) {
    console.error('❌ Export failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2)
  const outputDir = args[0] || './backups'
  
  runExport({ outputDir })
    .then((archivePath) => {
      console.log(`🎉 Backup created: ${archivePath}`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Export failed:', error)
      process.exit(1)
    })
}