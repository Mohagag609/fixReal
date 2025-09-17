import { Request, Response, NextFunction } from 'express'
import { AuditService } from '../services/auditService'

export interface AuditRequest extends Request {
  auditData?: {
    action: string
    entityType: string
    entityId: string
    oldValues?: any
    newValues?: any
  }
}

// Middleware لتسجيل العمليات تلقائياً
export const auditMiddleware = (entityType: string) => {
  return (req: AuditRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send

    res.send = function(data: any) {
      // تسجيل العملية بعد نجاحها
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const auditData = req.auditData
          if (auditData) {
            AuditService.createAuditLog({
              action: auditData.action,
              entityType: auditData.entityType,
              entityId: auditData.entityId,
              oldValues: auditData.oldValues,
              newValues: auditData.newValues,
              userId: (req as any).user?.id,
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('User-Agent')
            }).catch(error => {
              console.error('Audit logging error:', error)
            })
          }
        } catch (error) {
          console.error('Audit middleware error:', error)
        }
      }

      return originalSend.call(this, data)
    }

    next()
  }
}

// Helper function لتحديد نوع العملية
export const getActionType = (method: string, endpoint: string): string => {
  switch (method) {
    case 'POST':
      return 'CREATE'
    case 'PUT':
    case 'PATCH':
      return 'UPDATE'
    case 'DELETE':
      return 'DELETE'
    case 'GET':
      if (endpoint.includes('/stats') || endpoint.includes('/overview')) {
        return 'VIEW_STATS'
      }
      return 'VIEW'
    default:
      return 'UNKNOWN'
  }
}

// Helper function لتحديد نوع الكيان
export const getEntityType = (endpoint: string): string => {
  if (endpoint.includes('/customers')) return 'Customer'
  if (endpoint.includes('/units')) return 'Unit'
  if (endpoint.includes('/contracts')) return 'Contract'
  if (endpoint.includes('/brokers')) return 'Broker'
  if (endpoint.includes('/partners')) return 'Partner'
  if (endpoint.includes('/safes')) return 'Safe'
  if (endpoint.includes('/vouchers')) return 'Voucher'
  if (endpoint.includes('/installments')) return 'Installment'
  if (endpoint.includes('/transfers')) return 'Transfer'
  if (endpoint.includes('/audit')) return 'AuditLog'
  return 'Unknown'
}