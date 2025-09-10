'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Unit, UnitPartner, Partner } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
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

export default function UnitManagement() {
  const [unit, setUnit] = useState<Unit | null>(null)
  const [unitPartners, setUnitPartners] = useState<UnitPartner[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const router = useRouter()
  const params = useParams()
  const { notifications, addNotification, removeNotification } = useNotifications()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    
    if (params.id) {
      fetchUnitData(params.id as string)
    }
  }, [params.id])

  const fetchUnitData = async (unitId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      
      const [unitResponse, unitPartnersResponse, partnersResponse] = await Promise.all([
        fetch(`/api/units/${unitId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/unit-partners', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/partners', { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      
      const [unitData, unitPartnersData, partnersData] = await Promise.all([
        unitResponse.json(),
        unitPartnersResponse.json(),
        partnersResponse.json()
      ])
      
      if (unitData.success) {
        setUnit(unitData.data)
      } else {
        setError(unitData.error || 'خطأ في تحميل الوحدة')
      }

      if (unitPartnersData.success) {
        const filteredPartners = unitPartnersData.data.filter((up: UnitPartner) => up.unitId === unitId)
        setUnitPartners(filteredPartners)
      }

      if (partnersData.success) {
        setPartners(partnersData.data)
      }
    } catch (err) {
      console.error('Error fetching unit data:', err)
      setError('خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId)
    return partner ? partner.name : `شريك ${partnerId.slice(-4)}`
  }

  const calculateRemainingAmount = (unit: Unit) => {
    // حساب المبلغ المتبقي بناءً على العقود والمدفوعات
    return unit.totalPrice
  }

  if (loading) {
    return (
      <Layout title="إدارة الوحدة" subtitle="إدارة تفاصيل الوحدة والشركاء" icon="🏠">
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
      <Layout title="إدارة الوحدة" subtitle="إدارة تفاصيل الوحدة والشركاء" icon="🏠">
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
    <Layout title="إدارة الوحدة" subtitle="إدارة تفاصيل الوحدة والشركاء" icon="🏠">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🏠</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة الوحدة: {unit.code}</h1>
              <p className="text-gray-600">{unit.name || 'بدون اسم'}</p>
            </div>
          </div>
          <ModernButton variant="secondary" onClick={() => router.push('/units')}>
            العودة للوحدات
          </ModernButton>
        </div>

        {/* Unit Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ModernCard>
            <h3 className="text-xl font-bold text-gray-900 mb-4">تفاصيل الوحدة</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">كود الوحدة:</span>
                <span className="font-bold text-gray-900 text-lg">{unit.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">الاسم:</span>
                <span className="font-semibold text-gray-900">{unit.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">النوع:</span>
                <span className="font-semibold text-gray-900">{unit.unitType}</span>
              </div>
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
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">السعر الإجمالي:</span>
                <span className="font-bold text-green-800">{formatCurrency(unit.totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">المتبقي:</span>
                <span className="font-bold text-blue-800">{formatCurrency(calculateRemainingAmount(unit))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">الحالة:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  unit.status === 'متاحة' 
                    ? 'bg-green-100 text-green-800' 
                    : unit.status === 'محجوزة'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {unit.status}
                </span>
              </div>
            </div>
          </ModernCard>

          <ModernCard>
            <h3 className="text-xl font-bold text-gray-900 mb-4">الشركاء</h3>
            {unitPartners.length > 0 ? (
              <div className="space-y-3">
                {unitPartners.map((unitPartner) => (
                  <div key={unitPartner.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-semibold text-gray-900">{getPartnerName(unitPartner.partnerId)}</span>
                    <span className="text-blue-600 font-bold">{unitPartner.percentage}%</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">المجموع:</span>
                    <span className="font-bold text-green-600">
                      {unitPartners.reduce((sum, up) => sum + up.percentage, 0)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">👥</div>
                <p className="text-gray-600">لا يوجد شركاء لهذه الوحدة</p>
              </div>
            )}
          </ModernCard>
        </div>

        {/* Actions */}
        <ModernCard>
          <h3 className="text-xl font-bold text-gray-900 mb-4">الإجراءات</h3>
          <div className="flex flex-wrap gap-4">
            <ModernButton 
              variant="warning"
              onClick={() => {
                // العودة لصفحة الوحدات مع فتح modal التعديل
                router.push(`/units?edit=${unit.id}`)
              }}
            >
              ✏️ تعديل الوحدة
            </ModernButton>
            <ModernButton 
              variant="info"
              onClick={() => {
                // الانتقال لصفحة إدارة الشركاء
                router.push(`/units/${unit.id}/partners`)
              }}
            >
              👥 إدارة الشركاء
            </ModernButton>
            <ModernButton 
              variant="success"
              onClick={() => {
                // طباعة تقرير الوحدة
                window.print()
                addNotification({
                  type: 'success',
                  title: 'طباعة التقرير',
                  message: 'تم فتح نافذة الطباعة'
                })
              }}
            >
              📊 تقرير الوحدة
            </ModernButton>
            {unit.status === 'مباعة' && (
              <ModernButton 
                variant="secondary"
                onClick={async () => {
                  if (confirm('هل أنت متأكد من إرجاع هذه الوحدة؟')) {
                    try {
                      const token = localStorage.getItem('authToken')
                      const response = await fetch(`/api/units/${unit.id}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ status: 'متاحة' })
                      })
                      
                      if (response.ok) {
                        addNotification({
                          type: 'success',
                          title: 'تم الإرجاع',
                          message: 'تم إرجاع الوحدة بنجاح'
                        })
                        // إعادة تحميل البيانات
                        fetchUnitData(unit.id)
                      } else {
                        addNotification({
                          type: 'error',
                          title: 'خطأ',
                          message: 'فشل في إرجاع الوحدة'
                        })
                      }
                    } catch (error) {
                      addNotification({
                        type: 'error',
                        title: 'خطأ',
                        message: 'حدث خطأ في إرجاع الوحدة'
                      })
                    }
                  }
                }}
              >
                ↩️ إرجاع الوحدة
              </ModernButton>
            )}
            <ModernButton 
              variant="danger"
              onClick={async () => {
                if (confirm('هل أنت متأكد من حذف هذه الوحدة؟ هذا الإجراء لا يمكن التراجع عنه.')) {
                  try {
                    const token = localStorage.getItem('authToken')
                    const response = await fetch(`/api/units/${unit.id}`, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    })
                    
                    if (response.ok) {
                      addNotification({
                        type: 'success',
                        title: 'تم الحذف',
                        message: 'تم حذف الوحدة بنجاح'
                      })
                      // العودة لصفحة الوحدات
                      setTimeout(() => {
                        router.push('/units')
                      }, 1500)
                    } else {
                      addNotification({
                        type: 'error',
                        title: 'خطأ',
                        message: 'فشل في حذف الوحدة'
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
              }}
            >
              🗑️ حذف الوحدة
            </ModernButton>
          </div>
        </ModernCard>
      </div>
      
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </Layout>
  )
}