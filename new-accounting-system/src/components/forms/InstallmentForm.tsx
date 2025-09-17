'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

const installmentSchema = z.object({
  unitId: z.string().min(1, 'الوحدة مطلوبة'),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  dueDate: z.string().min(1, 'تاريخ الاستحقاق مطلوب'),
  status: z.enum(['مدفوع', 'معلق', 'متأخر']),
  notes: z.string().optional(),
})

type InstallmentFormData = z.infer<typeof installmentSchema>

interface Installment {
  id: string
  unitId: string
  amount: number
  dueDate: string
  status: string
  notes?: string
  createdAt: string
  unit: {
    code: string
    name?: string
    totalPrice: number
  }
}

interface InstallmentFormProps {
  installment?: Installment | null
  onSave: (data: InstallmentFormData) => void
  onCancel: () => void
}

export function InstallmentForm({ installment, onSave, onCancel }: InstallmentFormProps) {
  const [loading, setLoading] = useState(false)
  const [units, setUnits] = useState<Array<{ id: string; code: string; name?: string; totalPrice: number }>>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InstallmentFormData>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      unitId: '',
      amount: 0,
      dueDate: '',
      status: 'معلق',
      notes: '',
    },
  })

  useEffect(() => {
    // Fetch units
    const fetchUnits = async () => {
      try {
        const response = await fetch('/api/units')
        const data = await response.json()
        setUnits(data.data || [])
      } catch (error) {
        console.error('Error fetching units:', error)
      }
    }

    fetchUnits()
  }, [])

  useEffect(() => {
    if (installment) {
      reset({
        unitId: installment.unitId,
        amount: installment.amount,
        dueDate: installment.dueDate.split('T')[0],
        status: installment.status as 'مدفوع' | 'معلق' | 'متأخر',
        notes: installment.notes || '',
      })
    }
  }, [installment, reset])

  const onSubmit = async (data: InstallmentFormData) => {
    try {
      setLoading(true)
      await onSave(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">معلومات القسط</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الوحدة *
            </label>
            <select
              {...register('unitId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر الوحدة</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.code} - {unit.name || 'غير محدد'} - {unit.totalPrice.toLocaleString()} ج.م
                </option>
              ))}
            </select>
            {errors.unitId && (
              <p className="text-sm text-red-600 mt-1">{errors.unitId.message}</p>
            )}
          </div>

          <Input
            label="مبلغ القسط *"
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            error={errors.amount?.message}
            placeholder="أدخل مبلغ القسط"
          />

          <Input
            label="تاريخ الاستحقاق *"
            type="date"
            {...register('dueDate')}
            error={errors.dueDate?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحالة
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="معلق">معلق</option>
              <option value="مدفوع">مدفوع</option>
              <option value="متأخر">متأخر</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أدخل أي ملاحظات إضافية"
            />
          </div>

          {installment && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">معلومات إضافية</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">الوحدة:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {installment.unit.code}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">سعر الوحدة:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {installment.unit.totalPrice.toLocaleString()} ج.م
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">تاريخ الإنشاء:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {new Date(installment.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">الحالة الحالية:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {installment.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
          {installment ? 'تحديث' : 'إنشاء'}
        </Button>
      </motion.div>
    </form>
  )
}