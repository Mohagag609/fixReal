'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardKPIs } from '@/types'
import { formatCurrency } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import Sidebar from '@/components/Sidebar'
import SidebarToggle from '@/components/SidebarToggle'

// Compact UI Components
interface CompactCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  [key: string]: unknown;
}

const CompactCard = ({ children, className = '', ...props }: CompactCardProps) => (
  <div className={`bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-lg shadow-gray-900/5 p-4 ${className}`} {...props}>
    {children}
  </div>
)

interface CompactButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  onClick?: () => void;
  [key: string]: unknown;
}

const CompactButton = ({ children, variant = 'primary', size = 'sm', className = '', ...props }: CompactButtonProps) => {
  const variants: { [key: string]: string } = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md shadow-blue-500/20',
    secondary: 'bg-white/90 hover:bg-white border border-gray-200 text-gray-700 shadow-md shadow-gray-900/5',
    success: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md shadow-green-500/20',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md shadow-red-500/20',
    warning: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white shadow-md shadow-yellow-500/20',
    info: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md shadow-purple-500/20'
  }
  
  const sizes: { [key: string]: string } = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm font-medium'
  }
  
  return (
    <button 
      className={`${variants[variant]} ${sizes[size]} rounded-lg transition-all duration-150 hover:scale-105 active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const KPICard = ({ title, value, icon, color, trend, onClick }: KPICardProps) => (
  <CompactCard 
    className={`cursor-pointer hover:scale-105 transition-all duration-150 ${onClick ? 'hover:shadow-xl' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
        {trend && (
          <p className="text-xs text-gray-500 mt-1">{trend}</p>
        )}
      </div>
      <div className={`w-8 h-8 ${color.replace('text-', 'bg-').replace('-600', '-100')} rounded-lg flex items-center justify-center`}>
        <span className="text-sm">{icon}</span>
      </div>
    </div>
  </CompactCard>
)

interface QuickActionCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

const QuickActionCard = ({ title, icon, color, onClick }: QuickActionCardProps) => (
  <CompactCard 
    className="cursor-pointer hover:scale-105 transition-all duration-150 hover:shadow-xl"
    onClick={onClick}
  >
    <div className="text-center">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
        <span className="text-lg">{icon}</span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
  </CompactCard>
)

interface NavigationCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

const NavigationCard = ({ title, icon, color, onClick }: NavigationCardProps) => (
  <CompactCard 
    className="cursor-pointer hover:scale-105 transition-all duration-150 hover:shadow-xl"
    onClick={onClick}
  >
    <div className="text-center">
      <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
        <span className="text-sm">{icon}</span>
      </div>
      <h3 className="text-xs font-semibold text-gray-900">{title}</h3>
    </div>
  </CompactCard>
)

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dbConfigured, setDbConfigured] = useState<boolean | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    // تأخير التحقق من قاعدة البيانات حتى يتم تحميل الصفحة
    const timer = setTimeout(() => {
      checkDatabaseConfig()
    }, 100)
    
    // توجيه تلقائي لصفحة الإعدادات إذا لم تكن قاعدة البيانات مُعدة
    const redirectTimer = setTimeout(() => {
      if (dbConfigured === false) {
        router.push('/setup')
      }
    }, 3000) // انتظار 3 ثواني
    
    return () => {
      clearTimeout(timer)
      clearTimeout(redirectTimer)
    }
  }, [dbConfigured, router])

  const checkDatabaseConfig = async () => {
    try {
      const response = await fetch('/api/setup', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Setup API response status:', response.status)
      
      const data = await response.json()
      setDbConfigured(data.configured)
      
      if (data.configured) {
        console.log('Database configured, loading KPIs...')
        // تحميل البيانات مباشرة
        await fetchKPIs(true)
      } else {
        console.log('Database not configured')
        return
      }
    } catch (err) {
      console.error('Error checking database config:', err)
      setDbConfigured(false)
      return
    }
  }

  const fetchKPIs = async (forceRefresh = false) => {
    try {
      setLoading(true)
      
      console.log('Fetching KPIs...')
      const url = forceRefresh ? '/api/dashboard?refresh=true' : '/api/dashboard'
      
      // Optimized fetch with proper error handling and caching
      const response = await fetch(url, {
        headers: { 
          'Content-Type': 'application/json'
        },
        cache: forceRefresh ? 'no-cache' : 'default'
      })
      
      console.log('Dashboard response status:', response.status)
      
      if (!response.ok) {
        console.log('HTTP error:', response.status)
        setError(`خطأ في الخادم: ${response.status}`)
        setLoading(false)
        return
      }
      
      const data = await response.json()
      console.log('Dashboard data received:', data.success)
      
      if (data.success) {
        setKpis(data.data)
        setError(null) // مسح أي أخطاء سابقة
        console.log('KPIs loaded successfully')
      } else {
        // التحقق من وجود redirectTo في الاستجابة
        if (data.redirectTo === '/setup') {
          // توجيه تلقائي لصفحة الإعدادات
          setTimeout(() => {
            router.push('/setup')
          }, 2000) // انتظار ثانيتين لإظهار الرسالة
          setError(data.message || 'سيتم توجيهك لصفحة الإعدادات...')
        } else {
          setError(data.error || 'خطأ في تحميل البيانات')
          console.log('API returned error:', data.error)
        }
      }
    } catch (err) {
      console.error('Error fetching KPIs:', err)
      setError('خطأ في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { title: 'عميل جديد', icon: '👤', color: 'bg-gradient-to-r from-blue-100 to-blue-200', onClick: () => router.push('/customers') },
    { title: 'وحدة جديدة', icon: '🏠', color: 'bg-gradient-to-r from-green-100 to-green-200', onClick: () => router.push('/units') },
    { title: 'عقد جديد', icon: '📋', color: 'bg-gradient-to-r from-purple-100 to-purple-200', onClick: () => router.push('/contracts') },
    { title: 'سمسار', icon: '🤝', color: 'bg-gradient-to-r from-yellow-100 to-yellow-200', onClick: () => router.push('/brokers') },
    { title: 'شركاء', icon: '👥', color: 'bg-gradient-to-r from-indigo-100 to-indigo-200', onClick: () => router.push('/partners') },
    { title: 'خزينة', icon: '💰', color: 'bg-gradient-to-r from-pink-100 to-pink-200', onClick: () => router.push('/treasury') },
    { title: 'تحسين الأداء', icon: '⚡', color: 'bg-gradient-to-r from-orange-100 to-orange-200', onClick: () => router.push('/admin/performance') },
    { title: 'لوحة الإدارة', icon: '👑', color: 'bg-gradient-to-r from-red-100 to-pink-200', onClick: () => router.push('/admin') },
    { title: 'الإعدادات', icon: '⚙️', color: 'bg-gradient-to-r from-gray-100 to-gray-200', onClick: () => router.push('/settings') }
  ]

  const navigationItems = [
    { title: 'العملاء', icon: '👤', color: 'bg-gradient-to-r from-blue-100 to-blue-200', onClick: () => router.push('/customers') },
    { title: 'الوحدات', icon: '🏠', color: 'bg-gradient-to-r from-green-100 to-green-200', onClick: () => router.push('/units') },
    { title: 'العقود', icon: '📋', color: 'bg-gradient-to-r from-purple-100 to-purple-200', onClick: () => router.push('/contracts') },
    { title: 'السماسرة', icon: '🤝', color: 'bg-gradient-to-r from-yellow-100 to-yellow-200', onClick: () => router.push('/brokers') },
    { title: 'الأقساط', icon: '📅', color: 'bg-gradient-to-r from-indigo-100 to-indigo-200', onClick: () => router.push('/installments') },
    { title: 'السندات', icon: '📄', color: 'bg-gradient-to-r from-pink-100 to-pink-200', onClick: () => router.push('/vouchers') },
    { title: 'الشركاء', icon: '👥', color: 'bg-gradient-to-r from-teal-100 to-teal-200', onClick: () => router.push('/partners') },
    { title: 'الخزينة', icon: '💰', color: 'bg-gradient-to-r from-orange-100 to-orange-200', onClick: () => router.push('/treasury') },
    { title: 'التقارير', icon: '📊', color: 'bg-gradient-to-r from-red-100 to-red-200', onClick: () => router.push('/reports') },
    { title: 'النسخ', icon: '💾', color: 'bg-gradient-to-r from-gray-100 to-gray-200', onClick: () => router.push('/backup') }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <h2 className="text-lg font-semibold text-gray-700">جاري التحميل...</h2>
          <p className="text-sm text-gray-500 mt-2">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  // عرض رسالة إعداد قاعدة البيانات
  if (dbConfigured === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">إعداد قاعدة البيانات</h1>
            <p className="text-gray-600 mb-4">لم يتم إعداد قاعدة البيانات بعد. يرجى إعدادها أولاً للمتابعة.</p>
            <p className="text-sm text-blue-600 mb-6">سيتم توجيهك تلقائياً لصفحة الإعدادات خلال ثانية واحدة...</p>
            <button
              onClick={() => router.push('/setup')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              إعداد قاعدة البيانات الآن
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:mr-72' : ''}`}>
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40 w-full">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <SidebarToggle onToggle={() => setSidebarOpen(!sidebarOpen)} />
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🏢</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
                  <p className="text-gray-600">نظام إدارة العقارات المتطور</p>
                </div>
              </div>
              <div className="flex gap-2">
                <CompactButton variant="secondary" size="sm" onClick={() => fetchKPIs(true)}>
                  🔄 تحديث
                </CompactButton>
                <CompactButton variant="warning" size="sm" onClick={() => router.push('/optimize')}>
                  ⚡ تحسين الأداء
                </CompactButton>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="text-xs text-gray-500 mb-6">
          آخر تحديث: {new Date().toLocaleString('en-GB')}
        </div>

        {/* Error Message */}
        {error && (
          <CompactCard className="mb-6 bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-red-500 mr-2 text-lg">⚠️</span>
                <div>
                  <h3 className="text-red-800 font-semibold text-sm">خطأ في تحميل البيانات</h3>
                  <p className="text-red-600 text-xs">{error}</p>
                </div>
              </div>
              <CompactButton 
                variant="danger" 
                size="sm" 
                onClick={() => router.push('/login')}
              >
                تسجيل الدخول
              </CompactButton>
            </div>
          </CompactCard>
        )}

        {/* KPIs Section */}
        {kpis && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">المؤشرات الرئيسية</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                title="إجمالي العقود"
                value={formatCurrency(kpis.totalContractValue)}
                icon="💰"
                color="text-green-600"
                trend={`${kpis.totalContracts} عقد`}
                onClick={() => router.push('/contracts')}
              />
              <KPICard
                title="إجمالي الإيصالات"
                value={formatCurrency(kpis.totalVoucherAmount)}
                icon="📈"
                color="text-blue-600"
                trend={`${kpis.totalVouchers} إيصال`}
                onClick={() => router.push('/vouchers')}
              />
              <KPICard
                title="الأقساط المدفوعة"
                value={`${kpis.paidInstallments}`}
                icon="✅"
                color="text-green-600"
                trend="مدفوعة"
                onClick={() => router.push('/installments')}
              />
              <KPICard
                title="الأقساط المعلقة"
                value={`${kpis.pendingInstallments}`}
                icon="⏳"
                color="text-orange-600"
                trend="معلقة"
                onClick={() => router.push('/installments')}
              />
            </div>
          </div>
        )}

        {/* Additional KPIs */}
        {kpis && (
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                title="نسبة التحصيل"
                value={`${Math.round((kpis.paidInstallments / (kpis.paidInstallments + kpis.pendingInstallments)) * 100) || 0}%`}
                icon="📊"
                color="text-indigo-600"
                trend="ممتاز"
                onClick={() => router.push('/installments')}
              />
              <KPICard
                title="إجمالي الديون"
                value={formatCurrency(kpis.pendingInstallments * 1000)}
                icon="⚠️"
                color="text-orange-600"
                trend="يحتاج متابعة"
                onClick={() => router.push('/installments')}
              />
              <KPICard
                title="عدد الوحدات"
                value={`${kpis.totalUnits}`}
                icon="🏠"
                color="text-teal-600"
                trend={`نشطة: ${kpis.activeUnits}`}
                onClick={() => router.push('/units')}
              />
              <KPICard
                title="عدد المستثمرين"
                value={`${kpis.totalCustomers}`}
                icon="👥"
                color="text-pink-600"
                trend="نشط"
                onClick={() => router.push('/partners')}
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">الإجراءات السريعة</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                title={action.title}
                icon={action.icon}
                color={action.color}
                onClick={action.onClick}
              />
            ))}
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">جميع الوحدات</h2>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            {navigationItems.map((item, index) => (
              <NavigationCard
                key={index}
                title={item.title}
                icon={item.icon}
                color={item.color}
                onClick={item.onClick}
              />
            ))}
          </div>
        </div>
        
        <NotificationSystem 
          notifications={notifications} 
          onRemove={removeNotification} 
        />
        </div>
      </div>
    </div>
  )
}