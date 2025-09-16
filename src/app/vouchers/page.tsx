'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Voucher } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatting'
import { NotificationSystem, useNotifications } from '@/components/NotificationSystem'
import ModernCard from '@/components/ui/ModernCard'
import ModernButton from '@/components/ui/ModernButton'

export default function Vouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  
  const router = useRouter()
  const { addNotification } = useNotifications()

  // Fetch vouchers
  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vouchers')
      const data = await response.json()
      
      if (data.success) {
        setVouchers(data.data)
      } else {
        setError(data.error || 'فشل في تحميل السندات')
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  // Delete voucher
  const handleDeleteVoucher = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السند؟')) return

    try {
      const response = await fetch(`/api/vouchers/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setVouchers(vouchers.filter(v => v.id !== id))
        addNotification('تم حذف السند بنجاح')
      } else {
        addNotification(data.error || 'فشل في حذف السند')
      }
    } catch (err) {
      addNotification('خطأ في الاتصال بالخادم')
    }
  }

  // Filter vouchers
  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = voucher.description?.toLowerCase().includes(search.toLowerCase()) ||
                         voucher.id?.toLowerCase().includes(search.toLowerCase())
    const matchesType = !typeFilter || voucher.type === typeFilter
    return matchesSearch && matchesType
  })

  useEffect(() => {
    fetchVouchers()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <NotificationSystem notifications={[]} onRemove={() => {}} />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">إدارة السندات</h1>
              <p className="text-gray-600">إدارة جميع السندات المالية في النظام</p>
            </div>
            <div className="flex gap-3">
              <ModernButton variant="secondary" onClick={() => router.push('/treasury')}>
                العودة للخزينة
              </ModernButton>
              <ModernButton variant="secondary" onClick={() => router.push('/')}>
                الرئيسية
              </ModernButton>
            </div>
          </div>
        </div>

        {/* Filters */}
        <ModernCard className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">البحث</label>
              <input
                type="text"
                placeholder="ابحث في السندات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع السند</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">جميع الأنواع</option>
                <option value="receipt">إيصال استلام</option>
                <option value="payment">إيصال دفع</option>
                <option value="transfer">تحويل</option>
              </select>
            </div>
            <div className="flex items-end">
              <ModernButton variant="secondary" size="sm">
                تصفية
              </ModernButton>
              <ModernButton variant="secondary" size="sm">
                إعادة تعيين
              </ModernButton>
            </div>
          </div>
        </ModernCard>

        {/* Vouchers List */}
        <ModernCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 font-medium text-gray-700">رقم السند</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">النوع</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">المبلغ</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">الوصف</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">التاريخ</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      {voucher.id || 'غير محدد'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        voucher.type === 'receipt' 
                          ? 'bg-green-100 text-green-800' 
                          : voucher.type === 'payment'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {voucher.type === 'receipt' ? 'إيصال استلام' : 
                         voucher.type === 'payment' ? 'إيصال دفع' : 'تحويل'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">
                      {formatCurrency(voucher.amount)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {voucher.description || 'لا يوجد وصف'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(voucher.date)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <ModernButton size="sm" variant="secondary">
                          عرض
                        </ModernButton>
                        <ModernButton size="sm" variant="danger" onClick={() => handleDeleteVoucher(voucher.id)}>
                          حذف
                        </ModernButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredVouchers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                لا توجد سندات مطابقة للبحث
              </div>
            )}
          </div>
        </ModernCard>
      </div>
    </div>
  )
}