'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Customer } from '@/types'
// import { formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import Layout from '@/components/Layout'
import { checkDuplicateName, checkDuplicatePhone, checkDuplicateNationalId } from '@/utils/duplicateCheck'
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

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name') // name, phone, createdAt
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomers, setDeletingCustomers] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
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
    
    // Check if database is configured
    checkDatabaseStatus()
    
    // إعادة تحميل القائمة عند فتح الصفحة للتأكد من أحدث البيانات
    fetchCustomers(true)
  }, [])

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/setup')
      const data = await response.json()
      
      if (!data.success) {
        // إذا لم تكن قاعدة البيانات مُعدة، فقط أظهر رسالة تحذير
        // console.log('Database not configured, but continuing to load customers')
        // إزالة الإشعار المزعج
        // addNotification({
        //   type: 'warning',
        //   title: 'تحذير',
        //   message: 'قاعدة البيانات غير مُعدة بالكامل، قد لا تعمل بعض الميزات'
        // })
      }
      
      // تحميل العملاء في جميع الحالات
      fetchCustomers()
    } catch (error) {
      console.error('Database check error:', error)
      // في حالة الخطأ، فقط أظهر رسالة تحذير
      addNotification({
        type: 'warning',
        title: 'تحذير',
        message: 'لا يمكن التحقق من حالة قاعدة البيانات، جاري تحميل العملاء...'
      })
      fetchCustomers()
    }
  }

  const fetchCustomers = async (forceRefresh = false) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const url = forceRefresh ? '/api/customers?refresh=true&limit=1000' : '/api/customers?limit=1000'
      
      // Optimized fetch with proper error handling and caching
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: forceRefresh ? 'no-cache' : 'default'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setCustomers(data.data)
        setError(null) // Clear any previous errors
        console.log(`تم تحميل ${data.data.length} عميل`)
      } else {
        setError(data.error || 'خطأ في تحميل العملاء')
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError('خطأ في الاتصال بالخادم')
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

  // نظام التصدير الاحترافي
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportType, setExportType] = useState<'csv' | 'excel' | 'pdf' | 'json'>('csv')
  const [exportFields, setExportFields] = useState({
    name: true,
    phone: true,
    nationalId: true,
    address: true,
    status: true,
    createdAt: true,
    notes: false
  })

  // تصدير CSV
  const exportToCSV = () => {
    const selectedFields = Object.entries(exportFields)
      .filter(([_, selected]) => selected)
      .map(([field, _]) => field)

    const headers = {
      name: 'الاسم',
      phone: 'رقم الهاتف',
      nationalId: 'الرقم القومي',
      address: 'العنوان',
      status: 'الحالة',
      createdAt: 'تاريخ الإضافة',
      notes: 'ملاحظات'
    }

    const csvHeaders = selectedFields.map(field => headers[field as keyof typeof headers])
    const csvContent = [
      csvHeaders.join(','),
      ...customers
        .filter(customer => {
          const matchesSearch = !search || 
            customer.name.toLowerCase().includes(search.toLowerCase()) ||
            (customer.phone && customer.phone.toLowerCase().includes(search.toLowerCase())) ||
            (customer.nationalId && customer.nationalId.toLowerCase().includes(search.toLowerCase())) ||
            (customer.address && customer.address.toLowerCase().includes(search.toLowerCase()))
          
          const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
          
          return matchesSearch && matchesStatus
        })
        .sort((a, b) => {
          let aValue: string | number
          let bValue: string | number
          
          switch (sortBy) {
            case 'name':
              aValue = a.name.toLowerCase()
              bValue = b.name.toLowerCase()
              break
            case 'phone':
              aValue = a.phone || ''
              bValue = b.phone || ''
              break
            case 'createdAt':
              aValue = new Date(a.createdAt).getTime()
              bValue = new Date(b.createdAt).getTime()
              break
            default:
              aValue = a.name.toLowerCase()
              bValue = b.name.toLowerCase()
          }
          
          if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
          if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
          return 0
        })
        .map(customer => 
          selectedFields.map(field => {
            let value = ''
            switch (field) {
              case 'name':
                value = customer.name
                break
              case 'phone':
                value = customer.phone || ''
                break
              case 'nationalId':
                value = customer.nationalId || ''
                break
              case 'address':
                value = customer.address || ''
                break
              case 'status':
                value = customer.status
                break
              case 'createdAt':
                value = new Date(customer.createdAt || new Date()).toLocaleDateString('en-US')
                break
              case 'notes':
                value = customer.notes || ''
                break
            }
            return `"${value}"`
          }).join(',')
        )
    ].join('\n')

    // إضافة BOM للعربية
    const BOM = '\uFEFF'
    const csvWithBOM = BOM + csvContent
    
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `customers_${new Date()??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // تصدير Excel باستخدام ExcelJS - إصدار جديد محسن
  const exportToExcel = async () => {
    try {
      // استيراد مكتبة ExcelJS
      const ExcelJS = await import('exceljs')
      
      // فلترة وترتيب العملاء
      const filteredCustomers = customers
        .filter(customer => {
          const matchesSearch = !search || 
            customer.name.toLowerCase().includes(search.toLowerCase()) ||
            (customer.phone && customer.phone.toLowerCase().includes(search.toLowerCase())) ||
            (customer.nationalId && customer.nationalId.toLowerCase().includes(search.toLowerCase())) ||
            (customer.address && customer.address.toLowerCase().includes(search.toLowerCase()))
          
          const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
          
          return matchesSearch && matchesStatus
        })
        .sort((a, b) => {
          let aValue: string | number
          let bValue: string | number
          
          switch (sortBy) {
            case 'name':
              aValue = a.name.toLowerCase()
              bValue = b.name.toLowerCase()
              break
            case 'phone':
              aValue = a.phone || ''
              bValue = b.phone || ''
              break
            case 'createdAt':
              aValue = new Date(a.createdAt).getTime()
              bValue = new Date(b.createdAt).getTime()
              break
            default:
              aValue = a.name.toLowerCase()
              bValue = b.name.toLowerCase()
          }
          
          if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
          if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
          return 0
        })

      // إنشاء workbook جديد
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('العملاء')

     // إعدادات الورقة
     worksheet.properties.defaultRowHeight = 25
     worksheet.properties.defaultColWidth = 15
     
     // إعداد اتجاه الشيت من اليمين لليسار
     worksheet.views = [{ rightToLeft: true }]
     
     // إعدادات إضافية للاتجاه
     // worksheet.properties.rightToLeft = true // غير مدعوم في ExcelJS

      // إعداد الأعمدة
      worksheet.columns = [
        { header: 'الاسم', key: 'name', width: 20 },
        { header: 'رقم الهاتف', key: 'phone', width: 15 },
        { header: 'الرقم القومي', key: 'nationalId', width: 15 },
        { header: 'العنوان', key: 'address', width: 25 },
        { header: 'الحالة', key: 'status', width: 12 },
        { header: 'تاريخ الإضافة', key: 'createdAt', width: 15 },
        { header: 'ملاحظات', key: 'notes', width: 20 }
      ]

      // إضافة العناوين
      const headerRow = worksheet.getRow(1)
      headerRow.values = ['الاسم', 'رقم الهاتف', 'الرقم القومي', 'العنوان', 'الحالة', 'تاريخ الإضافة', 'ملاحظات']
      headerRow.height = 30

      // تنسيق العناوين
      headerRow.eachCell((cell, colNumber) => {
        cell.font = {
          name: 'Arial',
          size: 14,
          bold: true,
          color: { argb: 'FFFFFFFF' }
        }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4F46E5' }
        }
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          readingOrder: 'rtl'
        }
        cell.border = {
          top: { style: 'thick', color: { argb: 'FF000000' } },
          bottom: { style: 'thick', color: { argb: 'FF000000' } },
          left: { style: 'thick', color: { argb: 'FF000000' } },
          right: { style: 'thick', color: { argb: 'FF000000' } }
        }
      })

      // إضافة البيانات
      filteredCustomers
        .filter(customer => customer.name && customer.name.trim() !== '')
        .forEach((customer, index) => {
          const row = worksheet.addRow([
            customer.name || '',
            customer.phone || '',
            customer.nationalId || '',
            customer.address || '',
            customer.status || 'غير محدد',
            new Date(customer.createdAt || new Date()).toLocaleDateString('en-US'),
            customer.notes || ''
          ])
          
          row.height = 25
          
          // تنسيق الصف
          row.eachCell((cell, colNumber) => {
            const isEvenRow = index % 2 === 0
            const cellValue = cell.value as string
            
            // تنسيق أساسي
            cell.font = {
              name: 'Arial',
              size: 12
            }
            cell.alignment = {
              horizontal: 'center',
              vertical: 'middle',
              readingOrder: 'rtl'
            }
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } }
            }
            
            // تنسيق الحالة (العمود الخامس)
            if (colNumber === 5) {
              if (cellValue === 'نشط') {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFC6F6D5' }
                }
                cell.font = {
                  name: 'Arial',
                  size: 12,
                  bold: true,
                  color: { argb: 'FF22543D' }
                }
              } else if (cellValue === 'غير نشط') {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFFED7D7' }
                }
                cell.font = {
                  name: 'Arial',
                  size: 12,
                  bold: true,
                  color: { argb: 'FFC53030' }
                }
              }
            } else {
              // ألوان متناوبة
              if (isEvenRow) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF7FAFC' }
                }
              } else {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFFFFFFF' }
                }
              }
            }
          })
        })

      // إضافة فلتر تلقائي
      worksheet.autoFilter = {
        from: 'A1',
        to: `G${filteredCustomers.length + 1}`
      }

      // تصدير الملف
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `تقرير_العملاء_${new Date()??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.xlsx`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      addNotification({
        type: 'success',
        title: 'تم التصدير بنجاح',
        message: 'تم تصدير ملف Excel بنجاح'
      })
      
    } catch (error) {
      console.error('Excel export error:', error)
      addNotification({
        type: 'error',
        title: 'خطأ في التصدير',
        message: 'فشل في تصدير ملف Excel'
      })
    }
  }

  // تصدير PDF
  const exportToPDF = () => {
    const selectedFields = Object.entries(exportFields)
      .filter(([_, selected]) => selected)
      .map(([field, _]) => field)

    const headers = {
      name: 'الاسم',
      phone: 'رقم الهاتف',
      nationalId: 'الرقم القومي',
      address: 'العنوان',
      status: 'الحالة',
      createdAt: 'تاريخ الإضافة',
      notes: 'ملاحظات'
    }

    const filteredCustomers = customers
      .filter(customer => {
        const matchesSearch = !search || 
          customer.name.toLowerCase().includes(search.toLowerCase()) ||
          (customer.phone && customer.phone.toLowerCase().includes(search.toLowerCase())) ||
          (customer.nationalId && customer.nationalId.toLowerCase().includes(search.toLowerCase())) ||
          (customer.address && customer.address.toLowerCase().includes(search.toLowerCase()))
        
        const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
        
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        let aValue: string | number
        let bValue: string | number
        
        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
            break
          case 'phone':
            aValue = a.phone || ''
            bValue = b.phone || ''
            break
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime()
            bValue = new Date(b.createdAt).getTime()
            break
          default:
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
        }
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      })

    // إنشاء HTML للتحويل إلى PDF
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تقرير العملاء</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #2563eb; margin-bottom: 10px; }
          .header p { color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
          th { background-color: #f8fafc; font-weight: bold; color: #1e40af; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير العملاء</h1>
          <p>تاريخ التقرير: ${new Date().toLocaleDateString('en-US')}</p>
          <p>إجمالي العملاء: ${filteredCustomers.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${selectedFields.map(field => `<th>${headers[field as keyof typeof headers]}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredCustomers.map(customer => `
              <tr>
                ${selectedFields.map(field => {
                  let value = ''
                  switch (field) {
                    case 'name':
                      value = customer.name
                      break
                    case 'phone':
                      value = customer.phone || ''
                      break
                    case 'nationalId':
                      value = customer.nationalId || ''
                      break
                    case 'address':
                      value = customer.address || ''
                      break
                    case 'status':
                      value = customer.status
                      break
                    case 'createdAt':
                      value = new Date(customer.createdAt || new Date()).toLocaleDateString('en-US')
                      break
                    case 'notes':
                      value = customer.notes || ''
                      break
                  }
                  return `<td>${value}</td>`
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>تم إنشاء هذا التقرير في ${new Date().toLocaleString('en-US')}</p>
        </div>
      </body>
      </html>
    `

    // فتح نافذة جديدة للطباعة/التصدير
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 1000)
    }
  }

  // تصدير JSON
  const exportToJSON = () => {
    const selectedFields = Object.entries(exportFields)
      .filter(([_, selected]) => selected)
      .map(([field, _]) => field)

    const filteredCustomers = customers
      .filter(customer => {
        const matchesSearch = !search || 
          customer.name.toLowerCase().includes(search.toLowerCase()) ||
          (customer.phone && customer.phone.toLowerCase().includes(search.toLowerCase())) ||
          (customer.nationalId && customer.nationalId.toLowerCase().includes(search.toLowerCase())) ||
          (customer.address && customer.address.toLowerCase().includes(search.toLowerCase()))
        
        const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
        
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        let aValue: string | number
        let bValue: string | number
        
        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
            break
          case 'phone':
            aValue = a.phone || ''
            bValue = b.phone || ''
            break
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime()
            bValue = new Date(b.createdAt).getTime()
            break
          default:
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
        }
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
      .map(customer => {
        const jsonCustomer: Record<string, unknown> = {}
        selectedFields.forEach(field => {
          switch (field) {
            case 'name':
              jsonCustomer.name = customer.name
              break
            case 'phone':
              jsonCustomer.phone = customer.phone || ''
              break
            case 'nationalId':
              jsonCustomer.nationalId = customer.nationalId || ''
              break
            case 'address':
              jsonCustomer.address = customer.address || ''
              break
            case 'status':
              jsonCustomer.status = customer.status
              break
            case 'createdAt':
              jsonCustomer.createdAt = new Date(customer.createdAt || new Date()).toLocaleDateString('en-US')
              break
            case 'notes':
              jsonCustomer.notes = customer.notes || ''
              break
          }
        })
        return jsonCustomer
      })

    const jsonData = {
      metadata: {
        title: 'تقرير العملاء',
        exportDate: new Date().toISOString(),
        totalRecords: filteredCustomers.length,
        exportType: 'JSON',
        fields: selectedFields
      },
      customers: filteredCustomers
    }

    const jsonString = JSON.stringify(jsonData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `customers_${new Date()??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // تنفيذ التصدير حسب النوع المحدد
  const handleExport = () => {
    switch (exportType) {
      case 'csv':
        exportToCSV()
        break
      case 'excel':
        exportToExcel()
        break
      case 'pdf':
        exportToPDF()
        break
      case 'json':
        exportToJSON()
        break
    }
    setShowExportModal(false)
  }

  // استيراد سريع للعملاء من ملف نصي (محسن)
  const handleBulkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        addNotification({
          type: 'error',
          title: 'خطأ في الملف',
          message: 'الملف فارغ أو لا يحتوي على أسماء'
        })
        return
      }

      if (lines.length > 500) {
        addNotification({
          type: 'error',
          title: 'خطأ في الملف',
          message: 'الملف يحتوي على أكثر من 500 اسم. الحد الأقصى 500'
        })
        return
      }

      // تحضير البيانات للاستيراد السريع
      const customersToImport = lines.map(line => ({
        name: line.trim(),
        phone: '',
        nationalId: '',
        address: '',
        status: 'نشط',
        notes: 'مستورد تلقائياً'
      })).filter(customer => customer.name)

      if (customersToImport.length === 0) {
        addNotification({
          type: 'error',
          title: 'خطأ في الملف',
          message: 'لا توجد أسماء صالحة في الملف'
        })
        return
      }

      // استخدام API محسن للاستيراد السريع
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/customers/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customers: customersToImport })
      })

      const data = await response.json()
      
      if (data.success) {
        addNotification({
          type: 'success',
          title: 'تم الاستيراد بنجاح',
          message: data.message
        })
        
        // إعادة تحميل قائمة العملاء مع إعادة تعيين الكاش
        setLoading(true)
        await fetchCustomers(true) // forceRefresh = true
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في الاستيراد',
          message: data.error || 'فشل في استيراد العملاء'
        })
      }

    } catch (err) {
      console.error('Bulk import error:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في الاستيراد',
        message: 'فشل في قراءة الملف أو الاتصال بالخادم'
      })
    }

    // إعادة تعيين input
    event.target.value = ''
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
                  <span className="text-white text-xl">👤</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">إدارة العملاء</h1>
                  <p className="text-gray-600">نظام متطور لإدارة العملاء</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
        <ModernButton onClick={() => setShowAddModal(true)}>
          <span className="mr-2">➕</span>
          إضافة عميل جديد
          <span className="mr-2 text-xs opacity-70">Ctrl+N</span>
        </ModernButton>
                <NavigationButtons />
              </div>
            </div>
          </div>
      </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">

      {/* Search and Filters */}
      <ModernCard className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse flex-wrap gap-4">
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
            
            {/* فلتر الحالة */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold"
            >
              <option value="all">جميع الحالات</option>
              <option value="نشط">نشط</option>
              <option value="غير نشط">غير نشط</option>
            </select>
            
            {/* ترتيب حسب */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold"
            >
              <option value="name">الاسم</option>
              <option value="phone">الهاتف</option>
              <option value="createdAt">تاريخ الإضافة</option>
            </select>
            
            {/* اتجاه الترتيب */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold hover:bg-gray-50"
              title={sortOrder === 'asc' ? 'ترتيب تصاعدي' : 'ترتيب تنازلي'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
            </button>
            <ModernButton variant="secondary" size="sm" onClick={() => setShowExportModal(true)}>
              📊 تصدير احترافي
            </ModernButton>
            <ModernButton variant="info" size="sm" onClick={() => fetchCustomers(true)}>
              🔄 تحديث القائمة
            </ModernButton>
            <label className="cursor-pointer">
              <div className="px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/25 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95">
                📥 استيراد سريع (300 اسم)
              </div>
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleBulkImport}
                className="hidden"
              />
            </label>
          </div>
          <div className="text-sm text-gray-500">
            {customers
              .filter(customer => {
                const matchesSearch = !search || 
                  customer.name.toLowerCase().includes(search.toLowerCase()) ||
                  (customer.phone && customer.phone.toLowerCase().includes(search.toLowerCase())) ||
                  (customer.nationalId && customer.nationalId.toLowerCase().includes(search.toLowerCase())) ||
                  (customer.address && customer.address.toLowerCase().includes(search.toLowerCase()))
                
                const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
                
                return matchesSearch && matchesStatus
              }).length} من {customers.length} عميل
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
              {customers
                .filter(customer => {
                  const matchesSearch = !search || 
                customer.name.toLowerCase().includes(search.toLowerCase()) ||
                (customer.phone && customer.phone.toLowerCase().includes(search.toLowerCase())) ||
                    (customer.nationalId && customer.nationalId.toLowerCase().includes(search.toLowerCase())) ||
                    (customer.address && customer.address.toLowerCase().includes(search.toLowerCase()))
                  
                  const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
                  
                  return matchesSearch && matchesStatus
                })
                .sort((a, b) => {
                  let aValue: string | number
                  let bValue: string | number
                  
                  switch (sortBy) {
                    case 'name':
                      aValue = a.name.toLowerCase()
                      bValue = b.name.toLowerCase()
                      break
                    case 'phone':
                      aValue = a.phone || ''
                      bValue = b.phone || ''
                      break
                    case 'createdAt':
                      aValue = new Date(a.createdAt).getTime()
                      bValue = new Date(b.createdAt).getTime()
                      break
                    default:
                      aValue = a.name.toLowerCase()
                      bValue = b.name.toLowerCase()
                  }
                  
                  if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
                  if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
                  return 0
                })
                .map((customer) => (
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
                    <div className="text-gray-800 font-semibold">{new Date(customer.createdAt || new Date()).toLocaleDateString('en-US')}</div>
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
                  onChange={(e: unknown) => setNewCustomer({...newCustomer, name: e.target.value})}
                  placeholder="اسم العميل"
                  required
                />
                
                <ModernInput
                  label="رقم الهاتف (اختياري)"
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e: unknown) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  placeholder="رقم الهاتف"
                />
                
                <ModernInput
                  label="الرقم القومي (اختياري)"
                  type="text"
                  value={newCustomer.nationalId}
                  onChange={(e: unknown) => setNewCustomer({...newCustomer, nationalId: e.target.value})}
                  placeholder="الرقم القومي"
                />
                
                <ModernSelect
                  label="الحالة"
                  value={newCustomer.status}
                  onChange={(e: unknown) => setNewCustomer({...newCustomer, status: e.target.value})}
                >
                  <option value="نشط">نشط</option>
                  <option value="غير نشط">غير نشط</option>
                </ModernSelect>
                
                <div className="md:col-span-2">
                  <ModernInput
                    label="العنوان"
                    type="text"
                    value={newCustomer.address}
                    onChange={(e: unknown) => setNewCustomer({...newCustomer, address: e.target.value})}
                    placeholder="عنوان العميل"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-900">ملاحظات</label>
                    <textarea
                      value={newCustomer.notes}
                      onChange={(e: unknown) => setNewCustomer({...newCustomer, notes: e.target.value})}
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
        </div>
      </div>

      {/* نافذة التصدير الاحترافية */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">📊 تصدير احترافي</h3>
              <p className="text-gray-600 mt-2">اختر نوع التصدير والحقول المطلوبة</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* نوع التصدير */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">نوع التصدير</label>
                <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={() => setExportType('csv')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      exportType === 'csv'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">📄</div>
                    <div className="font-bold">CSV</div>
                    <div className="text-xs text-gray-500">ملف نصي</div>
                  </button>
                  
                  <button
                    onClick={() => setExportType('excel')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      exportType === 'excel'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">📊</div>
                    <div className="font-bold">Excel</div>
                    <div className="text-xs text-gray-500">جدول بيانات</div>
                  </button>
                  
                  <button
                    onClick={() => setExportType('pdf')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      exportType === 'pdf'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">📋</div>
                    <div className="font-bold">PDF</div>
                    <div className="text-xs text-gray-500">تقرير مطبوع</div>
                  </button>
                  
                  <button
                    onClick={() => setExportType('json')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      exportType === 'json'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🔗</div>
                    <div className="font-bold">JSON</div>
                    <div className="text-xs text-gray-500">بيانات منظمة</div>
                  </button>
                </div>
              </div>

              {/* الحقول المطلوبة */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">الحقول المطلوبة</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(exportFields).map(([field, selected]) => {
                    const fieldLabels = {
                      name: 'الاسم',
                      phone: 'رقم الهاتف',
                      nationalId: 'الرقم القومي',
                      address: 'العنوان',
                      status: 'الحالة',
                      createdAt: 'تاريخ الإضافة',
                      notes: 'ملاحظات'
                    }
                    
                    return (
                      <label key={field} className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => setExportFields(prev => ({
                            ...prev,
                            [field]: e.target.checked
                          }))}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {fieldLabels[field as keyof typeof fieldLabels]}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* معلومات التصدير */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 mb-2">معلومات التصدير</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• سيتم تصدير {customers
                    .filter(customer => {
                      const matchesSearch = !search || 
                        customer.name.toLowerCase().includes(search.toLowerCase()) ||
                        (customer.phone && customer.phone.toLowerCase().includes(search.toLowerCase())) ||
                        (customer.nationalId && customer.nationalId.toLowerCase().includes(search.toLowerCase())) ||
                        (customer.address && customer.address.toLowerCase().includes(search.toLowerCase()))
                      
                      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
                      
                      return matchesSearch && matchesStatus
                    }).length} عميل</div>
                  <div>• نوع الملف: {exportType.toUpperCase()}</div>
                  <div>• الحقول المحددة: {Object.entries(exportFields).filter(([_, selected]) => selected).length} حقل</div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 space-x-reverse">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
              >
                إلغاء
              </button>
              <button
                onClick={handleExport}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105"
              >
                تصدير الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}