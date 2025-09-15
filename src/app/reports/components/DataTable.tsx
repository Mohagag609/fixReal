/**
 * مكون الجدول - Data Table Component
 * جدول متقدم باستخدام TanStack Table مع إمكانيات البحث والترتيب والتصدير
 */

'use client'

import { useState, useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  PaginationState
} from '@tanstack/react-table'
import { reportColumns, formatValue, getStatusColor, calculateTotals } from '../../../lib/reports/transformers'
import ExportMenu from './ExportMenu'
import { PrintButton } from './PrintButton'

interface DataTableProps {
  data: unknown[]
  reportType: string
  title: string
  onExport: (format: string) => void
  onPrint: () => void
}

export default function DataTable({ data, reportType, title, onExport, onPrint }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  })

  // تعريف الأعمدة
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<unknown>()
    const reportCols = reportColumns[reportType] || []
    
    return reportCols.map(col => 
      columnHelper.accessor(col.key, {
        id: col.key,
        header: col.title,
        cell: ({ getValue, row }) => {
          const value = getValue()
          const cellData = row.original[col.key]
          
          if (col.type === 'status') {
            return (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cellData?.raw || value)}`}>
                {cellData?.formatted || formatValue(value, col.type)}
              </span>
            )
          }
          
          if (col.type === 'currency' || col.type === 'number') {
            return (
              <span className={`text-${col.align || 'right'} font-mono`}>
                {cellData?.formatted || formatValue(value, col.type)}
              </span>
            )
          }
          
          return (
            <span className={`text-${col.align || 'left'}`}>
              {cellData?.formatted || formatValue(value, col.type)}
            </span>
          )
        },
        enableSorting: true,
        enableColumnFilter: true
      })
    )
  }, [reportType])

  // إعداد الجدول
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableGlobalFilter: true,
    enableColumnFilters: true,
    enableSorting: true,
    enableMultiSort: false
  })

  // حساب الإجماليات
  const totals = useMemo(() => {
    return calculateTotals(data, reportType)
  }, [data, reportType])

  // إحصائيات الجدول
  const stats = useMemo(() => {
    const pageStart = pagination.pageIndex * pagination.pageSize + 1
    const pageEnd = Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.length)
    
    return {
      total: data.length,
      pageStart,
      pageEnd,
      pageCount: table.getPageCount(),
      currentPage: pagination.pageIndex + 1
    }
  }, [data.length, pagination, table])

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* رأس الجدول */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">
              عرض {stats.pageStart}-{stats.pageEnd} من {stats.total} سجل
            </p>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <ExportMenu onExport={onExport} />
            <PrintButton onPrint={onPrint} />
          </div>
        </div>
      </div>

      {/* شريط البحث والفلاتر */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="relative">
              <input
                type="text"
                placeholder="البحث في جميع الأعمدة..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <select
              value={pagination.pageSize}
              onChange={(e) => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), pageIndex: 0 }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10 صفوف</option>
              <option value={25}>25 صف</option>
              <option value={50}>50 صف</option>
              <option value={100}>100 صف</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-500">
            {globalFilter && `تم العثور على ${table.getFilteredRowModel().rows.length} نتيجة`}
          </div>
        </div>
      </div>

      {/* الجدول */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center justify-end">
                      {header.isPlaceholder ? null : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                      {header.column.getIsSorted() === 'asc' && (
                        <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                      {header.column.getIsSorted() === 'desc' && (
                        <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          
          {/* صف الإجماليات */}
          {Object.keys(totals).length > 0 && (
            <tfoot className="bg-gray-100">
              <tr className="font-semibold">
                {columns.map((column, index) => {
                  const colKey = column.id as string
                  const total = totals[colKey]
                  
                  if (total) {
                    return (
                      <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatValue(total, 'currency')}
                      </td>
                    )
                  }
                  
                  if (index === 0) {
                    return (
                      <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        الإجمالي
                      </td>
                    )
                  }
                  
                  return <td key={index} className="px-6 py-4"></td>
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* الترقيم */}
      {table.getPageCount() > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              صفحة {stats.currentPage} من {stats.pageCount}
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                الأولى
              </button>
              
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                السابقة
              </button>
              
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                التالية
              </button>
              
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                الأخيرة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}