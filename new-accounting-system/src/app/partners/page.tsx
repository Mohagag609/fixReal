'use client'

import { useState, useEffect, useMemo } from 'react'
// import { motion } from 'framer-motion'
import { PlusIcon, EditIcon, TrashIcon, UsersIcon, BuildingIcon, DollarIcon, PhoneIcon, MapPinIcon, DownloadIcon, RefreshCwIcon } from '../../components/icons'
import { DataTable } from '../../components/tables/DataTable'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { PartnerForm } from '../../components/forms/PartnerForm'
import { AdvancedSearch } from '../../components/AdvancedSearch'
import { DataGrouping } from '../../components/DataGrouping'
import { MasterDetailLayout } from '../../components/MasterDetailLayout'
import { NotificationProvider, useNotifications } from '../../components/NotificationSystem'
import { usePaginatedApi } from '../../hooks/usePaginatedApi'
import { checkDuplicateName, checkDuplicatePhone } from '../../lib/duplicateCheck'
import { formatDate, formatCurrency } from '../../lib/utils'
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
  [key: string]: unknown
}

function PartnersPageContent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  // const [groupedData, setGroupedData] = useState<Record<string, Partner[]>>({})
  // const [searchFilters, setSearchFilters] = useState<Record<string, unknown>[]>([])
  // const [dateRange, setDateRange] = useState<{ from: string; to: string } | undefined>()

  const { addNotification } = useNotifications()

  // Use paginated API hook
  const {
    data: partners,
    loading,
    // error,
    pagination,
    refresh,
    // setSearch,
    setFilters,
    setPage,
    clearFilters,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedApi<Partner>('/api/partners', {
    ttl: 60000,
    initialLimit: 20,
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault()
            document.getElementById('search-input')?.focus()
            break
          case 'r':
            e.preventDefault()
            refresh()
            break
          case 'Escape':
            e.preventDefault()
            setShowDetailPanel(false)
            setSelectedPartner(null)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [refresh])

  // Handle create/update partner
  const handleSavePartner = async (partnerData: Partial<Partner>) => {
    try {
      // Check for duplicates
      if (partners) {
        if (checkDuplicateName(partnerData.name || '', partners, editingPartner?.id)) {
          addNotification({
            type: 'error',
            title: 'خطأ في البيانات',
            message: 'اسم الشريك موجود بالفعل'
          })
          return
        }

        if (partnerData.phone && checkDuplicatePhone(partnerData.phone, partners, editingPartner?.id)) {
          addNotification({
            type: 'error',
            title: 'خطأ في البيانات',
            message: 'رقم الهاتف موجود بالفعل'
          })
          return
        }
      }

      const url = editingPartner ? `/api/partners/${editingPartner.id}` : '/api/partners'
      const method = editingPartner ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerData),
      })

      if (response.ok) {
        await refresh()
        setIsModalOpen(false)
        setEditingPartner(null)
        addNotification({
          type: 'success',
          title: 'تم بنجاح',
          message: editingPartner ? 'تم تحديث الشريك بنجاح' : 'تم إنشاء الشريك بنجاح'
        })
      } else {
        throw new Error('فشل في حفظ البيانات')
      }
    } catch (error) {
      console.error('Error saving partner:', error)
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'فشل في حفظ البيانات'
      })
    }
  }

  // Handle delete partner
  const handleDeletePartner = async (partner: Partner) => {
    try {
      const response = await fetch(`/api/partners/${partner.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await refresh()
        setDeletingPartner(null)
        addNotification({
          type: 'success',
          title: 'تم بنجاح',
          message: 'تم حذف الشريك بنجاح'
        })
      } else {
        throw new Error('فشل في حذف الشريك')
      }
    } catch (error) {
      console.error('Error deleting partner:', error)
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: 'فشل في حذف الشريك'
      })
    }
  }

  // Handle search
  const handleSearch = (filters: Array<{ field: string; operator: string; value: string | number; value2?: string | number }>) => {
    // setSearchFilters(filters)
    // setDateRange(dateRange)
    
    // Convert filters to API format
    const apiFilters: Record<string, unknown> = {}
    filters.forEach(filter => {
      apiFilters[filter.field] = filter.value
    })
    
    setFilters(apiFilters)
  }

  // Handle export
  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      addNotification({
        type: 'info',
        title: 'جاري التصدير',
        message: `جاري تصدير البيانات بصيغة ${format}...`
      })
      
      // TODO: Implement export functionality
      console.log(`Exporting as ${format}`)
      
      addNotification({
        type: 'success',
        title: 'تم التصدير',
        message: 'تم تصدير البيانات بنجاح'
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      addNotification({
        type: 'error',
        title: 'خطأ في التصدير',
        message: 'فشل في تصدير البيانات'
      })
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
        accessorKey: 'unitPartners',
        header: 'الوحدات',
        cell: ({ row }) => {
          const unitPartners = row.getValue('unitPartners') as Array<Record<string, unknown>>
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
          const debts = row.getValue('partnerDebts') as Array<Record<string, unknown>>
          const totalDebts = debts?.reduce((sum, debt) => sum + (debt.amount as number), 0) || 0
          return (
            <div className="flex items-center">
              <DollarIcon className="w-4 h-4 ml-2 text-red-600" />
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
          const groups = row.getValue('partnerGroupPartners') as Array<Record<string, unknown>>
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
                <EditIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingPartner(partner)}
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

  if (loading && !partners) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalUnits = partners?.reduce((sum, p) => sum + (p.unitPartners?.length || 0), 0) || 0
  const totalDebts = partners?.reduce((sum, p) => 
    sum + (p.partnerDebts?.reduce((s, debt) => s + debt.amount, 0) || 0), 0
  ) || 0

  const searchFields = [
    { key: 'name', label: 'اسم الشريك', type: 'text' as const },
    { key: 'phone', label: 'رقم الهاتف', type: 'text' as const },
    { key: 'notes', label: 'ملاحظات', type: 'text' as const },
  ]

  const groupingOptions = [
    { key: 'name', label: 'اسم الشريك', type: 'text' as const },
    { key: 'phone', label: 'رقم الهاتف', type: 'text' as const },
  ]

  const masterContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الشركاء</h1>
          <p className="text-gray-600">إدارة الشركاء ومجموعات الشركاء</p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            className="flex items-center"
          >
            <DownloadIcon className="w-4 h-4 ml-2" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            className="flex items-center"
          >
            <DownloadIcon className="w-4 h-4 ml-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={refresh}
            className="flex items-center"
          >
            <RefreshCwIcon className="w-4 h-4 ml-2" />
            تحديث
          </Button>
          <Button
            onClick={() => {
              setEditingPartner(null)
              setIsModalOpen(true)
            }}
            className="flex items-center"
          >
            <PlusIcon className="w-4 h-4 ml-2" />
            إضافة شريك جديد
          </Button>
        </div>
      </div>

      {/* Advanced Search */}
      <AdvancedSearch
        onSearch={handleSearch}
        onClear={() => {
          // setSearchFilters([])
          // setDateRange(undefined)
          clearFilters()
        }}
        searchFields={searchFields}
        dateRangeFields={[
          { key: 'createdAt', label: 'تاريخ الإنشاء' }
        ]}
      />

      {/* Data Grouping */}
      {partners && partners.length > 0 && (
        <DataGrouping
          data={partners}
          groupingOptions={groupingOptions}
          onGroupedDataChange={() => {}}
          onSortingChange={() => {}}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">إجمالي الشركاء</p>
                <p className="text-2xl font-bold text-gray-900">{partners?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BuildingIcon className="w-6 h-6 text-green-600" />
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
                <DollarIcon className="w-6 h-6 text-red-600" />
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
                <MapPinIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">متوسط الوحدات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {partners && partners.length > 0 ? Math.round(totalUnits / partners.length) : 0}
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
            data={partners || []}
            searchKey="name"
            searchPlaceholder="البحث باسم الشريك..."
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            عرض {((pagination.page - 1) * pagination.limit) + 1} إلى {Math.min(pagination.page * pagination.limit, pagination.total)} من {pagination.total} عنصر
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => setPage(pagination.page - 1)}
              disabled={!hasPrevPage}
            >
              السابق
            </Button>
            <span className="text-sm text-gray-700">
              صفحة {pagination.page} من {pagination.pages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(pagination.page + 1)}
              disabled={!hasNextPage}
            >
              التالي
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  const detailContent = selectedPartner ? (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{selectedPartner.name}</h2>
        <p className="text-gray-600">تفاصيل الشريك</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">اسم الشريك</label>
              <p className="text-gray-900">{selectedPartner.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">رقم الهاتف</label>
              <p className="text-gray-900">{selectedPartner.phone || 'غير محدد'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">ملاحظات</label>
              <p className="text-gray-900">{selectedPartner.notes || 'لا توجد ملاحظات'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الإحصائيات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">عدد الوحدات</label>
              <p className="text-gray-900">{selectedPartner.unitPartners?.length || 0}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">إجمالي الديون</label>
              <p className="text-gray-900">
                {formatCurrency(selectedPartner.partnerDebts?.reduce((sum, debt) => sum + debt.amount, 0) || 0)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">عدد المجموعات</label>
              <p className="text-gray-900">{selectedPartner.partnerGroupPartners?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ) : null

  return (
    <div className="h-full">
      <MasterDetailLayout
        master={masterContent}
        detail={detailContent}
        isDetailOpen={showDetailPanel}
        onDetailClose={() => {
          setShowDetailPanel(false)
          setSelectedPartner(null)
        }}
        onDetailOpen={() => setShowDetailPanel(true)}
        selectedItem={selectedPartner as Record<string, unknown> | undefined}
      />

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
            هل أنت متأكد من حذف الشريك &quot;{deletingPartner?.name}&quot;؟
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

export default function PartnersPage() {
  return (
    <NotificationProvider>
      <PartnersPageContent />
    </NotificationProvider>
  )
}