// Monitoring and health check utilities

import { prisma } from './db'
import { createCriticalNotification, createImportantNotification } from './notifications'

// ملاحظة: كاش بسيط في الذاكرة لتقليل استدعاءات قاعدة البيانات المتكررة.
// هذا مجرد حل قصير الأجل داخل نفس العملية — إن أردت مشاركة الكاش بين إنستانسات
// استخدم Redis أو حل خارجي.
type CacheEntry<T> = { value: T; expiresAt: number }
const _monitorCache = new Map<string, CacheEntry<any>>()

function getFromCache<T>(key: string): T | undefined {
  const entry = _monitorCache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    _monitorCache.delete(key)
    return undefined
  }
  return entry.value as T
}

function setCache<T>(key: string, value: T, ttlMs = 1000 * 30) {
  _monitorCache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    database: { status: 'pass' | 'fail'; responseTime: number; error?: string | undefined }
    memory: { status: 'pass' | 'fail'; usage: number; error?: string | undefined }
    disk: { status: 'pass' | 'fail'; usage: number; error?: string | undefined }
  }
  timestamp: string
  uptime: number
}

export interface Metrics {
  totalRequests: number
  averageResponseTime: number
  errorRate: number
  activeUsers: number
  databaseConnections: number
  memoryUsage: number
  diskUsage: number
  lastBackupDate?: string | undefined
  totalRecords: number
}

// Perform health check
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const checks = {
    database: { status: 'pass' as 'pass' | 'fail', responseTime: 0, error: undefined as string | undefined },
    memory: { status: 'pass' as 'pass' | 'fail', usage: 0, error: undefined as string | undefined },
    disk: { status: 'pass' as 'pass' | 'fail', usage: 0, error: undefined as string | undefined }
  }
  
  // Database check
  try {
    const dbStartTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.database.responseTime = Date.now() - dbStartTime
    
    if (checks.database.responseTime > 1000) {
      checks.database.status = 'fail'
      checks.database.error = 'Database response time too high'
    }
  } catch (error) {
    checks.database.status = 'fail'
    checks.database.error = 'Database connection failed'
  }
  
  // Memory check
  try {
    const memUsage = process.memoryUsage()
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
    checks.memory.usage = memUsagePercent
    
    if (memUsagePercent > 90) {
      checks.memory.status = 'fail'
      checks.memory.error = 'Memory usage too high'
    }
  } catch (error) {
    checks.memory.status = 'fail'
    checks.memory.error = 'Memory check failed'
  }
  
  // Disk check (simplified)
  try {
    // This is a simplified disk check - in production you'd use fs.stat
    checks.disk.usage = 50 // Placeholder
  } catch (error) {
    checks.disk.status = 'fail'
    checks.disk.error = 'Disk check failed'
  }
  
  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  if (checks.database.status === 'fail') {
    status = 'unhealthy'
  } else if (checks.memory.status === 'fail' || checks.disk.status === 'fail') {
    status = 'degraded'
  }
  
  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }
}

// Get system metrics
export async function getSystemMetrics(): Promise<Metrics> {
  // FIXED: استخدم كاش قصير الأمد لخفض استدعاءات DB المتكررة من واجهات المراقبة
  const cacheKey = 'system:metrics'
  const cached = getFromCache<Metrics>(cacheKey)
  if (cached) return cached

  try {
    const [
      totalRecords,
      activeUsers,
      lastBackup
    ] = await Promise.all([
      getTotalRecordsCount(),
      getActiveUsersCount(),
      getLastBackupDate()
    ])

    const memUsage = process.memoryUsage()
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100

    const result: Metrics = {
      totalRequests: 0, // Would be tracked in production
      averageResponseTime: 0, // Would be tracked in production
      errorRate: 0, // Would be tracked in production
      activeUsers,
      databaseConnections: 1, // Simplified
      memoryUsage: memUsagePercent,
      diskUsage: 50, // Placeholder
      lastBackupDate: lastBackup,
      totalRecords
    }

    // Cache for 20 seconds by default to reduce load
    setCache(cacheKey, result, 1000 * 20)
    return result
  } catch (error) {
    console.error('Error getting system metrics:', error)
    throw error
  }
}

// Get total records count
async function getTotalRecordsCount(): Promise<number> {
  try {
    const [
      customerCount,
      unitCount,
      partnerCount,
      contractCount,
      installmentCount,
      voucherCount
    ] = await Promise.all([
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.unit.count({ where: { deletedAt: null } }),
      prisma.partner.count({ where: { deletedAt: null } }),
      prisma.contract.count({ where: { deletedAt: null } }),
      prisma.installment.count({ where: { deletedAt: null } }),
      prisma.voucher.count({ where: { deletedAt: null } })
    ])
    
    return customerCount + unitCount + partnerCount + contractCount + installmentCount + voucherCount
  } catch (error) {
    console.error('Error getting total records count:', error)
    return 0
  }
}

// Get active users count
async function getActiveUsersCount(): Promise<number> {
  try {
    return await prisma.user.count({ where: { isActive: true } })
  } catch (error) {
    console.error('Error getting active users count:', error)
    return 0
  }
}

// Get last backup date
async function getLastBackupDate(): Promise<string | undefined> {
  const cacheKey = 'system:last_backup'
  const cached = getFromCache<string | undefined>(cacheKey)
  if (cached) return cached

  try {
    // This would be stored in settings or a separate backup log table
    const setting = await prisma.settings.findUnique({
      where: { key: 'last_backup_date' }
    })
    const value = setting?.value || undefined
    // Cache backups for longer (e.g., 15 minutes)
    setCache(cacheKey, value, 1000 * 60 * 15)
    return value
  } catch (error) {
    console.error('Error getting last backup date:', error)
    return undefined
  }
}

// Monitor system health
export async function monitorSystemHealth(): Promise<void> {
  try {
    const healthCheck = await performHealthCheck()
    
    if (healthCheck.status === 'unhealthy') {
      await createCriticalNotification(
        'نظام غير صحي',
        'النظام في حالة غير صحية - تحقق من قاعدة البيانات',
        'system',
        { healthCheck }
      )
    } else if (healthCheck.status === 'degraded') {
      await createImportantNotification(
        'نظام متدهور',
        'النظام في حالة متدهورة - تحقق من الذاكرة أو القرص',
        'system',
        { healthCheck }
      )
    }
  } catch (error) {
    console.error('Error monitoring system health:', error)
  }
}

// Check database connectivity
export async function checkDatabaseConnectivity(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connectivity check failed:', error)
    return false
  }
}

// Check data integrity
export async function checkDataIntegrity(): Promise<{
  isValid: boolean
  issues: string[]
}> {
  const issues: string[] = []
  
  try {
    // Check for orphaned records
    const orphanedContracts = await prisma.contract.findMany({
      where: {
        OR: [
          { unit: { deletedAt: { not: null } } },
          { customer: { deletedAt: { not: null } } }
        ]
      }
    })
    
    if (orphanedContracts.length > 0) {
      issues.push(`Found ${orphanedContracts.length} orphaned contracts`)
    }
    
    // Check for negative balances
    const negativeBalances = await prisma.safe.findMany({
      where: { balance: { lt: 0 } }
    })
    
    if (negativeBalances.length > 0) {
      issues.push(`Found ${negativeBalances.length} safes with negative balance`)
    }
    
    // Check for invalid percentages
    const invalidPercentages = await prisma.unitPartner.findMany({
      where: {
        OR: [
          { percentage: { lt: 0 } },
          { percentage: { gt: 100 } }
        ]
      }
    })
    
    if (invalidPercentages.length > 0) {
      issues.push(`Found ${invalidPercentages.length} unit partners with invalid percentages`)
    }
    
    return {
      isValid: issues.length === 0,
      issues
    }
  } catch (error) {
    console.error('Error checking data integrity:', error)
    return {
      isValid: false,
      issues: ['Error checking data integrity']
    }
  }
}

// Performance monitoring
export async function monitorPerformance(): Promise<{
  averageResponseTime: number
  slowQueries: string[]
  memoryUsage: number
}> {
  try {
    const memUsage = process.memoryUsage()
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100
    
    return {
      averageResponseTime: 0, // Would be tracked in production
      slowQueries: [], // Would be tracked in production
      memoryUsage: memUsagePercent
    }
  } catch (error) {
    console.error('Error monitoring performance:', error)
    return {
      averageResponseTime: 0,
      slowQueries: [],
      memoryUsage: 0
    }
  }
}