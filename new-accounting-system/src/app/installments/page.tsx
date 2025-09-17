'use client'

import { useState, useEffect, useMemo } from 'react'
// import { motion } from 'framer-motion'
import { PlusIcon, EditIcon, TrashIcon, CalendarIcon, DollarIcon, CheckCircle, Clock, AlertIcon, AlertCircle } from '../../components/icons'
import { DataTable } from '../../components/tables/DataTable'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { InstallmentForm } from '../../components/forms/InstallmentForm'
import { formatDate, formatCurrency } from '../../lib/utils'
import { ColumnDef } from '@tanstack/react-table'

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

export default function InstallmentsPage() {
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null)
  const [deletingInstallment, setDeletingInstallment] = useState<Installment | null>(null)

  // Fetch installments
  const fetchInstallments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/installments')
      const data = await response.json()
      setInstallments(data.data || [])
    } catch (error) {
      console.error('Error fetching installments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstallments()
  }, [])

  // Handle create/update installment
  const handleSaveInstallment = async (installmentData: Partial<Installment>) => {
    try {
      const url = editingInstallment ? `/api/installments/${editingInstallment.id}` : '/api/installments'
      const method = editingInstallment ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(installmentData),
      })

      if (response.ok) {
        await fetchInstallments()
        setIsModalOpen(false)
        setEditingInstallment(null)
      }
    } catch (error) {
      console.error('Error saving installment:', error)
    }
  }

  // Handle delete installment
  const handleDeleteInstallment = async (installment: Installment) => {
    try {
      const response = await fetch(`/api/installments/${installment.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchInstallments()
        setDeletingInstallment(null)
      }
    } catch (error) {
      console.error('Error deleting installment:', error)
    }
  }

  // Handle mark as paid
  const handleMarkAsPaid = async (installment: Installment) => {
    try {
      const response = await fetch(`/api/installments/${installment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'مدفوع' }),
      })

      if (response.ok) {
        await fetchInstallments()
      }
    } catch (error) {
      console.error('Error marking installment as paid:', error)
    }
  }

  // Table columns
  const columns: ColumnDef<Installment>[] = useMemo(
    () => [
      {
        accessorKey: 'unit.code',
        header: 'كود الوحدة',
        cell: ({ row }) => (
          <div className="font-medium text-blue-600">
            {row.original.unit.code}
          </div>
        ),
      },
      {
        accessorKey: 'unit.name',
        header: 'اسم الوحدة',
        cell: ({ row }) => (
          <div className="text-gray-900">
            {row.original.unit.name || 'غير محدد'}
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'مبلغ القسط',
        cell: ({ row }) => (
          <div className="flex items-center">
            <DollarIcon className="w-4 h-4 ml-2 text-green-600" />
            <span className="font-semibold text-green-600">
              {formatCurrency(row.getValue('amount'))}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: 'تاريخ الاستحقاق',
        cell: ({ row }) => (
          <div className="flex items-center text-gray-600">
            <CalendarIcon className="w-4 h-4 ml-2" />
            {formatDate(row.getValue('dueDate'))}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'الحالة',
        cell: ({ row }) => {
          const status = row.getValue('status') as string
          const statusConfig = {
            'مدفوع': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
            'معلق': { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
            'متأخر': { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
          }
          const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['معلق']
          const Icon = config.icon
          
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
              <Icon className="w-3 h-3 ml-1" />
              {status}
            </span>
          )
        },
      },
      {
        accessorKey: 'notes',
        header: 'ملاحظات',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {row.getValue('notes') || 'لا توجد ملاحظات'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'تاريخ الإنشاء',
        cell: ({ row }) => formatDate(row.getValue('createdAt')),
      },
      {
        id: 'actions',
        header: 'الإجراءات',
        cell: ({ row }) => {
          const installment = row.original
          return (
            <div className="flex items-center space-x-2 space-x-reverse">
              {installment.status === 'معلق' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleMarkAsPaid(installment)}
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingInstallment(installment)
                  setIsModalOpen(true)
                }}
              >
                <EditIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingInstallment(installment)}
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // const totalAmount = installments.reduce((sum, i) => sum + i.amount, 0)
  const paidAmount = installments.filter(i => i.status === 'مدفوع').reduce((sum, i) => sum + i.amount, 0)
  const pendingAmount = installments.filter(i => i.status === 'معلق').reduce((sum, i) => sum + i.amount, 0)
  const overdueAmount = installments.filter(i => i.status === 'متأخر').reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الأقساط</h1>
          <p className="text-gray-600">إدارة أقساط العقود</p>
        </div>
        <Button
          onClick={() => {
            setEditingInstallment(null)
            setIsModalOpen(true)
          }}
          className="flex items-center"
        >
          <PlusIcon className="w-4 h-4 ml-2" />
          إضافة قسط جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الأقساط</p>
                <p className="text-2xl font-bold text-gray-900">{installments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">المدفوع</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(paidAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">المعلق</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(pendingAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">المتأخر</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(overdueAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الأقساط</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={installments}
            searchKey="unit.code"
            searchPlaceholder="البحث بكود الوحدة..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingInstallment(null)
        }}
        title={editingInstallment ? 'تعديل القسط' : 'إضافة قسط جديد'}
        size="md"
      >
        <InstallmentForm
          installment={editingInstallment}
          onSave={handleSaveInstallment}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingInstallment(null)
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingInstallment}
        onClose={() => setDeletingInstallment(null)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            هل أنت متأكد من حذف القسط للوحدة &quot;{deletingInstallment?.unit.code}&quot;؟
          </p>
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => setDeletingInstallment(null)}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={() => deletingInstallment && handleDeleteInstallment(deletingInstallment)}
            >
              حذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}