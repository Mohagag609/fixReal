// Frontend performance optimizations

// Virtual scrolling for large lists
export class VirtualScroller {
  private container: HTMLElement
  private itemHeight: number
  private visibleCount: number
  private buffer: number
  private scrollTop: number = 0
  private totalHeight: number = 0
  private onScroll: (startIndex: number, endIndex: number) => void

  constructor(
    container: HTMLElement,
    itemHeight: number,
    visibleCount: number,
    buffer: number = 5,
    onScroll: (startIndex: number, endIndex: number) => void
  ) {
    this.container = container
    this.itemHeight = itemHeight
    this.visibleCount = visibleCount
    this.buffer = buffer
    this.onScroll = onScroll

    this.setupScrollListener()
  }

  private setupScrollListener() {
    this.container.addEventListener('scroll', this.handleScroll.bind(this))
  }

  private handleScroll() {
    this.scrollTop = this.container.scrollTop
    this.updateVisibleItems()
  }

  private updateVisibleItems() {
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.buffer)
    const endIndex = Math.min(
      this.totalHeight / this.itemHeight - 1,
      Math.ceil((this.scrollTop + this.container.clientHeight) / this.itemHeight) + this.buffer
    )

    this.onScroll(startIndex, endIndex)
  }

  updateTotalHeight(totalItems: number) {
    this.totalHeight = totalItems * this.itemHeight
    this.container.style.height = `${this.totalHeight}px`
  }

  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll.bind(this))
  }
}

// Image lazy loading
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null
  private images: Set<HTMLImageElement> = new Set()

  constructor() {
    this.setupObserver()
  }

  private setupObserver() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            this.loadImage(img)
            this.observer?.unobserve(img)
          }
        })
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    )
  }

  observe(img: HTMLImageElement) {
    if (this.observer) {
      this.images.add(img)
      this.observer.observe(img)
    }
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src
    if (src) {
      img.src = src
      img.classList.remove('lazy')
      img.classList.add('loaded')
    }
  }

  unobserve(img: HTMLImageElement) {
    this.images.delete(img)
    this.observer?.unobserve(img)
  }

  destroy() {
    this.images.forEach(img => this.observer?.unobserve(img))
    this.images.clear()
    this.observer?.disconnect()
  }
}

// Debounced search
export function createDebouncedSearch(
  callback: (query: string) => void,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null

  return (query: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      callback(query)
    }, delay)
  }
}

// Throttled scroll handler
export function createThrottledScroll(
  callback: (scrollTop: number) => void,
  delay: number = 16
) {
  let lastCall = 0

  return (scrollTop: number) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      callback(scrollTop)
    }
  }
}

// Memory-efficient data processing
export function processLargeDataset<T, R>(
  data: T[],
  processor: (item: T) => R,
  batchSize: number = 1000,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  return new Promise((resolve) => {
    const results: R[] = []
    let index = 0

    const processBatch = () => {
      const batch = data.slice(index, index + batchSize)
      const batchResults = batch.map(processor)
      results.push(...batchResults)
      index += batchSize

      if (onProgress) {
        onProgress(index, data.length)
      }

      if (index < data.length) {
        // Use setTimeout to prevent blocking the main thread
        setTimeout(processBatch, 0)
      } else {
        resolve(results)
      }
    }

    processBatch()
  })
}

// Optimized table rendering
export function createOptimizedTable<T>(
  data: T[],
  columns: Array<{
    key: keyof T
    label: string
    render?: (value: unknown, item: T) => string
  }>,
  options: {
    pageSize?: number
    virtualScrolling?: boolean
    itemHeight?: number
  } = {}
) {
  const { pageSize = 50, virtualScrolling = false, itemHeight = 40 } = options

  if (virtualScrolling && data.length > pageSize) {
    return createVirtualTable(data, columns, itemHeight)
  }

  return createPaginatedTable(data, columns, pageSize)
}

function createVirtualTable<T>(
  data: T[],
  columns: Array<{
    key: keyof T
    label: string
    render?: (value: unknown, item: T) => string
  }>,
  itemHeight: number
) {
  // Implementation for virtual table
  return {
    render: () => {
      // Virtual table rendering logic
      return ''
    }
  }
}

function createPaginatedTable<T>(
  data: T[],
  columns: Array<{
    key: keyof T
    label: string
    render?: (value: unknown, item: T) => string
  }>,
  pageSize: number
) {
  // Implementation for paginated table
  return {
    render: () => {
      // Paginated table rendering logic
      return ''
    }
  }
}

// Bundle splitting utilities
export function loadComponent<T extends React.ComponentType<unknown>>(
  importFunc: () => Promise<{ default: T }>
): Promise<T> {
  return importFunc().then(importedModule => (importedModule as any).default)
}

// Preload critical resources
export function preloadCriticalResources() {
  // Preload critical CSS
  const criticalCSS = document.createElement('link')
  criticalCSS.rel = 'preload'
  criticalCSS.href = '/styles/critical.css'
  criticalCSS.as = 'style'
  document.head.appendChild(criticalCSS)

  // Preload critical fonts
  const criticalFont = document.createElement('link')
  criticalFont.rel = 'preload'
  criticalFont.href = '/fonts/arabic-font.woff2'
  criticalFont.as = 'font'
  criticalFont.crossOrigin = 'anonymous'
  document.head.appendChild(criticalFont)
}

// Service Worker registration for caching
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  }
}

// Performance monitoring
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`${name} took ${end - start} milliseconds`)
}

// Memory usage monitoring
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    return {
      used: memory?.usedJSHeapSize || 0,
      total: memory?.totalJSHeapSize || 0,
      limit: memory?.jsHeapSizeLimit || 0
    }
  }
  return null
}

// Export singleton instances
export const lazyImageLoader = new LazyImageLoader()
