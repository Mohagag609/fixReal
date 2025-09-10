// Audit trail utilities

import { prisma } from './db'

export interface AuditLogData {
  action: string
  entityType: string
  entityId: string
  oldValues?: any
  newValues?: any
  userId?: string
  ipAddress?: string
  userAgent?: string
}

// Create audit log entry
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
        newValues: data.newValues ? JSON.stringify(data.newValues) : null,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }
    })
  } catch (error) {
    console.error('Error creating audit log:', error)
    // Don't throw error to avoid breaking the main operation
  }
}

// Get audit logs with pagination
export async function getAuditLogs(
  page: number = 1,
  limit: number = 50,
  filters: {
    action?: string
    entityType?: string
    entityId?: string
    userId?: string
    fromDate?: string
    toDate?: string
  } = {}
): Promise<{ data: any[]; total: number; totalPages: number }> {
  try {
    const skip = (page - 1) * limit
    
    const whereClause: any = {}
    
    if (filters.action) {
      whereClause.action = { contains: filters.action, mode: 'insensitive' }
    }
    
    if (filters.entityType) {
      whereClause.entityType = filters.entityType
    }
    
    if (filters.entityId) {
      whereClause.entityId = filters.entityId
    }
    
    if (filters.userId) {
      whereClause.userId = filters.userId
    }
    
    if (filters.fromDate || filters.toDate) {
      whereClause.createdAt = {}
      if (filters.fromDate) {
        whereClause.createdAt.gte = new Date(filters.fromDate)
      }
      if (filters.toDate) {
        whereClause.createdAt.lte = new Date(filters.toDate)
      }
    }
    
    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where: whereClause })
    ])
    
    const totalPages = Math.ceil(total / limit)
    
    return { data, total, totalPages }
  } catch (error) {
    console.error('Error getting audit logs:', error)
    throw error
  }
}

// Get audit logs for specific entity
export async function getEntityAuditLogs(
  entityType: string,
  entityId: string,
  page: number = 1,
  limit: number = 50
): Promise<{ data: any[]; total: number; totalPages: number }> {
  return getAuditLogs(page, limit, { entityType, entityId })
}

// Get audit log by ID
export async function getAuditLogById(id: string): Promise<any | null> {
  try {
    const auditLog = await prisma.auditLog.findUnique({
      where: { id }
    })
    
    return auditLog
  } catch (error) {
    console.error('Error getting audit log by ID:', error)
    throw error
  }
}

// Get audit statistics
export async function getAuditStats(): Promise<{
  totalLogs: number
  logsByAction: { action: string; count: number }[]
  logsByEntityType: { entityType: string; count: number }[]
  recentActivity: any[]
}> {
  try {
    const [
      totalLogs,
      logsByAction,
      logsByEntityType,
      recentActivity
    ] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      prisma.auditLog.groupBy({
        by: ['entityType'],
        _count: { entityType: true },
        orderBy: { _count: { entityType: 'desc' } },
        take: 10
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      })
    ])

    return {
      totalLogs,
      logsByAction: logsByAction.map(item => ({
        action: item.action,
        count: item._count.action
      })),
      logsByEntityType: logsByEntityType.map(item => ({
        entityType: item.entityType,
        count: item._count.entityType
      })),
      recentActivity
    }
  } catch (error) {
    console.error('Error getting audit stats:', error)
    throw error
  }
}

// Audit log filter type
export interface AuditLogFilter {
  action?: string
  entityType?: string
  entityId?: string
  userId?: string
  fromDate?: string
  toDate?: string
}

// Export audit logs to CSV
export async function exportAuditLogsToCSV(
  filters: {
    action?: string
    entityType?: string
    entityId?: string
    userId?: string
    fromDate?: string
    toDate?: string
  } = {}
): Promise<string> {
  try {
    const whereClause: any = {}
    
    if (filters.action) {
      whereClause.action = { contains: filters.action, mode: 'insensitive' }
    }
    
    if (filters.entityType) {
      whereClause.entityType = filters.entityType
    }
    
    if (filters.entityId) {
      whereClause.entityId = filters.entityId
    }
    
    if (filters.userId) {
      whereClause.userId = filters.userId
    }
    
    if (filters.fromDate || filters.toDate) {
      whereClause.createdAt = {}
      if (filters.fromDate) {
        whereClause.createdAt.gte = new Date(filters.fromDate)
      }
      if (filters.toDate) {
        whereClause.createdAt.lte = new Date(filters.toDate)
      }
    }
    
    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })
    
    // Convert to CSV
    const headers = ['التاريخ', 'الإجراء', 'نوع الكيان', 'معرف الكيان', 'المستخدم', 'العنوان', 'المتصفح']
    const rows = logs.map(log => [
      log.createdAt.toISOString(),
      log.action,
      log.entityType,
      log.entityId,
      log.userId || '',
      log.ipAddress || '',
      log.userAgent || ''
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    return csvContent
  } catch (error) {
    console.error('Error exporting audit logs to CSV:', error)
    throw error
  }
}

// Helper function to get request info for audit
export function getRequestInfo(request: Request): {
  ipAddress?: string
  userAgent?: string
} {
  const headers = request.headers
  return {
    ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || undefined,
    userAgent: headers.get('user-agent') || undefined
  }
}