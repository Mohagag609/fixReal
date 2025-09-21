import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            مرحباً بك في لوحة التحكم
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            نظام إدارة شامل مع Next.js و PostgreSQL
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowRight className="h-5 w-5 ml-2" />
                العملاء
              </CardTitle>
              <CardDescription>
                إدارة بيانات العملاء والعلاقات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/customers">
                <Button className="w-full">إدارة العملاء</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowRight className="h-5 w-5 ml-2" />
                الفواتير
              </CardTitle>
              <CardDescription>
                إنشاء وإدارة الفواتير والمدفوعات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/invoices">
                <Button className="w-full">إدارة الفواتير</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowRight className="h-5 w-5 ml-2" />
                المعاملات
              </CardTitle>
              <CardDescription>
                تتبع جميع المعاملات المالية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/transactions">
                <Button className="w-full">إدارة المعاملات</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowRight className="h-5 w-5 ml-2" />
                المنتجات
              </CardTitle>
              <CardDescription>
                إدارة المخزون والمنتجات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/products">
                <Button className="w-full">إدارة المنتجات</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowRight className="h-5 w-5 ml-2" />
                لوحة التحكم
              </CardTitle>
              <CardDescription>
                نظرة عامة على الإحصائيات والأداء
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button className="w-full">عرض لوحة التحكم</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowRight className="h-5 w-5 ml-2" />
                الإعدادات
              </CardTitle>
              <CardDescription>
                تخصيص النظام والإعدادات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings">
                <Button className="w-full">الإعدادات</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            تم تطوير هذا النظام باستخدام أحدث التقنيات
          </p>
          <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
            <span>Next.js 14</span>
            <span>•</span>
            <span>TypeScript</span>
            <span>•</span>
            <span>PostgreSQL</span>
            <span>•</span>
            <span>Tailwind CSS</span>
          </div>
        </div>
      </div>
    </div>
  )
}