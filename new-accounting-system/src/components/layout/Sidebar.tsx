'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Building,
  FileText,
  Wallet,
  Receipt,
  Calendar,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    title: 'لوحة التحكم',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'العملاء',
    href: '/customers',
    icon: Users,
  },
  {
    title: 'الوحدات',
    href: '/units',
    icon: Building,
  },
  {
    title: 'العقود',
    href: '/contracts',
    icon: FileText,
  },
  {
    title: 'الشركاء',
    href: '/partners',
    icon: Users,
  },
  {
    title: 'الخزائن',
    href: '/safes',
    icon: Wallet,
  },
  {
    title: 'الخزينة',
    href: '/treasury',
    icon: Wallet,
  },
  {
    title: 'الشيكات',
    href: '/vouchers',
    icon: Receipt,
  },
  {
    title: 'الأقساط',
    href: '/installments',
    icon: Calendar,
  },
  {
    title: 'التقارير',
    href: '/reports',
    icon: BarChart3,
  },
  {
    title: 'الإعدادات',
    href: '/settings',
    icon: Settings,
  },
]

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : '100%',
        }}
        transition={{ type: 'spring', duration: 0.3 }}
        className={cn(
          'fixed top-0 right-0 h-full w-64 bg-white shadow-lg border-l border-gray-200 z-50 lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">نظام المحاسبة</h1>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href as string}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) {
                    onToggle()
                  }
                }}
                className={cn(
                  'flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors duration-200 rounded-lg group',
                  isActive && 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5 ml-3',
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                )} />
                <span className="font-medium">{item.title}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-sm text-gray-500 text-center">
            نظام المحاسبة v2.0
          </div>
        </div>
      </motion.aside>
    </>
  )
}