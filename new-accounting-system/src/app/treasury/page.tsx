'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Wallet, ArrowRightLeft, DollarSign, TrendingUp } from 'lucide-react'
import { DataTable } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { TransferForm } from '@/components/forms/TransferForm'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'

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

export default function TreasuryPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [safes, setSafes] = useState<Safe[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null)
  const [deletingTransfer, setDeletingTransfer] = useState<Transfer | null>(null)

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true)
      const [transfersRes, safesRes] = await Promise.all([
        fetch('/api/transfers'),
        fetch('/api/safes'),
      ])
      
      const transfersData = await transfersRes.json()
      const safesData = await safesRes.json()
      
      setTransfers(transfersData.data || [])
      setSafes(safesData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Handle create/update transfer
  const handleSaveTransfer = async (transferData: Partial<Transfer>) => {
    try {
      const url = editingTransfer ? `/api/transfers/${editingTransfer.id}` : '/api/transfers'
      const method = editingTransfer ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
      })

      if (response.ok) {
        await fetchData()
        setIsModalOpen(false)
        setEditingTransfer(null)
      }
    } catch (error) {
      console.error('Error saving transfer:', error)
    }
  }

  // Handle delete transfer
  const handleDeleteTransfer = async (transfer: Transfer) => {
    try {
      const response = await fetch(`/api/transfers/${transfer.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchData()
        setDeletingTransfer(null)
      }
    } catch (error) {
      console.error('Error deleting transfer:', error)
    }
  }

  // Table columns
  const columns: ColumnDef<Transfer>[] = useMemo(
    () => [
      {
        accessorKey: 'fromSafe.name',
        header: 'من الخزينة',
        cell: ({ row }) => (
          <div className="flex items-center">
            <Wallet className="w-4 h-4 ml-2 text-red-600" />
            <span className="font-medium text-red-600">
              {row.original.fromSafe.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'toSafe.name',
        header: 'إلى الخزينة',
        cell: ({ row }) => (
          <div className="flex items-center">
            <Wallet className="w-4 h-4 ml-2 text-green-600" />
            <span className="font-medium text-green-600">
              {row.original.toSafe.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'المبلغ',
        cell: ({ row }) => (
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 ml-2 text-blue-600" />
            <span className="font-semibold text-blue-600">
              {formatCurrency(row.getValue('amount'))}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'الوصف',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {row.getValue('description') || 'لا يوجد وصف'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'تاريخ التحويل',
        cell: ({ row }) => formatDate(row.getValue('createdAt')),
      },
      {
        id: 'actions',
        header: 'الإجراءات',
        cell: ({ row }) => {
          const transfer = row.original
          return (
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingTransfer(transfer)
                  setIsModalOpen(true)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingTransfer(transfer)}
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

  const totalTransfers = transfers.length
  const totalAmount = transfers.reduce((sum, t) => sum + t.amount, 0)
  const totalSafes = safes.length
  const totalBalance = safes.reduce((sum, s) => sum + s.balance, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الخزينة</h1>
          <p className="text-gray-600">إدارة التحويلات بين الخزائن</p>
        </div>
        <Button
          onClick={() => {
            setEditingTransfer(null)
            setIsModalOpen(true)
          }}
          className="flex items-center"
        >
          <Plus className="w-4 h-4 ml-2" />
          تحويل جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الخزائن</p>
                <p className="text-2xl font-bold text-gray-900">{totalSafes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الأرصدة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ArrowRightLeft className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي التحويلات</p>
                <p className="text-2xl font-bold text-gray-900">{totalTransfers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي المبالغ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safes Overview */}
      <Card>
        <CardHeader>
          <CardTitle>نظرة عامة على الخزائن</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safes.map((safe) => (
              <motion.div
                key={safe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{safe.name}</h3>
                    <p className="text-sm text-gray-600">الرصيد الحالي</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      safe.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(safe.balance)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transfers Table */}
      <Card>
        <CardHeader>
          <CardTitle>سجل التحويلات</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={transfers}
            searchKey="description"
            searchPlaceholder="البحث بالوصف..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTransfer(null)
        }}
        title={editingTransfer ? 'تعديل التحويل' : 'تحويل جديد'}
        size="md"
      >
        <TransferForm
          transfer={editingTransfer}
          safes={safes}
          onSave={handleSaveTransfer}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingTransfer(null)
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingTransfer}
        onClose={() => setDeletingTransfer(null)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            هل أنت متأكد من حذف التحويل من &quot;{deletingTransfer?.fromSafe.name}&quot; إلى &quot;{deletingTransfer?.toSafe.name}&quot;؟
          </p>
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => setDeletingTransfer(null)}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={() => deletingTransfer && handleDeleteTransfer(deletingTransfer)}
            >
              حذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}