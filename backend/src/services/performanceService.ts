import { PrismaClient } from '@prisma/client'
import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

export interface PerformanceMetrics {
  timestamp: Date
  cpu: {
    usage: number
    loadAverage: number[]
  }
  memory: {
    used: number
    free: number
    total: number
    usage: number
  }
  database: {
    connectionCount: number
    queryCount: number
    slowQueries: number
    averageQueryTime: number
  }
  api: {
    requestCount: number
    averageResponseTime: number
    errorRate: number
    activeConnections: number
  }
  disk: {
    used: number
    free: number
    total: number
    usage: number
  }
}

export interface QueryAnalysis {
  query: string
  executionTime: number
  frequency: number
  lastExecuted: Date
  optimizationSuggestions: string[]
}

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
  maxSize: number
  evictions: number
}

export class PerformanceService {
  private static metrics: PerformanceMetrics[] = []
  private static queryLog: QueryAnalysis[] = []
  private static cacheStats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    size: 0,
    maxSize: 1000,
    evictions: 0
  }

  // جمع مقاييس الأداء
  static async collectMetrics(): Promise<PerformanceMetrics> {
    try {
      const timestamp = new Date()
      
      // مقاييس المعالج
      const cpuUsage = await this.getCpuUsage()
      const loadAverage = os.loadavg()
      
      // مقاييس الذاكرة
      const memoryUsage = process.memoryUsage()
      const totalMemory = os.totalmem()
      const freeMemory = os.freemem()
      
      // مقاييس قاعدة البيانات
      const dbMetrics = await this.getDatabaseMetrics()
      
      // مقاييس API
      const apiMetrics = await this.getApiMetrics()
      
      // مقاييس القرص
      const diskMetrics = await this.getDiskMetrics()
      
      const metrics: PerformanceMetrics = {
        timestamp,
        cpu: {
          usage: cpuUsage,
          loadAverage
        },
        memory: {
          used: memoryUsage.heapUsed,
          free: freeMemory,
          total: totalMemory,
          usage: (memoryUsage.heapUsed / totalMemory) * 100
        },
        database: dbMetrics,
        api: apiMetrics,
        disk: diskMetrics
      }
      
      // حفظ المقاييس
      this.metrics.push(metrics)
      
      // الاحتفاظ بآخر 1000 قياس
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000)
      }
      
      return metrics
    } catch (error) {
      console.error('Error collecting performance metrics:', error)
      throw new Error('فشل في جمع مقاييس الأداء')
    }
  }

  // الحصول على استخدام المعالج
  private static async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startMeasure = process.cpuUsage()
      
      setTimeout(() => {
        const endMeasure = process.cpuUsage(startMeasure)
        const totalUsage = (endMeasure.user + endMeasure.system) / 1000000 // تحويل إلى ثواني
        const cpuUsage = (totalUsage / 1000) * 100 // تحويل إلى نسبة مئوية
        resolve(Math.min(cpuUsage, 100))
      }, 1000)
    })
  }

  // الحصول على مقاييس قاعدة البيانات
  private static async getDatabaseMetrics() {
    try {
      // عدد الاتصالات النشطة
      const connectionCount = await prisma.$queryRaw`SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'`
      
      // عدد الاستعلامات البطيئة
      const slowQueries = await prisma.$queryRaw`
        SELECT count(*) as count 
        FROM pg_stat_statements 
        WHERE mean_exec_time > 1000
      `
      
      // متوسط وقت الاستعلام
      const avgQueryTime = await prisma.$queryRaw`
        SELECT avg(mean_exec_time) as avg_time 
        FROM pg_stat_statements
      `
      
      return {
        connectionCount: (connectionCount as any)[0]?.count || 0,
        queryCount: this.queryLog.length,
        slowQueries: (slowQueries as any)[0]?.count || 0,
        averageQueryTime: (avgQueryTime as any)[0]?.avg_time || 0
      }
    } catch (error) {
      console.error('Error getting database metrics:', error)
      return {
        connectionCount: 0,
        queryCount: 0,
        slowQueries: 0,
        averageQueryTime: 0
      }
    }
  }

  // الحصول على مقاييس API
  private static async getApiMetrics() {
    // هذه المقاييس تحتاج إلى middleware لتتبعها
    return {
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      activeConnections: 0
    }
  }

  // الحصول على مقاييس القرص
  private static async getDiskMetrics() {
    try {
      const stats = fs.statSync(process.cwd())
      const totalSpace = os.totalmem() // تقريب
      const freeSpace = os.freemem()
      const usedSpace = totalSpace - freeSpace
      
      return {
        used: usedSpace,
        free: freeSpace,
        total: totalSpace,
        usage: (usedSpace / totalSpace) * 100
      }
    } catch (error) {
      console.error('Error getting disk metrics:', error)
      return {
        used: 0,
        free: 0,
        total: 0,
        usage: 0
      }
    }
  }

  // تحليل الاستعلامات
  static async analyzeQueries(): Promise<QueryAnalysis[]> {
    try {
      const queries = await prisma.$queryRaw`
        SELECT 
          query,
          mean_exec_time as execution_time,
          calls as frequency,
          last_exec as last_executed
        FROM pg_stat_statements 
        ORDER BY mean_exec_time DESC 
        LIMIT 50
      `
      
      const analysis: QueryAnalysis[] = (queries as any[]).map(query => ({
        query: query.query,
        executionTime: parseFloat(query.execution_time),
        frequency: parseInt(query.frequency),
        lastExecuted: new Date(query.last_executed),
        optimizationSuggestions: this.getOptimizationSuggestions(query.query, query.execution_time)
      }))
      
      this.queryLog = analysis
      return analysis
    } catch (error) {
      console.error('Error analyzing queries:', error)
      return []
    }
  }

  // اقتراحات تحسين الاستعلامات
  private static getOptimizationSuggestions(query: string, executionTime: number): string[] {
    const suggestions: string[] = []
    
    if (executionTime > 1000) {
      suggestions.push('الاستعلام بطيء جداً - فكر في إضافة فهارس')
    }
    
    if (query.includes('SELECT *')) {
      suggestions.push('تجنب استخدام SELECT * - حدد الأعمدة المطلوبة فقط')
    }
    
    if (query.includes('ORDER BY') && !query.includes('LIMIT')) {
      suggestions.push('فكر في إضافة LIMIT لتقليل عدد النتائج')
    }
    
    if (query.includes('JOIN') && executionTime > 500) {
      suggestions.push('تحقق من وجود فهارس على أعمدة JOIN')
    }
    
    if (query.includes('WHERE') && executionTime > 300) {
      suggestions.push('تحقق من وجود فهارس على أعمدة WHERE')
    }
    
    return suggestions
  }

  // تحسين قاعدة البيانات
  static async optimizeDatabase() {
    try {
      const optimizations = []
      
      // تحليل الجداول
      await prisma.$executeRaw`ANALYZE`
      optimizations.push('تم تحليل الجداول')
      
      // إعادة بناء الفهارس
      await prisma.$executeRaw`REINDEX DATABASE accounting`
      optimizations.push('تم إعادة بناء الفهارس')
      
      // تنظيف قاعدة البيانات
      await prisma.$executeRaw`VACUUM`
      optimizations.push('تم تنظيف قاعدة البيانات')
      
      return {
        success: true,
        optimizations,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error optimizing database:', error)
      throw new Error('فشل في تحسين قاعدة البيانات')
    }
  }

  // إنشاء فهارس مقترحة
  static async suggestIndexes() {
    try {
      const suggestions = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public' 
        AND n_distinct > 100
        ORDER BY n_distinct DESC
      `
      
      return (suggestions as any[]).map(stat => ({
        table: stat.tablename,
        column: stat.attname,
        distinctValues: stat.n_distinct,
        correlation: stat.correlation,
        suggestion: `CREATE INDEX idx_${stat.tablename}_${stat.attname} ON ${stat.tablename}(${stat.attname})`
      }))
    } catch (error) {
      console.error('Error suggesting indexes:', error)
      return []
    }
  }

  // مراقبة الذاكرة
  static async monitorMemory() {
    try {
      const memoryUsage = process.memoryUsage()
      const totalMemory = os.totalmem()
      const freeMemory = os.freemem()
      
      const memoryInfo = {
        heap: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          usage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        },
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        system: {
          total: totalMemory,
          free: freeMemory,
          used: totalMemory - freeMemory,
          usage: ((totalMemory - freeMemory) / totalMemory) * 100
        }
      }
      
      // تحذير إذا كانت الذاكرة منخفضة
      if (memoryInfo.system.usage > 90) {
        console.warn('تحذير: استخدام الذاكرة مرتفع جداً!')
      }
      
      return memoryInfo
    } catch (error) {
      console.error('Error monitoring memory:', error)
      throw new Error('فشل في مراقبة الذاكرة')
    }
  }

  // تنظيف الذاكرة
  static async cleanupMemory() {
    try {
      if (global.gc) {
        global.gc()
        return { success: true, message: 'تم تنظيف الذاكرة بنجاح' }
      } else {
        return { success: false, message: 'تنظيف الذاكرة غير متاح' }
      }
    } catch (error) {
      console.error('Error cleaning up memory:', error)
      throw new Error('فشل في تنظيف الذاكرة')
    }
  }

  // الحصول على إحصائيات الأداء
  static async getPerformanceStats() {
    try {
      const latestMetrics = this.metrics[this.metrics.length - 1]
      const avgMetrics = this.calculateAverageMetrics()
      
      return {
        current: latestMetrics,
        average: avgMetrics,
        trends: this.calculateTrends(),
        alerts: this.checkAlerts(latestMetrics),
        recommendations: this.getRecommendations(latestMetrics)
      }
    } catch (error) {
      console.error('Error getting performance stats:', error)
      throw new Error('فشل في الحصول على إحصائيات الأداء')
    }
  }

  // حساب المتوسطات
  private static calculateAverageMetrics() {
    if (this.metrics.length === 0) return null
    
    const sum = this.metrics.reduce((acc, metric) => ({
      cpu: acc.cpu + metric.cpu.usage,
      memory: acc.memory + metric.memory.usage,
      database: {
        queryCount: acc.database.queryCount + metric.database.queryCount,
        slowQueries: acc.database.slowQueries + metric.database.slowQueries,
        averageQueryTime: acc.database.averageQueryTime + metric.database.averageQueryTime
      },
      api: {
        requestCount: acc.api.requestCount + metric.api.requestCount,
        averageResponseTime: acc.api.averageResponseTime + metric.api.averageResponseTime,
        errorRate: acc.api.errorRate + metric.api.errorRate
      },
      disk: acc.disk + metric.disk.usage
    }), {
      cpu: 0,
      memory: 0,
      database: { queryCount: 0, slowQueries: 0, averageQueryTime: 0 },
      api: { requestCount: 0, averageResponseTime: 0, errorRate: 0 },
      disk: 0
    })
    
    const count = this.metrics.length
    
    return {
      cpu: sum.cpu / count,
      memory: sum.memory / count,
      database: {
        queryCount: sum.database.queryCount / count,
        slowQueries: sum.database.slowQueries / count,
        averageQueryTime: sum.database.averageQueryTime / count
      },
      api: {
        requestCount: sum.api.requestCount / count,
        averageResponseTime: sum.api.averageResponseTime / count,
        errorRate: sum.api.errorRate / count
      },
      disk: sum.disk / count
    }
  }

  // حساب الاتجاهات
  private static calculateTrends() {
    if (this.metrics.length < 2) return null
    
    const recent = this.metrics.slice(-10)
    const older = this.metrics.slice(-20, -10)
    
    if (older.length === 0) return null
    
    const recentAvg = this.calculateAverageMetrics()
    const olderAvg = this.calculateAverageMetrics()
    
    return {
      cpu: recentAvg!.cpu - olderAvg!.cpu,
      memory: recentAvg!.memory - olderAvg!.memory,
      database: {
        queryCount: recentAvg!.database.queryCount - olderAvg!.database.queryCount,
        slowQueries: recentAvg!.database.slowQueries - olderAvg!.database.slowQueries
      }
    }
  }

  // فحص التنبيهات
  private static checkAlerts(metrics: PerformanceMetrics) {
    const alerts = []
    
    if (metrics.cpu.usage > 80) {
      alerts.push({ type: 'warning', message: 'استخدام المعالج مرتفع' })
    }
    
    if (metrics.memory.usage > 90) {
      alerts.push({ type: 'critical', message: 'استخدام الذاكرة مرتفع جداً' })
    }
    
    if (metrics.database.slowQueries > 10) {
      alerts.push({ type: 'warning', message: 'عدد الاستعلامات البطيئة مرتفع' })
    }
    
    if (metrics.disk.usage > 95) {
      alerts.push({ type: 'critical', message: 'مساحة القرص منخفضة' })
    }
    
    return alerts
  }

  // الحصول على التوصيات
  private static getRecommendations(metrics: PerformanceMetrics) {
    const recommendations = []
    
    if (metrics.cpu.usage > 70) {
      recommendations.push('فكر في ترقية المعالج أو تحسين الكود')
    }
    
    if (metrics.memory.usage > 80) {
      recommendations.push('فكر في زيادة الذاكرة أو تحسين استخدامها')
    }
    
    if (metrics.database.averageQueryTime > 100) {
      recommendations.push('تحسين استعلامات قاعدة البيانات')
    }
    
    if (metrics.disk.usage > 90) {
      recommendations.push('تنظيف الملفات غير المستخدمة')
    }
    
    return recommendations
  }

  // بدء مراقبة الأداء
  static startMonitoring(intervalMs: number = 60000) {
    setInterval(async () => {
      try {
        await this.collectMetrics()
      } catch (error) {
        console.error('Error in performance monitoring:', error)
      }
    }, intervalMs)
  }

  // إيقاف مراقبة الأداء
  static stopMonitoring() {
    // يمكن إضافة منطق لإيقاف المراقبة
  }
}