/**
 * API Route لتصدير CSV
 * يتعامل مع طلبات تصدير البيانات إلى ملفات CSV
 */

import { NextRequest, NextResponse } from 'next/server'
import { exportToCSV, exportMultipleCSV, createCSVZip } from '../../../../lib/reports/exporters/toCSV'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, data, reportType, fileName, multipleSheets, asZip } = body
    
    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { success: false, error: 'البيانات مطلوبة' },
        { status: 400 }
      )
    }
    
    let response: NextResponse
    
    if (multipleSheets && Array.isArray(multipleSheets)) {
      // تصدير متعدد الملفات
      if (asZip) {
        // تصدير كملف ZIP
        const buffer = await createCSVZip(multipleSheets)
        response = new NextResponse(buffer as unknown)
        response.headers.set('Content-Type', 'application/zip')
        response.headers.set('Content-Disposition', `attachment; filename="reports-${new Date()??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.zip"`)
        response.headers.set('Content-Length', buffer.length.toString())
      } else {
        // إرجاع JSON مع ملفات CSV متعددة
        const csvFiles = exportMultipleCSV(multipleSheets)
        return NextResponse.json({
          success: true,
          data: csvFiles
        })
      }
    } else {
      // تصدير ملف واحد
      const csv = exportToCSV({
        title: title || 'تقرير',
        data,
        reportType: reportType || 'general',
        fileName: fileName || `report-${new Date()??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.csv`
      })
      
      const buffer = Buffer.from(csv, 'utf-8')
      response = new NextResponse(buffer)
      response.headers.set('Content-Type', 'text/csv; charset=utf-8')
      response.headers.set('Content-Disposition', `attachment; filename="${fileName || 'report'}.csv"`)
      response.headers.set('Content-Length', buffer.length.toString())
    }
    
    return response
    
  } catch (error) {
    console.error('CSV export error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'خطأ في تصدير CSV' 
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
    
    const csv = exportToCSV({
      title,
      data: sampleData,
      reportType,
      fileName: `${reportType}-report-${new Date()??.toISOString().split('T')[0] || 'غير محدد' || 'غير محدد'}.csv`
    })
    
    const buffer = Buffer.from(csv, 'utf-8')
    const response = new NextResponse(buffer)
    response.headers.set('Content-Type', 'text/csv; charset=utf-8')
    response.headers.set('Content-Disposition', `attachment; filename="${reportType}-report.csv"`)
    response.headers.set('Content-Length', buffer.length.toString())
    
    return response
    
  } catch (error) {
    console.error('CSV export error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'خطأ في تصدير CSV' 
      },
      { status: 500 }
    )
  }
}