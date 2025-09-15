'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Unit, UnitPartner, Partner } from '@/types'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import Layout from '@/components/Layout'

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

export default function UnitManagementPage() {
  const [unit, setUnit] = useState<Unit | null>(null)
  const [unitPartners, setUnitPartners] = useState<UnitPartner[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [partnerGroups, setPartnerGroups] = useState<unknown[]>([])
  const [selectedPartnerGroup, setSelectedPartnerGroup] = useState('')
  const [linkedPartnerGroup, setLinkedPartnerGroup] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPartnersModal, setShowPartnersModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [newUnit, setNewUnit] = useState({
    name: '',
    unitType: '',
    area: '',
    floor: '',
    building: '',
    totalPrice: '',
    status: 'متاحة',
    notes: ''
  })
  
  const router = useRouter()
  const params = useParams()
  const unitId = params.id as string
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    if (unitId) {
      fetchUnitData(unitId)
    }
  }, [unitId])

  const fetchUnitData = async (id: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      
      const [unitResponse, unitPartnersResponse, partnersResponse, partnerGroupsResponse, linkedPartnerGroupResponse] = await Promise.all([
        fetch(`/api/units/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/unit-partners', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/partners', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/partner-groups', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/unit-partner-groups?unitId=${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      
      const [unitData, unitPartnersData, partnersData, partnerGroupsData, linkedPartnerGroupData] = await Promise.all([
        unitResponse.json(),
        unitPartnersResponse.json(),
        partnersResponse.json(),
        partnerGroupsResponse.json(),
        linkedPartnerGroupResponse.json()
      ])
      
      if (unitResponse.ok) {
        setUnit(unitData)
        setEditingUnit(unitData)
        setNewUnit({
          name: unitData.name || '',
          unitType: unitData.unitType || '',
          area: unitData.area || '',
          floor: unitData.floor || '',
          building: unitData.building || '',
          totalPrice: unitData.totalPrice?.toString() || '',
          status: unitData.status || 'متاحة',
          notes: unitData.notes || ''
        })
      } else {
        setError(unitData.error || 'خطأ في تحميل الوحدة')
      }

      if (unitPartnersResponse.ok) {
        // Check if unitPartnersData is an array
        if (Array.isArray(unitPartnersData)) {
          const filteredPartners = unitPartnersData.filter((up: UnitPartner) => up.unitId === id)
          setUnitPartners(filteredPartners)
        } else if (unitPartnersData && Array.isArray(unitPartnersData.data)) {
          const filteredPartners = unitPartnersData.data.filter((up: UnitPartner) => up.unitId === id)
        setUnitPartners(filteredPartners)
        } else {
          console.log('unitPartnersData is not an array:', unitPartnersData)
          setUnitPartners([])
        }
      }

      if (partnersResponse.ok) {
        // Check if partnersData is an array
        if (Array.isArray(partnersData)) {
          setPartners(partnersData)
        } else if (partnersData && Array.isArray(partnersData.data)) {
        setPartners(partnersData.data)
        } else {
          console.log('partnersData is not an array:', partnersData)
          setPartners([])
        }
      }

      if (partnerGroupsResponse.ok) {
        // Check if partnerGroupsData is an array
        if (Array.isArray(partnerGroupsData)) {
          setPartnerGroups(partnerGroupsData)
        } else if (partnerGroupsData && Array.isArray(partnerGroupsData.data)) {
          setPartnerGroups(partnerGroupsData.data)
        } else {
          console.log('partnerGroupsData is not an array:', partnerGroupsData)
          setPartnerGroups([])
        }
      }

      if (linkedPartnerGroupResponse.ok) {
        // Check if linkedPartnerGroupData is an array
        if (Array.isArray(linkedPartnerGroupData)) {
          setLinkedPartnerGroup(linkedPartnerGroupData[0] || null)
        } else if (linkedPartnerGroupData && Array.isArray(linkedPartnerGroupData.data)) {
          setLinkedPartnerGroup(linkedPartnerGroupData.data[0] || null)
        } else {
          console.log('linkedPartnerGroupData is not an array:', linkedPartnerGroupData)
          setLinkedPartnerGroup(null)
        }
      }
    } catch (err) {
      console.error('Error fetching unit data:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUnit = async () => {
    if (!editingUnit) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/units/${editingUnit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newUnit.name,
          unitType: newUnit.unitType,
          area: newUnit.area,
          floor: newUnit.floor,
          building: newUnit.building,
          totalPrice: parseFloat(newUnit.totalPrice) || 0,
          status: newUnit.status,
          notes: newUnit.notes
        })
      })

      const data = await response.json()

      if (data.success) {
        addNotification({
          type: 'success',
          title: 'تم التحديث',
          message: 'تم تحديث الوحدة بنجاح'
        })
        setShowEditModal(false)
        fetchUnitData(unitId)
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ',
          message: data.error || 'فشل في تحديث الوحدة'
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'حدث خطأ في تحديث الوحدة'
      })
    }
  }

  const handleDeleteUnit = async () => {
    if (!unit) return
    
    if (confirm('هل أنت متأكد من حذف هذه الوحدة نهائياً؟\n\nتحذير: هذا الحذف نهائي ولن يمكن استرداد البيانات!')) {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(`/api/units/${unit.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const data = await response.json()
        
        if (response.ok && data.success) {
          addNotification({
            type: 'success',
            title: 'تم الحذف',
            message: 'تم حذف الوحدة نهائياً من قاعدة البيانات'
          })
          router.push('/units')
        } else {
          addNotification({
            type: 'error',
            title: 'خطأ',
            message: data.error || 'فشل في حذف الوحدة'
          })
        }
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'خطأ',
          message: 'حدث خطأ في حذف الوحدة'
        })
      }
    }
  }

  const handleLinkPartnerGroup = async () => {
    if (!selectedPartnerGroup) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء اختيار مجموعة شركاء'
      })
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/unit-partner-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          unitId: unitId,
          partnerGroupId: selectedPartnerGroup
        })
      })

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'تم الربط',
          message: 'تم ربط الوحدة بمجموعة الشركاء بنجاح'
        })
        setShowPartnersModal(false)
        setSelectedPartnerGroup('')
        // Refresh data
        fetchUnitData(unitId)
      } else {
        const data = await response.json()
        addNotification({
          type: 'error',
          title: 'خطأ في الربط',
          message: data.error || 'فشل في ربط الوحدة بمجموعة الشركاء'
        })
      }
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'خطأ في الربط',
        message: 'فشل في ربط الوحدة بمجموعة الشركاء'
      })
    }
  }

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId)
    return partner ? partner.name : `شريك ${partnerId.slice(-4)}`
  }

  if (loading) {
    return (
      <Layout title="إدارة الوحدة" subtitle="إدارة تفاصيل الوحدة" icon="🏠">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">جاري التحميل...</h2>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !unit) {
    return (
      <Layout title="إدارة الوحدة" subtitle="إدارة تفاصيل الوحدة" icon="🏠">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">خطأ في تحميل الوحدة</h2>
            <p className="text-gray-500 mb-4">{error || 'الوحدة غير موجودة'}</p>
            <ModernButton onClick={() => router.push('/units')}>
              العودة للوحدات
            </ModernButton>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="إدارة الوحدة" subtitle="إدارة تفاصيل الوحدة" icon="🏠">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🏠</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة الوحدة</h1>
              <p className="text-gray-600">{unit.code} - {unit.name || 'بدون اسم'}</p>
            </div>
          </div>
          <div className="flex space-x-3 space-x-reverse">
          <ModernButton variant="secondary" onClick={() => router.push('/units')}>
            العودة للوحدات
          </ModernButton>
            <ModernButton variant="info" onClick={() => setShowPartnersModal(true)}>
              🔗 ربط بمجموعة شركاء
            </ModernButton>
            <ModernButton variant="warning" onClick={() => setShowEditModal(true)}>
              تعديل الوحدة
            </ModernButton>
            <ModernButton variant="danger" onClick={handleDeleteUnit}>
              حذف الوحدة
            </ModernButton>
          </div>
        </div>

        {/* Unit Info */}
        <ModernCard className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">معلومات الوحدة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">كود الوحدة:</span>
                <span className="font-bold text-gray-900">{unit.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">الاسم:</span>
                <span className="font-semibold text-gray-900">{unit.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">النوع:</span>
                <span className="font-semibold text-gray-900">{unit.unitType || '-'}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">المساحة:</span>
                <span className="font-semibold text-gray-900">{unit.area || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">الطابق:</span>
                <span className="font-semibold text-gray-900">{unit.floor || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">المبنى:</span>
                <span className="font-semibold text-gray-900">{unit.building || '-'}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">السعر الإجمالي:</span>
                <span className="font-bold text-green-600">
                  {unit.totalPrice ? `${unit.totalPrice.toLocaleString()} جنيه` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">الحالة:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  unit.status === 'متاحة' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {unit.status || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">تاريخ الإنشاء:</span>
                <span className="font-semibold text-gray-900">
                  {unit.createdAt ? new Date(unit.createdAt).toLocaleDateString('ar-EG') : '-'}
                </span>
              </div>
            </div>
          </div>
          
          {unit.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">الملاحظات</h4>
              <p className="text-gray-600 leading-relaxed">{unit.notes}</p>
            </div>
          )}
          </ModernCard>

        {/* Partners Section */}
          <ModernCard>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">مجموعة الشركاء المرتبطة</h3>
            <div className="flex items-center space-x-4 space-x-reverse">
              {linkedPartnerGroup && (
                <div className="text-sm text-gray-600">
                  المجموعة: {linkedPartnerGroup.partnerGroup?.name}
                </div>
              )}
              <ModernButton 
                size="sm" 
                onClick={() => setShowPartnersModal(true)}
              >
                {linkedPartnerGroup ? 'تغيير المجموعة' : '🔗 ربط بمجموعة شركاء'}
              </ModernButton>
            </div>
          </div>
          
            {linkedPartnerGroup ? (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">👥</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{linkedPartnerGroup.partnerGroup?.name}</h4>
                    <p className="text-sm text-gray-600">مجموعة الشركاء المرتبطة</p>
                    {linkedPartnerGroup.partnerGroup?.notes && (
                      <p className="text-sm text-gray-500 mt-1">{linkedPartnerGroup.partnerGroup.notes}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {unitPartners.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">الشركاء في هذه المجموعة</h4>
                  <div className="space-y-3">
                    {unitPartners.map((unitPartner) => (
                      <div key={unitPartner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xs">
                              {getPartnerName(unitPartner.partnerId).charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{getPartnerName(unitPartner.partnerId)}</span>
                        </div>
                        <span className="text-blue-600 font-bold">{unitPartner.percentage}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">إجمالي النسب:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {unitPartners.reduce((sum, up) => sum + up.percentage, 0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد مجموعة شركاء مرتبطة</h3>
              <p className="text-gray-500 mb-6">اربط هذه الوحدة بمجموعة شركاء لإدارة الملكية</p>
              <ModernButton onClick={() => setShowPartnersModal(true)}>
                🔗 ربط بمجموعة شركاء
              </ModernButton>
            </div>
            )}
          </ModernCard>
        </div>

      {/* Edit Unit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">تعديل الوحدة</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
                  <input
                    type="text"
                    value={newUnit.name}
                    onChange={(e) => setNewUnit({...newUnit, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع الوحدة</label>
                  <select
                    value={newUnit.unitType}
                    onChange={(e) => setNewUnit({...newUnit, unitType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="سكني">سكني</option>
                    <option value="تجاري">تجاري</option>
                    <option value="إداري">إداري</option>
                    <option value="مكتب">مكتب</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المساحة</label>
                  <input
                    type="text"
                    value={newUnit.area}
                    onChange={(e) => setNewUnit({...newUnit, area: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الطابق</label>
                  <input
                    type="text"
                    value={newUnit.floor}
                    onChange={(e) => setNewUnit({...newUnit, floor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المبنى</label>
                  <input
                    type="text"
                    value={newUnit.building}
                    onChange={(e) => setNewUnit({...newUnit, building: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">السعر الإجمالي</label>
                  <input
                    type="number"
                    value={newUnit.totalPrice}
                    onChange={(e) => setNewUnit({...newUnit, totalPrice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                  <select
                    value={newUnit.status}
                    onChange={(e) => setNewUnit({...newUnit, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="متاحة">متاحة</option>
                    <option value="محجوزة">محجوزة</option>
                    <option value="مباعة">مباعة</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">الملاحظات</label>
                  <textarea
                    value={newUnit.notes}
                    onChange={(e) => setNewUnit({...newUnit, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 space-x-reverse pt-6">
            <ModernButton 
                  variant="secondary"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  إلغاء
            </ModernButton>
            <ModernButton 
                  onClick={handleUpdateUnit}
                  className="flex-1"
                >
                  حفظ التغييرات
            </ModernButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Partners Management Modal */}
      {showPartnersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">إدارة شركاء الوحدة</h3>
                <button
                  onClick={() => setShowPartnersModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔗</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">ربط بمجموعة شركاء</h3>
                <p className="text-gray-500 mb-6">اختر مجموعة الشركاء التي تريد ربطها بهذه الوحدة</p>
                <div className="space-y-4">
                  <select 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedPartnerGroup}
                    onChange={(e) => setSelectedPartnerGroup(e.target.value)}
                  >
                    <option value="">اختر مجموعة شركاء...</option>
                    {partnerGroups.map((group: unknown) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex space-x-3 space-x-reverse">
              <ModernButton 
                variant="secondary"
                      onClick={() => setShowPartnersModal(false)}
                      className="flex-1"
                    >
                      إلغاء
                    </ModernButton>
                    <ModernButton
                      onClick={handleLinkPartnerGroup}
                      className="flex-1"
                    >
                      ربط المجموعة
                    </ModernButton>
                  </div>
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
    </Layout>
  )
}