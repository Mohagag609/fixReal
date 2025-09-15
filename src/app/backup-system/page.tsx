'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationSystem, useNotifications } from '../../components/NotificationSystem'

// Modern UI Components
const ModernCard = ({ children, className = '', ...props }: Record<string, unknown>) => (
  <div className={`bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl shadow-gray-900/5 p-6 ${className}`} {...props}>
    {children}
  </div>
)

const ModernButton = ({ children, variant = 'primary', size = 'md', className = '', disabled = false, ...props }: Record<string, unknown>) => {
  const variants: { [key: string]: string } = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25',
    secondary: 'bg-white/80 hover:bg-white border border-gray-200 text-gray-700 shadow-lg shadow-gray-900/5',
    success: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/25',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25',
    warning: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white shadow-lg shadow-yellow-500/25'
  }
  
  const sizes: { [key: string]: string } = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm font-medium',
    lg: 'px-6 py-3 text-base font-medium'
  }
  
  return (
    <button 
      className={`${variants[variant]} ${sizes[size]} rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export default function BackupSystem() {
  const [isLoading, setIsLoading] = useState(false)
  const [databaseType, setDatabaseType] = useState<string>('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importMode, setImportMode] = useState<'replace' | 'upsert'>('replace')
  const [wipeMode, setWipeMode] = useState<'soft'>('soft')
  const [adminUrl, setAdminUrl] = useState('')
  const [showWipeForm, setShowWipeForm] = useState(false)
  
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    // Get database type from environment or API
    fetchDatabaseInfo()
  }, [] // TODO: Review dependencies) // TODO: Review dependencies

  const fetchDatabaseInfo = async () => {
    try {
      // This would typically come from an API endpoint
      // For now, we'll use a placeholder
      setDatabaseType('PostgreSQL (Neon)')
    } catch (error) {
      console.error('Failed to fetch database info:', error)
    }
  }

  const handleExport = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/system/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup-${new Date()??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.tar.gz`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        addNotification({
          type: 'success',
          title: 'تم إنشاء النسخة الاحتياطية',
          message: 'تم تصدير البيانات بنجاح'
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details || errorData.error || 'فشل في إنشاء النسخة الاحتياطية'
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Export error:', error)
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف'
      addNotification({
        type: 'error',
        title: 'خطأ في التصدير',
        message: `فشل في إنشاء النسخة الاحتياطية: ${errorMessage}`
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async (dryRun = false) => {
    if (!importFile) {
      addNotification({
        type: 'error',
        title: 'خطأ في الاستيراد',
        message: 'يرجى اختيار ملف النسخة الاحتياطية'
      })
      return
    }

    setIsLoading(true)
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // Remove data:application/...;base64, prefix
        }
        reader.onerror = reject
        reader.readAsDataURL(importFile)
      })

      const response = await fetch('/api/system/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          base64,
          apply: !dryRun,
          mode: importMode
        })
      })

      const result = await response.json()

      if (response.ok) {
        addNotification({
          type: 'success',
          title: dryRun ? 'تم فحص النسخة الاحتياطية' : 'تم استيراد النسخة الاحتياطية',
          message: result.message
        })
        
        if (result.stats) {
          console.log('Import statistics:', result.stats)
        }
        
        if (result.changes) {
          console.log('Changes detected:', result.changes)
          
          // عرض التغييرات المكتشفة
          const changesList = Object.entries(result.changes)
            .filter(([_, change]) => change.difference !== 0)
            .map(([table, change]) => {
              const sign = change.difference > 0 ? '+' : ''
              return `${table}: ${change.current} → ${change.backup} (${sign}${change.difference})`
            })
            .join('\n')
          
          if (changesList) {
            console.log('📊 Changes Summary:')
            console.log(changesList)
          }
        }
      } else {
        throw new Error(result.details || 'فشل في استيراد النسخة الاحتياطية')
      }
    } catch (error) {
      console.error('Import error:', error)
      addNotification({
        type: 'error',
        title: 'خطأ في الاستيراد',
        message: error instanceof Error ? error.message : 'فشل في استيراد النسخة الاحتياطية'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWipe = async () => {
    if (!confirm('هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/system/wipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminUrl: adminUrl || 'ADMIN_WIPE_2024'
        })
      })

      const result = await response.json()

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'تم مسح البيانات',
          message: result.message
        })
        
        // مسح البيانات المحلية وتسجيل الخروج
        localStorage.clear()
        sessionStorage.clear()
        
        // إعادة توجيه لصفحة إدارة قاعدة البيانات
        setTimeout(() => {
          window.location.href = '/setup'
        }, 2000)
      } else {
        throw new Error(result.error || 'فشل في مسح البيانات')
      }
    } catch (error) {
      console.error('Wipe error:', error)
      addNotification({
        type: 'error',
        title: 'خطأ في المسح',
        message: error instanceof Error ? error.message : 'فشل في مسح البيانات'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">💾</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">نظام النسخ الاحتياطية</h1>
                <p className="text-gray-600">إدارة شاملة للنسخ الاحتياطية والاستعادة</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <ModernButton variant="secondary" onClick={() => router.push('/')}>
                العودة للرئيسية
              </ModernButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Database Info */}
        <ModernCard className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات قاعدة البيانات</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>نوع قاعدة البيانات:</strong> {databaseType}</p>
            <p><strong>حالة الاتصال:</strong> متصل</p>
            <p><strong>آخر نسخة احتياطية:</strong> غير متوفر</p>
          </div>
        </ModernCard>

        {/* Export Section */}
        <ModernCard className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">إنشاء نسخة احتياطية</h2>
          <p className="text-gray-600 mb-6">تصدير جميع البيانات إلى ملف مضغوط</p>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <ModernButton
              onClick={handleExport}
              disabled={isLoading}
              variant="success"
              size="lg"
            >
              {isLoading ? 'جاري التصدير...' : '📦 إنشاء نسخة احتياطية'}
            </ModernButton>
          </div>
        </ModernCard>

        {/* Import Section */}
        <ModernCard className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">استيراد نسخة احتياطية</h2>
          <p className="text-gray-600 mb-6">استعادة البيانات من ملف النسخة الاحتياطية</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختيار ملف النسخة الاحتياطية
              </label>
              <input
                type="file"
                accept=".tar.gz,.gz"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وضع الاستيراد
              </label>
              <select
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as 'replace' | 'upsert')}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="replace">استبدال (حذف البيانات الحالية)</option>
                <option value="upsert">دمج (تحديث البيانات الموجودة)</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <ModernButton
                onClick={() => handleImport(true)}
                disabled={isLoading || !importFile}
                variant="secondary"
                size="lg"
              >
                {isLoading ? 'جاري الفحص...' : '🔍 فحص النسخة الاحتياطية'}
              </ModernButton>
              
              <ModernButton
                onClick={() => handleImport(false)}
                disabled={isLoading || !importFile}
                variant="primary"
                size="lg"
              >
                {isLoading ? 'جاري الاستيراد...' : '📥 استيراد النسخة الاحتياطية'}
              </ModernButton>
            </div>
          </div>
        </ModernCard>

        {/* Wipe Section */}
        <ModernCard className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">مسح البيانات</h2>
          <p className="text-gray-600 mb-6">حذف جميع البيانات من قاعدة البيانات</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط الإدارة (اختياري)
              </label>
              <input
                type="password"
                value={adminUrl}
                onChange={(e) => setAdminUrl(e.target.value)}
                placeholder="أدخل رابط الإدارة (اختياري) - سيتم استخدام القيمة الافتراضية"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                رابط الإدارة اختياري - سيتم استخدام القيمة الافتراضية إذا لم يتم إدخال قيمة
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وضع المسح
              </label>
              <select
                value={wipeMode}
                onChange={(e) => setWipeMode(e.target.value as 'soft')}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="soft">مسح ناعم (soft delete)</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <ModernButton
                onClick={handleWipe}
                disabled={isLoading}
                variant="danger"
                size="lg"
              >
                {isLoading ? 'جاري المسح...' : '🗑️ مسح البيانات'}
              </ModernButton>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    تحذير
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>هذا الإجراء سيمسح جميع البيانات من قاعدة البيانات. تأكد من وجود نسخة احتياطية قبل المتابعة.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModernCard>
      </div>
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  )
}