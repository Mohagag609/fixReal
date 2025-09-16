'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Unit, UnitPartner, PartnerGroup } from '@/types'
import { formatCurrency } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import SidebarToggle from '@/components/SidebarToggle'
import Sidebar from '@/components/Sidebar'
import NavigationButtons from '@/components/NavigationButtons'
import ModernCard from '@/components/ui/ModernCard'
import ModernButton from '@/components/ui/ModernButton'
import { ModernInput } from '@/components/ui/ModernInput'
import { ModernSelect } from '@/components/ui/ModernSelect'

export default function Units() {
  const [units, setUnits] = useState<Unit[]>([])
  const [unitPartners, setUnitPartners] = useState<UnitPartner[]>([])
  const [partnerGroups, setPartnerGroups] = useState<PartnerGroup[]>([])
  const [partners, setPartners] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name') // name, unitType, totalPrice, createdAt
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportType, setExportType] = useState<'csv' | 'excel' | 'pdf' | 'json'>('csv')
  const [exportFields, setExportFields] = useState({
    name: true,
    unitType: true,
    area: true,
    floor: true,
    building: true,
    totalPrice: true,
    status: true,
    createdAt: true,
    notes: false
  })
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [deletingUnits, setDeletingUnits] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
            setEditingUnit(null)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [sidebarOpen])

  useEffect(() => {
    // Load data when page opens
    fetchData(true)
  }, []) // TODO: Review dependencies

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

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      // Optimized parallel data fetching with proper error handling
      const [unitsResponse, unitPartnersResponse, partnerGroupsResponse, partnersResponse] = await Promise.allSettled([
        fetch(`/api/units${forceRefresh ? '?refresh=true&limit=1000' : '?limit=1000'}`, { 
          headers: { 
            'Content-Type': 'application/json'
          },
          cache: forceRefresh ? 'no-cache' : 'default'
        }),
        fetch(`/api/unit-partners${forceRefresh ? '?refresh=true&limit=1000' : '?limit=1000'}`, { 
          headers: { 
            'Content-Type': 'application/json'
          },
          cache: forceRefresh ? 'no-cache' : 'default'
        }),
        fetch(`/api/partner-groups${forceRefresh ? '?refresh=true&limit=1000' : '?limit=1000'}`, { 
          headers: { 
            'Content-Type': 'application/json'
          },
          cache: forceRefresh ? 'no-cache' : 'default'
        }),
        fetch(`/api/partners${forceRefresh ? '?refresh=true&limit=1000' : '?limit=1000'}`, { 
          headers: { 
            'Content-Type': 'application/json'
          },
          cache: forceRefresh ? 'no-cache' : 'default'
        })
      ])
      
      // Process responses with error handling
      const [unitsData, unitPartnersData, partnerGroupsData, partnersData] = await Promise.all([
        unitsResponse.status === 'fulfilled' ? unitsResponse.value.json() : { success: false, error: 'Failed to fetch units' },
        unitPartnersResponse.status === 'fulfilled' ? unitPartnersResponse.value.json() : { success: false, error: 'Failed to fetch unit partners' },
        partnerGroupsResponse.status === 'fulfilled' ? partnerGroupsResponse.value.json() : { success: false, error: 'Failed to fetch partner groups' },
        partnersResponse.status === 'fulfilled' ? partnersResponse.value.json() : { success: false, error: 'Failed to fetch partners' }
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
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
      const response = await fetch(`/api/units/${editingUnit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
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
      const response = await fetch(`/api/units/${unitId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
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

  // دوال التصدير الاحترافي
  const exportToCSV = () => {
    const selectedFields = Object.entries(exportFields)
      .filter(([_, selected]) => selected)
      .map(([field, _]) => field)

    const filteredUnits = units
      .filter(unit => {
        const matchesSearch = !search || 
          (unit.name && unit.name.toLowerCase().includes(search.toLowerCase())) ||
          (unit.unitType && unit.unitType.toLowerCase().includes(search.toLowerCase())) ||
          (unit.building && unit.building.toLowerCase().includes(search.toLowerCase()))
        
        const matchesStatus = statusFilter === 'all' || unit.status === statusFilter
        
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        let aValue: string | number
        let bValue: string | number
        
        switch (sortBy) {
          case 'name':
            aValue = (a.name || '').toLowerCase()
            bValue = (b.name || '').toLowerCase()
            break
          case 'unitType':
            aValue = a.unitType || ''
            bValue = b.unitType || ''
            break
          case 'totalPrice':
            aValue = parseFloat((a.totalPrice || 0).toString())
            bValue = parseFloat((b.totalPrice || 0).toString())
            break
          case 'createdAt':
            aValue = new Date(a.createdAt || new Date()).getTime()
            bValue = new Date(b.createdAt || new Date()).getTime()
            break
          default:
            aValue = (a.name || '').toLowerCase()
            bValue = (b.name || '').toLowerCase()
        }
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      })

    const headers = selectedFields.map(field => {
      const fieldNames: { [key: string]: string } = {
        name: 'الاسم',
        unitType: 'نوع الوحدة',
        area: 'المساحة',
        floor: 'الطابق',
        building: 'المبنى',
        totalPrice: 'السعر الإجمالي',
        status: 'الحالة',
        createdAt: 'تاريخ الإضافة',
        notes: 'ملاحظات'
      }
      return fieldNames[field] || field
    })

    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...filteredUnits.map(unit => 
        selectedFields.map(field => {
          let value = ''
          switch (field) {
            case 'name': value = unit.name || ''; break
            case 'unitType': value = unit.unitType || ''; break
            case 'area': value = unit.area || ''; break
            case 'floor': value = unit.floor || ''; break
            case 'building': value = unit.building || ''; break
            case 'totalPrice': value = (unit.totalPrice || 0).toString(); break
            case 'status': value = unit.status || ''; break
            case 'createdAt': value = new Date(unit.createdAt || new Date()).toLocaleDateString('en-US'); break
            case 'notes': value = unit.notes || ''; break
          }
          return `"${value}"`
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `وحدات_${new Date().toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    addNotification({
      type: 'success',
      title: 'تم التصدير بنجاح',
      message: 'تم تصدير ملف CSV بنجاح'
    })
  }

  const exportToExcel = async () => {
    try {
      const ExcelJS = await import('exceljs')
      
      const filteredUnits = units
        .filter(unit => {
          const matchesSearch = !search || 
            (unit.name && unit.name.toLowerCase().includes(search.toLowerCase())) ||
            (unit.unitType && unit.unitType.toLowerCase().includes(search.toLowerCase())) ||
            (unit.building && unit.building.toLowerCase().includes(search.toLowerCase()))
          
          const matchesStatus = statusFilter === 'all' || unit.status === statusFilter
          
          return matchesSearch && matchesStatus
        })
        .sort((a, b) => {
          let aValue: string | number
          let bValue: string | number
          
          switch (sortBy) {
            case 'name':
              aValue = (a.name || '').toLowerCase()
              bValue = (b.name || '').toLowerCase()
              break
            case 'unitType':
              aValue = a.unitType || ''
              bValue = b.unitType || ''
              break
            case 'totalPrice':
              aValue = parseFloat((a.totalPrice || 0).toString())
              bValue = parseFloat((b.totalPrice || 0).toString())
              break
            case 'createdAt':
              aValue = new Date(a.createdAt || new Date()).getTime()
              bValue = new Date(b.createdAt || new Date()).getTime()
              break
            default:
              aValue = (a.name || '').toLowerCase()
              bValue = (b.name || '').toLowerCase()
          }
          
          if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
          if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
          return 0
        })

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('الوحدات')

      // إعدادات الورقة
      worksheet.properties.defaultRowHeight = 25
      worksheet.properties.defaultColWidth = 15
      
      // إعداد اتجاه الشيت من اليمين لليسار
      worksheet.views = [{ rightToLeft: true }]

      // إعداد الأعمدة
      worksheet.columns = [
        { header: 'الاسم', key: 'name', width: 20 },
        { header: 'نوع الوحدة', key: 'unitType', width: 15 },
        { header: 'المساحة', key: 'area', width: 12 },
        { header: 'الطابق', key: 'floor', width: 10 },
        { header: 'المبنى', key: 'building', width: 15 },
        { header: 'السعر الإجمالي', key: 'totalPrice', width: 15 },
        { header: 'الحالة', key: 'status', width: 12 },
        { header: 'تاريخ الإضافة', key: 'createdAt', width: 15 },
        { header: 'ملاحظات', key: 'notes', width: 20 }
      ]

      // إضافة العناوين
      const headerRow = worksheet.getRow(1)
      headerRow.values = ['الاسم', 'نوع الوحدة', 'المساحة', 'الطابق', 'المبنى', 'السعر الإجمالي', 'الحالة', 'تاريخ الإضافة', 'ملاحظات']
      headerRow.height = 30

      // تنسيق العناوين
      headerRow.eachCell((cell) => {
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
      filteredUnits
        .filter(unit => unit.name && unit.name.trim() !== '')
        .forEach((unit, index) => {
          const row = worksheet.addRow([
        unit.name || '',
            unit.unitType || '',
            unit.area || '',
        unit.floor || '',
        unit.building || '',
            unit.totalPrice || '',
            unit.status || 'غير محدد',
            new Date(unit.createdAt || new Date()).toLocaleDateString('en-US'),
        unit.notes || ''
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
            
            // تنسيق الحالة (العمود السابع)
            if (colNumber === 7) {
              if (cellValue === 'متاحة') {
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
              } else if (cellValue === 'محجوزة') {
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
        to: `I${filteredUnits.length + 1}`
      }

      // تصدير الملف
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
      link.setAttribute('download', `تقرير_الوحدات_${new Date().toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.xlsx`)
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

  const exportToPDF = () => {
    const selectedFields = Object.entries(exportFields)
      .filter(([_, selected]) => selected)
      .map(([field, _]) => field)

    const filteredUnits = units
      .filter(unit => {
        const matchesSearch = !search || 
          (unit.name && unit.name.toLowerCase().includes(search.toLowerCase())) ||
          (unit.unitType && unit.unitType.toLowerCase().includes(search.toLowerCase())) ||
          (unit.building && unit.building.toLowerCase().includes(search.toLowerCase()))
        
        const matchesStatus = statusFilter === 'all' || unit.status === statusFilter
        
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        let aValue: string | number
        let bValue: string | number
        
        switch (sortBy) {
          case 'name':
            aValue = (a.name || '').toLowerCase()
            bValue = (b.name || '').toLowerCase()
            break
          case 'unitType':
            aValue = a.unitType || ''
            bValue = b.unitType || ''
            break
          case 'totalPrice':
            aValue = parseFloat((a.totalPrice || 0).toString())
            bValue = parseFloat((b.totalPrice || 0).toString())
            break
          case 'createdAt':
            aValue = new Date(a.createdAt || new Date()).getTime()
            bValue = new Date(b.createdAt || new Date()).getTime()
            break
          default:
            aValue = (a.name || '').toLowerCase()
            bValue = (b.name || '').toLowerCase()
        }
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      })

    const fieldNames: { [key: string]: string } = {
      name: 'الاسم',
      unitType: 'نوع الوحدة',
      area: 'المساحة',
      floor: 'الطابق',
      building: 'المبنى',
      totalPrice: 'السعر الإجمالي',
      status: 'الحالة',
      createdAt: 'تاريخ الإضافة',
      notes: 'ملاحظات'
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الوحدات</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; }
          .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
          .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
          table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          th { background: #4F46E5; color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 14px; }
          td { padding: 12px 15px; text-align: center; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #f9fafb; }
          tr:hover { background: #f3f4f6; }
          .status-available { background: #d1fae5; color: #065f46; font-weight: bold; }
          .status-reserved { background: #fee2e2; color: #991b1b; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          @media print { body { background: white; } .header { background: #4F46E5 !important; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير الوحدات</h1>
          <p>تاريخ التقرير: ${new Date().toLocaleDateString('en-US')}</p>
          <p>إجمالي الوحدات: ${filteredUnits.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${selectedFields.map(field => `<th>${fieldNames[field] || field}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredUnits.map(unit => `
              <tr>
                ${selectedFields.map(field => {
                  let value = ''
                  let className = ''
                  switch (field) {
                    case 'name': value = unit.name || ''; break
                    case 'unitType': value = unit.unitType || ''; break
                    case 'area': value = unit.area || ''; break
                    case 'floor': value = unit.floor || ''; break
                    case 'building': value = unit.building || ''; break
                    case 'totalPrice': value = (unit.totalPrice || 0).toString(); break
                    case 'status': 
                      value = unit.status || ''
                      className = unit.status === 'متاحة' ? 'status-available' : unit.status === 'محجوزة' ? 'status-reserved' : ''
                      break
                    case 'createdAt': value = new Date(unit.createdAt || new Date()).toLocaleDateString('en-US'); break
                    case 'notes': value = unit.notes || ''; break
                  }
                  return `<td class="${className}">${value}</td>`
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>تم إنشاء التقرير في ${new Date().toLocaleString('ar-SA')}</p>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
    
    addNotification({
      type: 'success',
      title: 'تم التصدير بنجاح',
      message: 'تم تصدير ملف PDF بنجاح'
    })
  }

  const exportToJSON = () => {
    const selectedFields = Object.entries(exportFields)
      .filter(([_, selected]) => selected)
      .map(([field, _]) => field)

    const filteredUnits = units
      .filter(unit => {
        const matchesSearch = !search || 
          (unit.name && unit.name.toLowerCase().includes(search.toLowerCase())) ||
          (unit.unitType && unit.unitType.toLowerCase().includes(search.toLowerCase())) ||
          (unit.building && unit.building.toLowerCase().includes(search.toLowerCase()))
        
        const matchesStatus = statusFilter === 'all' || unit.status === statusFilter
        
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        let aValue: string | number
        let bValue: string | number
        
        switch (sortBy) {
          case 'name':
            aValue = (a.name || '').toLowerCase()
            bValue = (b.name || '').toLowerCase()
            break
          case 'unitType':
            aValue = a.unitType || ''
            bValue = b.unitType || ''
            break
          case 'totalPrice':
            aValue = parseFloat((a.totalPrice || 0).toString())
            bValue = parseFloat((b.totalPrice || 0).toString())
            break
          case 'createdAt':
            aValue = new Date(a.createdAt || new Date()).getTime()
            bValue = new Date(b.createdAt || new Date()).getTime()
            break
          default:
            aValue = (a.name || '').toLowerCase()
            bValue = (b.name || '').toLowerCase()
        }
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
      .map(unit => {
        const filteredUnit: Record<string, unknown> = {}
        selectedFields.forEach(field => {
          switch (field) {
            case 'name': filteredUnit.name = unit.name; break
            case 'unitType': filteredUnit.unitType = unit.unitType; break
            case 'area': filteredUnit.area = unit.area; break
            case 'floor': filteredUnit.floor = unit.floor; break
            case 'building': filteredUnit.building = unit.building; break
            case 'totalPrice': filteredUnit.totalPrice = unit.totalPrice; break
            case 'status': filteredUnit.status = unit.status; break
            case 'createdAt': filteredUnit.createdAt = new Date(unit.createdAt || new Date()).toISOString(); break
            case 'notes': filteredUnit.notes = unit.notes; break
          }
        })
        return filteredUnit
      })

    const jsonData = {
      metadata: {
        title: 'تقرير الوحدات',
        exportDate: new Date().toISOString(),
        totalRecords: filteredUnits.length,
        exportType: 'JSON',
        fields: selectedFields
      },
      units: filteredUnits
    }

    const jsonString = JSON.stringify(jsonData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `وحدات_${new Date().toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    addNotification({
      type: 'success',
      title: 'تم التصدير بنجاح',
      message: 'تم تصدير ملف JSON بنجاح'
    })
  }



  // استيراد سريع للوحدات من ملف نصي - رقم الوحدة، الطابق، المبنى
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
          message: 'الملف فارغ أو لا يحتوي على بيانات'
        })
        return
      }

      if (lines.length > 500) {
        addNotification({
          type: 'error',
          title: 'خطأ في الملف',
          message: 'الملف يحتوي على أكثر من 500 وحدة. الحد الأقصى 500'
        })
        return
      }

      // تحضير البيانات للاستيراد السريع - رقم الوحدة، الطابق، المبنى
      const unitsToImport = lines.map(line => {
        // تقسيم البيانات بـ Tab
        const parts = line.split('\t').map(part => part.trim())
        
        console.log('Original line:', JSON.stringify(line))
        console.log('Split parts:', parts)
        
        const unitNumber = parts[0] || ''
        const floor = parts[1] || ''
        const building = parts[2] || ''
        
        console.log('Extracted values:', { unitNumber, floor, building })
        
        // التحقق من صحة البيانات
        if (parts.length < 3) {
          console.warn('Invalid line format:', line, 'Expected: UnitNumber Floor Building')
          return null
        }
        
        // استخدام المبنى كاسم الوحدة
        const name = building
        
        // إنشاء كود الوحدة التلقائي
        const sanitizedBuilding = (building || 'غير محدد').replace(/\s/g, '')
        const sanitizedFloor = (floor || 'غير محدد').replace(/\s/g, '')
        const sanitizedUnitNumber = unitNumber.replace(/\s/g, '')
        const code = `${sanitizedUnitNumber}-${sanitizedFloor}-${sanitizedBuilding}`
        
        const unitData = {
          name,
          floor,
          building,
          code,
          unitType: 'سكني', // افتراضي
          area: '', // فارغ
          totalPrice: 0, // افتراضي
          status: 'متاحة', // افتراضي
          notes: 'مستورد تلقائياً - استيراد سريع'
        }
        
        console.log('Final unit data:', unitData)
        return unitData
      }).filter(unit => unit !== null && unit.name.trim())

      if (unitsToImport.length === 0) {
        addNotification({
          type: 'error',
          title: 'خطأ في الملف',
          message: 'لا توجد وحدات صالحة في الملف'
        })
        return
      }

      // فحص تكرار الأكواد
      const existingCodes = units.map(u => u.code.toLowerCase())
      const duplicateCodes = unitsToImport.filter(unit => 
        unit && existingCodes.includes(unit.code.toLowerCase())
      )

      if (duplicateCodes.length > 0) {
        addNotification({
          type: 'error',
          title: 'خطأ في البيانات',
          message: `يوجد ${duplicateCodes.length} وحدة مكررة: ${duplicateCodes.map(u => u?.code || '').join(', ')}`
        })
        return
      }

          // استخدام API محسن للاستيراد السريع
          const response = await fetch('/api/units/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ units: unitsToImport })
          })

      const data = await response.json()
      
      if (data.success) {
        addNotification({
          type: 'success',
          title: 'تم الاستيراد بنجاح',
          message: `تم استيراد ${unitsToImport.length} وحدة بنجاح`
        })
        
        // إعادة تحميل قائمة الوحدات
        fetchData()
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في الاستيراد',
          message: data.error || 'فشل في استيراد الوحدات'
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
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40 w-full">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
                <SidebarToggle onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🏠</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة الوحدات</h1>
              <p className="text-gray-600">نظام متطور لإدارة الوحدات العقارية</p>
            </div>
          </div>
              <div className="flex items-center space-x-3 space-x-reverse">
          <ModernButton onClick={() => setShowAddModal(true)}>
            <span className="mr-2">➕</span>
            إضافة وحدة جديدة
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold"
            >
              <option value="all">جميع الحالات</option>
              <option value="متاحة">متاحة</option>
              <option value="محجوزة">محجوزة</option>
              <option value="مباعة">مباعة</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 font-bold"
            >
              <option value="name">الاسم</option>
              <option value="unitType">نوع الوحدة</option>
              <option value="totalPrice">السعر الإجمالي</option>
              <option value="createdAt">تاريخ الإضافة</option>
            </select>
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
            <ModernButton variant="info" size="sm" onClick={() => fetchData(true)}>
              🔄 تحديث القائمة
            </ModernButton>
            <div className="flex flex-col items-end space-y-2">
              <label className="cursor-pointer">
                <div className="px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/25 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95">
                  📥 استيراد سريع (رقم الوحدة، الطابق، المبنى)
                </div>
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleBulkImport}
                  className="hidden"
                />
              </label>
              <div className="text-xs text-gray-500 text-right">
                تنسيق الملف: رقم الوحدة	الطابق	المبنى (مفصول بـ Tab)
                <br />
                مثال: 1	7	A
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {units
              .filter(unit => {
                const matchesSearch = !search || 
                (unit.name && unit.name.toLowerCase().includes(search.toLowerCase())) ||
                  (unit.unitType && unit.unitType.toLowerCase().includes(search.toLowerCase())) ||
                  (unit.building && unit.building.toLowerCase().includes(search.toLowerCase()))
                
              const matchesStatus = statusFilter === 'all' || unit.status === statusFilter
                
              return matchesSearch && matchesStatus
              }).length} من {units.length} وحدة
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
                {units
                  .filter(unit => {
                    const matchesSearch = !search || 
                    (unit.name && unit.name.toLowerCase().includes(search.toLowerCase())) ||
                      (unit.unitType && unit.unitType.toLowerCase().includes(search.toLowerCase())) ||
                      (unit.building && unit.building.toLowerCase().includes(search.toLowerCase()))
                    
                  const matchesStatus = statusFilter === 'all' || unit.status === statusFilter
                    
                  return matchesSearch && matchesStatus
                  })
                  .sort((a, b) => {
                    let aValue: string | number
                    let bValue: string | number
                    
                    switch (sortBy) {
                      case 'name':
                        aValue = (a.name || '').toLowerCase()
                        bValue = (b.name || '').toLowerCase()
                        break
                      case 'unitType':
                        aValue = a.unitType || ''
                        bValue = b.unitType || ''
                        break
                      case 'totalPrice':
                        aValue = parseFloat((a.totalPrice || 0).toString())
                        bValue = parseFloat((b.totalPrice || 0).toString())
                        break
                      case 'createdAt':
                        aValue = new Date(a.createdAt || new Date()).getTime()
                        bValue = new Date(b.createdAt || new Date()).getTime()
                        break
                      default:
                        aValue = (a.name || '').toLowerCase()
                        bValue = (b.name || '').toLowerCase()
                    }
                    
                    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
                    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
                    return 0
                  })
                  .map((unit) => {
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
                  onChange={(e: unknown) => setNewUnit({...newUnit, name: e.target.value})}
                  placeholder="اسم الوحدة"
                  required
                />
                
                <ModernInput
                  label="الطابق (اختياري)"
                  type="text"
                  value={newUnit.floor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUnit({...newUnit, floor: e.target.value})}
                  placeholder="رقم الطابق"
                />
                
                <ModernInput
                  label="المبنى (اختياري)"
                  type="text"
                  value={newUnit.building}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUnit({...newUnit, building: e.target.value})}
                  placeholder="اسم المبنى"
                />
                
                <ModernInput
                  label="السعر الإجمالي (اختياري)"
                  type="number"
                  value={newUnit.totalPrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUnit({...newUnit, totalPrice: e.target.value})}
                  placeholder="السعر الإجمالي"
                />
                
                <ModernSelect
                  label="نوع الوحدة *"
                  value={newUnit.unitType}
                  onChange={(e: unknown) => setNewUnit({...newUnit, unitType: e.target.value})}
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
                  onChange={(e: unknown) => setNewUnit({...newUnit, area: e.target.value})}
                  placeholder="المساحة بالمتر المربع"
                />
                
                <ModernSelect
                  label="مجموعة الشركاء (اختيارية)"
                  value={newUnit.partnerGroupId}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewUnit({...newUnit, partnerGroupId: e.target.value})}
                >
                  <option value="">اختر مجموعة شركاء...</option>
                  {partnerGroups.map(group => {
                    const groupPartners = partners.filter((p: any) => p.partnerGroupId === group.id)
                    const totalPercent = groupPartners.reduce((sum: number, p: any) => sum + p.percent, 0)
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
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewUnit({...newUnit, status: e.target.value})}
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
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewUnit({...newUnit, notes: e.target.value})}
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">تصدير احترافي</h3>
              <p className="text-sm text-gray-500 mt-1">اختر نوع التصدير والحقول المطلوبة</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Export Type */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">نوع التصدير</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExportType('csv')}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      exportType === 'csv'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">📊</div>
                      <div className="font-bold">CSV</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setExportType('excel')}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      exportType === 'excel'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">📈</div>
                      <div className="font-bold">Excel</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setExportType('pdf')}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      exportType === 'pdf'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">📄</div>
                      <div className="font-bold">PDF</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setExportType('json')}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      exportType === 'json'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">🔧</div>
                      <div className="font-bold">JSON</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Fields Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">الحقول المطلوبة</label>
                <div className="space-y-2">
                  {Object.entries(exportFields).map(([field, selected]) => {
                    const fieldNames: { [key: string]: string } = {
                      name: 'الاسم',
                      unitType: 'نوع الوحدة',
                      area: 'المساحة',
                      floor: 'الطابق',
                      building: 'المبنى',
                      totalPrice: 'السعر الإجمالي',
                      status: 'الحالة',
                      createdAt: 'تاريخ الإضافة',
                      notes: 'ملاحظات'
                    }
                    return (
                      <label key={field} className="flex items-center space-x-3 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => setExportFields(prev => ({
                            ...prev,
                            [field]: e.target.checked
                          }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {fieldNames[field] || field}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Export Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• عدد الوحدات: {units
                    .filter(unit => {
                      const matchesSearch = !search || 
                        (unit.name && unit.name.toLowerCase().includes(search.toLowerCase())) ||
                        (unit.unitType && unit.unitType.toLowerCase().includes(search.toLowerCase())) ||
                        (unit.building && unit.building.toLowerCase().includes(search.toLowerCase()))
                      
                      const matchesStatus = statusFilter === 'all' || unit.status === statusFilter
                      
                      return matchesSearch && matchesStatus
                    }).length} وحدة</div>
                  <div>• نوع الملف: {exportType.toUpperCase()}</div>
                  <div>• الحقول المحددة: {Object.entries(exportFields).filter(([_, selected]) => selected).length} حقل</div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3 space-x-reverse">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
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
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                تصدير
              </button>
            </div>
          </div>
        </div>
      )}
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
        </div>
      </div>
    </div>
  )
}