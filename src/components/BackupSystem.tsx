'use client'

import { useState } from 'react'
import { useNotifications } from './NotificationSystem'

interface BackupSystemProps {
  onBackup: () => Promise<unknown>
  onRestore: (file: File) => Promise<void>
}

export function BackupSystem({ onBackup, onRestore }: BackupSystemProps) {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const { addNotification } = useNotifications()

  const handleBackup = async () => {
    setIsBackingUp(true)
    try {
      const data = await onBackup()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `backup_${new Date()??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      addNotification({
        type: 'success',
        title: 'تم إنشاء النسخة الاحتياطية',
        message: 'تم حفظ النسخة الاحتياطية بنجاح'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في النسخ الاحتياطي',
        message: 'فشل في إنشاء النسخة الاحتياطية'
      })
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsRestoring(true)
    try {
      await onRestore(file)
      addNotification({
        type: 'success',
        title: 'تم استعادة النسخة الاحتياطية',
        message: 'تم استعادة البيانات بنجاح'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في الاستعادة',
        message: 'فشل في استعادة النسخة الاحتياطية'
      })
    } finally {
      setIsRestoring(false)
      event.target.value = ''
    }
  }

  return (
    <div className="panel">
      <h2>نظام النسخ الاحتياطي</h2>
      
      <div className="tools">
        <button 
          className="btn ok" 
          onClick={handleBackup}
          disabled={isBackingUp}
        >
          {isBackingUp ? 'جاري الإنشاء...' : 'إنشاء نسخة احتياطية'}
        </button>
        
        <label className="btn secondary" style={{ cursor: 'pointer' }}>
          {isRestoring ? 'جاري الاستعادة...' : 'استعادة نسخة احتياطية'}
          <input
            type="file"
            accept=".json"
            onChange={handleRestore}
            disabled={isRestoring}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <h3>معلومات النسخ الاحتياطية</h3>
        <ul style={{ color: 'var(--muted)', fontSize: '14px' }}>
          <li>• النسخ الاحتياطية تحتوي على جميع البيانات الحالية</li>
          <li>• يمكن استعادة البيانات في أي وقت</li>
          <li>• يُنصح بإنشاء نسخة احتياطية يومياً</li>
          <li>• احتفظ بنسخ احتياطية متعددة في أماكن آمنة</li>
        </ul>
      </div>
    </div>
  )
}