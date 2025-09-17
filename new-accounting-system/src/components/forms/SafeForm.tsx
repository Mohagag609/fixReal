'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

const safeSchema = z.object({
  name: z.string().min(1, 'اسم الخزينة مطلوب'),
  balance: z.number().min(0, 'الرصيد يجب أن يكون أكبر من أو يساوي صفر'),
})

type SafeFormData = z.infer<typeof safeSchema>

interface Safe {
  id: string
  name: string
  balance: number
  createdAt: string
  vouchers: Array<{
    id: string
    type: string
    amount: number
    date: string
  }>
  transfersFrom: Array<{
    id: string
    amount: number
    toSafe: { name: string }
  }>
  transfersTo: Array<{
    id: string
    amount: number
    fromSafe: { name: string }
  }>
}

interface SafeFormProps {
  safe?: Safe | null
  onSave: (data: SafeFormData) => void
  onCancel: () => void
}

export function SafeForm({ safe, onSave, onCancel }: SafeFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SafeFormData>({
    resolver: zodResolver(safeSchema),
    defaultValues: {
      name: '',
      balance: 0,
    },
  })

  useEffect(() => {
    if (safe) {
      reset({
        name: safe.name,
        balance: safe.balance,
      })
    }
  }, [safe, reset])

  const onSubmit = async (data: SafeFormData) => {
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
          <CardTitle className="text-lg">معلومات الخزينة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="اسم الخزينة *"
            {...register('name')}
            error={errors.name?.message}
            placeholder="أدخل اسم الخزينة"
          />

          <Input
            label="الرصيد الابتدائي"
            type="number"
            {...register('balance', { valueAsNumber: true })}
            error={errors.balance?.message}
            placeholder="أدخل الرصيد الابتدائي"
          />

          {safe && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">معلومات إضافية</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">عدد الشيكات:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {safe.vouchers?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">التحويلات الصادرة:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {safe.transfersFrom?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">التحويلات الواردة:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {safe.transfersTo?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">تاريخ الإنشاء:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {new Date(safe.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
          {safe ? 'تحديث' : 'إنشاء'}
        </Button>
      </div>
    </form>
  )
}