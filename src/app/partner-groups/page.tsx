'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'

interface PartnerGroup {
  id: string
  name: string
  partners: Array<{
    partnerId: string
    percent: number
  }>
  notes?: string
  createdAt?: string
  updatedAt?: string
}

interface Partner {
  id: string
  name: string
  phone?: string
  notes?: string
}

export default function PartnerGroups() {
  const [partnerGroups, setPartnerGroups] = useState<PartnerGroup[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: '', notes: '' })
  const [selectedGroup, setSelectedGroup] = useState<PartnerGroup | null>(null)
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
      const token = localStorage.getItem('authToken')
      
      // Fetch partner groups
      const groupsResponse = await fetch('/api/partner-groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const groupsData = await groupsResponse.json()
      setPartnerGroups(groupsData.data || [])

      // Fetch partners
      const partnersResponse = await fetch('/api/partners', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const partnersData = await partnersResponse.json()
      setPartners(partnersData.data || [])

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
      if (data.success) {
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
      if (data.success) {
        fetchData() // Refresh data
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

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId)
    return partner ? partner.name : 'شريك محذوف'
  }

  const getTotalPercent = (group: PartnerGroup) => {
    return group.partners.reduce((sum, p) => sum + p.percent, 0)
  }

  if (loading) {
    return (
      <div className="container">
        <div className="panel loading">
          <h2>جاري التحميل...</h2>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            marginTop: '20px',
            fontSize: '24px'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid rgba(59, 130, 246, 0.3)',
              borderTop: '4px solid rgb(59, 130, 246)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container fade-in">
      <div className="header slide-in">
        <div className="brand">
          <div className="logo">🏛️</div>
          <h1>مجموعات الشركاء</h1>
        </div>
        <div className="tools">
          <button className="btn secondary" onClick={() => router.push('/partners')}>
            الشركاء
          </button>
          <button className="btn secondary" onClick={() => router.push('/units')}>
            الوحدات
          </button>
          <button className="btn secondary" onClick={() => router.push('/contracts')}>
            العقود
          </button>
          <button className="btn secondary" onClick={() => router.push('/reports')}>
            التقارير
          </button>
          <button className="btn warn" onClick={() => {
            localStorage.removeItem('authToken')
            router.push('/login')
          }}>
            تسجيل الخروج
          </button>
        </div>
      </div>

      <div className="main-layout">
        <div className="sidebar slide-in">
          <button className="tab" onClick={() => router.push('/')}>لوحة التحكم</button>
          <button className="tab" onClick={() => router.push('/customers')}>العملاء</button>
          <button className="tab" onClick={() => router.push('/units')}>الوحدات</button>
          <button className="tab" onClick={() => router.push('/contracts')}>العقود</button>
          <button className="tab" onClick={() => router.push('/brokers')}>السماسرة</button>
          <button className="tab" onClick={() => router.push('/installments')}>الأقساط</button>
          <button className="tab" onClick={() => router.push('/vouchers')}>السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab" onClick={() => router.push('/partner-debts')}>ديون الشركاء</button>
          <button className="tab active">مجموعات الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content slide-in">
          {/* Add New Group Form */}
          <div className="panel">
            <h2>إضافة مجموعة شركاء جديدة</h2>
            <div className="grid-2" style={{ gap: '16px' }}>
              <div>
                <label className="form-label">اسم المجموعة</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="مثال: مستثمرو المرحلة الأولى"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                />
              </div>
              <div>
                <label className="form-label">ملاحظات</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ملاحظات اختيارية"
                  value={newGroup.notes}
                  onChange={(e) => setNewGroup({...newGroup, notes: e.target.value})}
                />
              </div>
            </div>
            <div className="tools">
              <button className="btn" onClick={handleAddGroup}>
                إضافة المجموعة
              </button>
            </div>
          </div>

          {/* Partner Groups List */}
          <div className="panel">
            <h2>قائمة مجموعات الشركاء</h2>
            {partnerGroups.length === 0 ? (
              <p>لا توجد مجموعات شركاء</p>
            ) : (
              <div className="grid" style={{ gap: '16px' }}>
                {partnerGroups.map(group => {
                  const totalPercent = getTotalPercent(group)
                  return (
                    <div key={group.id} className="card slide-in">
                      <div className="header" style={{ justifyContent: 'space-between' }}>
                        <h3>{group.name}</h3>
                        <div className="tools">
                          <span className={`badge ${totalPercent === 100 ? 'ok' : 'warn'}`}>
                            {totalPercent}%
                          </span>
                          <button 
                            className="btn secondary" 
                            onClick={() => setSelectedGroup(selectedGroup?.id === group.id ? null : group)}
                          >
                            {selectedGroup?.id === group.id ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                          </button>
                        </div>
                      </div>
                      
                      {group.notes && (
                        <p style={{ color: 'var(--muted)', marginTop: '8px' }}>
                          {group.notes}
                        </p>
                      )}

                      {selectedGroup?.id === group.id && (
                        <div style={{ marginTop: '16px' }}>
                          <h4>الشركاء في هذه المجموعة</h4>
                          {group.partners.length === 0 ? (
                            <p>لا يوجد شركاء في هذه المجموعة</p>
                          ) : (
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>اسم الشريك</th>
                                  <th>النسبة</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.partners.map((partner, index) => (
                                  <tr key={index}>
                                    <td>{getPartnerName(partner.partnerId)}</td>
                                    <td>{partner.percent}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}

                          <div style={{ marginTop: '16px' }}>
                            <h4>إضافة شريك جديد</h4>
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
          </div>
        </div>
      </div>
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
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
    <div className="tools">
      <select 
        className="form-select"
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
        className="form-input"
        placeholder="النسبة %"
        value={percent}
        onChange={(e) => setPercent(e.target.value)}
        min="0.1"
        max="100"
        step="0.1"
      />
      <button className="btn" onClick={handleSubmit}>
        إضافة
      </button>
    </div>
  )
}