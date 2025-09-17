'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

const unitSchema = z.object({
  code: z.string().min(1, 'كود الوحدة مطلوب'),
  name: z.string().optional().or(z.undefined()),
  unitType: z.enum(['سكني', 'تجاري', 'إداري', 'مخزن']),
  area: z.string().optional().or(z.undefined()),
  floor: z.string().optional().or(z.undefined()),
  building: z.string().optional().or(z.undefined()),
  totalPrice: z.number().min(0, 'السعر يجب أن يكون أكبر من أو يساوي صفر'),
  status: z.enum(['متاحة', 'مباعة', 'محجوزة']),
  notes: z.string().optional().or(z.undefined()),
})

type UnitFormData = z.infer<typeof unitSchema>

interface Unit {
  id: string
  code: string
  name?: string | undefined
  unitType: string
  area?: string | undefined
  floor?: string | undefined
  building?: string | undefined
  totalPrice: number
  status: string
  notes?: string | undefined
  createdAt: string
  contracts: Array<{
    id: string
    totalPrice: number
    start: string
  }>
  unitPartners: Array<{
    id: string
    percentage: number
    partner: {
      name: string
      phone?: string | undefined
    }
  }>
}

interface UnitFormProps {
  unit?: Unit | null
  onSave: (data: UnitFormData) => Promise<void>
  onCancel: () => void
}

export function UnitForm({ unit, onSave, onCancel }: UnitFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      code: '',
      name: '',
      unitType: 'سكني',
      area: '',
      floor: '',
      building: '',
      totalPrice: 0,
      status: 'متاحة',
      notes: '',
    },
  })

  useEffect(() => {
    if (unit) {
      reset({
        code: unit.code,
        name: unit.name || '',
        unitType: unit.unitType as 'سكني' | 'تجاري' | 'إداري' | 'مخزن',
        area: unit.area || '',
        floor: unit.floor || '',
        building: unit.building || '',
        totalPrice: unit.totalPrice,
        status: unit.status as 'متاحة' | 'مباعة' | 'محجوزة',
        notes: unit.notes || '',
      })
    }
  }, [unit, reset])

  const onSubmit = async (data: UnitFormData) => {
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
              label="كود الوحدة *"
              {...register('code')}
              error={errors.code?.message}
              placeholder="أدخل كود الوحدة"
            />

            <Input
              label="اسم الوحدة"
              {...register('name')}
              error={errors.name?.message}
              placeholder="أدخل اسم الوحدة"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الوحدة
              </label>
              <select
                {...register('unitType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="سكني">سكني</option>
                <option value="تجاري">تجاري</option>
                <option value="إداري">إداري</option>
                <option value="مخزن">مخزن</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="متاحة">متاحة</option>
                <option value="مباعة">مباعة</option>
                <option value="محجوزة">محجوزة</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Location and Price Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الموقع والسعر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="المساحة"
              {...register('area')}
              error={errors.area?.message}
              placeholder="أدخل مساحة الوحدة"
            />

            <Input
              label="الطابق"
              {...register('floor')}
              error={errors.floor?.message}
              placeholder="أدخل رقم الطابق"
            />

            <Input
              label="المبنى"
              {...register('building')}
              error={errors.building?.message}
              placeholder="أدخل اسم المبنى"
            />

            <Input
              label="السعر الإجمالي *"
              type="number"
              {...register('totalPrice', { valueAsNumber: true })}
              error={errors.totalPrice?.message}
              placeholder="أدخل السعر الإجمالي"
            />
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">معلومات إضافية</CardTitle>
        </CardHeader>
        <CardContent>
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
          {unit ? 'تحديث' : 'إنشاء'}
        </Button>
      </div>
    </form>
  )
}