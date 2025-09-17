import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

export class AuditService {
  // إنشاء سجل تدقيق جديد
  static async createAuditLog(data: AuditLogData) {
    try {
      const auditLog = await prisma.auditLog.create({
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
      return auditLog
    } catch (error) {
      console.error('Error creating audit log:', error)
      throw new Error('فشل في إنشاء سجل التدقيق')
    }
  }

  // الحصول على سجلات التدقيق مع التصفح
  static async getAuditLogs(page: number = 1, limit: number = 50, filters?: {
    action?: string
    entityType?: string
    userId?: string
    dateFrom?: Date
    dateTo?: Date
  }) {
    try {
      const skip = (page - 1) * limit
      
      const where: any = {}
      
      if (filters?.action) {
        where.action = { contains: filters.action, mode: 'insensitive' }
      }
      
      if (filters?.entityType) {
        where.entityType = { contains: filters.entityType, mode: 'insensitive' }
      }
      
      if (filters?.userId) {
        where.userId = filters.userId
      }
      
      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {}
        if (filters.dateFrom) {
          where.createdAt.gte = filters.dateFrom
        }
        if (filters.dateTo) {
          where.createdAt.lte = filters.dateTo
        }
      }

      const [auditLogs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.auditLog.count({ where })
      ])

      return {
        data: auditLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      throw new Error('فشل في تحميل سجلات التدقيق')
    }
  }

  // الحصول على سجل تدقيق محدد
  static async getAuditLogById(id: string) {
    try {
      const auditLog = await prisma.auditLog.findUnique({
        where: { id }
      })
      return auditLog
    } catch (error) {
      console.error('Error fetching audit log:', error)
      throw new Error('فشل في تحميل سجل التدقيق')
    }
  }

  // حذف سجلات التدقيق القديمة
  static async deleteOldAuditLogs(daysToKeep: number = 90) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      })

      return result.count
    } catch (error) {
      console.error('Error deleting old audit logs:', error)
      throw new Error('فشل في حذف سجلات التدقيق القديمة')
    }
  }

  // إحصائيات سجل التدقيق
  static async getAuditStats() {
    try {
      const [
        totalLogs,
        todayLogs,
        actionStats,
        entityStats
      ] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
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
        })
      ])

      return {
        totalLogs,
        todayLogs,
        actionStats,
        entityStats
      }
    } catch (error) {
      console.error('Error fetching audit stats:', error)
      throw new Error('فشل في تحميل إحصائيات سجل التدقيق')
    }
  }
}