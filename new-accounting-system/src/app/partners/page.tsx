'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Users, Building, DollarSign, Phone, MapPin } from 'lucide-react'
import { DataTable } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { PartnerForm } from '@/components/forms/PartnerForm'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'

interface Partner {
  id: string
  name: string
  phone?: string
  notes?: string
  createdAt: string
  unitPartners: Array<{
    id: string
    percentage: number
    unit: {
      code: string
      name?: string
      totalPrice: number
    }
  }>
  partnerDebts: Array<{
    id: string
    amount: number
    dueDate: string
    status: string
  }>
  partnerGroupPartners: Array<{
    id: string
    percentage: number
    partnerGroup: {
      name: string
    }
  }>
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null)

  // Fetch partners
  const fetchPartners = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/partners')
      const data = await response.json()
      setPartners(data.data || [])
    } catch (error) {
      console.error('Error fetching partners:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPartners()
  }, [])

  // Handle create/update partner
  const handleSavePartner = async (partnerData: Partial<Partner>) => {
    try {
      const url = editingPartner ? `/api/partners/${editingPartner.id}` : '/api/partners'
      const method = editingPartner ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerData),
      })

      if (response.ok) {
        await fetchPartners()
        setIsModalOpen(false)
        setEditingPartner(null)
      }
    } catch (error) {
      console.error('Error saving partner:', error)
    }
  }

  // Handle delete partner
  const handleDeletePartner = async (partner: Partner) => {
    try {
      const response = await fetch(`/api/partners/${partner.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchPartners()
        setDeletingPartner(null)
      }
    } catch (error) {
      console.error('Error deleting partner:', error)
    }
  }

  // Table columns
  const columns: ColumnDef<Partner>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'اسم الشريك',
        cell: ({ row }) => (
          <div className="flex items-center">
            <Users className="w-4 h-4 ml-2 text-blue-600" />
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
            <Phone className="w-4 h-4 ml-2" />
            {row.getValue('phone') || 'غير محدد'}
          </div>
        ),
      },
      {
        accessorKey: 'unitPartners',
        header: 'الوحدات',
        cell: ({ row }) => {
          const unitPartners = row.getValue('unitPartners') as Array<any>
          return (
            <div className="text-sm text-gray-600">
              {unitPartners?.length || 0} وحدة
            </div>
          )
        },
      },
      {
        accessorKey: 'partnerDebts',
        header: 'الديون',
        cell: ({ row }) => {
          const debts = row.getValue('partnerDebts') as Array<any>
          const totalDebts = debts?.reduce((sum, debt) => sum + debt.amount, 0) || 0
          return (
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 ml-2 text-red-600" />
              <span className="font-semibold text-red-600">
                {formatCurrency(totalDebts)}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: 'partnerGroupPartners',
        header: 'المجموعات',
        cell: ({ row }) => {
          const groups = row.getValue('partnerGroupPartners') as Array<any>
          return (
            <div className="text-sm text-gray-600">
              {groups?.length || 0} مجموعة
            </div>
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
          const partner = row.original
          return (
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingPartner(partner)
                  setIsModalOpen(true)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingPartner(partner)}
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

  const totalUnits = partners.reduce((sum, p) => sum + (p.unitPartners?.length || 0), 0)
  const totalDebts = partners.reduce((sum, p) => 
    sum + (p.partnerDebts?.reduce((s, debt) => s + debt.amount, 0) || 0), 0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الشركاء</h1>
          <p className="text-gray-600">إدارة الشركاء ومجموعات الشركاء</p>
        </div>
        <Button
          onClick={() => {
            setEditingPartner(null)
            setIsModalOpen(true)
          }}
          className="flex items-center"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة شريك جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الشركاء</p>
                <p className="text-2xl font-bold text-gray-900">{partners.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الوحدات</p>
                <p className="text-2xl font-bold text-gray-900">{totalUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الديون</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalDebts)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">متوسط الوحدات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {partners.length > 0 ? Math.round(totalUnits / partners.length) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الشركاء</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={partners}
            searchKey="name"
            searchPlaceholder="البحث باسم الشريك..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingPartner(null)
        }}
        title={editingPartner ? 'تعديل الشريك' : 'إضافة شريك جديد'}
        size="md"
      >
        <PartnerForm
          partner={editingPartner}
          onSave={handleSavePartner}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingPartner(null)
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingPartner}
        onClose={() => setDeletingPartner(null)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            هل أنت متأكد من حذف الشريك "{deletingPartner?.name}"؟
          </p>
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => setDeletingPartner(null)}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={() => deletingPartner && handleDeletePartner(deletingPartner)}
            >
              حذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}