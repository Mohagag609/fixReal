'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Receipt, Wallet, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import { DataTable } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { VoucherForm } from '@/components/forms/VoucherForm'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'

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

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [deletingVoucher, setDeletingVoucher] = useState<Voucher | null>(null)

  // Fetch vouchers
  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vouchers')
      const data = await response.json()
      setVouchers(data.data || [])
    } catch (error) {
      console.error('Error fetching vouchers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVouchers()
  }, [])

  // Handle create/update voucher
  const handleSaveVoucher = async (voucherData: Partial<Voucher>) => {
    try {
      const url = editingVoucher ? `/api/vouchers/${editingVoucher.id}` : '/api/vouchers'
      const method = editingVoucher ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voucherData),
      })

      if (response.ok) {
        await fetchVouchers()
        setIsModalOpen(false)
        setEditingVoucher(null)
      }
    } catch (error) {
      console.error('Error saving voucher:', error)
    }
  }

  // Handle delete voucher
  const handleDeleteVoucher = async (voucher: Voucher) => {
    try {
      const response = await fetch(`/api/vouchers/${voucher.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchVouchers()
        setDeletingVoucher(null)
      }
    } catch (error) {
      console.error('Error deleting voucher:', error)
    }
  }

  // Table columns
  const columns: ColumnDef<Voucher>[] = useMemo(
    () => [
      {
        accessorKey: 'type',
        header: 'النوع',
        cell: ({ row }) => {
          const type = row.getValue('type') as string
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                type === 'receipt'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {type === 'receipt' ? 'وارد' : 'صادر'}
            </span>
          )
        },
      },
      {
        accessorKey: 'description',
        header: 'الوصف',
        cell: ({ row }) => (
          <div className="font-medium text-gray-900">
            {row.getValue('description')}
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'المبلغ',
        cell: ({ row }) => {
          const amount = row.getValue('amount') as number
          const type = row.original.type
          return (
            <div className={`flex items-center font-semibold ${
              type === 'receipt' ? 'text-green-600' : 'text-red-600'
            }`}>
              {type === 'receipt' ? (
                <TrendingUp className="w-4 h-4 ml-2" />
              ) : (
                <TrendingDown className="w-4 h-4 ml-2" />
              )}
              {type === 'receipt' ? '+' : '-'}{formatCurrency(amount)}
            </div>
          )
        },
      },
      {
        accessorKey: 'safe.name',
        header: 'الخزينة',
        cell: ({ row }) => (
          <div className="flex items-center">
            <Wallet className="w-4 h-4 ml-2 text-blue-600" />
            <span className="text-gray-900">
              {row.original.safe.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'payer',
        header: 'المدفوع له/منه',
        cell: ({ row }) => {
          const voucher = row.original
          return (
            <div className="text-sm text-gray-600">
              {voucher.type === 'receipt' ? voucher.payer : voucher.beneficiary || 'غير محدد'}
            </div>
          )
        },
      },
      {
        accessorKey: 'unit',
        header: 'الوحدة المرتبطة',
        cell: ({ row }) => {
          const unit = row.original.unit
          return unit ? (
            <div className="text-sm text-blue-600">
              {unit.code} {unit.name && `- ${unit.name}`}
            </div>
          ) : (
            <span className="text-sm text-gray-500">غير مرتبط</span>
          )
        },
      },
      {
        accessorKey: 'date',
        header: 'التاريخ',
        cell: ({ row }) => (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 ml-2" />
            {formatDate(row.getValue('date'))}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'الإجراءات',
        cell: ({ row }) => {
          const voucher = row.original
          return (
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingVoucher(voucher)
                  setIsModalOpen(true)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingVoucher(voucher)}
              >
                <Trash2 className="w-4 h-4" />
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

  const totalReceipts = vouchers
    .filter(v => v.type === 'receipt')
    .reduce((sum, v) => sum + v.amount, 0)
  
  const totalPayments = vouchers
    .filter(v => v.type === 'payment')
    .reduce((sum, v) => sum + v.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الشيكات</h1>
          <p className="text-gray-600">إدارة الشيكات المالية</p>
        </div>
        <Button
          onClick={() => {
            setEditingVoucher(null)
            setIsModalOpen(true)
          }}
          className="flex items-center"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة شيك جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الشيكات</p>
                <p className="text-2xl font-bold text-gray-900">{vouchers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الواردات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalReceipts)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي المدفوعات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalPayments)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">صافي الحركة</p>
                <p className={`text-2xl font-bold ${
                  totalReceipts - totalPayments >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(totalReceipts - totalPayments)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الشيكات</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={vouchers}
            searchKey="description"
            searchPlaceholder="البحث بالوصف أو المدفوع له..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingVoucher(null)
        }}
        title={editingVoucher ? 'تعديل الشيك' : 'إضافة شيك جديد'}
        size="lg"
      >
        <VoucherForm
          voucher={editingVoucher}
          onSave={handleSaveVoucher}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingVoucher(null)
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingVoucher}
        onClose={() => setDeletingVoucher(null)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            هل أنت متأكد من حذف الشيك &quot;{deletingVoucher?.description}&quot;؟
          </p>
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => setDeletingVoucher(null)}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={() => deletingVoucher && handleDeleteVoucher(deletingVoucher)}
            >
              حذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}