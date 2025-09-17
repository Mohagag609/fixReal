'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

const transferSchema = z.object({
  fromSafeId: z.string().min(1, 'الخزينة المصدر مطلوبة'),
  toSafeId: z.string().min(1, 'الخزينة الوجهة مطلوبة'),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  description: z.string().optional(),
})

type TransferFormData = z.infer<typeof transferSchema>

interface Transfer {
  id: string
  fromSafeId: string
  toSafeId: string
  amount: number
  description?: string
  createdAt: string
  fromSafe: {
    name: string
  }
  toSafe: {
    name: string
  }
}

interface Safe {
  id: string
  name: string
  balance: number
}

interface TransferFormProps {
  transfer?: Transfer | null
  safes: Safe[]
  onSave: (data: TransferFormData) => void
  onCancel: () => void
}

export function TransferForm({ transfer, safes, onSave, onCancel }: TransferFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromSafeId: '',
      toSafeId: '',
      amount: 0,
      description: '',
    },
  })

  const fromSafeId = watch('fromSafeId')
  const amount = watch('amount')

  useEffect(() => {
    if (transfer) {
      reset({
        fromSafeId: transfer.fromSafeId,
        toSafeId: transfer.toSafeId,
        amount: transfer.amount,
        description: transfer.description || '',
      })
    }
  }, [transfer, reset])

  const onSubmit = async (data: TransferFormData) => {
    try {
      setLoading(true)
      await onSave(data)
    } finally {
      setLoading(false)
    }
  }

  const selectedFromSafe = safes.find(safe => safe.id === fromSafeId)
  const availableSafes = safes.filter(safe => safe.id !== fromSafeId)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">معلومات التحويل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              من الخزينة *
            </label>
            <select
              {...register('fromSafeId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر الخزينة المصدر</option>
              {safes.map((safe) => (
                <option key={safe.id} value={safe.id}>
                  {safe.name} - الرصيد: {safe.balance.toLocaleString()} ج.م
                </option>
              ))}
            </select>
            {errors.fromSafeId && (
              <p className="text-sm text-red-600 mt-1">{errors.fromSafeId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              إلى الخزينة *
            </label>
            <select
              {...register('toSafeId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">اختر الخزينة الوجهة</option>
              {availableSafes.map((safe) => (
                <option key={safe.id} value={safe.id}>
                  {safe.name} - الرصيد: {safe.balance.toLocaleString()} ج.م
                </option>
              ))}
            </select>
            {errors.toSafeId && (
              <p className="text-sm text-red-600 mt-1">{errors.toSafeId.message}</p>
            )}
          </div>

          <Input
            label="المبلغ *"
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            error={errors.amount?.message}
            placeholder="أدخل المبلغ المراد تحويله"
          />

          {selectedFromSafe && amount > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">الرصيد المتاح: {selectedFromSafe.balance.toLocaleString()} ج.م</p>
                  <p className="text-xs mt-1">
                    الرصيد بعد التحويل: {(selectedFromSafe.balance - amount).toLocaleString()} ج.م
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الوصف
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أدخل وصف للتحويل (اختياري)"
            />
          </div>

          {transfer && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">معلومات إضافية</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">من:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {transfer.fromSafe.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">إلى:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {transfer.toSafe.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">تاريخ التحويل:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {new Date(transfer.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">المبلغ:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {transfer.amount.toLocaleString()} ج.م
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
          {transfer ? 'تحديث' : 'تحويل'}
        </Button>
      </div>
    </form>
  )
}