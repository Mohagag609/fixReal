/**
 * API Route للتقارير - Reports API
 * يتعامل مع طلبات إنشاء التقارير المختلفة
 */

import { NextRequest, NextResponse } from 'next/server'
import { getInstallmentsReport, getPaymentsReport, getAgingReport, ReportFilters } from '../../../../lib/reports/queries'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const filters: ReportFilters = await request.json()
    
    // التحقق من نوع التقرير
    const validReports = ['installments', 'payments', 'aging']
    if (!validReports.includes(slug)) {
      return NextResponse.json(
        { success: false, error: 'نوع التقرير غير صحيح' },
        { status: 400 }
      )
    }
    
    let data: unknown[] = []
    
    // تشغيل التقرير المناسب
    switch (slug) {
      case 'installments':
        data = await getInstallmentsReport(filters)
        break
        
      case 'payments':
        data = await getPaymentsReport(filters)
        break
        
      case 'aging':
        data = await getAgingReport(filters)
        break
        
      default:
        return NextResponse.json(
          { success: false, error: 'نوع التقرير غير مدعوم' },
          { status: 400 }
        )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        rows: data,
        count: data.length,
        reportType: slug,
        filters: filters,
        generatedAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'خطأ في إنشاء التقرير' 
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const { searchParams } = new URL(request.url)
    
    // تحويل query parameters إلى filters
    const filters: ReportFilters = {
      projectId: searchParams.get('projectId') || '',
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || '',
      status: searchParams.get('status') || '',
      method: searchParams.get('method') || '',
      q: searchParams.get('q') || ''
    }
    
    // إزالة القيم الفارغة
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof ReportFilters] === undefined) {
        delete filters[key as keyof ReportFilters]
      }
    })
    
    let data: unknown[] = []
    
    // تشغيل التقرير المناسب
    switch (slug) {
      case 'installments':
        data = await getInstallmentsReport(filters)
        break
        
      case 'payments':
        data = await getPaymentsReport(filters)
        break
        
      case 'aging':
        data = await getAgingReport(filters)
        break
        
      default:
        return NextResponse.json(
          { success: false, error: 'نوع التقرير غير مدعوم' },
          { status: 400 }
        )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        rows: data,
        count: data.length,
        reportType: slug,
        filters: filters,
        generatedAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'خطأ في إنشاء التقرير' 
      },
      { status: 500 }
    )
  }
}