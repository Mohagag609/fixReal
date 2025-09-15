'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Installment, Unit, Contract } from '@/types'
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

export default function Installments() {
  const [installments, setInstallments] = useState<Installment[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [unitFilter, setUnitFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })
  const [groupByUnit, setGroupByUnit] = useState(true)
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())
  const [deletingInstallments, setDeletingInstallments] = useState<Set<string>>(new Set())
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleInstallment, setRescheduleInstallment] = useState<Installment | null>(null)
  const [newDueDate, setNewDueDate] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Master-Detail Layout states
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  
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
          case 'f':
            e.preventDefault()
            document.getElementById('search-input')?.focus()
            break
          case 'Escape':
            e.preventDefault()
            setSearch('')
            setStatusFilter('')
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
    
    fetchInstallments()
  }, [])

  const fetchInstallments = async () => {
    try {
      const token = localStorage.getItem('authToken')
      
      const [installmentsRes, unitsRes, contractsRes] = await Promise.all([
        fetch('/api/installments', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/units', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/contracts', { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      const [installmentsData, unitsData, contractsData] = await Promise.all([
        installmentsRes.json(),
        unitsRes.json(),
        contractsRes.json()
      ])

      if (installmentsData.success) setInstallments(installmentsData.data)
      if (unitsData.success) setUnits(unitsData.data)
      if (contractsData.success) setContracts(contractsData.data)

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handlePayInstallment = async (installmentId: string) => {
    if (!confirm('هل أنت متأكد من تسديد هذا القسط؟')) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/installments/${installmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'مدفوع' })
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('تم تسديد القسط بنجاح!')
        setError(null)
        fetchInstallments()
        addNotification({
          type: 'success',
          title: 'تم التسديد بنجاح',
          message: 'تم تسديد القسط بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في تسديد القسط')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في التسديد',
          message: data.error || 'فشل في تسديد القسط'
        })
      }
    } catch (err) {
      console.error('Pay installment error:', err)
      setError('خطأ في تسديد القسط')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في التسديد',
        message: 'فشل في تسديد القسط'
      })
    }
  }

  const handleDeleteInstallment = async (installmentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسط؟')) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/installments/${installmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setSuccess('تم حذف القسط بنجاح!')
        setError(null)
        fetchInstallments()
        addNotification({
          type: 'success',
          title: 'تم الحذف بنجاح',
          message: 'تم حذف القسط بنجاح'
        })
      } else {
        setError(data.error || 'خطأ في حذف القسط')
        setSuccess(null)
        addNotification({
          type: 'error',
          title: 'خطأ في الحذف',
          message: data.error || 'فشل في حذف القسط'
        })
      }
    } catch (err) {
      console.error('Delete installment error:', err)
      setError('خطأ في حذف القسط')
      setSuccess(null)
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'فشل في حذف القسط'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مدفوع':
        return 'bg-green-100 text-green-800'
      case 'مستحق':
        return 'bg-yellow-100 text-yellow-800'
      case 'متأخر':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getUnitName = (unitId: string) => {
    const unit = units.find(u => u.id === unitId)
    return unit ? unit.code : 'غير محدد'
  }

  const getContractForUnit = (unitId: string) => {
    return contracts.find(c => c.unitId === unitId)
  }

  const isOverdue = (dueDate: string | Date) => {
    const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
    return date < new Date() && date.toDateString() !== new Date().toDateString()
  }

  const handleReschedule = (installment: Installment) => {
    setRescheduleInstallment(installment)
    setNewDueDate(new Date(installment.dueDate)??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد')
    setShowRescheduleModal(true)
  }

  const handleRescheduleSubmit = async () => {
    if (!rescheduleInstallment || !newDueDate) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/installments/${rescheduleInstallment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dueDate: newDueDate })
      })

      const data = await response.json()
      if (data.success) {
        addNotification({
          type: 'success',
          title: 'تم إعادة الجدولة بنجاح',
          message: 'تم تغيير تاريخ الاستحقاق بنجاح'
        })
        setShowRescheduleModal(false)
        fetchInstallments()
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في إعادة الجدولة',
          message: data.error || 'فشل في تغيير تاريخ الاستحقاق'
        })
      }
    } catch (err) {
      console.error('Reschedule error:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في إعادة الجدولة',
        message: 'فشل في تغيير تاريخ الاستحقاق'
      })
    }
  }

  const exportToCSV = () => {
    const headers = ['الوحدة', 'المبلغ', 'تاريخ الاستحقاق', 'الحالة', 'الملاحظات']
    const csvContent = [
      headers.join(','),
      ...installments.map(installment => [
        getUnitName(installment.unitId),
        installment.amount,
        formatDate(installment.dueDate),
        installment.status,
        installment.notes || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `installments_${new Date()??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printInstallments = () => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>تقرير الأقساط</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 30px; }
            .date { text-align: left; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>تقرير الأقساط</h1>
            <p class="date">تاريخ الطباعة: ${new Date().toLocaleString('en-GB')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>الوحدة</th>
                <th>المبلغ</th>
                <th>تاريخ الاستحقاق</th>
                <th>الحالة</th>
                <th>الملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${installments.map(installment => `
                <tr>
                  <td>${getUnitName(installment.unitId)}</td>
                  <td>${formatCurrency(installment.amount)}</td>
                  <td>${formatDate(installment.dueDate)}</td>
                  <td>${installment.status}</td>
                  <td>${installment.notes || '-'}</td>
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

  const toggleUnitExpansion = (unitId: string) => {
    setExpandedUnits(prev => {
      const newSet = new Set(prev)
      if (newSet.has(unitId)) {
        newSet.delete(unitId)
      } else {
        newSet.add(unitId)
      }
      return newSet
    })
  }

  const handleInstallmentClick = (installment: Installment) => {
    setSelectedInstallment(installment)
    setShowDetailPanel(true)
  }

  const closeDetailPanel = () => {
    setShowDetailPanel(false)
    setSelectedInstallment(null)
  }

  const filteredInstallments = installments.filter(installment => {
    const matchesSearch = search === '' || 
      getUnitName(installment.unitId).toLowerCase().includes(search.toLowerCase()) ||
      installment.notes?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || installment.status === statusFilter
    const matchesUnit = unitFilter === 'all' || installment.unitId === unitFilter
    
    const matchesDate = !dateFilter.from || !dateFilter.to || 
      (new Date(installment.dueDate) >= new Date(dateFilter.from) && 
       new Date(installment.dueDate) <= new Date(dateFilter.to))
    
    return matchesSearch && matchesStatus && matchesUnit && matchesDate
  })

  // Group installments by unit
  const groupedInstallments = useMemo(() => {
    if (!groupByUnit) return { 'all': filteredInstallments }
    
    const groups: { [key: string]: Installment[] } = {}
    filteredInstallments.forEach(installment => {
      const unitId = installment.unitId
      if (!groups[unitId]) {
        groups[unitId] = []
      }
      groups[unitId].push(installment)
    })
    
    return groups
  }, [filteredInstallments, groupByUnit])

  // Calculate summary for each unit
  const getUnitSummary = (unitInstallments: Installment[]) => {
    const total = unitInstallments.length
    const paid = unitInstallments.filter(i => i.status === 'مدفوع').length
    const pending = unitInstallments.filter(i => i.status === 'مستحق').length
    const overdue = unitInstallments.filter(i => i.status === 'متأخر' || isOverdue(i.dueDate)).length
    const totalAmount = unitInstallments.reduce((sum, i) => sum + i.amount, 0)
    const paidAmount = unitInstallments.filter(i => i.status === 'مدفوع').reduce((sum, i) => sum + i.amount, 0)
    
    return { total, paid, pending, overdue, totalAmount, paidAmount }
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
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <SidebarToggle onToggle={() => setSidebarOpen(!sidebarOpen)} />
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📅</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">إدارة الأقساط</h1>
                  <p className="text-gray-600">نظام متطور لإدارة أقساط العقود</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <ModernButton variant="secondary" onClick={() => router.push('/contracts')}>
                  📋 إضافة عقد جديد
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
          <div className="space-y-6">
            {/* Search and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="relative">
                  <input
                    id="search-input"
                    type="text"
                    placeholder="🔍 ابحث في الأقساط... (Ctrl+F)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-80 px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <ModernButton variant="secondary" size="sm" onClick={exportToCSV}>
                  📊 تصدير CSV
                </ModernButton>
                <ModernButton variant="secondary" size="sm" onClick={printInstallments}>
                  🖨️ طباعة PDF
                </ModernButton>
              </div>
              <div className="text-sm text-gray-500">
                {filteredInstallments.length} قسط
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <ModernSelect
                label="فلتر الحالة"
                value={statusFilter}
                onChange={(e: unknown) => setStatusFilter(e.target.value)}
              >
                <option value="all">جميع الحالات</option>
                <option value="مستحق">مستحق</option>
                <option value="مدفوع">مدفوع</option>
                <option value="متأخر">متأخر</option>
              </ModernSelect>

              <ModernSelect
                label="فلتر الوحدة"
                value={unitFilter}
                onChange={(e: unknown) => setUnitFilter(e.target.value)}
              >
                <option value="all">جميع الوحدات</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code}
                  </option>
                ))}
              </ModernSelect>

              <ModernInput
                label="من تاريخ"
                type="date"
                value={dateFilter.from}
                onChange={(e: unknown) => setDateFilter({...dateFilter, from: e.target.value})}
              />

              <ModernInput
                label="إلى تاريخ"
                type="date"
                value={dateFilter.to}
                onChange={(e: unknown) => setDateFilter({...dateFilter, to: e.target.value})}
              />
            </div>

            {/* View Options */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <label className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  checked={groupByUnit}
                  onChange={(e) => setGroupByUnit(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">تجميع حسب الوحدة</span>
              </label>
            </div>
          </div>
        </ModernCard>

        {/* Installments List */}
        <ModernCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">قائمة الأقساط</h2>
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

          {filteredInstallments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-gray-400">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد أقساط</h3>
              <p className="text-gray-500 mb-6">لم يتم إنشاء أي أقساط بعد. ابدأ بإنشاء عقد جديد</p>
              <div className="flex items-center justify-center space-x-4 space-x-reverse">
                <ModernButton onClick={() => router.push('/contracts')}>
                  <span className="mr-2">📄</span>
                  إدارة العقود
                </ModernButton>
                <ModernButton variant="secondary" onClick={() => router.push('/units')}>
                  <span className="mr-2">🏠</span>
                  إدارة الوحدات
                </ModernButton>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {groupByUnit ? (
                // Grouped view
                <div className="space-y-4">
                  {Object.entries(groupedInstallments).map(([unitId, unitInstallments]) => {
                  const summary = getUnitSummary(unitInstallments)
                  const isExpanded = expandedUnits.has(unitId)
                  
                  return (
                    <div key={unitId} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Unit Summary Header */}
                      <div 
                        className="bg-gray-50 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => toggleUnitExpansion(unitId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 space-x-reverse">
                            <span className="text-lg font-semibold text-gray-900">
                              {getUnitName(unitId)}
                            </span>
                            <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600">
                              <span>المجموع: {summary.total}</span>
                              <span className="text-green-600">مدفوع: {summary.paid}</span>
                              <span className="text-yellow-600">مستحق: {summary.pending}</span>
                              <span className="text-red-600">متأخر: {summary.overdue}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="text-right">
                              <div className="text-sm text-gray-500">إجمالي المبلغ</div>
                              <div className="font-semibold text-green-600">{formatCurrency(summary.totalAmount)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">المدفوع</div>
                              <div className="font-semibold text-blue-600">{formatCurrency(summary.paidAmount)}</div>
                            </div>
                            <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Unit Installments Details */}
                      {isExpanded && (
                        <div className="bg-white">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-right py-3 px-6 font-semibold text-gray-700">المبلغ</th>
                                <th className="text-right py-3 px-6 font-semibold text-gray-700">تاريخ الاستحقاق</th>
                                <th className="text-right py-3 px-6 font-semibold text-gray-700">الحالة</th>
                                <th className="text-right py-3 px-6 font-semibold text-gray-700">الملاحظات</th>
                                <th className="text-right py-3 px-6 font-semibold text-gray-700">الإجراءات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {unitInstallments.map((installment) => (
                                <tr 
                                  key={installment.id} 
                                  className="border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer transition-colors duration-150"
                                  onClick={() => handleInstallmentClick(installment)}
                                >
                                  <td className="py-3 px-6">
                                    <div className="font-semibold text-green-600">{formatCurrency(installment.amount)}</div>
                                  </td>
                                  <td className="py-3 px-6">
                                    <div className={`text-gray-600 ${isOverdue(installment.dueDate) ? 'text-red-600 font-semibold' : ''}`}>
                                      {formatDate(installment.dueDate)}
                                    </div>
                                  </td>
                                  <td className="py-3 px-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(installment.status)}`}>
                                      {installment.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-6">
                                    <div className="text-gray-600 max-w-xs truncate">{installment.notes || '-'}</div>
                                  </td>
                                  <td className="py-3 px-6">
                                    <div className="flex items-center space-x-2 space-x-reverse" onClick={(e) => e.stopPropagation()}>
                                      {installment.status !== 'مدفوع' && (
                                        <>
                                          <ModernButton 
                                            size="sm" 
                                            variant="success" 
                                            onClick={() => handlePayInstallment(installment.id)}
                                          >
                                            💰 تسديد
                                          </ModernButton>
                                          <ModernButton 
                                            size="sm" 
                                            variant="warning" 
                                            onClick={() => handleReschedule(installment)}
                                          >
                                            📅 إعادة جدولة
                                          </ModernButton>
                                        </>
                                      )}
                                      <ModernButton 
                                        size="sm" 
                                        variant="danger" 
                                        onClick={() => handleDeleteInstallment(installment.id)}
                                        disabled={deletingInstallments.has(installment.id)}
                                      >
                                        {deletingInstallments.has(installment.id) ? '⏳' : '🗑️'} حذف
                                      </ModernButton>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              // Flat view
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">الوحدة</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">المبلغ</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">تاريخ الاستحقاق</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">الحالة</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">الملاحظات</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstallments.map((installment) => (
                    <tr 
                      key={installment.id} 
                      className="border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer transition-colors duration-150"
                      onClick={() => handleInstallmentClick(installment)}
                    >
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{getUnitName(installment.unitId)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-green-600">{formatCurrency(installment.amount)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className={`text-gray-600 ${isOverdue(installment.dueDate) ? 'text-red-600 font-semibold' : ''}`}>
                          {formatDate(installment.dueDate)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(installment.status)}`}>
                          {installment.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-600 max-w-xs truncate">{installment.notes || '-'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2 space-x-reverse" onClick={(e) => e.stopPropagation()}>
                          {installment.status !== 'مدفوع' && (
                            <>
                              <ModernButton 
                                size="sm" 
                                variant="success" 
                                onClick={() => handlePayInstallment(installment.id)}
                              >
                                💰 تسديد
                              </ModernButton>
                              <ModernButton 
                                size="sm" 
                                variant="warning" 
                                onClick={() => handleReschedule(installment)}
                              >
                                📅 إعادة جدولة
                              </ModernButton>
                            </>
                          )}
                          <ModernButton 
                            size="sm" 
                            variant="danger" 
                            onClick={() => handleDeleteInstallment(installment.id)}
                            disabled={deletingInstallments.has(installment.id)}
                          >
                            {deletingInstallments.has(installment.id) ? '⏳' : '🗑️'} حذف
                          </ModernButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          )}
        </ModernCard>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && rescheduleInstallment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-md w-full">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">إعادة جدولة القسط</h2>
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">الوحدة:</span>
                  <p className="text-gray-900 font-semibold">{getUnitName(rescheduleInstallment.unitId)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">المبلغ:</span>
                  <p className="text-gray-900 font-semibold">{formatCurrency(rescheduleInstallment.amount)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">التاريخ الحالي:</span>
                  <p className="text-gray-900">{formatDate(rescheduleInstallment.dueDate)}</p>
                </div>
                
                <ModernInput
                  label="التاريخ الجديد"
                  type="date"
                  value={newDueDate}
                  onChange={(e: unknown) => setNewDueDate(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-8 pt-6 border-t border-gray-200">
                <ModernButton variant="secondary" onClick={() => setShowRescheduleModal(false)}>
                  إلغاء
                </ModernButton>
                <ModernButton onClick={handleRescheduleSubmit}>
                  📅 تأكيد إعادة الجدولة
                </ModernButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Panel - Side Drawer */}
      {showDetailPanel && selectedInstallment && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeDetailPanel}
          />
          
          {/* Side Panel */}
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">تفاصيل القسط</h2>
                    <p className="text-blue-100 text-sm">معلومات مفصلة عن القسط</p>
                  </div>
                  <button
                    onClick={closeDetailPanel}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors duration-200"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">المعلومات الأساسية</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">الوحدة:</span>
                        <span className="font-semibold text-gray-900">{getUnitName(selectedInstallment.unitId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">المبلغ:</span>
                        <span className="font-bold text-green-600 text-lg">{formatCurrency(selectedInstallment.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">تاريخ الاستحقاق:</span>
                        <span className={`font-semibold ${isOverdue(selectedInstallment.dueDate) ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatDate(selectedInstallment.dueDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">الحالة:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInstallment.status)}`}>
                          {selectedInstallment.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contract Info */}
                  {(() => {
                    const contract = getContractForUnit(selectedInstallment.unitId)
                    return contract ? (
                      <div className="bg-blue-50 rounded-xl p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات العقد</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">رقم العقد:</span>
                            <span className="font-semibold text-gray-900">{contract.id.slice(-8) || 'غير محدد'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">تاريخ العقد:</span>
                            <span className="font-semibold text-gray-900">{formatDate(contract.start)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">المبلغ الإجمالي:</span>
                            <span className="font-bold text-blue-600">{formatCurrency(contract.totalPrice)}</span>
                          </div>
                        </div>
                      </div>
                    ) : null
                  })()}

                  {/* Notes */}
                  {selectedInstallment.notes && (
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">الملاحظات</h3>
                      <p className="text-gray-700">{selectedInstallment.notes}</p>
                    </div>
                  )}

                  {/* Payment History */}
                  <div className="bg-green-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">تاريخ الدفع</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">تاريخ الإنشاء:</span>
                        <span className="font-semibold">{selectedInstallment.createdAt ? formatDate(selectedInstallment.createdAt) : 'غير محدد'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">آخر تحديث:</span>
                        <span className="font-semibold">{selectedInstallment.updatedAt ? formatDate(selectedInstallment.updatedAt) : 'غير محدد'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="grid grid-cols-2 gap-3">
                  <ModernButton 
                    variant="warning" 
                    size="sm"
                    onClick={() => {
                      closeDetailPanel()
                      handleReschedule(selectedInstallment)
                    }}
                  >
                    📅 تعديل
                  </ModernButton>
                  <ModernButton 
                    variant="info" 
                    size="sm"
                    onClick={() => {
                      window.print()
                      addNotification({
                        type: 'success',
                        title: 'طباعة',
                        message: 'تم فتح نافذة الطباعة'
                      })
                    }}
                  >
                    🖨️ طباعة
                  </ModernButton>
                  <ModernButton 
                    variant="success" 
                    size="sm"
                    onClick={() => {
                      // PDF download functionality
                      addNotification({
                        type: 'info',
                        title: 'قيد التطوير',
                        message: 'ميزة تحميل PDF قيد التطوير'
                      })
                    }}
                  >
                    📄 PDF
                  </ModernButton>
                  <ModernButton 
                    variant="secondary" 
                    size="sm"
                    onClick={closeDetailPanel}
                  >
                    إغلاق
                  </ModernButton>
                </div>
              </div>
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
  )
}