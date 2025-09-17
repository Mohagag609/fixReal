'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

const voucherSchema = z.object({
  type: z.enum(['receipt', 'payment'], { message: 'نوع الشيك مطلوب' }),
  date: z.string().min(1, 'التاريخ مطلوب'),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  safeId: z.string().min(1, 'الخزينة مطلوبة'),
  description: z.string().min(1, 'الوصف مطلوب'),
  payer: z.string().optional(),
  beneficiary: z.string().optional(),
  linkedRef: z.string().optional(),
})

type VoucherFormData = z.infer<typeof voucherSchema>

interface Voucher {
  id: string
  type: string
  date: string
  amount: number
  safeId: string
  description: string
  payer?: string
  beneficiary?: string
  linkedRef?: string
  createdAt: string
  safe: {
    name: string
  }
  unit?: {
    code: string
    name?: string
  }
}

interface VoucherFormProps {
  voucher?: Voucher | null
  onSave: (data: VoucherFormData) => void
  onCancel: () => void
}

export function VoucherForm({ voucher, onSave, onCancel }: VoucherFormProps) {
  const [loading, setLoading] = useState(false)
  const [safes, setSafes] = useState<Array<{ id: string; name: string; balance: number }>>([])
  const [units, setUnits] = useState<Array<{ id: string; code: string; name?: string }>>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      type: 'receipt',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      safeId: '',
      description: '',
      payer: '',
      beneficiary: '',
      linkedRef: '',
    },
  })

  const type = watch('type')

  useEffect(() => {
    // Fetch safes and units
    const fetchData = async () => {
      try {
        const [safesRes, unitsRes] = await Promise.all([
          fetch('/api/safes'),
          fetch('/api/units'),
        ])
        
        const safesData = await safesRes.json()
        const unitsData = await unitsRes.json()
        
        setSafes(safesData.data || [])
        setUnits(unitsData.data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (voucher) {
      reset({
        type: voucher.type as 'receipt' | 'payment',
        date: voucher.date.split('T')[0],
        amount: voucher.amount,
        safeId: voucher.safeId,
        description: voucher.description,
        payer: voucher.payer || '',
        beneficiary: voucher.beneficiary || '',
        linkedRef: voucher.linkedRef || '',
      })
    }
  }, [voucher, reset])

  const onSubmit = async (data: VoucherFormData) => {
    try {
      setLoading(true)
      await onSave(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الشيك *
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="receipt">وارد</option>
                <option value="payment">صادر</option>
              </select>
              {errors.type && (
                <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
              )}
            </div>

            <Input
              label="التاريخ *"
              type="date"
              {...register('date')}
              error={errors.date?.message}
            />

            <Input
              label="المبلغ *"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
              placeholder="أدخل المبلغ"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الخزينة *
              </label>
              <select
                {...register('safeId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">اختر الخزينة</option>
                {safes.map((safe) => (
                  <option key={safe.id} value={safe.id}>
                    {safe.name} - الرصيد: {safe.balance.toLocaleString()} ج.م
                  </option>
                ))}
              </select>
              {errors.safeId && (
                <p className="text-sm text-red-600 mt-1">{errors.safeId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">التفاصيل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوصف *
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل وصف الشيك"
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>

            {type === 'receipt' ? (
              <Input
                label="المدفوع منه"
                {...register('payer')}
                error={errors.payer?.message}
                placeholder="أدخل اسم المدفوع منه"
              />
            ) : (
              <Input
                label="المدفوع له"
                {...register('beneficiary')}
                error={errors.beneficiary?.message}
                placeholder="أدخل اسم المدفوع له"
              />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوحدة المرتبطة
              </label>
              <select
                {...register('linkedRef')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">اختر الوحدة (اختياري)</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} - {unit.name || 'غير محدد'}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Actions */}
      <div
        className="flex justify-end space-x-3 space-x-reverse pt-6 border-t border-gray-200"
      >
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
        >
          {voucher ? 'تحديث' : 'إنشاء'}
        </Button>
      </div>
    </form>
  )
}