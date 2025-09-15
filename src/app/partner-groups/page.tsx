'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PartnerGroup, Partner } from '@/types'
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

export default function PartnerGroups() {
  const [partnerGroups, setPartnerGroups] = useState<PartnerGroup[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: '', notes: '' })
  const [selectedGroup, setSelectedGroup] = useState<PartnerGroup | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [deletingGroups, setDeletingGroups] = useState<Set<string>>(new Set())
  const router = useRouter()
  const { notifications, addNotification, removeNotification } = useNotifications()

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
      setLoading(true)
      const token = localStorage.getItem('authToken')
      
      // Fetch partner groups
      const groupsResponse = await fetch('/api/partner-groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const groupsData = await groupsResponse.json()
      
      if (groupsResponse.ok) {
        setPartnerGroups(Array.isArray(groupsData) ? groupsData : groupsData.data || [])
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في التحميل',
          message: groupsData.error || 'فشل في تحميل مجموعات الشركاء'
        })
      }

      // Fetch partners
      const partnersResponse = await fetch('/api/partners', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const partnersData = await partnersResponse.json()
      
      if (partnersResponse.ok) {
        setPartners(Array.isArray(partnersData) ? partnersData : partnersData.data || [])
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في التحميل',
          message: partnersData.error || 'فشل في تحميل الشركاء'
        })
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في التحميل',
        message: 'فشل في تحميل البيانات'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddGroup = async () => {
    if (!newGroup.name.trim()) {
      addNotification({
        type: 'error',
        title: 'خطأ في البيانات',
        message: 'الرجاء إدخال اسم المجموعة'
      })
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/partner-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newGroup)
      })

      const data = await response.json()
      if (response.ok && data.success) {
        setPartnerGroups([...partnerGroups, data.data])
        setNewGroup({ name: '', notes: '' })
        setShowAddForm(false)
        addNotification({
          type: 'success',
          title: 'تم الحفظ بنجاح',
          message: 'تم إنشاء مجموعة الشركاء بنجاح'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في الحفظ',
          message: data.error || 'فشل في إنشاء المجموعة'
        })
      }
    } catch (err) {
      console.error('Error adding group:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في إنشاء المجموعة'
      })
    }
  }

  const handleAddPartnerToGroup = async (groupId: string, partnerId: string, percent: number) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/partner-groups/${groupId}/partners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ partnerId, percent })
      })

      const data = await response.json()
      if (response.ok && data.success) {
        // Refresh the selected group details
        if (selectedGroup?.id === groupId) {
          fetchGroupDetails(groupId)
        }
        addNotification({
          type: 'success',
          title: 'تم الحفظ بنجاح',
          message: 'تم إضافة الشريك للمجموعة بنجاح'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في الحفظ',
          message: data.error || 'فشل في إضافة الشريك'
        })
      }
    } catch (err) {
      console.error('Error adding partner to group:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في إضافة الشريك'
      })
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المجموعة؟')) {
      try {
        setDeletingGroups(prev => new Set(prev).add(groupId))
        const token = localStorage.getItem('authToken')
        const response = await fetch(`/api/partner-groups/${groupId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          setPartnerGroups(partnerGroups.filter(g => g.id !== groupId))
          if (selectedGroup?.id === groupId) {
            setSelectedGroup(null)
          }
          addNotification({
            type: 'success',
            title: 'تم الحذف',
            message: 'تم حذف مجموعة الشركاء بنجاح'
          })
        } else {
          addNotification({
            type: 'error',
            title: 'خطأ في الحذف',
            message: 'فشل في حذف المجموعة'
          })
        }
      } catch (err) {
        addNotification({
          type: 'error',
          title: 'خطأ في الحذف',
          message: 'فشل في حذف المجموعة'
        })
      } finally {
        setDeletingGroups(prev => {
          const newSet = new Set(prev)
          newSet.delete(groupId)
          return newSet
        })
      }
    }
  }

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId)
    return partner ? partner.name : 'شريك محذوف'
  }

  const getTotalPercent = (group: PartnerGroup) => {
    return group.partners?.reduce((sum: number, p: unknown) => sum + p.percentage, 0) || 0
  }

  const fetchGroupDetails = async (groupId: string) => {
    try {
      setLoadingDetails(true)
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/partner-groups/${groupId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const groupDetails = await response.json()
        setSelectedGroup(groupDetails)
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في التحميل',
          message: 'فشل في تحميل تفاصيل المجموعة'
        })
      }
    } catch (err) {
      console.error('Error fetching group details:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في التحميل',
        message: 'فشل في تحميل تفاصيل المجموعة'
      })
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleToggleGroupDetails = (group: PartnerGroup) => {
    if (selectedGroup?.id === group.id) {
      setSelectedGroup(null)
    } else {
      // Always fetch details to get fresh data
      fetchGroupDetails(group.id)
    }
  }

  if (loading) {
    return (
      <Layout title="مجموعات الشركاء" subtitle="إدارة مجموعات الشركاء" icon="👥">
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
    <Layout title="مجموعات الشركاء" subtitle="إدارة مجموعات الشركاء" icon="👥">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">👥</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">مجموعات الشركاء</h1>
              <p className="text-gray-600">إدارة مجموعات الشركاء وربطها بالوحدات</p>
            </div>
          </div>
          <div className="flex space-x-3 space-x-reverse">
            <ModernButton variant="secondary" onClick={() => router.push('/partners')}>
              الشركاء
            </ModernButton>
            <ModernButton variant="secondary" onClick={() => router.push('/units')}>
              الوحدات
            </ModernButton>
            <ModernButton onClick={() => setShowAddForm(true)}>
              ➕ إضافة مجموعة جديدة
            </ModernButton>
          </div>
        </div>

        {/* Add New Group Form */}
        {showAddForm && (
          <ModernCard className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">إضافة مجموعة شركاء جديدة</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المجموعة</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="مثال: مستثمرو المرحلة الأولى"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ملاحظات اختيارية"
                  value={newGroup.notes}
                  onChange={(e) => setNewGroup({...newGroup, notes: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 space-x-reverse">
              <ModernButton variant="secondary" onClick={() => setShowAddForm(false)}>
                إلغاء
              </ModernButton>
              <ModernButton onClick={handleAddGroup}>
                إضافة المجموعة
              </ModernButton>
            </div>
          </ModernCard>
        )}

        {/* Partner Groups List */}
        <ModernCard>
          <h3 className="text-xl font-bold text-gray-900 mb-6">قائمة مجموعات الشركاء</h3>
          {partnerGroups.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد مجموعات شركاء</h3>
              <p className="text-gray-500 mb-6">ابدأ بإنشاء مجموعة شركاء جديدة</p>
              <ModernButton onClick={() => setShowAddForm(true)}>
                إضافة مجموعة جديدة
              </ModernButton>
            </div>
          ) : (
            <div className="space-y-6">
              {partnerGroups.map(group => {
                const totalPercent = getTotalPercent(group)
                return (
                  <div key={group.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {group.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{group.name}</h4>
                          {group.notes && (
                            <p className="text-sm text-gray-600">{group.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          totalPercent === 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {totalPercent}%
                        </span>
                        <ModernButton 
                          size="sm" 
                          variant="info"
                          onClick={() => handleToggleGroupDetails(group)}
                          disabled={loadingDetails}
                        >
                          {loadingDetails ? 'جاري التحميل...' : selectedGroup?.id === group.id ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                        </ModernButton>
                        <ModernButton 
                          size="sm" 
                          variant="danger"
                          onClick={() => handleDeleteGroup(group.id)}
                          disabled={deletingGroups.has(group.id)}
                        >
                          {deletingGroups.has(group.id) ? 'جاري الحذف...' : 'حذف'}
                        </ModernButton>
                      </div>
                    </div>
                    
                    {selectedGroup?.id === group.id && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4">الشركاء في هذه المجموعة</h5>
                        {!selectedGroup?.partners || selectedGroup.partners.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-400 text-4xl mb-2">👤</div>
                            <p className="text-gray-600">لا يوجد شركاء في هذه المجموعة</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedGroup.partners.map((partner: unknown, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-900">{partner.partner?.name || getPartnerName(partner.partnerId)}</span>
                                <span className="text-blue-600 font-bold">{partner.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-6">
                          <h5 className="text-lg font-semibold text-gray-900 mb-4">إضافة شريك جديد</h5>
                          <AddPartnerToGroupForm 
                            groupId={group.id}
                            partners={partners}
                            onAdd={handleAddPartnerToGroup}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ModernCard>
      </div>
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </Layout>
  )
}

function AddPartnerToGroupForm({ groupId, partners, onAdd }: {
  groupId: string
  partners: Partner[]
  onAdd: (groupId: string, partnerId: string, percent: number) => void
}) {
  const [selectedPartner, setSelectedPartner] = useState('')
  const [percent, setPercent] = useState('')

  const handleSubmit = () => {
    const percentNum = parseFloat(percent)
    if (!selectedPartner || !percentNum || percentNum <= 0) {
      alert('الرجاء اختيار شريك وإدخال نسبة صحيحة')
      return
    }
    
    onAdd(groupId, selectedPartner, percentNum)
    setSelectedPartner('')
    setPercent('')
  }

  return (
    <div className="flex space-x-3 space-x-reverse">
      <select 
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={selectedPartner}
        onChange={(e) => setSelectedPartner(e.target.value)}
      >
        <option value="">اختر شريك...</option>
        {partners.map(partner => (
          <option key={partner.id} value={partner.id}>
            {partner.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="النسبة %"
        value={percent}
        onChange={(e) => setPercent(e.target.value)}
        min="0.1"
        max="100"
        step="0.1"
      />
      <ModernButton size="sm" onClick={handleSubmit}>
        إضافة
      </ModernButton>
    </div>
  )
}