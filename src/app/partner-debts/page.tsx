'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PartnerDebt, Partner } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'

export default function PartnerDebts() {
  const [partnerDebts, setPartnerDebts] = useState<PartnerDebt[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [deletingDebts, setDeletingDebts] = useState<Set<string>>(new Set())
  const [newDebt, setNewDebt] = useState({
    partnerId: '',
    amount: '',
    dueDate: '',
    notes: ''
  })
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
      
      // Fetch partner debts
      const debtsResponse = await fetch('/api/partner-debts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const debtsData = await debtsResponse.json()
      if (debtsData.success) {
        setPartnerDebts(debtsData.data)
      } else {
        setError(debtsData.error || 'خطأ في تحميل ديون الشركاء')
      }

      // Fetch partners
      const partnersResponse = await fetch('/api/partners', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const partnersData = await partnersResponse.json()
      if (partnersData.success) {
        setPartners(partnersData.data)
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/partner-debts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newDebt,
          amount: parseFloat(newDebt.amount)
        })
      })

      const data = await response.json()
      if (data.success) {
        setPartnerDebts([...partnerDebts, data.data])
        setNewDebt({
          partnerId: '',
          amount: '',
          dueDate: '',
          notes: ''
        })
        setShowAddForm(false)
        addNotification({
          type: 'success',
          title: 'تم الحفظ بنجاح',
          message: 'تم إضافة دين الشريك بنجاح'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في الحفظ',
          message: data.error || 'فشل في إضافة دين الشريك'
        })
      }
    } catch (err) {
      console.error('Error adding debt:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'فشل في إضافة دين الشريك'
      })
    }
  }

  const handlePayDebt = async (debtId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/partner-debts/${debtId}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        fetchData() // Refresh data
        addNotification({
          type: 'success',
          title: 'تم السداد بنجاح',
          message: 'تم تسجيل سداد الدين بنجاح'
        })
      } else {
        addNotification({
          type: 'error',
          title: 'خطأ في السداد',
          message: data.error || 'فشل في تسجيل السداد'
        })
      }
    } catch (err) {
      console.error('Error paying debt:', err)
      addNotification({
        type: 'error',
        title: 'خطأ في السداد',
        message: 'فشل في تسجيل السداد'
      })
    }
  }

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId)
    return partner ? partner.name : 'شريك محذوف'
  }

  if (loading) {
    return (
      <div className="container">
        <div className="panel">
          <h2>جاري التحميل...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo">💰</div>
          <h1>ديون الشركاء</h1>
        </div>
        <div className="tools">
          <button className="btn primary" onClick={() => setShowAddForm(true)}>
            إضافة دين جديد
          </button>
          <button className="btn secondary" onClick={() => router.push('/partners')}>
            الشركاء
          </button>
          <button className="btn secondary" onClick={() => router.push('/')}>
            العودة للرئيسية
          </button>
        </div>
      </div>

      <div className="main-layout">
        <div className="sidebar">
          <button className="tab" onClick={() => router.push('/')}>لوحة التحكم</button>
          <button className="tab" onClick={() => router.push('/customers')}>العملاء</button>
          <button className="tab" onClick={() => router.push('/units')}>الوحدات</button>
          <button className="tab" onClick={() => router.push('/contracts')}>العقود</button>
          <button className="tab" onClick={() => router.push('/brokers')}>السماسرة</button>
          <button className="tab" onClick={() => router.push('/installments')}>الأقساط</button>
          <button className="tab" onClick={() => router.push('/vouchers')}>السندات</button>
          <button className="tab" onClick={() => router.push('/partners')}>الشركاء</button>
          <button className="tab" onClick={() => router.push('/partner-groups')}>مجموعات الشركاء</button>
          <button className="tab active">ديون الشركاء</button>
          <button className="tab" onClick={() => router.push('/treasury')}>الخزينة</button>
          <button className="tab" onClick={() => router.push('/reports')}>التقارير</button>
          <button className="tab" onClick={() => router.push('/backup')}>نسخة احتياطية</button>
        </div>

        <div className="content">
          {showAddForm && (
            <div className="panel" style={{ marginBottom: '20px' }}>
              <h2>إضافة دين شريك جديد</h2>
              <form onSubmit={handleAddDebt}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">الشريك</label>
                    <select
                      className="form-select"
                      value={newDebt.partnerId}
                      onChange={(e) => setNewDebt({...newDebt, partnerId: e.target.value})}
                      required
                    >
                      <option value="">اختر الشريك</option>
                      {partners.map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">المبلغ</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newDebt.amount}
                      onChange={(e) => setNewDebt({...newDebt, amount: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">تاريخ الاستحقاق</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newDebt.dueDate}
                      onChange={(e) => setNewDebt({...newDebt, dueDate: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">ملاحظات</label>
                    <textarea
                      className="form-textarea"
                      value={newDebt.notes}
                      onChange={(e) => setNewDebt({...newDebt, notes: e.target.value})}
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn primary">
                    إضافة الدين
                  </button>
                  <button type="button" className="btn secondary" onClick={() => setShowAddForm(false)}>
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="panel">
            <h2>قائمة ديون الشركاء</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="البحث في ديون الشركاء..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ width: '300px' }}
              />
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>الشريك</th>
                    <th>المبلغ</th>
                    <th>تاريخ الاستحقاق</th>
                    <th>الحالة</th>
                    <th>ملاحظات</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {partnerDebts.filter(debt => 
                    search === '' || 
                    getPartnerName(debt.partnerId).toLowerCase().includes(search.toLowerCase()) ||
                    debt.status.toLowerCase().includes(search.toLowerCase())
                  ).map((debt) => (
                    <tr key={debt.id}>
                      <td>{getPartnerName(debt.partnerId)}</td>
                      <td>{formatCurrency(debt.amount)}</td>
                      <td>{formatDate(debt.dueDate)}</td>
                      <td>
                        <span className={`badge ${debt.status === 'مدفوع' ? 'ok' : 'warn'}`}>
                          {debt.status}
                        </span>
                      </td>
                      <td>{debt.notes || '-'}</td>
                      <td>{debt.createdAt ? formatDate(debt.createdAt) : '-'}</td>
                      <td>
                        {debt.status !== 'مدفوع' && (
                          <button
                            className="btn ok"
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                            onClick={() => handlePayDebt(debt.id)}
                          >
                            تسجيل السداد
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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