'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ModernCard from '../../components/ModernCard'
import ModernButton from '../../components/ModernButton'
import SidebarToggle from '../../components/SidebarToggle'
import Sidebar from '../../components/Sidebar'
import NavigationButtons from '../../components/NavigationButtons'
import { NotificationSystem } from '../../components/NotificationSystem'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  lastLogin: string
  createdAt: string
  permissions: string[]
}

const ProfilePage = () => {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [notifications, setNotifications] = useState<Array<{id: string, type: 'success' | 'error' | 'info', title: string, message: string, timestamp: Date}>>([])

  const addNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { 
      id, 
      type, 
      title,
      message, 
      timestamp: new Date() 
    }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      if (!token) {
        router.push('/login')
        return
      }

      // Mock profile data for now
      setProfile({
        id: '1',
        name: 'المدير',
        email: 'admin@estate.com',
        role: 'مدير النظام',
        lastLogin: new Date().toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        permissions: ['read', 'write', 'delete', 'admin']
      })

    } catch (error) {
      console.error('Error fetching profile:', error)
      addNotification('error', 'خطأ في تحميل الملف الشخصي', 'فشل في تحميل بيانات المستخدم')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault()
            setSidebarOpen(!sidebarOpen)
            break
          case 'e':
            e.preventDefault()
            setEditing(!editing)
            break
          case 'Escape':
            e.preventDefault()
            setEditing(false)
            setSidebarOpen(false)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [sidebarOpen, editing])

  const handleSave = () => {
    addNotification('success', 'تم الحفظ بنجاح', 'تم تحديث الملف الشخصي بنجاح')
    setEditing(false)
  }

  const handleChangePassword = () => {
    addNotification('info', 'تغيير كلمة المرور', 'سيتم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <NotificationSystem notifications={notifications} onRemove={removeNotification} />
      
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'mr-80' : 'mr-0'}`}>
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left side - Menu button and title */}
              <div className="flex items-center space-x-4 space-x-reverse">
                <SidebarToggle onToggle={() => setSidebarOpen(!sidebarOpen)} />
                
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">👤</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">الملف الشخصي</h1>
                    <p className="text-gray-600">إدارة بيانات المستخدم</p>
                  </div>
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center space-x-3 space-x-reverse">
                <NavigationButtons />
                
                <div className="hidden md:flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                    title="تحديث الصفحة"
                  >
                    <span className="text-gray-600">🔄</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Profile Header */}
          <ModernCard className="mb-8">
            <div className="flex items-center space-x-6 space-x-reverse">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-3xl">👤</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{profile?.name}</h2>
                <p className="text-gray-600">{profile?.role}</p>
                <p className="text-sm text-gray-500">{profile?.email}</p>
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <ModernButton
                  onClick={() => setEditing(!editing)}
                  variant={editing ? 'secondary' : 'primary'}
                >
                  {editing ? 'إلغاء' : 'تعديل'}
                </ModernButton>
                <ModernButton
                  onClick={handleChangePassword}
                  variant="outline"
                >
                  تغيير كلمة المرور
                </ModernButton>
              </div>
            </div>
          </ModernCard>

          {/* Profile Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <ModernCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">المعلومات الشخصية</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                  {editing ? (
                    <input
                      type="text"
                      defaultValue={profile?.name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                  {editing ? (
                    <input
                      type="email"
                      defaultValue={profile?.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile?.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
                  <p className="text-gray-900">{profile?.role}</p>
                </div>
              </div>
            </ModernCard>

            {/* Account Information */}
            <ModernCard>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات الحساب</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ إنشاء الحساب</label>
                  <p className="text-gray-900">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB') : 'غير متوفر'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">آخر تسجيل دخول</label>
                  <p className="text-gray-900">{profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString('en-GB') : 'غير متوفر'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">حالة الحساب</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    نشط
                  </span>
                </div>
              </div>
            </ModernCard>
          </div>

          {/* Permissions */}
          <ModernCard className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">الصلاحيات</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile?.permissions.map((permission, index) => (
                <div key={index} className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 capitalize">{permission}</span>
                </div>
              ))}
            </div>
          </ModernCard>

          {/* Save Button */}
          {editing && (
            <div className="mt-6 flex justify-end">
              <ModernButton onClick={handleSave} variant="primary">
                حفظ التغييرات
              </ModernButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage