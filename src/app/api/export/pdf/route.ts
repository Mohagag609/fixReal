/**
 * API Route لتصدير PDF
 * يتعامل مع طلبات تصدير البيانات إلى ملفات PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { exportToPDF } from '../../../../lib/reports/exporters/toPDF'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, data, reportType, fileName } = body
    
    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { success: false, error: 'البيانات مطلوبة' },
        { status: 400 }
      )
    }
    
    // تصدير PDF
    const buffer = await exportToPDF({
      title: title || 'تقرير',
      data,
      reportType: reportType || 'general',
      fileName: fileName || `report-${new Date().toISOString().split('T')[0] || 'غير محدد'}.pdf`
    })
    
    const response = new NextResponse(buffer as BodyInit)
    response.headers.set('Content-Type', 'application/pdf')
    response.headers.set('Content-Disposition', `attachment; filename="${fileName || 'report'}.pdf"`)
    response.headers.set('Content-Length', buffer.length.toString())
    
    return response
    
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'خطأ في تصدير PDF' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'general'
    const title = searchParams.get('title') || 'تقرير'
    
    // هذا مثال بسيط - في التطبيق الحقيقي ستحتاج لجلب البيانات من قاعدة البيانات
    const sampleData = [
      { name: 'عينة 1', value: 100, date: '2024-01-01' },
      { name: 'عينة 2', value: 200, date: '2024-01-02' },
      { name: 'عينة 3', value: 300, date: '2024-01-03' }
    ]
    
    const buffer = await exportToPDF({
      title,
      data: sampleData,
      reportType,
      fileName: `${reportType}-report-${new Date().toISOString().split('T')[0] || 'غير محدد'}.pdf`
    })
    
    const response = new NextResponse(buffer as BodyInit)
    response.headers.set('Content-Type', 'application/pdf')
    response.headers.set('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`)
    response.headers.set('Content-Length', buffer.length.toString())
    
    return response
    
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'خطأ في تصدير PDF' 
      },
      { status: 500 }
    )
  }
}