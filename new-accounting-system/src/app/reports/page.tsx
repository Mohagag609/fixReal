'use client'

import { useState, useEffect } from 'react'
// import { motion } from 'framer-motion' // Temporarily disabled for Netlify
import { BarChart3, Download, Filter, CalendarIcon, DollarIcon, TrendingUp, TrendingDown, UsersIcon, BuildingIcon, FileTextIcon, Wallet } from '../../components/icons'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { formatCurrency } from '../../lib/utils'

interface ReportData {
  overview: {
    totalCustomers: number
    totalUnits: number
    totalContracts: number
    totalSafes: number
    availableUnits: number
    soldUnits: number
    activeContracts: number
    totalVouchers: number
  }
  financial: {
    totalSales: number
    totalRevenue: number
    totalExpenses: number
    totalSafesBalance: number
    netProfit: number
  }
  charts: {
    monthlySales: Array<{
      start: string
      _sum: { totalPrice: number | null }
      _count: { id: number }
    }>
    unitTypesDistribution: Array<{
      unitType: string
      _count: { id: number }
    }>
    paymentStatusDistribution: Array<{
      status: string
      _count: { id: number }
      _sum: { amount: number | null }
    }>
  }
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports/dashboard')
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (format: 'pdf' | 'excel') => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">فشل في تحميل بيانات التقارير</p>
      </div>
    )
  }

  const { overview, financial, charts } = reportData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
          <p className="text-gray-600">تقارير شاملة وتحليلات مفصلة</p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            className="flex items-center"
          >
            <Download className="w-4 h-4 ml-2" />
            تصدير Excel
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            className="flex items-center"
          >
            <Download className="w-4 h-4 ml-2" />
            تصدير PDF
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 ml-2" />
            فلترة التقارير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="من تاريخ"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
            <Input
              label="إلى تاريخ"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
            <div className="flex items-end">
              <Button
                onClick={fetchReportData}
                className="w-full"
              >
                تطبيق الفلتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className="animate-fade-in-up"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">العملاء</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          className="animate-fade-in-up"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BuildingIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">الوحدات</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.totalUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          className="animate-fade-in-up"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileTextIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">العقود</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.totalContracts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          className="animate-fade-in-up"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Wallet className="w-6 h-6 text-orange-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">الخزائن</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.totalSafes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="animate-fade-in-left"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarIcon className="w-5 h-5 ml-2" />
                النظرة المالية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">إجمالي المبيعات</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(financial.totalSales)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">إجمالي الإيرادات</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(financial.totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">إجمالي المصروفات</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(financial.totalExpenses)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <span className="text-gray-900 font-medium">صافي الربح</span>
                <span className={`font-bold ${
                  financial.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(financial.netProfit)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          className="animate-fade-in-right"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 ml-2" />
                إحصائيات الوحدات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الوحدات المتاحة</span>
                <span className="font-semibold text-blue-600">{overview.availableUnits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الوحدات المباعة</span>
                <span className="font-semibold text-purple-600">{overview.soldUnits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">العقود النشطة</span>
                <span className="font-semibold text-green-600">{overview.activeContracts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">إجمالي الشيكات</span>
                <span className="font-semibold text-orange-600">{overview.totalVouchers}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="animate-fade-in-up"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 ml-2" />
                توزيع أنواع الوحدات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {charts.unitTypesDistribution.map((item) => (
                  <div key={item.unitType} className="flex items-center justify-between">
                    <span className="text-gray-600">{item.unitType}</span>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${(item._count.id / charts.unitTypesDistribution.reduce((sum, i) => sum + i._count.id, 0)) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item._count.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          className="animate-fade-in-up"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingDown className="w-5 h-5 ml-2" />
                توزيع حالات الدفع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {charts.paymentStatusDistribution.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-gray-600">{item.status}</span>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            item.status === 'مدفوع' ? 'bg-green-600' : 
                            item.status === 'معلق' ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ 
                            width: `${(item._count.id / charts.paymentStatusDistribution.reduce((sum, i) => sum + i._count.id, 0)) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item._count.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Monthly Sales Chart */}
      <div
        className="animate-fade-in-up"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="w-5 h-5 ml-2" />
              المبيعات الشهرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {charts.monthlySales.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(item.start).toLocaleDateString('ar-EG', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </p>
                    <p className="text-sm text-gray-600">{item._count.id} عقد</p>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(item._sum.totalPrice || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}