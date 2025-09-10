'use client'

import { useRouter } from 'next/navigation'

interface NavigationButtonsProps {
  showBack?: boolean
  backLabel?: string
  showDashboard?: boolean
  dashboardLabel?: string
  className?: string
}

const NavigationButtons = ({ 
  showBack = true, 
  backLabel = 'العودة للخلف',
  showDashboard = true,
  dashboardLabel = 'العودة للوحة التحكم',
  className = ''
}: NavigationButtonsProps) => {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <div className={`flex items-center space-x-3 space-x-reverse ${className}`}>
      {showBack && (
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center space-x-2 space-x-reverse"
        >
          <span>←</span>
          <span>{backLabel}</span>
        </button>
      )}
      
      {showDashboard && (
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center space-x-2 space-x-reverse"
        >
          <span>🏠</span>
          <span>{dashboardLabel}</span>
        </button>
      )}
    </div>
  )
}

export default NavigationButtons