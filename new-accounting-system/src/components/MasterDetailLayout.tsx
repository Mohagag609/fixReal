'use client'

import React, { useState, useEffect } from 'react'
import { XIcon, ChevronLeftIcon, Maximize2Icon, Minimize2Icon, X, ChevronLeft, Minimize2, Maximize2 } from './icons'
import { Button } from './ui/Button'

export interface MasterDetailLayoutProps {
  master: React.ReactNode
  detail: React.ReactNode
  isDetailOpen: boolean
  onDetailClose: () => void
  onDetailOpen: () => void
  selectedItem?: Record<string, unknown> | undefined
  className?: string
  masterWidth?: string
  detailWidth?: string
}

export const MasterDetailLayout: React.FC<MasterDetailLayoutProps> = ({
  master,
  detail,
  isDetailOpen,
  onDetailClose,
  // onDetailOpen,
  // selectedItem,
  className = '',
  masterWidth = '50%',
  detailWidth = '50%',
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (isMobile) {
    return (
      <div className={`relative ${className}`}>
        <div>
          {isDetailOpen ? (
            <div
              key="detail"
              className="fixed inset-0 z-50 bg-white"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDetailClose}
                    className="flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4 ml-2" />
                    العودة
                  </Button>
                  <h2 className="text-lg font-semibold text-gray-900">
                    التفاصيل
                  </h2>
                  <div className="w-20" /> {/* Spacer for centering */}
                </div>
                <div className="flex-1 overflow-auto">
                  {detail}
                </div>
              </div>
            </div>
          ) : (
            <div
              key="master"
              className="h-full"
            >
              {master}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex h-full ${className}`}>
      {/* Master Panel */}
      <div>
            <div className="flex flex-col h-full">
              {/* Detail Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDetailClose}
                    className="flex items-center"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <h2 className="text-lg font-semibold text-gray-900">
                    التفاصيل
                  </h2>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="flex items-center"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-auto">
                {detail}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MasterDetailLayout