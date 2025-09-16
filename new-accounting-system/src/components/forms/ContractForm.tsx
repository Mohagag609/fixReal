'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

const contractSchema = z.object({
  unitId: z.string().min(1, 'الوحدة مطلوبة'),
  customerId: z.string().min(1, 'العميل مطلوب'),
  start: z.string().min(1, 'تاريخ العقد مطلوب'),
  totalPrice: z.number().min(0, 'السعر الإجمالي يجب أن يكون أكبر من أو يساوي صفر'),
  discountAmount: z.number().min(0).default(0),
  brokerName: z.string().optional(),
  brokerPercent: z.number().min(0).max(100).default(0),
  brokerAmount: z.number().min(0).default(0),
  downPayment: z.number().min(0).default(0),
  installmentType: z.enum(['شهري', 'ربعي', 'سنوي']),
  installmentCount: z.number().min(0).default(0),
  paymentType: z.enum(['installment', 'cash']),
})

type ContractFormData = z.infer<typeof contractSchema>

interface Contract {
  id: string
  unitId: string
  customerId: string
  start: string
  totalPrice: number
  discountAmount: number
  brokerName?: string
  brokerPercent: number
  brokerAmount: number
  downPayment: number
  installmentType: string
  installmentCount: number
  paymentType: string
  createdAt: string
  unit: {
    code: string
    name?: string
    totalPrice: number
    status: string
  }
  customer: {
    name: string
    phone?: string
    nationalId?: string
  }
}

interface ContractFormProps {
  contract?: Contract | null
  onSave: (data: ContractFormData) => void
  onCancel: () => void
}

export function ContractForm({ contract, onSave, onCancel }: ContractFormProps) {
  const [loading, setLoading] = useState(false)
  const [units, setUnits] = useState<Array<{ id: string; code: string; name?: string; totalPrice: number }>>([])
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; phone?: string }>>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      unitId: '',
      customerId: '',
      start: '',
      totalPrice: 0,
      discountAmount: 0,
      brokerName: '',
      brokerPercent: 0,
      brokerAmount: 0,
      downPayment: 0,
      installmentType: 'شهري',
      installmentCount: 0,
      paymentType: 'installment',
    },
  })

  const paymentType = watch('paymentType')
  const totalPrice = watch('totalPrice')
  const discountAmount = watch('discountAmount')
  const downPayment = watch('downPayment')

  useEffect(() => {
    // Fetch units and customers
    const fetchData = async () => {
      try {
        const [unitsRes, customersRes] = await Promise.all([
          fetch('/api/units'),
          fetch('/api/customers'),
        ])
        
        const unitsData = await unitsRes.json()
        const customersData = await customersRes.json()
        
        setUnits(unitsData.data || [])
        setCustomers(customersData.data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (contract) {
      reset({
        unitId: contract.unitId,
        customerId: contract.customerId,
        start: contract.start.split('T')[0], // Convert to YYYY-MM-DD format
        totalPrice: contract.totalPrice,
        discountAmount: contract.discountAmount,
        brokerName: contract.brokerName || '',
        brokerPercent: contract.brokerPercent,
        brokerAmount: contract.brokerAmount,
        downPayment: contract.downPayment,
        installmentType: contract.installmentType as 'شهري' | 'ربعي' | 'سنوي',
        installmentCount: contract.installmentCount,
        paymentType: contract.paymentType as 'installment' | 'cash',
      })
    }
  }, [contract, reset])

  const onSubmit = async (data: ContractFormData) => {
    try {
      setLoading(true)
      await onSave(data)
    } finally {
      setLoading(false)
    }
  }

  const remainingAmount = totalPrice - discountAmount - downPayment
  const installmentAmount = paymentType === 'installment' && watch('installmentCount') > 0 
    ? remainingAmount / watch('installmentCount') 
    : 0

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                العميل *
              </label>
              <select
                {...register('customerId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">اختر العميل</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone && `- ${customer.phone}`}
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="text-sm text-red-600 mt-1">{errors.customerId.message}</p>
              )}
            </div>

            <Input
              label="تاريخ العقد *"
              type="date"
              {...register('start')}
              error={errors.start?.message}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الدفع
              </label>
              <select
                {...register('paymentType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="installment">تقسيط</option>
                <option value="cash">نقدي</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">المعلومات المالية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="السعر الإجمالي *"
              type="number"
              {...register('totalPrice', { valueAsNumber: true })}
              error={errors.totalPrice?.message}
              placeholder="أدخل السعر الإجمالي"
            />

            <Input
              label="مبلغ الخصم"
              type="number"
              {...register('discountAmount', { valueAsNumber: true })}
              error={errors.discountAmount?.message}
              placeholder="أدخل مبلغ الخصم"
            />

            <Input
              label="الدفعة المقدمة"
              type="number"
              {...register('downPayment', { valueAsNumber: true })}
              error={errors.downPayment?.message}
              placeholder="أدخل الدفعة المقدمة"
            />

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">المبلغ المتبقي:</span>
                <span className="font-semibold text-blue-600">
                  {remainingAmount.toLocaleString()} ج.م
                </span>
              </div>
              {paymentType === 'installment' && watch('installmentCount') > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">مبلغ القسط:</span>
                  <span className="font-semibold text-green-600">
                    {installmentAmount.toLocaleString()} ج.م
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Installment Information */}
      {paymentType === 'installment' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">معلومات التقسيط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع التقسيط
                </label>
                <select
                  {...register('installmentType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="شهري">شهري</option>
                  <option value="ربعي">ربعي</option>
                  <option value="سنوي">سنوي</option>
                </select>
              </div>

              <Input
                label="عدد الأقساط"
                type="number"
                {...register('installmentCount', { valueAsNumber: true })}
                error={errors.installmentCount?.message}
                placeholder="أدخل عدد الأقساط"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Broker Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">معلومات الوسيط</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="اسم الوسيط"
              {...register('brokerName')}
              error={errors.brokerName?.message}
              placeholder="أدخل اسم الوسيط"
            />

            <Input
              label="نسبة الوسيط (%)"
              type="number"
              {...register('brokerPercent', { valueAsNumber: true })}
              error={errors.brokerPercent?.message}
              placeholder="أدخل نسبة الوسيط"
            />

            <Input
              label="مبلغ الوسيط"
              type="number"
              {...register('brokerAmount', { valueAsNumber: true })}
              error={errors.brokerAmount?.message}
              placeholder="أدخل مبلغ الوسيط"
            />
          </div>
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
          {contract ? 'تحديث' : 'إنشاء'}
        </Button>
      </motion.div>
    </form>
  )
}