'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Wallet, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { DataTable } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { SafeForm } from '@/components/forms/SafeForm'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'

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

export default function SafesPage() {
  const [safes, setSafes] = useState<Safe[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSafe, setEditingSafe] = useState<Safe | null>(null)
  const [deletingSafe, setDeletingSafe] = useState<Safe | null>(null)

  // Fetch safes
  const fetchSafes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/safes')
      const data = await response.json()
      setSafes(data.data || [])
    } catch (error) {
      console.error('Error fetching safes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSafes()
  }, [])

  // Handle create/update safe
  const handleSaveSafe = async (safeData: Partial<Safe>) => {
    try {
      const url = editingSafe ? `/api/safes/${editingSafe.id}` : '/api/safes'
      const method = editingSafe ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeData),
      })

      if (response.ok) {
        await fetchSafes()
        setIsModalOpen(false)
        setEditingSafe(null)
      }
    } catch (error) {
      console.error('Error saving safe:', error)
    }
  }

  // Handle delete safe
  const handleDeleteSafe = async (safe: Safe) => {
    try {
      const response = await fetch(`/api/safes/${safe.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchSafes()
        setDeletingSafe(null)
      }
    } catch (error) {
      console.error('Error deleting safe:', error)
    }
  }

  // Table columns
  const columns: ColumnDef<Safe>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'اسم الخزينة',
        cell: ({ row }) => (
          <div className="flex items-center">
            <Wallet className="w-4 h-4 ml-2 text-blue-600" />
            <span className="font-medium text-gray-900">
              {row.getValue('name')}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'balance',
        header: 'الرصيد الحالي',
        cell: ({ row }) => {
          const balance = row.getValue('balance') as number
          return (
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 ml-2 text-green-600" />
              <span className={`font-semibold ${
                balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(balance)}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'vouchers',
        header: 'عدد الشيكات',
        cell: ({ row }) => {
          const vouchers = row.getValue('vouchers') as Array<Record<string, unknown>>
          return (
            <span className="text-sm text-gray-600">
              {vouchers?.length || 0}
            </span>
          )
        },
      },
      {
        accessorKey: 'transfersFrom',
        header: 'التحويلات الصادرة',
        cell: ({ row }) => {
          const transfers = row.getValue('transfersFrom') as Array<Record<string, unknown>>
          return (
            <span className="text-sm text-gray-600">
              {transfers?.length || 0}
            </span>
          )
        },
      },
      {
        accessorKey: 'transfersTo',
        header: 'التحويلات الواردة',
        cell: ({ row }) => {
          const transfers = row.getValue('transfersTo') as Array<Record<string, unknown>>
          return (
            <span className="text-sm text-gray-600">
              {transfers?.length || 0}
            </span>
          )
        },
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
          const safe = row.original
          return (
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingSafe(safe)
                  setIsModalOpen(true)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingSafe(safe)}
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

  const totalBalance = safes.reduce((sum, safe) => sum + safe.balance, 0)
  const totalVouchers = safes.reduce((sum, safe) => sum + (safe.vouchers?.length || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الخزائن</h1>
          <p className="text-gray-600">إدارة الخزائن المالية</p>
        </div>
        <Button
          onClick={() => {
            setEditingSafe(null)
            setIsModalOpen(true)
          }}
          className="flex items-center"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة خزينة جديدة
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
                <p className="text-2xl font-bold text-gray-900">{safes.length}</p>
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
                <p className="text-sm font-medium text-gray-600">إجمالي الرصيد</p>
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
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الشيكات</p>
                <p className="text-2xl font-bold text-gray-900">{totalVouchers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">متوسط الرصيد</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(safes.length > 0 ? totalBalance / safes.length : 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الخزائن</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={safes}
            searchKey="name"
            searchPlaceholder="البحث باسم الخزينة..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingSafe(null)
        }}
        title={editingSafe ? 'تعديل الخزينة' : 'إضافة خزينة جديدة'}
        size="md"
      >
        <SafeForm
          safe={editingSafe}
          onSave={handleSaveSafe}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingSafe(null)
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingSafe}
        onClose={() => setDeletingSafe(null)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            هل أنت متأكد من حذف الخزينة &quot;{deletingSafe?.name}&quot;؟
          </p>
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => setDeletingSafe(null)}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={() => deletingSafe && handleDeleteSafe(deletingSafe)}
            >
              حذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}