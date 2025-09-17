'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

const customerSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  phone: z.string().optional().or(z.undefined()),
  nationalId: z.string().optional().or(z.undefined()),
  address: z.string().optional().or(z.undefined()),
  status: z.enum(['نشط', 'غير نشط']),
  notes: z.string().optional().or(z.undefined()),
})

type CustomerFormData = z.infer<typeof customerSchema>

interface Customer {
  id: string
  name: string
  phone?: string
  nationalId?: string
  address?: string
  status: string
  notes?: string
  createdAt: string
  contracts: Array<{
    id: string
    totalPrice: number
    start: string
  }>
}

interface CustomerFormProps {
  customer?: Customer | null
  onSave: (data: CustomerFormData) => Promise<void>
  onCancel: () => void
}

export function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      nationalId: '',
      address: '',
      status: 'نشط',
      notes: '',
    },
  })

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        phone: customer.phone || '',
        nationalId: customer.nationalId || '',
        address: customer.address || '',
        status: customer.status as 'نشط' | 'غير نشط',
        notes: customer.notes || '',
      })
    }
  }, [customer, reset])

  const onSubmit = async (data: CustomerFormData) => {
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
            <Input
              label="الاسم *"
              {...register('name')}
              error={errors.name?.message}
              placeholder="أدخل اسم العميل"
            />

            <Input
              label="رقم الهاتف"
              {...register('phone')}
              error={errors.phone?.message}
              placeholder="أدخل رقم الهاتف"
              type="tel"
            />

            <Input
              label="الرقم القومي"
              {...register('nationalId')}
              error={errors.nationalId?.message}
              placeholder="أدخل الرقم القومي"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">معلومات إضافية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العنوان
              </label>
              <textarea
                {...register('address')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل عنوان العميل"
              />
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
          </CardContent>
        </Card>
      </div>

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
          {customer ? 'تحديث' : 'إنشاء'}
        </Button>
      </motion.div>
    </form>
  )
}