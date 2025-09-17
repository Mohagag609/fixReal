'use client'

import { useState, useEffect, useMemo } from 'react'
import { PlusIcon, EditIcon, TrashIcon, UsersIcon, DollarIcon, PhoneIcon, CalendarIcon, AlertIcon } from '@/components/icons'
import { DataTable } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { BrokerForm } from '@/components/forms/BrokerForm'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'

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

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null)
  const [deletingBroker, setDeletingBroker] = useState<Broker | null>(null)

  // Fetch brokers
  const fetchBrokers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/brokers')
      const data = await response.json()
      setBrokers(data.data || [])
    } catch (error) {
      console.error('Error fetching brokers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBrokers()
  }, [])

  // Handle create/update broker
  const handleSaveBroker = async (brokerData: Partial<Broker>) => {
    try {
      const url = editingBroker ? `/api/brokers/${editingBroker.id}` : '/api/brokers'
      const method = editingBroker ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brokerData),
      })

      if (response.ok) {
        await fetchBrokers()
        setIsModalOpen(false)
        setEditingBroker(null)
      }
    } catch (error) {
      console.error('Error saving broker:', error)
    }
  }

  // Handle delete broker
  const handleDeleteBroker = async (broker: Broker) => {
    try {
      const response = await fetch(`/api/brokers/${broker.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchBrokers()
        setDeletingBroker(null)
      }
    } catch (error) {
      console.error('Error deleting broker:', error)
    }
  }

  // Table columns
  const columns: ColumnDef<Broker>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'اسم الوسيط',
        cell: ({ row }) => (
          <div className="flex items-center">
            <UsersIcon className="w-4 h-4 ml-2 text-blue-600" />
            <span className="font-medium text-gray-900">
              {row.getValue('name')}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'الهاتف',
        cell: ({ row }) => (
          <div className="flex items-center text-gray-600">
            <PhoneIcon className="w-4 h-4 ml-2" />
            {row.getValue('phone') || 'غير محدد'}
          </div>
        ),
      },
      {
        accessorKey: 'brokerDues',
        header: 'الديون',
        cell: ({ row }) => {
          const dues = row.getValue('brokerDues') as Array<{ amount: number }>
          const totalDues = dues?.reduce((sum, due) => sum + due.amount, 0) || 0
          return (
            <div className="flex items-center">
              <DollarIcon className="w-4 h-4 ml-2 text-red-600" />
              <span className="font-semibold text-red-600">
                {formatCurrency(totalDues)}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'brokerDues',
        header: 'عدد الديون',
        cell: ({ row }) => {
          const dues = row.getValue('brokerDues') as Array<{ dueDate: string; status: string }>
          const overdueCount = dues?.filter(due => 
            new Date(due.dueDate) < new Date() && due.status === 'معلق'
          ).length || 0
          
          return (
            <div className="flex items-center">
              {overdueCount > 0 && (
                <AlertIcon className="w-4 h-4 ml-2 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                overdueCount > 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {dues?.length || 0} ({overdueCount} متأخر)
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'تاريخ الإنشاء',
        cell: ({ row }) => (
          <div className="flex items-center text-gray-600">
            <CalendarIcon className="w-4 h-4 ml-2" />
            {formatDate(row.getValue('createdAt'))}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'الإجراءات',
        cell: ({ row }) => {
          const broker = row.original
          return (
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingBroker(broker)
                  setIsModalOpen(true)
                }}
              >
                <EditIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingBroker(broker)}
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

  const totalBrokers = brokers.length
  const totalDues = brokers.reduce((sum, b) => 
    sum + (b.brokerDues?.reduce((s, due) => s + due.amount, 0) || 0), 0
  )
  const overdueDues = brokers.reduce((sum, b) => 
    sum + (b.brokerDues?.filter(due => 
      new Date(due.dueDate) < new Date() && due.status === 'معلق'
    ).reduce((s, due) => s + due.amount, 0) || 0), 0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الوسطاء</h1>
          <p className="text-gray-600">إدارة الوسطاء وعمولاتهم</p>
        </div>
        <Button
          onClick={() => {
            setEditingBroker(null)
            setIsModalOpen(true)
          }}
          className="flex items-center"
        >
          <PlusIcon className="w-4 h-4 ml-2" />
          إضافة وسيط جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الوسطاء</p>
                <p className="text-2xl font-bold text-gray-900">{totalBrokers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي العمولات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalDues)}
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
                <p className="text-sm font-medium text-gray-600">العمولات المتأخرة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(overdueDues)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">متوسط العمولة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalBrokers > 0 ? formatCurrency(totalDues / totalBrokers) : formatCurrency(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الوسطاء</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={brokers}
            searchKey="name"
            searchPlaceholder="البحث باسم الوسيط..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingBroker(null)
        }}
        title={editingBroker ? 'تعديل الوسيط' : 'إضافة وسيط جديد'}
        size="md"
      >
        <BrokerForm
          broker={editingBroker}
          onSave={handleSaveBroker}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingBroker(null)
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingBroker}
        onClose={() => setDeletingBroker(null)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            هل أنت متأكد من حذف الوسيط &quot;{deletingBroker?.name}&quot;؟
          </p>
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => setDeletingBroker(null)}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={() => deletingBroker && handleDeleteBroker(deletingBroker)}
            >
              حذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}