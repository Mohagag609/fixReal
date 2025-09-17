'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends Omit<HTMLMotionProps<'input'>, 'onDrag'> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <div input
            ref={ref}
            className={cn(
              'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200',
              error && 'border-red-500 focus:ring-red-500',
              icon && 'pr-10',
              className
            )}
            whileFocus={{ scale: 1.01 }}
            {...props}
          />
        </div>
        {error && (
          <p
            className="text-sm text-red-600"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }