'use client'

import { useState, useEffect, useMemo } from 'react'
// import { motion } from 'framer-motion'
import { PlusIcon, EditIcon, TrashIcon, FileTextIcon, UserIcon, BuildingIcon, DollarIcon } from '../../components/icons'
import { DataTable } from '../../components/tables/DataTable'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { ContractForm } from '../../components/forms/ContractForm'
import { formatDate, formatCurrency } from '../../lib/utils'
import { ColumnDef } from '@tanstack/react-table'

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

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [deletingContract, setDeletingContract] = useState<Contract | null>(null)

  // Fetch contracts
  const fetchContracts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/contracts')
      const data = await response.json()
      setContracts(data.data || [])
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [])

  // Handle create/update contract
  const handleSaveContract = async (contractData: Partial<Contract>) => {
    try {
      const url = editingContract ? `/api/contracts/${editingContract.id}` : '/api/contracts'
      const method = editingContract ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
      })

      if (response.ok) {
        await fetchContracts()
        setIsModalOpen(false)
        setEditingContract(null)
      }
    } catch (error) {
      console.error('Error saving contract:', error)
    }
  }

  // Handle delete contract
  const handleDeleteContract = async (contract: Contract) => {
    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchContracts()
        setDeletingContract(null)
      }
    } catch (error) {
      console.error('Error deleting contract:', error)
    }
  }

  // Table columns
  const columns: ColumnDef<Contract>[] = useMemo(
    () => [
      {
        accessorKey: 'unit.code',
        header: 'كود الوحدة',
        cell: ({ row }) => (
          <div className="flex items-center">
            <BuildingIcon className="w-4 h-4 ml-2 text-blue-600" />
            <span className="font-medium text-blue-600">
              {row.original.unit.code}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'customer.name',
        header: 'العميل',
        cell: ({ row }) => (
          <div className="flex items-center">
            <UserIcon className="w-4 h-4 ml-2 text-gray-600" />
            <div>
              <div className="font-medium text-gray-900">
                {row.original.customer.name}
              </div>
              {row.original.customer.phone && (
                <div className="text-sm text-gray-500">
                  {row.original.customer.phone}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'totalPrice',
        header: 'السعر الإجمالي',
        cell: ({ row }) => (
          <div className="flex items-center">
            <DollarIcon className="w-4 h-4 ml-2 text-green-600" />
            <span className="font-semibold text-green-600">
              {formatCurrency(row.getValue('totalPrice'))}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'downPayment',
        header: 'الدفعة المقدمة',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900">
            {formatCurrency(row.getValue('downPayment'))}
          </span>
        ),
      },
      {
        accessorKey: 'installmentType',
        header: 'نوع التقسيط',
        cell: ({ row }) => {
          const type = row.getValue('installmentType') as string
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {type}
            </span>
          )
        },
      },
      {
        accessorKey: 'installmentCount',
        header: 'عدد الأقساط',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {row.getValue('installmentCount')} قسط
          </span>
        ),
      },
      {
        accessorKey: 'paymentType',
        header: 'نوع الدفع',
        cell: ({ row }) => {
          const type = row.getValue('paymentType') as string
          const typeClasses = {
            'installment': 'bg-yellow-100 text-yellow-800',
            'cash': 'bg-green-100 text-green-800',
          }
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                typeClasses[type as keyof typeof typeClasses] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {type === 'installment' ? 'تقسيط' : 'نقدي'}
            </span>
          )
        },
      },
      {
        accessorKey: 'start',
        header: 'تاريخ العقد',
        cell: ({ row }) => formatDate(row.getValue('start')),
      },
      {
        accessorKey: 'brokerName',
        header: 'الوسيط',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">
            {row.getValue('brokerName') || 'غير محدد'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'الإجراءات',
        cell: ({ row }) => {
          const contract = row.original
          return (
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingContract(contract)
                  setIsModalOpen(true)
                }}
              >
                <EditIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingContract(contract)}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العقود</h1>
          <p className="text-gray-600">إدارة عقود البيع</p>
        </div>
        <Button
          onClick={() => {
            setEditingContract(null)
            setIsModalOpen(true)
          }}
          className="flex items-center"
        >
          <PlusIcon className="w-4 h-4 ml-2" />
          إنشاء عقد جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileTextIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي العقود</p>
                <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
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
                <p className="text-sm font-medium text-gray-600">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(contracts.reduce((sum, c) => sum + c.totalPrice, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">عقود التقسيط</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts.filter(c => c.paymentType === 'installment').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BuildingIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">عقود نقدية</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts.filter(c => c.paymentType === 'cash').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العقود</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={contracts}
            searchKey="unit.code"
            searchPlaceholder="البحث بكود الوحدة أو اسم العميل..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingContract(null)
        }}
        title={editingContract ? 'تعديل العقد' : 'إنشاء عقد جديد'}
        size="xl"
      >
        <ContractForm
          contract={editingContract}
          onSave={handleSaveContract}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingContract(null)
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingContract}
        onClose={() => setDeletingContract(null)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            هل أنت متأكد من حذف العقد للوحدة &quot;{deletingContract?.unit.code}&quot;؟
          </p>
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => setDeletingContract(null)}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={() => deletingContract && handleDeleteContract(deletingContract)}
            >
              حذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}