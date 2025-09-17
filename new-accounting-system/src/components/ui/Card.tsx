'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'onDrag'> {
  hover?: boolean
  clickable?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, clickable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-xl shadow-sm border border-gray-200 p-6',
          hover && 'hover:shadow-md transition-shadow duration-200',
          clickable && 'cursor-pointer hover:shadow-md transition-all duration-200',
          className
        )}
        whileHover={hover ? { y: -2 } : undefined}
        whileTap={clickable ? { scale: 0.98 } : undefined}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border-b border-gray-200 pb-4 mb-6', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-gray-900', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border-t border-gray-200 pt-4 mt-6', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardContent, CardFooter }