'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, Bell, Search, UserIcon } from '../icons'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button
            variant="outline"
            size="sm"
            onClick={onMenuToggle}
            className="lg:hidden p-2"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="hidden md:block">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pr-10"
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* Notifications */}
          <Button
            variant="outline"
            size="sm"
            className="relative p-2"
          >
            <Bell className="w-5 h-5" />
            <motion.span
              className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </Button>

          {/* User menu */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">مدير النظام</p>
              <p className="text-xs text-gray-500">admin@example.com</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="p-2"
            >
              <UserIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}