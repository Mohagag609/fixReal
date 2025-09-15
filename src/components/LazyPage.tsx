import React, { Suspense, lazy, ComponentType } from 'react'
import { ModernCard } from './ui/ModernCard'

interface LazyPageProps {
  fallback?: React.ReactNode
  className?: string
}

// Default loading component
const DefaultLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <ModernCard className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">جاري التحميل...</p>
    </ModernCard>
  </div>
)

// Higher-order component for lazy loading pages
export function withLazyLoading<T extends object>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc)

  return function LazyPageWrapper(props: T & LazyPageProps) {
    const { fallback: customFallback, className, ...componentProps } = props

    return (
      <Suspense fallback={customFallback || fallback || <DefaultLoading />}>
        <div className={className}>
          <LazyComponent {...(componentProps as T)} />
        </div>
      </Suspense>
    )
  }
}

// Hook for lazy loading with error boundaries
export function useLazyComponent<T extends object>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  deps: React.DependencyList = []
) {
  const [Component, setComponent] = React.useState<ComponentType<T> | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    let isMounted = true

    const loadComponent = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const importedModule = await importFunc()
        
        if (isMounted) {
          setComponent(() => importedModule.default)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error)
          setLoading(false)
        }
      }
    }

    loadComponent()

    return () => {
      isMounted = false
    }
  }, deps)

  return { Component, loading, error }
}

// Error boundary for lazy components
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class LazyErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ReactNode }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ fallback?: React.ReactNode }>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center">
            <ModernCard className="p-8 text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">خطأ في تحميل الصفحة</h2>
              <p className="text-gray-600 mb-4">
                حدث خطأ أثناء تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                إعادة تحميل الصفحة
              </button>
            </ModernCard>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// Optimized page wrapper with lazy loading and error handling
export function OptimizedPage({
  children,
  fallback,
  className = ''
}: React.PropsWithChildren<LazyPageProps>) {
  return (
    <LazyErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback || <DefaultLoading />}>
        <div className={className}>
          {children}
        </div>
      </Suspense>
    </LazyErrorBoundary>
  )
}
