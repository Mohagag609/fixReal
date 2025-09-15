'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardKPIs } from '../../types'
import { formatCurrency, formatDate } from '../../utils/formatting'
import { NotificationSystem, useNotifications } from '../../components/NotificationSystem'
import ReportBuilder from './builder/ReportBuilder'
import DataTable from './components/DataTable'
import ReportPreview from './components/ReportPreview'
import { printReport } from './components/PrintButton'

// Modern UI Components
const ModernCard = ({ children, className = '', ...props }: unknown) => (
  <div className={`bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl shadow-gray-900/5 p-6 ${className}`} {...props}>
    {children}
  </div>
)

const ModernButton = ({ children, variant = 'primary', size = 'md', className = '', ...props }: unknown) => {
  const variants: { [key: string]: string } = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25',
    secondary: 'bg-white/80 hover:bg-white border border-gray-200 text-gray-700 shadow-lg shadow-gray-900/5',
    success: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/25',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25',
    warning: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white shadow-lg shadow-yellow-500/25',
    info: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/25'
  }
  
  const sizes: { [key: string]: string } = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm font-medium',
    lg: 'px-6 py-3 text-base font-medium'
  }
  
  return (
    <button 
      className={`${variants[variant]} ${sizes[size]} rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const ReportCard = ({ title, description, icon, color, onClick }: unknown) => (
  <ModernCard 
    className="cursor-pointer hover:scale-105 transition-all duration-200 hover:shadow-2xl"
    onClick={onClick}
  >
    <div className="text-center">
      <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </ModernCard>
)

export default function Reports() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد',
    to: new Date()??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'
  })
  
  // حالة نظام التقارير الجديد
  const [currentReport, setCurrentReport] = useState<{
    type: string
    data: unknown[]
    filters: unknown
    title: string
    columns: unknown[]
    summary?: unknown | null
  } | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    // Check if database is configured
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/setup')
      const data = await response.json()
      
      if (!data.success) {
        // إذا لم تكن قاعدة البيانات مُعدة، فقط أظهر رسالة تحذير
        // console.log('Database not configured, but continuing to load reports')
        // إزالة الإشعار المزعج
        // addNotification({
        //   type: 'warning',
        //   title: 'تحذير',
        //   message: 'قاعدة البيانات غير مُعدة بالكامل، قد لا تعمل بعض الميزات'
        // })
      }
      
      // تحميل التقارير في جميع الحالات
      fetchKPIs(true)
    } catch (error) {
      console.error('Database check error:', error)
      // في حالة الخطأ، فقط أظهر رسالة تحذير
      addNotification({
        type: 'warning',
        title: 'تحذير',
        message: 'لا يمكن التحقق من حالة قاعدة البيانات، جاري تحميل التقارير...'
      })
      fetchKPIs(true)
    }
  }

  const fetchKPIs = async (forceRefresh = false) => {
    try {
      const token = localStorage.getItem('authToken')
      const url = forceRefresh ? '/api/dashboard?refresh=true' : '/api/dashboard'
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: forceRefresh ? 'no-cache' : 'default'
      })
      
      const data = await response.json()
      if (data.success) {
        setKpis(data.data)
        console.log(`تم تحميل ${Object.keys(data.data).length} مؤشر أداء`)
      } else {
        setError(data.error || 'خطأ في تحميل البيانات')
      }
    } catch (err) {
      console.error('Error fetching KPIs:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  // دوال نظام التقارير الجديد
  const handleReportGenerated = (reportType: string, data: unknown[], filters: unknown) => {
    const reportTitles: Record<string, string> = {
      installments: 'تقرير الأقساط',
      payments: 'تقرير التحصيلات',
      aging: 'تحليل المتأخرات',
      customers: 'تقرير العملاء',
      units: 'تقرير الوحدات',
      financial: 'التقرير المالي'
    }
    
    const report: {
      type: string;
      data: unknown[];
      filters: unknown;
      title: string;
      columns: unknown[];
      summary?: unknown | null;
    } = {
      type: reportType,
      data,
      filters,
      title: reportTitles[reportType] || 'تقرير',
      columns: [], // سيتم تحديدها من API
      summary: {} // سيتم حسابها من API
    }
    
    setCurrentReport(report)
    setShowPreview(true)
  }

  const handleExport = async (format: string) => {
    if (!currentReport) return

    try {
      setReportLoading(true)
      const token = localStorage.getItem('authToken')
      let response: Response

      switch (format) {
        case 'excel':
          response = await fetch('/api/export/excel', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title: currentReport.title,
              data: currentReport.data,
              reportType: currentReport.type,
              fileName: `${currentReport.type}-report-${new Date()??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.xlsx`
            })
          })
          break

        case 'csv':
          response = await fetch('/api/export/csv', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title: currentReport.title,
              data: currentReport.data,
              reportType: currentReport.type,
              fileName: `${currentReport.type}-report-${new Date()??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.csv`
            })
          })
          break

        case 'pdf':
          response = await fetch('/api/export/pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title: currentReport.title,
              data: currentReport.data,
              reportType: currentReport.type,
              fileName: `${currentReport.type}-report-${new Date()??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.pdf`
            })
          })
          break

        default:
          throw new Error('صيغة التصدير غير مدعومة')
      }

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${currentReport.type}-report-${new Date()??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        addNotification({
          type: 'success',
          title: 'تم التصدير بنجاح',
          message: `تم تصدير التقرير بصيغة ${format.toUpperCase()}`
        })
      } else {
        throw new Error('فشل في تصدير التقرير')
      }
    } catch (err) {
      console.error('Export error:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في التصدير',
        message: 'فشل في تصدير التقرير'
      })
    } finally {
      setReportLoading(false)
    }
  }

  const handlePrint = () => {
    if (!currentReport) return
    printReport(currentReport.data, currentReport.type, currentReport.title)
  }

  const handleClosePreview = () => {
    setShowPreview(false)
  }

  const handleConfirmReport = () => {
    setShowPreview(false)
  }

  const handleReset = () => {
    setCurrentReport(null)
    setShowPreview(false)
    setError(null)
  }

  const generateReport = async (reportType: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/export/excel?type=${reportType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportType}-report-${new Date()??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        addNotification({
          type: 'success',
          title: 'تم التصدير بنجاح',
          message: 'تم تصدير التقرير بنجاح'
        })
      } else {
        throw new Error('فشل في تصدير التقرير')
      }
    } catch (err) {
      console.error('Export error:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في التصدير',
        message: 'فشل في تصدير التقرير'
      })
    }
  }

  const reports = [
    {
      title: 'تقرير المبيعات',
      description: 'تقرير شامل للمبيعات والعقود',
      icon: '📊',
      color: 'bg-gradient-to-r from-blue-100 to-blue-200',
      onClick: () => generateReport('sales')
    },
    {
      title: 'تقرير الأقساط',
      description: 'تقرير حالة الأقساط والتحصيل',
      icon: '📅',
      color: 'bg-gradient-to-r from-green-100 to-green-200',
      onClick: () => generateReport('installments')
    },
    {
      title: 'تقرير السندات',
      description: 'تقرير سندات القبض والدفع',
      icon: '📄',
      color: 'bg-gradient-to-r from-purple-100 to-purple-200',
      onClick: () => generateReport('vouchers')
    },
    {
      title: 'تقرير العملاء',
      description: 'تقرير بيانات العملاء والمعاملات',
      icon: '👤',
      color: 'bg-gradient-to-r from-yellow-100 to-yellow-200',
      onClick: () => generateReport('customers')
    },
    {
      title: 'تقرير الوحدات',
      description: 'تقرير حالة الوحدات والمبيعات',
      icon: '🏠',
      color: 'bg-gradient-to-r from-indigo-100 to-indigo-200',
      onClick: () => generateReport('units')
    },
    {
      title: 'تقرير السماسرة',
      description: 'تقرير عمولات السماسرة',
      icon: '🤝',
      color: 'bg-gradient-to-r from-pink-100 to-pink-200',
      onClick: () => generateReport('brokers')
    },
    {
      title: 'تقرير الخزائن',
      description: 'تقرير أرصدة الخزائن والتحويلات',
      icon: '💰',
      color: 'bg-gradient-to-r from-teal-100 to-teal-200',
      onClick: () => generateReport('treasury')
    },
    {
      title: 'تقرير الشركاء',
      description: 'تقرير الشركاء والأرباح',
      icon: '👥',
      color: 'bg-gradient-to-r from-orange-100 to-orange-200',
      onClick: () => generateReport('partners')
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">جاري التحميل...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">نظام التقارير الاحترافي</h1>
                <p className="text-gray-600">بناء وتشغيل التقارير الديناميكية مع إمكانيات التصدير والطباعة المتقدمة</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              {currentReport && (
                <ModernButton variant="secondary" onClick={handleReset}>
                  تقرير جديد
                </ModernButton>
              )}
              <ModernButton variant="secondary" onClick={() => router.push('/')}>
                العودة للرئيسية
              </ModernButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* نظام التقارير الجديد */}
        <div className="mb-8">
          <ReportBuilder
            onReportGenerated={handleReportGenerated}
            onLoadingChange={setReportLoading}
          />
        </div>

        {/* مؤشر التحميل */}
        {reportLoading && (
          <ModernCard className="mb-8">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-700">جاري إنشاء التقرير...</h3>
              <p className="text-gray-500">يرجى الانتظار</p>
            </div>
          </ModernCard>
        )}

        {/* Report Preview Modal */}
        {showPreview && currentReport && (
          <ReportPreview
            report={currentReport}
            onClose={handleClosePreview}
            onConfirm={handleConfirmReport}
            onExport={handleExport}
            onPrint={handlePrint}
          />
        )}

        {/* عرض التقرير */}
        {currentReport && !showPreview && !reportLoading && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">نتائج التقرير</h2>
              <button
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                ✕ إغلاق التقرير
              </button>
            </div>
            <DataTable
              data={currentReport.data}
              reportType={currentReport.type}
              title={currentReport.title}
              onExport={handleExport}
              onPrint={handlePrint}
            />
          </div>
        )}

        {/* Date Range Filter */}
        <ModernCard className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">من تاريخ</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                  className="px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">إلى تاريخ</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                  className="px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <ModernButton onClick={() => fetchKPIs(true)}>
                🔄 تحديث البيانات
              </ModernButton>
            </div>
            <div className="text-sm text-gray-500">
              آخر تحديث: {new Date().toLocaleString('en-GB')}
            </div>
          </div>
        </ModernCard>

        {/* Error Message */}
        {error && (
          <ModernCard className="mb-8 bg-red-50 border-red-200">
            <div className="flex items-center">
              <span className="text-red-500 mr-3 text-xl">⚠️</span>
              <div>
                <h3 className="text-red-800 font-semibold">خطأ في تحميل البيانات</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Summary Cards */}
        {kpis && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">ملخص الأداء</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ModernCard className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{formatCurrency(kpis.totalSales)}</div>
                  <div className="text-green-800 font-medium">إجمالي المبيعات</div>
                </div>
              </ModernCard>
              
              <ModernCard className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{formatCurrency(kpis.totalReceipts)}</div>
                  <div className="text-blue-800 font-medium">إجمالي المقبوضات</div>
                </div>
              </ModernCard>
              
              <ModernCard className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-2">{formatCurrency(kpis.totalExpenses)}</div>
                  <div className="text-red-800 font-medium">إجمالي المصروفات</div>
                </div>
              </ModernCard>
              
              <ModernCard className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{formatCurrency(kpis.netProfit)}</div>
                  <div className="text-purple-800 font-medium">صافي الربح</div>
                </div>
              </ModernCard>
            </div>
          </div>
        )}

        {/* Reports Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">التقارير السريعة (الطرق التقليدية)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reports.map((report, index) => (
              <ReportCard
                key={index}
                title={report.title}
                description={report.description}
                icon={report.icon}
                color={report.color}
                onClick={report.onClick}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <ModernCard>
          <h2 className="text-xl font-bold text-gray-900 mb-6">إجراءات سريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ModernButton 
              variant="success" 
              className="w-full py-4"
              onClick={() => generateReport('all')}
            >
              <span className="mr-2">📊</span>
              تصدير جميع التقارير
            </ModernButton>
            
            <ModernButton 
              variant="info" 
              className="w-full py-4"
              onClick={() => router.push('/dashboard')}
            >
              <span className="mr-2">📈</span>
              عرض لوحة التحكم
            </ModernButton>
            
            <ModernButton 
              variant="warning" 
              className="w-full py-4"
              onClick={() => router.push('/backup')}
            >
              <span className="mr-2">💾</span>
              النسخ الاحتياطية
            </ModernButton>
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