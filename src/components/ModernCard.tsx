'use client'

import { ReactNode } from 'react'

interface ModernCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

const ModernCard = ({ children, className = '', onClick }: ModernCardProps) => {
  return (
    <div
      className={`bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg shadow-gray-900/5 hover:shadow-xl hover:shadow-gray-900/10 transition-all duration-300 hover:scale-[1.02] ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default ModernCard