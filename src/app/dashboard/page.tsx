'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, CreditCard, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// Mock data - replace with real data from API
const stats = [
  {
    title: 'إجمالي العملاء',
    value: '1,234',
    change: '+12%',
    changeType: 'positive' as const,
    icon: Users,
  },
  {
    title: 'الفواتير الشهرية',
    value: '45',
    change: '+8%',
    changeType: 'positive' as const,
    icon: FileText,
  },
  {
    title: 'إجمالي الإيرادات',
    value: formatCurrency(125000),
    change: '+15%',
    changeType: 'positive' as const,
    icon: CreditCard,
  },
  {
    title: 'نمو المبيعات',
    value: '23%',
    change: '+5%',
    changeType: 'positive' as const,
    icon: TrendingUp,
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground">
          نظرة عامة على أداء عملك وإحصائيات مهمة
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span
                  className={
                    stat.changeType === 'positive'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {stat.change}
                </span>{' '}
                من الشهر الماضي
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات الشهرية</CardTitle>
            <CardDescription>
              تطور الإيرادات خلال الأشهر الستة الماضية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>رسم بياني للإيرادات سيتم إضافته هنا</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>المعاملات الأخيرة</CardTitle>
            <CardDescription>
              آخر 5 معاملات تمت في النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: 1, customer: 'أحمد محمد', amount: 1500, date: '2024-01-15' },
                { id: 2, customer: 'فاطمة علي', amount: 2300, date: '2024-01-14' },
                { id: 3, customer: 'محمد حسن', amount: 800, date: '2024-01-13' },
                { id: 4, customer: 'نور الدين', amount: 3200, date: '2024-01-12' },
                { id: 5, customer: 'سارة أحمد', amount: 1100, date: '2024-01-11' },
              ].map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{transaction.customer}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
          <CardDescription>
            الوصول السريع للوظائف الأكثر استخداماً
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border rounded-lg hover:bg-accent transition-colors text-center">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-medium">فاتورة جديدة</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-accent transition-colors text-center">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-medium">عميل جديد</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-accent transition-colors text-center">
              <CreditCard className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-medium">معاملة جديدة</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-accent transition-colors text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-medium">تقرير مبيعات</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}