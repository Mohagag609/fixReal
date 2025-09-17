'use client'

import { useState, useEffect, useMemo } from 'react'
// import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, Phone, MapPin } from 'lucide-react'
import { DataTable } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { CustomerForm } from '@/components/forms/CustomerForm'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers')
      const data = await response.json()
      setCustomers(data.data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  // Handle create/update customer
  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers'
      const method = editingCustomer ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      })

      if (response.ok) {
        await fetchCustomers()
        setIsModalOpen(false)
        setEditingCustomer(null)
      }
    } catch (error) {
      console.error('Error saving customer:', error)
    }
  }

  // Handle delete customer
  const handleDeleteCustomer = async (customer: Customer) => {
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCustomers()
        setDeletingCustomer(null)
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
    }
  }

  // Table columns
  const columns: ColumnDef<Customer>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'الاسم',
        cell: ({ row }) => (
          <div className="font-medium text-gray-900">{row.getValue('name')}</div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'الهاتف',
        cell: ({ row }) => (
          <div className="flex items-center text-gray-600">
            <Phone className="w-4 h-4 ml-2" />
            {row.getValue('phone') || 'غير محدد'}
          </div>
        ),
      },
      {
        accessorKey: 'nationalId',
        header: 'الرقم القومي',
        cell: ({ row }) => row.getValue('nationalId') || 'غير محدد',
      },
      {
        accessorKey: 'address',
        header: 'العنوان',
        cell: ({ row }) => (
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 ml-2" />
            {row.getValue('address') || 'غير محدد'}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'الحالة',
        cell: ({ row }) => {
          const status = row.getValue('status') as string
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                status === 'نشط'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {status}
            </span>
          )
        },
      },
      {
        accessorKey: 'contracts',
        header: 'عدد العقود',
        cell: ({ row }) => {
          const contracts = row.getValue('contracts') as Array<Record<string, unknown>>
          return (
            <span className="text-sm text-gray-600">
              {contracts?.length || 0}
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
          const customer = row.original
          return (
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCustomer(customer)
                  setIsModalOpen(true)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingCustomer(customer)}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العملاء</h1>
          <p className="text-gray-600">إدارة بيانات العملاء</p>
        </div>
        <Button
          onClick={() => {
            setEditingCustomer(null)
            setIsModalOpen(true)
          }}
          className="flex items-center"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة عميل جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي العملاء</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">العملاء النشطين</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => c.status === 'نشط').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Edit className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي العقود</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.reduce((sum, c) => sum + (c.contracts?.length || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">قيمة العقود</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    customers.reduce((sum, c) => 
                      sum + (c.contracts?.reduce((s, contract) => s + contract.totalPrice, 0) || 0), 0
                    )
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العملاء</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={customers}
            searchKey="name"
            searchPlaceholder="البحث بالاسم أو الهاتف..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCustomer(null)
        }}
        title={editingCustomer ? 'تعديل العميل' : 'إضافة عميل جديد'}
        size="lg"
      >
        <CustomerForm
          customer={editingCustomer}
          onSave={handleSaveCustomer}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingCustomer(null)
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            هل أنت متأكد من حذف العميل &quot;{deletingCustomer?.name}&quot;؟
          </p>
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => setDeletingCustomer(null)}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={() => deletingCustomer && handleDeleteCustomer(deletingCustomer)}
            >
              حذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}