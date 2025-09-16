import React from 'react'

interface ModernSelectProps {
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  className?: string
  disabled?: boolean
  required?: boolean
  children?: React.ReactNode
  [key: string]: unknown
}

const ModernSelect: React.FC<ModernSelectProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
  required = false,
  children,
  ...props
}) => {
  const baseClasses = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed'
  
  return (
    <select
      value={value}
      onChange={onChange}
      className={`${baseClasses} ${className}`}
      disabled={disabled}
      required={required}
      {...props}
    >
      {children}
    </select>
  )
}

export { ModernSelect }
