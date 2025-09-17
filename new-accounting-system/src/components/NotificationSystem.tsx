'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertIcon, Info, AlertTriangle } from './icons'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  persistent?: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification,
    }
    
    setNotifications(prev => [...prev, newNotification])

    // Auto remove notification after duration
    if (!notification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAllNotifications,
    }}>
      {children}
      <NotificationSystem />
    </NotificationContext.Provider>
  )
}

const NotificationSystem: React.FC = () => {
  const { notifications, removeNotification } = useNotifications()

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertIcon className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />
      default:
        return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  const getBackgroundColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getTextColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
      default:
        return 'text-gray-800'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <div>
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              max-w-sm w-full p-4 rounded-lg border shadow-lg backdrop-blur-sm
              ${getBackgroundColor(notification.type)}
            `}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="mr-3 flex-1">
                <h4 className={`text-sm font-medium ${getTextColor(notification.type)}`}>
                  {notification.title}
                </h4>
                <p className={`text-sm mt-1 ${getTextColor(notification.type)} opacity-90`}>
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className={`
                  flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10
                  transition-colors duration-200
                `}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotificationSystem