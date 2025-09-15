'use client'

import { useState, useEffect } from 'react'
import { useNotifications } from './NotificationSystem'

interface Settings {
  theme: 'dark' | 'light'
  fontSize: number
  language: 'ar' | 'en'
  currency: string
  dateFormat: string
  notifications: boolean
  autoSave: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly' | 'never'
}

interface SettingsProps {
  onSettingsChange: (settings: Settings) => void
}

export function Settings({ onSettingsChange }: SettingsProps) {
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    fontSize: 16,
    language: 'ar',
    currency: 'EGP',
    dateFormat: 'DD/MM/YYYY',
    notifications: true,
    autoSave: true,
    backupFrequency: 'weekly'
  })

  const { addNotification } = useNotifications()

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('app-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
  }, [])

  useEffect(() => {
    // Apply theme
    document.documentElement.setAttribute('data-theme', settings.theme)
    
    // Apply font size
    document.documentElement.style.fontSize = `${settings.fontSize}px`
    
    // Save to localStorage
    localStorage.setItem('app-settings', JSON.stringify(settings))
    
    // Notify parent component
    onSettingsChange(settings)
  }, [settings, onSettingsChange])

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    addNotification({
      type: 'success',
      title: 'تم حفظ الإعدادات',
      message: 'تم تحديث الإعدادات بنجاح'
    })
  }

  const resetSettings = () => {
    const defaultSettings: Settings = {
      theme: 'dark',
      fontSize: 16,
      language: 'ar',
      currency: 'EGP',
      dateFormat: 'DD/MM/YYYY',
      notifications: true,
      autoSave: true,
      backupFrequency: 'weekly'
    }
    setSettings(defaultSettings)
    addNotification({
      type: 'info',
      title: 'تم إعادة تعيين الإعدادات',
      message: 'تم استعادة الإعدادات الافتراضية'
    })
  }

  return (
    <div className="panel">
      <h2>الإعدادات</h2>
      
      <div className="grid-2" style={{ gap: '20px' }}>
        <div className="card">
          <h3>المظهر</h3>
          
          <div className="form-group">
            <label className="form-label">السمة</label>
            <select
              className="select"
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value as 'dark' | 'light')}
            >
              <option value="dark">داكن</option>
              <option value="light">فاتح</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">حجم الخط</label>
            <select
              className="select"
              value={settings.fontSize}
              onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
            >
              <option value="14">صغير (14px)</option>
              <option value="16">متوسط (16px)</option>
              <option value="18">كبير (18px)</option>
              <option value="20">كبير جداً (20px)</option>
            </select>
          </div>
        </div>

        <div className="card">
          <h3>اللغة والعملة</h3>
          
          <div className="form-group">
            <label className="form-label">اللغة</label>
            <select
              className="select"
              value={settings.language}
              onChange={(e) => updateSetting('language', e.target.value as 'ar' | 'en')}
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">العملة</label>
            <select
              className="select"
              value={settings.currency}
              onChange={(e) => updateSetting('currency', e.target.value)}
            >
              <option value="EGP">جنيه مصري (EGP)</option>
              <option value="USD">دولار أمريكي (USD)</option>
              <option value="EUR">يورو (EUR)</option>
              <option value="SAR">ريال سعودي (SAR)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">تنسيق التاريخ</label>
            <select
              className="select"
              value={settings.dateFormat}
              onChange={(e) => updateSetting('dateFormat', e.target.value)}
            >
              <option value="DD/MM/YYYY">يوم/شهر/سنة</option>
              <option value="MM/DD/YYYY">شهر/يوم/سنة</option>
              <option value="YYYY-MM-DD">سنة-شهر-يوم</option>
            </select>
          </div>
        </div>

        <div className="card">
          <h3>الإشعارات</h3>
          
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => updateSetting('notifications', e.target.checked)}
              />
              تفعيل الإشعارات
            </label>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => updateSetting('autoSave', e.target.checked)}
              />
              الحفظ التلقائي
            </label>
          </div>
        </div>

        <div className="card">
          <h3>النسخ الاحتياطية</h3>
          
          <div className="form-group">
            <label className="form-label">تكرار النسخ الاحتياطية</label>
            <select
              className="select"
              value={settings.backupFrequency}
              onChange={(e) => updateSetting('backupFrequency', e.target.value as unknown)}
            >
              <option value="daily">يومياً</option>
              <option value="weekly">أسبوعياً</option>
              <option value="monthly">شهرياً</option>
              <option value="never">لا</option>
            </select>
          </div>
        </div>
      </div>

      <div className="tools" style={{ marginTop: '20px' }}>
        <button className="btn secondary" onClick={resetSettings}>
          إعادة تعيين الإعدادات
        </button>
      </div>
    </div>
  )
}