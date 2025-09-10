'use client'

import { useEffect, useRef } from 'react'

interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }>
}

interface LineChartProps {
  data: ChartData
  title?: string
  height?: number
}

export function LineChart({ data, title, height = 300 }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Dynamic import for Chart.js
    import('chart.js/auto').then(({ Chart }) => {
      const ctx = canvasRef.current!.getContext('2d')
      if (!ctx) return

      new Chart(ctx, {
        type: 'line',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: !!title,
              text: title,
              font: {
                size: 16,
                family: 'Cairo'
              }
            },
            legend: {
              labels: {
                font: {
                  family: 'Cairo'
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                font: {
                  family: 'Cairo'
                }
              }
            },
            x: {
              ticks: {
                font: {
                  family: 'Cairo'
                }
              }
            }
          }
        }
      })
    })
  }, [data, title])

  return (
    <div className="card">
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  )
}

interface BarChartProps {
  data: ChartData
  title?: string
  height?: number
}

export function BarChart({ data, title, height = 300 }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    import('chart.js/auto').then(({ Chart }) => {
      const ctx = canvasRef.current!.getContext('2d')
      if (!ctx) return

      new Chart(ctx, {
        type: 'bar',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: !!title,
              text: title,
              font: {
                size: 16,
                family: 'Cairo'
              }
            },
            legend: {
              labels: {
                font: {
                  family: 'Cairo'
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                font: {
                  family: 'Cairo'
                }
              }
            },
            x: {
              ticks: {
                font: {
                  family: 'Cairo'
                }
              }
            }
          }
        }
      })
    })
  }, [data, title])

  return (
    <div className="card">
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  )
}

interface PieChartProps {
  data: ChartData
  title?: string
  height?: number
}

export function PieChart({ data, title, height = 300 }: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    import('chart.js/auto').then(({ Chart }) => {
      const ctx = canvasRef.current!.getContext('2d')
      if (!ctx) return

      new Chart(ctx, {
        type: 'pie',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: !!title,
              text: title,
              font: {
                size: 16,
                family: 'Cairo'
              }
            },
            legend: {
              labels: {
                font: {
                  family: 'Cairo'
                }
              }
            }
          }
        }
      })
    })
  }, [data, title])

  return (
    <div className="card">
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  )
}

interface DoughnutChartProps {
  data: ChartData
  title?: string
  height?: number
}

export function DoughnutChart({ data, title, height = 300 }: DoughnutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    import('chart.js/auto').then(({ Chart }) => {
      const ctx = canvasRef.current!.getContext('2d')
      if (!ctx) return

      new Chart(ctx, {
        type: 'doughnut',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: !!title,
              text: title,
              font: {
                size: 16,
                family: 'Cairo'
              }
            },
            legend: {
              labels: {
                font: {
                  family: 'Cairo'
                }
              }
            }
          }
        }
      })
    })
  }, [data, title])

  return (
    <div className="card">
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  )
}