'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Safe, Transfer } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import SidebarToggle from '@/components/SidebarToggle'
import Sidebar from '@/components/Sidebar'
import NavigationButtons from '@/components/NavigationButtons'

// Modern UI Components
const ModernCard = ({ children, className = '', ...props }: unknown) => (
  <div className={`bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl shadow-gray-900/5 p-6 ${className}`} {...props}>
    {children}
  </div>
)

const ModernButton = ({ children, variant = 'primary', size = 'md', className = '', ...props }: unknown) => {
  const variants: { [key: string]: string } = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25',
    secondary: 'bg-white/80 hover:bg-white border border-gray-200 text-gray-700 shadow-lg shadow-gray-900/5',
    success: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/25',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25',
    warning: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white shadow-lg shadow-yellow-500/25',
    info: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/25'
  }
  
  const sizes: { [key: string]: string } = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm font-medium',
    lg: 'px-6 py-3 text-base font-medium'
  }
  
  return (
    <button 
      className={`${variants[variant]} ${sizes[size]} rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const ModernInput = ({ label, className = '', ...props }: unknown) => (
  <div className="space-y-2">
    {label && <label className="text-sm font-bold text-gray-900">{label}</label>}
    <input 
      className={`w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal ${className}`}
      {...props}
    />
  </div>
)

const ModernSelect = ({ label, children, className = '', ...props }: unknown) => (
  <div className="space-y-2">
    {label && <label className="text-sm font-bold text-gray-900">{label}</label>}
    <select 
      className={`w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
)

export default function Treasury() {
  const [safes, setSafes] = useState<Safe[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddSafeModal, setShowAddSafeModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [editingSafe, setEditingSafe] = useState<Safe | null>(null)
  const [deletingSafes, setDeletingSafes] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newSafe, setNewSafe] = useState({
    name: '',
    balance: ''
  })
  const [newTransfer, setNewTransfer] = useState({
    fromSafeId: '',
    toSafeId: '',
    amount: '',
    description: ''
  })
  
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

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
          case 'n':
            e.preventDefault()
            setShowAddSafeModal(true)
            break
          case 't':
            e.preventDefault()
            setShowTransferModal(true)
            break
          case 'Escape':
            e.preventDefault()
            setShowAddSafeModal(false)
            setShowTransferModal(false)
            setEditingSafe(null)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [sidebarOpen])

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken')
      
      const [safesResponse, transfersResponse] = await Promise.all([
        fetch('/api/safes', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/transfers', { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      
      const [safesData, transfersData] = await Promise.all([
        safesResponse.json(),
        transfersResponse.json()
      ])
      
      if (safesData.success) {
        setSafes(safesData.data)
      } else {
        setError(safesData.error || 'خطأ في تحميل الخزائن')
      }

      if (transfersData.success) {
        setTransfers(transfersData.data)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSafe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newSafe.name) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء إدخال اسم الخزنة'
      })
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/safes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newSafe,
          balance: parseFloat(newSafe.balance) || 0
        })
      })

      const data = await response.json()
      if (data.success) {
        setShowAddSafeModal(false)
        setSuccess('تم إضافة الخزنة بنجاح!')
        setError(null)
        setNewSafe({
          name: '',
          balance: ''
        })
        fetchData()
        addNotification({
          type: 'success',
          title: 'تم الحفظ بنجاح',
          message: 'تم إضافة الخزنة بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في إضافة الخزنة')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحفظ',
          message: data.error || 'فشل في إضافة الخزنة'
        })
      }
    } catch (err) {
      console.error('Add safe error:', err)
      setError('خطأ في إضافة الخزنة')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في إضافة الخزنة'
      })
    }
  }

  const handleEditSafe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingSafe) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/safes/${editingSafe.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newSafe,
          balance: parseFloat(newSafe.balance) || 0
        })
      })

      const data = await response.json()
      if (data.success) {
        setShowAddSafeModal(false)
        setEditingSafe(null)
        setSuccess('تم تحديث الخزنة بنجاح!')
        setError(null)
        setNewSafe({
          name: '',
          balance: ''
        })
        fetchData()
        addNotification({
          type: 'success',
          title: 'تم التحديث بنجاح',
          message: 'تم تحديث الخزنة بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في تحديث الخزنة')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في التحديث',
          message: data.error || 'فشل في تحديث الخزنة'
        })
      }
    } catch (err) {
      console.error('Update safe error:', err)
      setError('خطأ في تحديث الخزنة')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في التحديث',
        message: 'فشل في تحديث الخزنة'
      })
    }
  }

  const handleDeleteSafe = async (safeId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخزنة؟')) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/safes/${safeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('تم حذف الخزنة بنجاح!')
        setError(null)
        fetchData()
        addNotification({
          type: 'success',
          title: 'تم الحذف بنجاح',
          message: 'تم حذف الخزنة بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في حذف الخزنة')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحذف',
          message: data.error || 'فشل في حذف الخزنة'
        })
      }
    } catch (err) {
      console.error('Delete safe error:', err)
      setError('خطأ في حذف الخزنة')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'فشل في حذف الخزنة'
      })
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTransfer.fromSafeId || !newTransfer.toSafeId || !newTransfer.amount) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء اختيار الخزائن وإدخال المبلغ'
      })
      return
    }

    if (newTransfer.fromSafeId === newTransfer.toSafeId) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'لا يمكن التحويل لنفس الخزنة'
      })
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newTransfer,
          amount: parseFloat(newTransfer.amount)
        })
      })

      const data = await response.json()
      if (data.success) {
        setShowTransferModal(false)
        setSuccess('تم التحويل بنجاح!')
        setError(null)
        setNewTransfer({
          fromSafeId: '',
          toSafeId: '',
          amount: '',
          description: ''
        })
        fetchData()
        addNotification({
          type: 'success',
          title: 'تم التحويل بنجاح',
          message: 'تم التحويل بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في التحويل')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في التحويل',
          message: data.error || 'فشل في التحويل'
        })
      }
    } catch (err) {
      console.error('Transfer error:', err)
      setError('خطأ في التحويل')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في التحويل',
        message: 'فشل في التحويل'
      })
    }
  }

  const openEditModal = (safe: Safe) => {
    setEditingSafe(safe)
    setNewSafe({
      name: safe.name,
      balance: safe.balance.toString()
    })
    setShowAddSafeModal(true)
  }

  const totalBalance = safes.reduce((sum, safe) => sum + safe.balance, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">جاري التحميل...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:mr-72' : ''}`}>
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <SidebarToggle onToggle={() => setSidebarOpen(!sidebarOpen)} />
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">💰</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">إدارة الخزينة</h1>
                  <p className="text-gray-600">نظام متطور لإدارة الخزائن والمعاملات</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <ModernButton onClick={() => setShowAddSafeModal(true)}>
                  <span className="mr-2">➕</span>
                  إضافة خزنة جديدة
                  <span className="mr-2 text-xs opacity-70">Ctrl+N</span>
                </ModernButton>
                <ModernButton variant="info" onClick={() => setShowTransferModal(true)}>
                  <span className="mr-2">🔄</span>
                  تحويل بين الخزائن
                  <span className="mr-2 text-xs opacity-70">Ctrl+T</span>
                </ModernButton>
                <NavigationButtons />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ModernCard className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{formatCurrency(totalBalance)}</div>
              <div className="text-green-800 font-medium">إجمالي الرصيد</div>
            </div>
          </ModernCard>
          
          <ModernCard className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{safes.length}</div>
              <div className="text-blue-800 font-medium">عدد الخزائن</div>
            </div>
          </ModernCard>
          
          <ModernCard className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{transfers.length}</div>
              <div className="text-purple-800 font-medium">عدد التحويلات</div>
            </div>
          </ModernCard>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <ModernCard className="mb-8 bg-red-50 border-red-200">
            <div className="flex items-center">
              <span className="text-red-500 mr-3 text-xl">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
          </ModernCard>
        )}

        {success && (
          <ModernCard className="mb-8 bg-green-50 border-green-200">
            <div className="flex items-center">
              <span className="text-green-500 mr-3 text-xl">✅</span>
              <span className="text-green-700">{success}</span>
            </div>
          </ModernCard>
        )}

        {/* Safes List */}
        <ModernCard className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">قائمة الخزائن</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-sm text-gray-500">آخر تحديث:</span>
              <span className="text-sm font-medium text-gray-700">{new Date().toLocaleString('en-GB')}</span>
            </div>
          </div>

          {safes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-gray-400">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد خزائن</h3>
              <p className="text-gray-500 mb-6">ابدأ بإنشاء خزنة جديدة لإدارة أموالك</p>
              <ModernButton onClick={() => setShowAddSafeModal(true)}>
                <span className="mr-2">➕</span>
                إضافة خزنة جديدة
              </ModernButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {safes.map((safe) => (
                <div key={safe.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{safe.name}</h3>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <ModernButton size="sm" variant="secondary" onClick={() => openEditModal(safe)}>
                        ✏️
                      </ModernButton>
                      <ModernButton size="sm" variant="danger" onClick={() => handleDeleteSafe(safe.id)}>
                        🗑️
                      </ModernButton>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-2">{formatCurrency(safe.balance)}</div>
                  <div className="text-sm text-gray-600">آخر تحديث: {formatDate(safe.updatedAt || new Date())}</div>
                </div>
              ))}
            </div>
          )}
        </ModernCard>

        {/* Recent Transfers */}
        <ModernCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">التحويلات الأخيرة</h2>
            <ModernButton variant="secondary" size="sm" onClick={() => router.push('/vouchers')}>
              📄 عرض جميع السندات
            </ModernButton>
          </div>

          {transfers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-gray-400">🔄</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد تحويلات</h3>
              <p className="text-gray-500 mb-6">لم يتم تنفيذ أي تحويلات بين الخزائن بعد</p>
              <ModernButton variant="info" onClick={() => setShowTransferModal(true)}>
                <span className="mr-2">🔄</span>
                تسجيل تحويل جديد
              </ModernButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">من</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">إلى</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">المبلغ</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">الوصف</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.slice(0, 10).map((transfer) => (
                    <tr key={transfer.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{transfer.fromSafeId}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{transfer.toSafeId}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-blue-600">{formatCurrency(transfer.amount)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-600 max-w-xs truncate">{transfer.description || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-600">{formatDate(transfer.createdAt || new Date())}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModernCard>
      </div>

      {/* Add/Edit Safe Modal */}
      {showAddSafeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingSafe ? 'تعديل الخزنة' : 'إضافة خزنة جديدة'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddSafeModal(false)
                    setEditingSafe(null)
                    setNewSafe({
                      name: '',
                      balance: ''
                    })
                  }}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={editingSafe ? handleEditSafe : handleAddSafe} className="p-6">
              <div className="space-y-6">
                <ModernInput
                  label="اسم الخزنة *"
                  type="text"
                  value={newSafe.name}
                  onChange={(e: unknown) => setNewSafe({...newSafe, name: e.target.value})}
                  placeholder="اسم الخزنة"
                />
                
                <ModernInput
                  label="الرصيد الابتدائي"
                  type="number"
                  value={newSafe.balance}
                  onChange={(e: unknown) => setNewSafe({...newSafe, balance: e.target.value})}
                  placeholder="الرصيد الابتدائي"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-8 pt-6 border-t border-gray-200">
                <ModernButton variant="secondary" onClick={() => {
                  setShowAddSafeModal(false)
                  setEditingSafe(null)
                  setNewSafe({
                    name: '',
                    balance: ''
                  })
                }}>
                  إلغاء
                </ModernButton>
                <ModernButton type="submit">
                  <span className="mr-2">💾</span>
                  {editingSafe ? 'تحديث الخزنة' : 'إضافة الخزنة'}
                </ModernButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">تحويل بين الخزائن</h2>
                <button
                  onClick={() => {
                    setShowTransferModal(false)
                    setNewTransfer({
                      fromSafeId: '',
                      toSafeId: '',
                      amount: '',
                      description: ''
                    })
                  }}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleTransfer} className="p-6">
              <div className="space-y-6">
                <ModernSelect
                  label="من الخزنة *"
                  value={newTransfer.fromSafeId}
                  onChange={(e: unknown) => setNewTransfer({...newTransfer, fromSafeId: e.target.value})}
                >
                  <option value="">اختر الخزنة المصدر...</option>
                  {safes.map((safe) => (
                    <option key={safe.id} value={safe.id}>
                      {safe.name} - {formatCurrency(safe.balance)}
                    </option>
                  ))}
                </ModernSelect>
                
                <ModernSelect
                  label="إلى الخزنة *"
                  value={newTransfer.toSafeId}
                  onChange={(e: unknown) => setNewTransfer({...newTransfer, toSafeId: e.target.value})}
                >
                  <option value="">اختر الخزنة الهدف...</option>
                  {safes.map((safe) => (
                    <option key={safe.id} value={safe.id}>
                      {safe.name} - {formatCurrency(safe.balance)}
                    </option>
                  ))}
                </ModernSelect>
                
                <ModernInput
                  label="المبلغ *"
                  type="number"
                  value={newTransfer.amount}
                  onChange={(e: unknown) => setNewTransfer({...newTransfer, amount: e.target.value})}
                  placeholder="المبلغ المراد تحويله"
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">الوصف</label>
                  <textarea
                    value={newTransfer.description}
                    onChange={(e: unknown) => setNewTransfer({...newTransfer, description: e.target.value})}
                    placeholder="وصف التحويل"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-8 pt-6 border-t border-gray-200">
                <ModernButton variant="secondary" onClick={() => {
                  setShowTransferModal(false)
                  setNewTransfer({
                    fromSafeId: '',
                    toSafeId: '',
                    amount: '',
                    description: ''
                  })
                }}>
                  إلغاء
                </ModernButton>
                <ModernButton type="submit">
                  <span className="mr-2">🔄</span>
                  تحويل
                </ModernButton>
              </div>
            </form>
          </div>
        </div>
      )}
      
        <NotificationSystem 
          notifications={notifications} 
          onRemove={removeNotification} 
        />
      </div>
    </div>
  )
}