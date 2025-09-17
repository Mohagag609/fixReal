import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

export interface SystemStats {
  users: {
    total: number
    active: number
    inactive: number
    newToday: number
  }
  data: {
    customers: number
    units: number
    contracts: number
    transactions: number
    invoices: number
    partners: number
    brokers: number
  }
  performance: {
    averageResponseTime: number
    errorRate: number
    uptime: number
    memoryUsage: number
    cpuUsage: number
  }
  storage: {
    databaseSize: number
    fileStorageSize: number
    backupSize: number
    totalSize: number
  }
  security: {
    failedLogins: number
    blockedIPs: number
    securityAlerts: number
    lastSecurityScan: Date
  }
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  components: {
    database: 'healthy' | 'warning' | 'critical'
    api: 'healthy' | 'warning' | 'critical'
    storage: 'healthy' | 'warning' | 'critical'
    security: 'healthy' | 'warning' | 'critical'
  }
  issues: string[]
  recommendations: string[]
  lastChecked: Date
}

export interface SystemLog {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'critical'
  component: string
  message: string
  details?: any
  userId?: string
  ipAddress?: string
}

export class AdminService {
  // الحصول على إحصائيات النظام
  static async getSystemStats(): Promise<SystemStats> {
    try {
      // إحصائيات المستخدمين
      const users = await prisma.user.findMany()
      const activeUsers = users.filter(u => u.isActive)
      const newUsersToday = users.filter(u => {
        const today = new Date()
        const userDate = new Date(u.createdAt)
        return userDate.toDateString() === today.toDateString()
      })

      // إحصائيات البيانات
      const customers = await prisma.customer.count()
      const units = await prisma.unit.count()
      const contracts = await prisma.contract.count()
      const transactions = await prisma.transaction.count()
      const invoices = await prisma.invoice.count()
      const partners = await prisma.partner.count()
      const brokers = await prisma.broker.count()

      // إحصائيات الأداء (مبسطة)
      const performance = {
        averageResponseTime: 0,
        errorRate: 0,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0
      }

      // إحصائيات التخزين
      const storage = await this.getStorageStats()

      // إحصائيات الأمان
      const security = await this.getSecurityStats()

      return {
        users: {
          total: users.length,
          active: activeUsers.length,
          inactive: users.length - activeUsers.length,
          newToday: newUsersToday.length
        },
        data: {
          customers,
          units,
          contracts,
          transactions,
          invoices,
          partners,
          brokers
        },
        performance,
        storage,
        security
      }
    } catch (error) {
      console.error('Error getting system stats:', error)
      throw new Error('فشل في الحصول على إحصائيات النظام')
    }
  }

  // الحصول على صحة النظام
  static async getSystemHealth(): Promise<SystemHealth> {
    try {
      const issues: string[] = []
      const recommendations: string[] = []
      
      // فحص قاعدة البيانات
      const dbHealth = await this.checkDatabaseHealth()
      
      // فحص API
      const apiHealth = await this.checkApiHealth()
      
      // فحص التخزين
      const storageHealth = await this.checkStorageHealth()
      
      // فحص الأمان
      const securityHealth = await this.checkSecurityHealth()
      
      // تحديد الحالة العامة
      const components = {
        database: dbHealth.status,
        api: apiHealth.status,
        storage: storageHealth.status,
        security: securityHealth.status
      }
      
      // جمع المشاكل والتوصيات
      issues.push(...dbHealth.issues, ...apiHealth.issues, ...storageHealth.issues, ...securityHealth.issues)
      recommendations.push(...dbHealth.recommendations, ...apiHealth.recommendations, ...storageHealth.recommendations, ...securityHealth.recommendations)
      
      // تحديد الحالة العامة
      let status: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (Object.values(components).includes('critical')) {
        status = 'critical'
      } else if (Object.values(components).includes('warning')) {
        status = 'warning'
      }
      
      return {
        status,
        components,
        issues,
        recommendations,
        lastChecked: new Date()
      }
    } catch (error) {
      console.error('Error getting system health:', error)
      throw new Error('فشل في فحص صحة النظام')
    }
  }

  // فحص صحة قاعدة البيانات
  private static async checkDatabaseHealth() {
    try {
      await prisma.$queryRaw`SELECT 1`
      
      // فحص عدد الاتصالات
      const connections = await prisma.$queryRaw`SELECT count(*) as count FROM pg_stat_activity`
      const connectionCount = (connections as any)[0]?.count || 0
      
      const issues: string[] = []
      const recommendations: string[] = []
      
      if (connectionCount > 50) {
        issues.push('عدد اتصالات قاعدة البيانات مرتفع')
        recommendations.push('تحقق من إعدادات اتصال قاعدة البيانات')
      }
      
      return {
        status: issues.length > 0 ? 'warning' : 'healthy' as 'healthy' | 'warning' | 'critical',
        issues,
        recommendations
      }
    } catch (error) {
      return {
        status: 'critical' as 'healthy' | 'warning' | 'critical',
        issues: ['فشل في الاتصال بقاعدة البيانات'],
        recommendations: ['تحقق من إعدادات قاعدة البيانات']
      }
    }
  }

  // فحص صحة API
  private static async checkApiHealth() {
    try {
      // فحص الذاكرة
      const memoryUsage = process.memoryUsage()
      const totalMemory = require('os').totalmem()
      const memoryPercent = (memoryUsage.heapUsed / totalMemory) * 100
      
      const issues: string[] = []
      const recommendations: string[] = []
      
      if (memoryPercent > 90) {
        issues.push('استخدام الذاكرة مرتفع جداً')
        recommendations.push('فكر في زيادة الذاكرة أو تحسين الكود')
      }
      
      return {
        status: issues.length > 0 ? 'warning' : 'healthy' as 'healthy' | 'warning' | 'critical',
        issues,
        recommendations
      }
    } catch (error) {
      return {
        status: 'critical' as 'healthy' | 'warning' | 'critical',
        issues: ['فشل في فحص صحة API'],
        recommendations: ['تحقق من حالة الخدمة']
      }
    }
  }

  // فحص صحة التخزين
  private static async checkStorageHealth() {
    try {
      const storage = await this.getStorageStats()
      const usagePercent = (storage.used / storage.total) * 100
      
      const issues: string[] = []
      const recommendations: string[] = []
      
      if (usagePercent > 90) {
        issues.push('مساحة التخزين منخفضة')
        recommendations.push('فكر في تنظيف الملفات أو زيادة مساحة التخزين')
      }
      
      return {
        status: issues.length > 0 ? 'warning' : 'healthy' as 'healthy' | 'warning' | 'critical',
        issues,
        recommendations
      }
    } catch (error) {
      return {
        status: 'critical' as 'healthy' | 'warning' | 'critical',
        issues: ['فشل في فحص صحة التخزين'],
        recommendations: ['تحقق من إعدادات التخزين']
      }
    }
  }

  // فحص صحة الأمان
  private static async checkSecurityHealth() {
    try {
      const security = await this.getSecurityStats()
      
      const issues: string[] = []
      const recommendations: string[] = []
      
      if (security.failedLogins > 10) {
        issues.push('عدد محاولات تسجيل الدخول الفاشلة مرتفع')
        recommendations.push('تحقق من محاولات الاختراق المحتملة')
      }
      
      if (security.blockedIPs > 5) {
        issues.push('عدد عناوين IP المحظورة مرتفع')
        recommendations.push('تحقق من إعدادات الأمان')
      }
      
      return {
        status: issues.length > 0 ? 'warning' : 'healthy' as 'healthy' | 'warning' | 'critical',
        issues,
        recommendations
      }
    } catch (error) {
      return {
        status: 'critical' as 'healthy' | 'warning' | 'critical',
        issues: ['فشل في فحص صحة الأمان'],
        recommendations: ['تحقق من إعدادات الأمان']
      }
    }
  }

  // الحصول على إحصائيات التخزين
  private static async getStorageStats() {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads')
      const backupsDir = path.join(process.cwd(), 'backups')
      
      let fileStorageSize = 0
      let backupSize = 0
      
      if (fs.existsSync(uploadsDir)) {
        fileStorageSize = this.getDirectorySize(uploadsDir)
      }
      
      if (fs.existsSync(backupsDir)) {
        backupSize = this.getDirectorySize(backupsDir)
      }
      
      // حجم قاعدة البيانات (تقريبي)
      const dbSize = await prisma.$queryRaw`SELECT pg_database_size('accounting') as size`
      const databaseSize = (dbSize as any)[0]?.size || 0
      
      const totalSize = fileStorageSize + backupSize + databaseSize
      
      return {
        databaseSize,
        fileStorageSize,
        backupSize,
        totalSize,
        used: totalSize,
        total: require('os').totalmem(),
        free: require('os').freemem()
      }
    } catch (error) {
      console.error('Error getting storage stats:', error)
      return {
        databaseSize: 0,
        fileStorageSize: 0,
        backupSize: 0,
        totalSize: 0,
        used: 0,
        total: 0,
        free: 0
      }
    }
  }

  // حساب حجم المجلد
  private static getDirectorySize(dirPath: string): number {
    let size = 0
    
    try {
      const files = fs.readdirSync(dirPath)
      
      for (const file of files) {
        const filePath = path.join(dirPath, file)
        const stats = fs.statSync(filePath)
        
        if (stats.isDirectory()) {
          size += this.getDirectorySize(filePath)
        } else {
          size += stats.size
        }
      }
    } catch (error) {
      console.error('Error calculating directory size:', error)
    }
    
    return size
  }

  // الحصول على إحصائيات الأمان
  private static async getSecurityStats() {
    try {
      // عدد محاولات تسجيل الدخول الفاشلة
      const failedLogins = await prisma.auditLog.count({
        where: {
          action: 'LOGIN_FAILED'
        }
      })
      
      // عدد عناوين IP المحظورة (مبسط)
      const blockedIPs = 0 // يمكن تنفيذ هذا لاحقاً
      
      // عدد تنبيهات الأمان
      const securityAlerts = await prisma.auditLog.count({
        where: {
          action: {
            contains: 'SECURITY'
          }
        }
      })
      
      // آخر فحص أمان
      const lastSecurityScan = new Date()
      
      return {
        failedLogins,
        blockedIPs,
        securityAlerts,
        lastSecurityScan
      }
    } catch (error) {
      console.error('Error getting security stats:', error)
      return {
        failedLogins: 0,
        blockedIPs: 0,
        securityAlerts: 0,
        lastSecurityScan: new Date()
      }
    }
  }

  // الحصول على سجلات النظام
  static async getSystemLogs(limit: number = 100, level?: string) {
    try {
      const where: any = {}
      
      if (level) {
        where.level = level
      }
      
      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          createdAt: true,
          action: true,
          details: true,
          userId: true,
          ipAddress: true
        }
      })
      
      return logs.map(log => ({
        id: log.id,
        timestamp: log.createdAt,
        level: this.getLogLevel(log.action),
        component: this.getLogComponent(log.action),
        message: log.action,
        details: log.details,
        userId: log.userId,
        ipAddress: log.ipAddress
      }))
    } catch (error) {
      console.error('Error getting system logs:', error)
      throw new Error('فشل في الحصول على سجلات النظام')
    }
  }

  // تحديد مستوى السجل
  private static getLogLevel(action: string): 'info' | 'warning' | 'error' | 'critical' {
    if (action.includes('ERROR') || action.includes('FAILED')) {
      return 'error'
    }
    if (action.includes('SECURITY') || action.includes('CRITICAL')) {
      return 'critical'
    }
    if (action.includes('WARNING') || action.includes('ALERT')) {
      return 'warning'
    }
    return 'info'
  }

  // تحديد مكون السجل
  private static getLogComponent(action: string): string {
    if (action.includes('AUTH') || action.includes('LOGIN')) {
      return 'Authentication'
    }
    if (action.includes('DATABASE') || action.includes('QUERY')) {
      return 'Database'
    }
    if (action.includes('API') || action.includes('REQUEST')) {
      return 'API'
    }
    if (action.includes('SECURITY')) {
      return 'Security'
    }
    return 'System'
  }

  // تنظيف النظام
  static async cleanupSystem() {
    try {
      const results = []
      
      // تنظيف السجلات القديمة
      const oldLogs = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 يوم
          }
        }
      })
      results.push(`تم حذف ${oldLogs.count} سجل قديم`)
      
      // تنظيف الملفات المؤقتة
      const tempDir = path.join(process.cwd(), 'temp')
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir)
        let deletedFiles = 0
        
        for (const file of files) {
          const filePath = path.join(tempDir, file)
          const stats = fs.statSync(filePath)
          
          // حذف الملفات الأقدم من 7 أيام
          if (Date.now() - stats.mtime.getTime() > 7 * 24 * 60 * 60 * 1000) {
            fs.unlinkSync(filePath)
            deletedFiles++
          }
        }
        
        results.push(`تم حذف ${deletedFiles} ملف مؤقت`)
      }
      
      // تنظيف قاعدة البيانات
      await prisma.$executeRaw`VACUUM`
      results.push('تم تنظيف قاعدة البيانات')
      
      return {
        success: true,
        results,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error cleaning up system:', error)
      throw new Error('فشل في تنظيف النظام')
    }
  }

  // إعادة تشغيل النظام
  static async restartSystem() {
    try {
      // حفظ حالة النظام
      await this.saveSystemState()
      
      // إعادة تشغيل العملية
      setTimeout(() => {
        process.exit(0)
      }, 2000)
      
      return {
        success: true,
        message: 'سيتم إعادة تشغيل النظام خلال ثانيتين'
      }
    } catch (error) {
      console.error('Error restarting system:', error)
      throw new Error('فشل في إعادة تشغيل النظام')
    }
  }

  // حفظ حالة النظام
  private static async saveSystemState() {
    try {
      const state = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        version: process.version,
        platform: process.platform
      }
      
      const stateFile = path.join(process.cwd(), 'system-state.json')
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2))
    } catch (error) {
      console.error('Error saving system state:', error)
    }
  }

  // الحصول على معلومات النظام
  static async getSystemInfo() {
    try {
      const info = {
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: process.uptime()
        },
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV,
        database: {
          provider: 'postgresql',
          version: 'unknown' // يمكن الحصول على هذا من قاعدة البيانات
        },
        application: {
          name: 'Accounting System',
          version: '1.0.0',
          buildDate: new Date().toISOString()
        }
      }
      
      return info
    } catch (error) {
      console.error('Error getting system info:', error)
      throw new Error('فشل في الحصول على معلومات النظام')
    }
  }
}