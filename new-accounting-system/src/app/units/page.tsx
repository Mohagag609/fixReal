'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, Building, MapPin, DollarSign } from 'lucide-react'
import { DataTable } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { UnitForm } from '@/components/forms/UnitForm'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ColumnDef } from '@tanstack/react-table'

interface Unit {
  id: string
  code: string
  name?: string
  unitType: string
  area?: string
  floor?: string
  building?: string
  totalPrice: number
  status: string
  notes?: string
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
      phone?: string
    }
  }>
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null)

  // Fetch units
  const fetchUnits = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/units')
      const data = await response.json()
      setUnits(data.data || [])
    } catch (error) {
      console.error('Error fetching units:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnits()
  }, [])

  // Handle create/update unit
  const handleSaveUnit = async (unitData: Partial<Unit>) => {
    try {
      const url = editingUnit ? `/api/units/${editingUnit.id}` : '/api/units'
      const method = editingUnit ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unitData),
      })

      if (response.ok) {
        await fetchUnits()
        setIsModalOpen(false)
        setEditingUnit(null)
      }
    } catch (error) {
      console.error('Error saving unit:', error)
    }
  }

  // Handle delete unit
  const handleDeleteUnit = async (unit: Unit) => {
    try {
      const response = await fetch(`/api/units/${unit.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchUnits()
        setDeletingUnit(null)
      }
    } catch (error) {
      console.error('Error deleting unit:', error)
    }
  }

  // Table columns
  const columns: ColumnDef<Unit>[] = useMemo(
    () => [
      {
        accessorKey: 'code',
        header: 'كود الوحدة',
        cell: ({ row }) => (
          <div className="font-medium text-blue-600">{row.getValue('code')}</div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'اسم الوحدة',
        cell: ({ row }) => (
          <div className="font-medium text-gray-900">
            {row.getValue('name') || 'غير محدد'}
          </div>
        ),
      },
      {
        accessorKey: 'unitType',
        header: 'نوع الوحدة',
        cell: ({ row }) => {
          const type = row.getValue('unitType') as string
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {type}
            </span>
          )
        },
      },
      {
        accessorKey: 'area',
        header: 'المساحة',
        cell: ({ row }) => (
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 ml-2" />
            {row.getValue('area') || 'غير محدد'}
          </div>
        ),
      },
      {
        accessorKey: 'building',
        header: 'المبنى',
        cell: ({ row }) => (
          <div className="flex items-center text-gray-600">
            <Building className="w-4 h-4 ml-2" />
            {row.getValue('building') || 'غير محدد'}
          </div>
        ),
      },
      {
        accessorKey: 'totalPrice',
        header: 'السعر',
        cell: ({ row }) => (
          <div className="flex items-center text-gray-900 font-medium">
            <DollarSign className="w-4 h-4 ml-2" />
            {formatCurrency(row.getValue('totalPrice'))}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'الحالة',
        cell: ({ row }) => {
          const status = row.getValue('status') as string
          const statusClasses = {
            'متاحة': 'bg-green-100 text-green-800',
            'مباعة': 'bg-purple-100 text-purple-800',
            'محجوزة': 'bg-yellow-100 text-yellow-800',
          }
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {status}
            </span>
          )
        },
      },
      {
        accessorKey: 'contracts',
        header: 'العقود',
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
          const unit = row.original
          return (
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingUnit(unit)
                  setIsModalOpen(true)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingUnit(unit)}
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
          <h1 className="text-2xl font-bold text-gray-900">الوحدات</h1>
          <p className="text-gray-600">إدارة الوحدات العقارية</p>
        </div>
        <Button
          onClick={() => {
            setEditingUnit(null)
            setIsModalOpen(true)
          }}
          className="flex items-center"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة وحدة جديدة
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الوحدات</p>
                <p className="text-2xl font-bold text-gray-900">{units.length}</p>
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
                <p className="text-sm font-medium text-gray-600">الوحدات المتاحة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {units.filter(u => u.status === 'متاحة').length}
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
                <p className="text-sm font-medium text-gray-600">الوحدات المباعة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {units.filter(u => u.status === 'مباعة').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي القيمة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(units.reduce((sum, u) => sum + u.totalPrice, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الوحدات</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={units}
            searchKey="code"
            searchPlaceholder="البحث بالكود أو الاسم..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingUnit(null)
        }}
        title={editingUnit ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}
        size="lg"
      >
        <UnitForm
          unit={editingUnit}
          onSave={handleSaveUnit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingUnit(null)
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingUnit}
        onClose={() => setDeletingUnit(null)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            هل أنت متأكد من حذف الوحدة &quot;{deletingUnit?.code}&quot;؟
          </p>
          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => setDeletingUnit(null)}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={() => deletingUnit && handleDeleteUnit(deletingUnit)}
            >
              حذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}