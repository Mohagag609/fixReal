'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // تأكد أننا على العميل
    setIsClient(true)
    
    // تحديث الوقت عند تحميل المكون
    setCurrentTime(new Date().toLocaleString('ar-SA'))
    
    // تحديث الوقت كل دقيقة
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString('ar-SA'))
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const menuItems = [
    {
      title: 'لوحة التحكم',
      icon: '🏠',
      path: '/',
      description: 'نظرة عامة على النظام'
    },
    {
      title: 'العملاء',
      icon: '👤',
      path: '/customers',
      description: 'إدارة العملاء'
    },
    {
      title: 'الوحدات',
      icon: '🏢',
      path: '/units',
      description: 'إدارة الوحدات العقارية'
    },
    {
      title: 'العقود',
      icon: '📋',
      path: '/contracts',
      description: 'إدارة العقود والمبيعات'
    },
    {
      title: 'السماسرة',
      icon: '🤝',
      path: '/brokers',
      description: 'إدارة السماسرة والعمولات'
    },
    {
      title: 'الأقساط',
      icon: '📅',
      path: '/installments',
      description: 'إدارة الأقساط والتحصيل'
    },
    {
      title: 'السندات',
      icon: '📄',
      path: '/vouchers',
      description: 'سندات القبض والدفع'
    },
    {
      title: 'الشركاء',
      icon: '👥',
      path: '/partners',
      description: 'إدارة الشركاء والمجموعات'
    },
    {
      title: 'ديون الشركاء',
      icon: '💰',
      path: '/partner-debts',
      description: 'إدارة ديون الشركاء'
    },
    {
      title: 'الخزينة',
      icon: '🏦',
      path: '/treasury',
      description: 'إدارة الخزائن والمعاملات'
    },
    {
      title: 'التقارير',
      icon: '📊',
      path: '/reports',
      description: 'التقارير والإحصائيات'
    },
    {
      title: 'النسخ الاحتياطية',
      icon: '🔄',
      path: '/backup-system',
      description: 'نظام النسخ الاحتياطية والاستعادة'
    }
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 right-0 h-full bg-white/95 backdrop-blur-sm border-l border-gray-200/50 shadow-2xl shadow-gray-900/10 z-50
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        w-80 lg:w-72
        ${!isClient ? 'hidden' : ''}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🏢</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">نظام العقارات</h1>
              <p className="text-xs text-gray-600">إدارة متطورة</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
          >
            <span className="text-gray-600">✕</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-120px)]">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                router.push(item.path)
                if (window.innerWidth < 1024) {
                  onToggle()
                }
              }}
              className={`
                w-full flex items-center space-x-3 space-x-reverse p-4 rounded-xl transition-all duration-200
                ${isActive(item.path) 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25' 
                  : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                }
                group
              `}
            >
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                ${isActive(item.path) 
                  ? 'bg-white/20' 
                  : 'bg-gray-100 group-hover:bg-gray-200'
                }
              `}>
                <span className="text-xl">{item.icon}</span>
              </div>
              <div className="flex-1 text-right">
                <div className="font-medium">{item.title}</div>
                <div className={`text-xs ${isActive(item.path) ? 'text-white/80' : 'text-gray-500'}`}>
                  {item.description}
                </div>
              </div>
              {isActive(item.path) && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/50 bg-white/50">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-2">
              آخر تحديث: {currentTime || 'جاري التحميل...'}
            </div>
            <div className="flex items-center justify-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">النظام يعمل بشكل طبيعي</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar