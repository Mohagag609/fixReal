'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboardIcon, UsersIcon, BuildingIcon, FileTextIcon, WalletIcon, ReceiptIcon, CalendarIcon, BarChart3Icon, SettingsIcon, X } from '../icons'
import { cn } from '../../lib/utils'

const menuItems = [
  {
    title: 'لوحة التحكم',
    href: '/',
    icon: LayoutDashboardIcon,
  },
  {
    title: 'العملاء',
    href: '/customers',
    icon: UsersIcon,
  },
  {
    title: 'الوحدات',
    href: '/units',
    icon: BuildingIcon,
  },
  {
    title: 'العقود',
    href: '/contracts',
    icon: FileTextIcon,
  },
  {
    title: 'الشركاء',
    href: '/partners',
    icon: UsersIcon,
  },
  {
    title: 'الخزائن',
    href: '/safes',
    icon: WalletIcon,
  },
  {
    title: 'الخزينة',
    href: '/treasury',
    icon: WalletIcon,
  },
  {
    title: 'الشيكات',
    href: '/vouchers',
    icon: ReceiptIcon,
  },
  {
    title: 'الأقساط',
    href: '/installments',
    icon: CalendarIcon,
  },
  {
    title: 'التقارير',
    href: '/reports',
    icon: BarChart3Icon,
  },
  {
    title: 'الإعدادات',
    href: '/settings',
    icon: SettingsIcon,
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
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">نظام المحاسبة</h2>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
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
      </aside>
    </>
  )
}