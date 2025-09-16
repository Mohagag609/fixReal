import React from 'react'

interface ModernCardProps {
  children?: React.ReactNode
  className?: string
  [key: string]: unknown
}

const ModernCard: React.FC<ModernCardProps> = ({ children, className = '', ...props }) => (
  <div className={`bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl shadow-gray-900/5 p-6 ${className}`} {...props}>
    {children}
  </div>
)

export default ModernCard
