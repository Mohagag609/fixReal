'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Unit, UnitPartner, PartnerGroup } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import { checkDuplicateCode } from '@/utils/duplicateCheck'
import Layout from '@/components/Layout'

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

export default function Units() {
  const [units, setUnits] = useState<Unit[]>([])
  const [unitPartners, setUnitPartners] = useState<UnitPartner[]>([])
  const [partnerGroups, setPartnerGroups] = useState<PartnerGroup[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [deletingUnits, setDeletingUnits] = useState<Set<string>>(new Set())
  const [newUnit, setNewUnit] = useState({
    name: '',
    unitType: 'سكني',
    area: '',
    floor: '',
    building: '',
    totalPrice: '',
    status: 'متاحة',
    notes: '',
    partnerGroupId: ''
  })
  
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
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
            setEditingUnit(null)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    fetchData()
  }, []) // إزالة التكرار - fetchData سيتم استدعاؤه مرة واحدة فقط

  useEffect(() => {
    // Check if we need to open edit modal from management page
    const urlParams = new URLSearchParams(window.location.search)
    const editId = urlParams.get('edit')
    if (editId && units.length > 0) {
      // Find the unit to edit
      const unitToEdit = units.find(unit => unit.id === editId)
      if (unitToEdit) {
        openEditModal(unitToEdit)
        // Clean up URL
        window.history.replaceState({}, '', '/units')
      }
    }
  }, [units])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      
      // استخدام Promise.all لتحسين الأداء وتقليل التكرار
      const [unitsResponse, unitPartnersResponse, partnerGroupsResponse, partnersResponse] = await Promise.all([
        fetch('/api/units', { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }),
        fetch('/api/unit-partners', { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }),
        fetch('/api/partner-groups', { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }),
        fetch('/api/partners', { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        })
      ])
      
      const [unitsData, unitPartnersData, partnerGroupsData, partnersData] = await Promise.all([
        unitsResponse.json(),
        unitPartnersResponse.json(),
        partnerGroupsResponse.json(),
        partnersResponse.json()
      ])
      
      if (unitsData.success) {
        setUnits(unitsData.data)
      } else {
        setError(unitsData.error || 'خطأ في تحميل الوحدات')
      }

      if (unitPartnersData.success) {
        setUnitPartners(unitPartnersData.data)
      }

      if (partnerGroupsData.success) {
        setPartnerGroups(partnerGroupsData.data)
      }

      if (partnersData.success) {
        setPartners(partnersData.data)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }, []) // إضافة useCallback لتجنب التكرار

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // التحقق من البيانات المطلوبة - الاسم فقط مطلوب
    if (!newUnit.name.trim()) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء إدخال اسم الوحدة'
      })
      return
    }

    // إنشاء كود الوحدة التلقائي (ترتيب معكوس)
    const sanitizedBuilding = (newUnit.building || 'غير محدد').replace(/\s/g, '')
    const sanitizedFloor = (newUnit.floor || 'غير محدد').replace(/\s/g, '')
    const sanitizedName = newUnit.name.replace(/\s/g, '')
    const code = `${sanitizedName}-${sanitizedFloor}-${sanitizedBuilding}`

    // فحص تكرار كود الوحدة
    if (units.some(u => u.code.toLowerCase() === code.toLowerCase())) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'هذه الوحدة (نفس الاسم والدور والبرج) موجودة بالفعل'
      })
      return
    }

    // التحقق من مجموعة الشركاء (اختيارية)
    if (newUnit.partnerGroupId) {
      const selectedGroup = partnerGroups.find(g => g.id === newUnit.partnerGroupId)
      if (!selectedGroup) {
        addNotification({
          type: 'error',
          title: 'خطأ في البيانات',
          message: 'لم يتم العثور على مجموعة الشركاء المحددة'
        })
        return
      }

      // Get partners for this group from the partners array
      const groupPartners = partners.filter(p => p.partnerGroupId === selectedGroup.id)
      const totalPercent = groupPartners.reduce((sum, p) => sum + p.percent, 0)
      if (totalPercent !== 100) {
        addNotification({
          type: 'error',
          title: 'خطأ في البيانات',
          message: `لا يمكن استخدام هذه المجموعة. إجمالي النسب فيها هو ${totalPercent}% ويجب أن يكون 100%`
        })
        return
      }
    }

    // إغلاق النافذة فوراً وإظهار النجاح
    setShowAddModal(false)
    setSuccess('تم إضافة الوحدة بنجاح!')
    setError(null)
    
    // إضافة الوحدة للقائمة فوراً مع ID مؤقت
    const tempUnit = {
      ...newUnit,
      id: `temp-${Date.now()}`,
      code,
      totalPrice: parseFloat(newUnit.totalPrice),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setUnits(prev => [tempUnit, ...prev])

    // إعادة تعيين النموذج
    setNewUnit({
      name: '',
      unitType: 'سكني',
      area: '',
      floor: '',
      building: '',
      totalPrice: '',
      status: 'متاحة',
      notes: '',
      partnerGroupId: ''
    })

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newUnit,
          code,
          totalPrice: parseFloat(newUnit.totalPrice),
          partnerGroupId: newUnit.partnerGroupId
        })
      })

      const data = await response.json()
      if (data.success) {
        // استبدال الوحدة المؤقتة بالوحدة الحقيقية
        setUnits(prev => prev.map(unit => 
          unit.id === tempUnit.id ? data.data : unit
        ))
        addNotification({
          type: 'success',
          title: 'تم الحفظ بنجاح',
          message: 'تم إضافة الوحدة بنجاح'
        })
      } else {
        // في حالة فشل الحفظ، نزيل الوحدة المؤقتة ونعيد النافذة
        setUnits(prev => prev.filter(unit => unit.id !== tempUnit.id))
        setShowAddModal(true)
        setError(data.error || 'خطأ في إضافة الوحدة')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحفظ',
          message: data.error || 'فشل في إضافة الوحدة'
        })
      }
    } catch (err) {
      console.error('Add unit error:', err)
      // في حالة فشل الحفظ، نزيل الوحدة المؤقتة ونعيد النافذة
      setUnits(prev => prev.filter(unit => unit.id !== tempUnit.id))
      setShowAddModal(true)
      setError('خطأ في إضافة الوحدة')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في إضافة الوحدة'
      })
    }
  }

  const handleEditUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingUnit) return

    // التحقق من البيانات المطلوبة - الاسم فقط مطلوب
    if (!newUnit.name.trim()) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء إدخال اسم الوحدة'
      })
      return
    }

    // إنشاء كود الوحدة التلقائي (ترتيب معكوس)
    const sanitizedBuilding = (newUnit.building || 'غير محدد').replace(/\s/g, '')
    const sanitizedFloor = (newUnit.floor || 'غير محدد').replace(/\s/g, '')
    const sanitizedName = newUnit.name.replace(/\s/g, '')
    const code = `${sanitizedName}-${sanitizedFloor}-${sanitizedBuilding}`

    // فحص تكرار كود الوحدة (باستثناء الوحدة الحالية)
    if (units.some(u => u.id !== editingUnit.id && u.code.toLowerCase() === code.toLowerCase())) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'هذه الوحدة (نفس الاسم والدور والبرج) موجودة بالفعل'
      })
      return
    }

    // إغلاق النافذة فوراً وإظهار النجاح
    setShowAddModal(false)
    setEditingUnit(null)
    setSuccess('تم تحديث الوحدة بنجاح!')
    setError(null)

    // تحديث الوحدة في القائمة فوراً
    const updatedUnit = {
      ...editingUnit,
      ...newUnit,
      code,
      totalPrice: parseFloat(newUnit.totalPrice),
      updatedAt: new Date().toISOString()
    }
    setUnits(prev => prev.map(unit => 
      unit.id === editingUnit.id ? updatedUnit : unit
    ))

    // إعادة تعيين النموذج
    setNewUnit({
      name: '',
      unitType: 'سكني',
      area: '',
      floor: '',
      building: '',
      totalPrice: '',
      status: 'متاحة',
      notes: '',
      partnerGroupId: ''
    })

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/units/${editingUnit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newUnit,
          code,
          totalPrice: parseFloat(newUnit.totalPrice),
          partnerGroupId: newUnit.partnerGroupId
        })
      })

      const data = await response.json()
      if (data.success) {
        // استبدال الوحدة المحدثة بالبيانات الحقيقية من الخادم
        setUnits(prev => prev.map(unit => 
          unit.id === editingUnit.id ? data.data : unit
        ))
        addNotification({
          type: 'success',
          title: 'تم التحديث بنجاح',
          message: 'تم تحديث الوحدة بنجاح'
        })
      } else {
        // في حالة فشل التحديث، نعيد البيانات الأصلية
        fetchData()
        setError(data.error || 'خطأ في تحديث الوحدة')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في التحديث',
          message: data.error || 'فشل في تحديث الوحدة'
        })
      }
    } catch (err) {
      console.error('Update unit error:', err)
      // في حالة فشل التحديث، نعيد البيانات الأصلية
      fetchData()
      setError('خطأ في تحديث الوحدة')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في التحديث',
        message: 'فشل في تحديث الوحدة'
      })
    }
  }

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة؟')) return

    // إضافة الوحدة لقائمة الحذف وإظهار الحركة فوراً
    setDeletingUnits(prev => {
      const newSet = new Set(prev)
      newSet.add(unitId)
      return newSet
    })
    
    // إزالة الوحدة من القائمة فوراً مع الحركة
    setUnits(prev => prev.filter(unit => unit.id !== unitId))

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/units/${unitId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('تم حذف الوحدة بنجاح!')
        setError(null)
        addNotification({
          type: 'success',
          title: 'تم الحذف بنجاح',
          message: 'تم حذف الوحدة بنجاح'
        })
      } else {
        // في حالة فشل الحذف، نعيد الوحدة للقائمة
        fetchData()
        setError(data.error || 'خطأ في حذف الوحدة')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحذف',
          message: data.error || 'فشل في حذف الوحدة'
        })
      }
    } catch (err) {
      console.error('Delete unit error:', err)
      // في حالة فشل الحذف، نعيد الوحدة للقائمة
      fetchData()
      setError('خطأ في حذف الوحدة')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'فشل في حذف الوحدة'
      })
    } finally {
      // إزالة الوحدة من قائمة الحذف
      setDeletingUnits(prev => {
        const newSet = new Set(prev)
        newSet.delete(unitId)
        return newSet
      })
    }
  }

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit)
    setNewUnit({
      name: unit.name || '',
      unitType: unit.unitType || 'سكني',
      area: unit.area || '',
      floor: unit.floor || '',
      building: unit.building || '',
      totalPrice: unit.totalPrice.toString(),
      status: unit.status,
      notes: unit.notes || '',
      partnerGroupId: '' // سيتم تحديث هذا لاحقاً
    })
    setShowAddModal(true)
  }

  const getUnitPartners = (unitId: string) => {
    return unitPartners.filter(up => up.unitId === unitId)
  }

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId)
    return partner ? partner.name : `شريك ${partnerId.slice(-4)}`
  }

  const calculateRemainingAmount = (unit: Unit) => {
    // حساب المبلغ المتبقي بناءً على العقود والمدفوعات
    // هذا يحتاج إلى تنفيذ أكثر تفصيلاً مع البيانات الفعلية
    return unit.totalPrice
  }

  const getUnitDisplayName = (unit: Unit) => {
    if (!unit) return '—'
    const name = unit.name ? `اسم الوحدة (${unit.name})` : ''
    const floor = unit.floor ? `رقم الدور (${unit.floor})` : ''
    const building = unit.building ? `رقم العمارة (${unit.building})` : ''
    return [name, floor, building].filter(Boolean).join(' ')
  }

  const exportToCSV = () => {
    const headers = ['كود الوحدة', 'اسم الوحدة', 'الدور', 'البرج', 'نوع الوحدة', 'الشركاء', 'السعر', 'المتبقي', 'الحالة', 'ملاحظات']
    const rows = units.map(unit => {
      const unitPartnersList = getUnitPartners(unit.id)
      const partnersText = unitPartnersList
        .map(up => `${getPartnerName(up.partnerId)} (${up.percentage}%)`)
        .join(' | ')
      
      return [
        unit.code,
        unit.name || '',
        unit.floor || '',
        unit.building || '',
        unit.unitType || '',
        partnersText || '—',
        unit.totalPrice,
        calculateRemainingAmount(unit),
        unit.status,
        unit.notes || ''
      ]
    })
    
    const csvContent = [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'units.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printUnits = () => {
    const printContent = `
      <html dir="rtl">
        <head>
          <title>تقرير الوحدات</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير الوحدات</h1>
            <p>تاريخ التقرير: ${new Date().toLocaleDateString('en-GB')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>كود الوحدة</th>
                <th>اسم الوحدة</th>
                <th>الدور</th>
                <th>البرج</th>
                <th>نوع الوحدة</th>
                <th>السعر</th>
                <th>المتبقي</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${units.map(unit => `
                <tr>
                  <td>${unit.code}</td>
                  <td>${unit.name || ''}</td>
                  <td>${unit.floor || ''}</td>
                  <td>${unit.building || ''}</td>
                  <td>${unit.unitType || ''}</td>
                  <td>${formatCurrency(unit.totalPrice)}</td>
                  <td>${formatCurrency(calculateRemainingAmount(unit))}</td>
                  <td>${unit.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

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
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🏠</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة الوحدات</h1>
              <p className="text-gray-600">نظام متطور لإدارة الوحدات العقارية</p>
            </div>
          </div>
          <ModernButton onClick={() => setShowAddModal(true)}>
            <span className="mr-2">➕</span>
            إضافة وحدة جديدة
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
                placeholder="🔍 ابحث في الوحدات... (Ctrl+F)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-80 px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold placeholder:text-gray-500 placeholder:font-normal"
              />
            </div>
            <ModernSelect
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="w-40"
            >
              <option value="all">جميع الحالات</option>
              <option value="متاحة">متاحة</option>
              <option value="محجوزة">محجوزة</option>
              <option value="مباعة">مباعة</option>
            </ModernSelect>
            <ModernButton variant="secondary" size="sm" onClick={exportToCSV}>
              📊 تصدير CSV
            </ModernButton>
            <ModernButton variant="secondary" size="sm" onClick={printUnits}>
              🖨️ طباعة PDF
            </ModernButton>
          </div>
          <div className="text-sm text-gray-500">
            {units.filter(unit => {
              const matchesSearch = search === '' || 
                unit.code.toLowerCase().includes(search.toLowerCase()) ||
                (unit.name && unit.name.toLowerCase().includes(search.toLowerCase())) ||
                unit.unitType.toLowerCase().includes(search.toLowerCase())
              const matchesStatus = statusFilter === 'all' || unit.status === statusFilter
              return matchesSearch && matchesStatus
            }).length} وحدة
          </div>
        </div>
      </ModernCard>

        {/* Units List */}
        <ModernCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">قائمة الوحدات</h2>
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
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">كود الوحدة</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الاسم</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الطابق</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">المبنى</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">السعر</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">المتبقي</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الحالة</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الشركاء</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">النوع</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">المساحة</th>
                  <th className="text-right py-4 px-6 font-bold text-gray-900 text-sm uppercase tracking-wide">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {units.filter(unit => {
                  const matchesSearch = search === '' || 
                    unit.code.toLowerCase().includes(search.toLowerCase()) ||
                    (unit.name && unit.name.toLowerCase().includes(search.toLowerCase())) ||
                    unit.unitType.toLowerCase().includes(search.toLowerCase())
                  const matchesStatus = statusFilter === 'all' || unit.status === statusFilter
                  return matchesSearch && matchesStatus
                }).map((unit) => {
                  const partners = getUnitPartners(unit.id)
                  return (
                    <tr 
                      key={unit.id} 
                      className={`
                        border-b border-gray-100 hover:bg-gray-50/50 transition-all duration-300
                        ${deletingUnits.has(unit.id) 
                          ? 'transform translate-x-full opacity-0 scale-95' 
                          : 'transform translate-x-0 opacity-100 scale-100'
                        }
                      `}
                    >
                      <td className="py-4 px-6 w-40">
                        <div className="text-gray-900 font-bold text-base truncate" title={unit.code}>{unit.code}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-800 font-semibold">{unit.name || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-800 font-semibold">{unit.floor || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-800 font-semibold">{unit.building || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-green-800">{formatCurrency(unit.totalPrice)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-blue-800">{formatCurrency(calculateRemainingAmount(unit))}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          unit.status === 'متاحة' 
                            ? 'bg-green-100 text-green-800' 
                            : unit.status === 'محجوزة'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {unit.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-600">
                          {partners.length > 0 ? (
                            <div>
                              {partners.map((partner, index) => (
                                <div key={index}>
                                  {getPartnerName(partner.partnerId)} ({partner.percentage}%)
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">لا يوجد شركاء</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-800 font-semibold">{unit.unitType}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-800 font-semibold">{unit.area || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <ModernButton size="sm" variant="info" onClick={() => router.push(`/units/${unit.id}`)}>
                            👁️ إدارة
                          </ModernButton>
                          <ModernButton size="sm" variant="warning" onClick={() => openEditModal(unit)}>
                            ✏️ تعديل
                          </ModernButton>
                          {unit.status === 'مباعة' && (
                            <ModernButton size="sm" variant="secondary" onClick={() => {
                              if (confirm('هل أنت متأكد من إرجاع هذه الوحدة؟')) {
                                // إضافة منطق الإرجاع هنا
                                addNotification({
                                  type: 'info',
                                  title: 'قيد التطوير',
                                  message: 'ميزة الإرجاع قيد التطوير'
                                })
                              }
                            }}>
                              ↩️ إرجاع
                            </ModernButton>
                          )}
                          <ModernButton size="sm" variant="danger" onClick={() => handleDeleteUnit(unit.id)}>
                            🗑️ حذف
                          </ModernButton>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </ModernCard>
      </div>

      {/* Add/Edit Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingUnit ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingUnit(null)
                    setNewUnit({
                      name: '',
                      unitType: 'سكني',
                      area: '',
                      floor: '',
                      building: '',
                      totalPrice: '',
                      status: 'متاحة',
                      notes: '',
                      partnerGroupId: ''
                    })
                  }}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={editingUnit ? handleEditUnit : handleAddUnit} className="p-6">
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
                  label="اسم الوحدة * (مطلوب)"
                  type="text"
                  value={newUnit.name}
                  onChange={(e: any) => setNewUnit({...newUnit, name: e.target.value})}
                  placeholder="اسم الوحدة"
                  required
                />
                
                <ModernInput
                  label="الطابق (اختياري)"
                  type="text"
                  value={newUnit.floor}
                  onChange={(e: any) => setNewUnit({...newUnit, floor: e.target.value})}
                  placeholder="رقم الطابق"
                />
                
                <ModernInput
                  label="المبنى (اختياري)"
                  type="text"
                  value={newUnit.building}
                  onChange={(e: any) => setNewUnit({...newUnit, building: e.target.value})}
                  placeholder="اسم المبنى"
                />
                
                <ModernInput
                  label="السعر الإجمالي (اختياري)"
                  type="number"
                  value={newUnit.totalPrice}
                  onChange={(e: any) => setNewUnit({...newUnit, totalPrice: e.target.value})}
                  placeholder="السعر الإجمالي"
                />
                
                <ModernSelect
                  label="نوع الوحدة *"
                  value={newUnit.unitType}
                  onChange={(e: any) => setNewUnit({...newUnit, unitType: e.target.value})}
                >
                  <option value="سكني">سكني</option>
                  <option value="تجاري">تجاري</option>
                  <option value="إداري">إداري</option>
                  <option value="صناعي">صناعي</option>
                </ModernSelect>
                
                <ModernInput
                  label="المساحة (اختياري)"
                  type="text"
                  value={newUnit.area}
                  onChange={(e: any) => setNewUnit({...newUnit, area: e.target.value})}
                  placeholder="المساحة بالمتر المربع"
                />
                
                <ModernSelect
                  label="مجموعة الشركاء (اختيارية)"
                  value={newUnit.partnerGroupId}
                  onChange={(e: any) => setNewUnit({...newUnit, partnerGroupId: e.target.value})}
                >
                  <option value="">اختر مجموعة شركاء...</option>
                  {partnerGroups.map(group => {
                    const groupPartners = partners.filter(p => p.partnerGroupId === group.id)
                    const totalPercent = groupPartners.reduce((sum, p) => sum + p.percent, 0)
                    return (
                      <option key={group.id} value={group.id}>
                        {group.name} ({totalPercent}%)
                      </option>
                    )
                  })}
                </ModernSelect>
                
                <ModernSelect
                  label="الحالة"
                  value={newUnit.status}
                  onChange={(e: any) => setNewUnit({...newUnit, status: e.target.value})}
                >
                  <option value="متاحة">متاحة</option>
                  <option value="محجوزة">محجوزة</option>
                  <option value="مباعة">مباعة</option>
                </ModernSelect>
                
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">ملاحظات</label>
                    <textarea
                      value={newUnit.notes}
                      onChange={(e: any) => setNewUnit({...newUnit, notes: e.target.value})}
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
                  setEditingUnit(null)
                  setNewUnit({
                    name: '',
                    unitType: 'سكني',
                    area: '',
                    floor: '',
                    building: '',
                    totalPrice: '',
                    status: 'متاحة',
                    notes: '',
                    partnerGroupId: ''
                  })
                }}>
                  إلغاء
                </ModernButton>
                <ModernButton type="submit">
                  <span className="mr-2">💾</span>
                  {editingUnit ? 'تحديث الوحدة' : 'إضافة الوحدة'}
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
  )
}