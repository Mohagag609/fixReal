'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Building,
  FileText,
  Wallet,
  TrendingUp,
  DollarSign,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface DashboardData {
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
  recent: {
    vouchers: Array<{
      id: string
      type: string
      amount: number
      date: string
      description: string
      safe: { name: string }
    }>
    contracts: Array<{
      id: string
      totalPrice: number
      start: string
      unit: { code: string; name: string }
      customer: { name: string }
    }>
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

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports/dashboard')
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">فشل في تحميل بيانات لوحة التحكم</p>
      </div>
    )
  }

  const { overview, financial, recent } = dashboardData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-600">نظرة عامة على النظام</p>
        </div>
        <div className="text-sm text-gray-500">
          آخر تحديث: {formatDate(new Date())}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">العملاء</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building className="w-6 h-6 text-green-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">الوحدات</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.totalUnits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">العقود</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.totalContracts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
        </motion.div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 ml-2" />
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
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
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FileText className="w-5 h-5 ml-2" />
                  العقود الأخيرة
                </span>
                <Link href="/contracts">
                  <Button variant="outline" size="sm">
                    عرض الكل
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recent.contracts.length > 0 ? (
                  recent.contracts.map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{contract.unit.code}</p>
                        <p className="text-sm text-gray-600">{contract.customer.name}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(contract.totalPrice)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(contract.start)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">لا توجد عقود حديثة</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Wallet className="w-5 h-5 ml-2" />
                  الشيكات الأخيرة
                </span>
                <Link href="/vouchers">
                  <Button variant="outline" size="sm">
                    عرض الكل
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recent.vouchers.length > 0 ? (
                  recent.vouchers.map((voucher) => (
                    <div key={voucher.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{voucher.description}</p>
                        <p className="text-sm text-gray-600">{voucher.safe.name}</p>
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold ${
                          voucher.type === 'receipt' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {voucher.type === 'receipt' ? '+' : '-'}{formatCurrency(voucher.amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(voucher.date)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">لا توجد شيكات حديثة</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>الإجراءات السريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/customers">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <Users className="w-6 h-6 mb-2" />
                  <span>إضافة عميل</span>
                </Button>
              </Link>
              <Link href="/units">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <Building className="w-6 h-6 mb-2" />
                  <span>إضافة وحدة</span>
                </Button>
              </Link>
              <Link href="/contracts">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <FileText className="w-6 h-6 mb-2" />
                  <span>إنشاء عقد</span>
                </Button>
              </Link>
              <Link href="/vouchers">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                  <Wallet className="w-6 h-6 mb-2" />
                  <span>إضافة شيك</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}