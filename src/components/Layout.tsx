'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'

interface LayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  icon: string
}

const Layout = ({ children, title, subtitle, icon }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  // Handle sidebar state based on route
  useEffect(() => {
    const handleRouteChange = () => {
      // Always open sidebar on dashboard, close on mobile
      if (window.location.pathname === '/') {
        setSidebarOpen(window.innerWidth >= 1024)
      } else if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }

    // Set initial state when component mounts
    handleRouteChange()

    // Listen for window resize
    const handleResize = () => {
      handleRouteChange()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault()
            setSidebarOpen(!sidebarOpen)
            break
          case 'u':
            e.preventDefault()
            router.push('/units')
            break
          case 'p':
            e.preventDefault()
            router.push('/partners')
            break
          case 'c':
            e.preventDefault()
            router.push('/contracts')
            break
          case 't':
            e.preventDefault()
            router.push('/treasury')
            break
          case 'i':
            e.preventDefault()
            router.push('/installments')
            break
          case 's':
            e.preventDefault()
            router.push('/customers')
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [sidebarOpen, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:mr-72' : ''}`}>
        {/* Header */}
        <Header 
          title={title}
          subtitle={subtitle}
          icon={icon}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout