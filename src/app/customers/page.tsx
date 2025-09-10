'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Customer } from '@/types'
import { formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import Layout from '@/components/Layout'
import { checkDuplicateName, checkDuplicatePhone, checkDuplicateNationalId } from '@/utils/duplicateCheck'
import SidebarToggle from '@/components/SidebarToggle'
import Sidebar from '@/components/Sidebar'

// Modern UI Components
const ModernCard = ({ children, className = '', ...props }: any) => (
  <div className={`bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl shadow-gray-900/5 p-6 ${className}`} {...props}>
    {children}
  </div>
)

const ModernButton = ({ children, variant = 'primary', size = 'md', className = '', ...props }: any) => {
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

const ModernInput = ({ label, className = '', ...props }: any) => (
  <div className="space-y-2">
    {label && <label className="text-sm font-bold text-gray-900">{label}</label>}
    <input 
      className={`w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal ${className}`}
      {...props}
    />
  </div>
)

const ModernSelect = ({ label, children, className = '', ...props }: any) => (
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

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomers, setDeletingCustomers] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    nationalId: '',
    address: '',
    status: 'نشط',
    notes: ''
  })
  
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault()
            setSidebarOpen(!sidebarOpen)
            break
          case 'n':
            e.preventDefault()
            setShowAddModal(true)
            break
          case 'f':
            e.preventDefault()
            document.getElementById('search-input')?.focus()
            break
          case 'Escape':
            e.preventDefault()
            setShowAddModal(false)
            setEditingCustomer(null)
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
    
    // Only fetch if customers array is empty to prevent multiple calls
    if (customers.length === 0) {
      fetchCustomers()
    }
  }, [])

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success) {
        setCustomers(data.data)
      } else {
        setError(data.error || 'خطأ في تحميل العملاء')
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // التحقق من الاسم فقط (مطلوب)
    if (!newCustomer.name.trim()) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء إدخال اسم العميل'
      })
      return
    }

    // فحص تكرار الاسم
    if (checkDuplicateName(newCustomer.name.trim(), customers)) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'اسم العميل موجود بالفعل'
      })
      return
    }

    // فحص تكرار رقم الهاتف (إذا تم إدخاله)
    if (newCustomer.phone && newCustomer.phone.trim() && checkDuplicatePhone(newCustomer.phone.trim(), customers)) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'رقم الهاتف موجود بالفعل'
      })
      return
    }

    // فحص تكرار الرقم القومي (إذا تم إدخاله)
    if (newCustomer.nationalId && newCustomer.nationalId.trim() && checkDuplicateNationalId(newCustomer.nationalId.trim(), customers)) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرقم القومي موجود بالفعل'
      })
      return
    }

    // إغلاق النافذة فوراً وإظهار النجاح
    setShowAddModal(false)
    setSuccess('تم إضافة العميل بنجاح!')
    setError(null)
    
    // إضافة العميل للقائمة فوراً مع ID مؤقت
    const tempCustomer = {
      ...newCustomer,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setCustomers(prev => [tempCustomer, ...prev])

    // إعادة تعيين النموذج
    setNewCustomer({
      name: '',
      phone: '',
      nationalId: '',
      address: '',
      status: 'نشط',
      notes: ''
    })

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCustomer)
      })

      const data = await response.json()
      if (data.success) {
        // استبدال العميل المؤقت بالعميل الحقيقي
        setCustomers(prev => prev.map(customer => 
          customer.id === tempCustomer.id ? data.data : customer
        ))
        addNotification({
          type: 'success',
          title: 'تم الحفظ بنجاح',
          message: 'تم إضافة العميل بنجاح'
        })
      } else {
        // في حالة فشل الحفظ، نزيل العميل المؤقت ونعيد النافذة
        setCustomers(prev => prev.filter(customer => customer.id !== tempCustomer.id))
        setShowAddModal(true)
        setError(data.error || 'خطأ في إضافة العميل')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحفظ',
          message: data.error || 'فشل في إضافة العميل'
        })
      }
    } catch (err) {
      console.error('Add customer error:', err)
      // في حالة فشل الحفظ، نزيل العميل المؤقت ونعيد النافذة
      setCustomers(prev => prev.filter(customer => customer.id !== tempCustomer.id))
      setShowAddModal(true)
      setError('خطأ في إضافة العميل')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في إضافة العميل'
      })
    }
  }

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingCustomer) return

    // التحقق من الاسم فقط (مطلوب)
    if (!newCustomer.name.trim()) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء إدخال اسم العميل'
      })
      return
    }

    // فحص تكرار الاسم (باستثناء العميل الحالي)
    if (checkDuplicateName(newCustomer.name.trim(), customers, editingCustomer.id)) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'اسم العميل موجود بالفعل'
      })
      return
    }

    // فحص تكرار رقم الهاتف (إذا تم إدخاله)
    if (newCustomer.phone && newCustomer.phone.trim() && checkDuplicatePhone(newCustomer.phone.trim(), customers, editingCustomer.id)) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'رقم الهاتف موجود بالفعل'
      })
      return
    }

    // فحص تكرار الرقم القومي (إذا تم إدخاله)
    if (newCustomer.nationalId && newCustomer.nationalId.trim() && checkDuplicateNationalId(newCustomer.nationalId.trim(), customers, editingCustomer.id)) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرقم القومي موجود بالفعل'
      })
      return
    }

    // إغلاق النافذة فوراً وإظهار النجاح
    setShowAddModal(false)
    setEditingCustomer(null)
    setSuccess('تم تحديث العميل بنجاح!')
    setError(null)

    // تحديث العميل في القائمة فوراً
    const updatedCustomer = {
      ...editingCustomer,
      ...newCustomer,
      updatedAt: new Date().toISOString()
    }
    setCustomers(prev => prev.map(customer => 
      customer.id === editingCustomer.id ? updatedCustomer : customer
    ))

    // إعادة تعيين النموذج
    setNewCustomer({
      name: '',
      phone: '',
      nationalId: '',
      address: '',
      status: 'نشط',
      notes: ''
    })

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCustomer)
      })

      const data = await response.json()
      if (data.success) {
        // استبدال العميل المحدث بالبيانات الحقيقية من الخادم
        setCustomers(prev => prev.map(customer => 
          customer.id === editingCustomer.id ? data.data : customer
        ))
        addNotification({
          type: 'success',
          title: 'تم التحديث بنجاح',
          message: 'تم تحديث العميل بنجاح'
        })
      } else {
        // في حالة فشل التحديث، نعيد البيانات الأصلية
        fetchCustomers()
        setError(data.error || 'خطأ في تحديث العميل')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في التحديث',
          message: data.error || 'فشل في تحديث العميل'
        })
      }
    } catch (err) {
      console.error('Update customer error:', err)
      // في حالة فشل التحديث، نعيد البيانات الأصلية
      fetchCustomers()
      setError('خطأ في تحديث العميل')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في التحديث',
        message: 'فشل في تحديث العميل'
      })
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return

    // إضافة العميل لقائمة الحذف وإظهار الحركة فوراً
    setDeletingCustomers(prev => {
      const newSet = new Set(prev)
      newSet.add(customerId)
      return newSet
    })
    
    // إزالة العميل من القائمة فوراً مع الحركة
    setCustomers(prev => prev.filter(customer => customer.id !== customerId))

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('تم حذف العميل بنجاح!')
        setError(null)
        addNotification({
          type: 'success',
          title: 'تم الحذف بنجاح',
          message: 'تم حذف العميل بنجاح'
        })
      } else {
        // في حالة فشل الحذف، نعيد العميل للقائمة
        fetchCustomers()
        setError(data.error || 'خطأ في حذف العميل')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحذف',
          message: data.error || 'فشل في حذف العميل'
        })
      }
    } catch (err) {
      console.error('Delete customer error:', err)
      // في حالة فشل الحذف، نعيد العميل للقائمة
      fetchCustomers()
      setError('خطأ في حذف العميل')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'فشل في حذف العميل'
      })
    } finally {
      // إزالة العميل من قائمة الحذف
      setDeletingCustomers(prev => {
        const newSet = new Set(prev)
        newSet.delete(customerId)
        return newSet
      })
    }
  }

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setNewCustomer({
      name: customer.name,
      phone: customer.phone || '',
      nationalId: customer.nationalId || '',
      address: customer.address || '',
      status: customer.status,
      notes: customer.notes || ''
    })
    setShowAddModal(true)
  }

  if (loading) {
    return (
      <Layout title="إدارة العملاء" subtitle="نظام متطور لإدارة العملاء" icon="👤">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">جاري التحميل...</h2>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="إدارة العملاء" subtitle="نظام متطور لإدارة العملاء" icon="👤">
      <div className="flex items-center justify-between mb-8">
        <ModernButton onClick={() => setShowAddModal(true)}>
          <span className="mr-2">➕</span>
          إضافة عميل جديد
          <span className="mr-2 text-xs opacity-70">Ctrl+N</span>
        </ModernButton>
      </div>

      {/* Search and Filters */}
      <ModernCard className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="relative">
              <input
                id="search-input"
                type="text"
                placeholder="🔍 ابحث في العملاء... (Ctrl+F)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-80 px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal"
              />
            </div>
            <ModernButton variant="secondary" size="sm">
              📊 تصدير CSV
            </ModernButton>
            <ModernButton variant="secondary" size="sm">
              🖨️ طباعة PDF
            </ModernButton>
          </div>
          <div className="text-sm text-gray-500">
            {customers.length} عميل
          </div>
        </div>
      </ModernCard>

      {/* Customers List */}
      <ModernCard>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">قائمة العملاء</h2>
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-sm text-gray-500">آخر تحديث:</span>
            <span className="text-sm font-medium text-gray-700">{new Date().toLocaleString('en-GB')}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-green-700">{success}</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الاسم</th>
                <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">رقم الهاتف</th>
                <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الرقم القومي</th>
                <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">العنوان</th>
                <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الحالة</th>
                <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">تاريخ الإضافة</th>
                <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {customers.filter(customer => 
                search === '' || 
                customer.name.toLowerCase().includes(search.toLowerCase()) ||
                (customer.phone && customer.phone.toLowerCase().includes(search.toLowerCase())) ||
                (customer.nationalId && customer.nationalId.toLowerCase().includes(search.toLowerCase()))
              ).map((customer) => (
                <tr 
                  key={customer.id} 
                  className={`
                    border-b border-gray-100 hover:bg-gray-50/50 transition-all duration-300
                    ${deletingCustomers.has(customer.id) 
                      ? 'transform translate-x-full opacity-0 scale-95' 
                      : 'transform translate-x-0 opacity-100 scale-100'
                    }
                  `}
                >
                  <td className="py-4 px-6">
                    <div className="text-gray-900 font-bold text-base">{customer.name}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-800 font-semibold">{customer.phone || '-'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-800 font-semibold">{customer.nationalId || '-'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-800 font-semibold max-w-xs truncate">{customer.address || '-'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      customer.status === 'نشط' 
                        ? 'bg-green-100 text-green-900' 
                        : 'bg-red-100 text-red-900'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-800 font-semibold">{formatDate(customer.createdAt || new Date())}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <ModernButton size="sm" variant="secondary" onClick={() => openEditModal(customer)}>
                        ✏️ تعديل
                      </ModernButton>
                      <ModernButton size="sm" variant="danger" onClick={() => handleDeleteCustomer(customer.id)}>
                        🗑️ حذف
                      </ModernButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModernCard>

      {/* Add/Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCustomer ? 'تعديل العميل' : 'إضافة عميل جديد'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingCustomer(null)
                    setNewCustomer({
                      name: '',
                      phone: '',
                      nationalId: '',
                      address: '',
                      status: 'نشط',
                      notes: ''
                    })
                  }}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={editingCustomer ? handleEditCustomer : handleAddCustomer} className="p-6">
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center">
                  <span className="text-blue-500 mr-2">ℹ️</span>
                  <span className="text-blue-700 text-sm font-medium">
                    الاسم فقط مطلوب، باقي الحقول اختيارية
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernInput
                  label="الاسم * (مطلوب)"
                  type="text"
                  value={newCustomer.name}
                  onChange={(e: any) => setNewCustomer({...newCustomer, name: e.target.value})}
                  placeholder="اسم العميل"
                  required
                />
                
                <ModernInput
                  label="رقم الهاتف (اختياري)"
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e: any) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  placeholder="رقم الهاتف"
                />
                
                <ModernInput
                  label="الرقم القومي (اختياري)"
                  type="text"
                  value={newCustomer.nationalId}
                  onChange={(e: any) => setNewCustomer({...newCustomer, nationalId: e.target.value})}
                  placeholder="الرقم القومي"
                />
                
                <ModernSelect
                  label="الحالة"
                  value={newCustomer.status}
                  onChange={(e: any) => setNewCustomer({...newCustomer, status: e.target.value})}
                >
                  <option value="نشط">نشط</option>
                  <option value="غير نشط">غير نشط</option>
                </ModernSelect>
                
                <div className="md:col-span-2">
                  <ModernInput
                    label="العنوان"
                    type="text"
                    value={newCustomer.address}
                    onChange={(e: any) => setNewCustomer({...newCustomer, address: e.target.value})}
                    placeholder="عنوان العميل"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-900">ملاحظات</label>
                    <textarea
                      value={newCustomer.notes}
                      onChange={(e: any) => setNewCustomer({...newCustomer, notes: e.target.value})}
                      placeholder="ملاحظات إضافية"
                      rows={3}
                      className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-8 pt-6 border-t border-gray-200">
                <ModernButton variant="secondary" onClick={() => {
                  setShowAddModal(false)
                  setEditingCustomer(null)
                  setNewCustomer({
                    name: '',
                    phone: '',
                    nationalId: '',
                    address: '',
                    status: 'نشط',
                    notes: ''
                  })
                }}>
                  إلغاء
                </ModernButton>
                <ModernButton type="submit">
                  <span className="mr-2">💾</span>
                  {editingCustomer ? 'تحديث العميل' : 'إضافة العميل'}
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
    </Layout>
  )
}