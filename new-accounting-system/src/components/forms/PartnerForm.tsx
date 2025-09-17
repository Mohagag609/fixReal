'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

const partnerSchema = z.object({
  name: z.string().min(1, 'اسم الشريك مطلوب'),
  phone: z.string().optional().or(z.undefined()),
  notes: z.string().optional().or(z.undefined()),
})

type PartnerFormData = z.infer<typeof partnerSchema>

interface Partner {
  id: string
  name: string
  phone?: string | undefined
  notes?: string | undefined
  createdAt: string
  unitPartners: Array<{
    id: string
    percentage: number
    unit: {
      code: string
      name?: string
      totalPrice: number
    }
  }>
  partnerDebts: Array<{
    id: string
    amount: number
    dueDate: string
    status: string
  }>
  partnerGroupPartners: Array<{
    id: string
    percentage: number
    partnerGroup: {
      name: string
    }
  }>
}

interface PartnerFormProps {
  partner?: Partner | null
  onSave: (data: PartnerFormData) => Promise<void>
  onCancel: () => void
}

export function PartnerForm({ partner, onSave, onCancel }: PartnerFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: '',
      phone: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (partner) {
      reset({
        name: partner.name,
        phone: partner.phone || '',
        notes: partner.notes || '',
      })
    }
  }, [partner, reset])

  const onSubmit = async (data: PartnerFormData) => {
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
          <CardTitle className="text-lg">معلومات الشريك</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="اسم الشريك *"
            {...register('name')}
            error={errors.name?.message}
            placeholder="أدخل اسم الشريك"
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

          {partner && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">معلومات إضافية</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">الوحدات المرتبطة:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {partner.unitPartners?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">الديون:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {partner.partnerDebts?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">المجموعات:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {partner.partnerGroupPartners?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">تاريخ الإنشاء:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {new Date(partner.createdAt).toLocaleDateString('ar-EG')}
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
          {partner ? 'تحديث' : 'إنشاء'}
        </Button>
      </div>
    </form>
  )
}