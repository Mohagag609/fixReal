'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

const brokerSchema = z.object({
  name: z.string().min(1, 'اسم الوسيط مطلوب'),
  phone: z.string().optional().or(z.undefined()),
  notes: z.string().optional().or(z.undefined()),
})

type BrokerFormData = z.infer<typeof brokerSchema>

interface Broker {
  id: string
  name: string
  phone?: string
  notes?: string
  createdAt: string
  brokerDues: Array<{
    id: string
    amount: number
    dueDate: string
    status: string
  }>
}

interface BrokerFormProps {
  broker?: Broker | null
  onSave: (data: BrokerFormData) => Promise<void>
  onCancel: () => void
}

export function BrokerForm({ broker, onSave, onCancel }: BrokerFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BrokerFormData>({
    resolver: zodResolver(brokerSchema),
    defaultValues: {
      name: '',
      phone: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (broker) {
      reset({
        name: broker.name,
        phone: broker.phone || '',
        notes: broker.notes || '',
      })
    }
  }, [broker, reset])

  const onSubmit = async (data: BrokerFormData) => {
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
          <CardTitle className="text-lg">معلومات الوسيط</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="اسم الوسيط *"
            {...register('name')}
            error={errors.name?.message}
            placeholder="أدخل اسم الوسيط"
          />

          <Input
            label="رقم الهاتف"
            {...register('phone')}
            error={errors.phone?.message}
            placeholder="أدخل رقم الهاتف"
            type="tel"
          />

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

          {broker && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">معلومات إضافية</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">عدد الديون:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {broker.brokerDues?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">إجمالي الديون:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {broker.brokerDues?.reduce((sum, due) => sum + due.amount, 0).toLocaleString() || 0} ج.م
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">الديون المتأخرة:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {broker.brokerDues?.filter(due => 
                      new Date(due.dueDate) < new Date() && due.status === 'معلق'
                    ).length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">تاريخ الإنشاء:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {new Date(broker.createdAt).toLocaleDateString('ar-EG')}
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
          {broker ? 'تحديث' : 'إنشاء'}
        </Button>
      </div>
    </form>
  )
}