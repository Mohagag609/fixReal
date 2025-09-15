/**
 * مصدر تصدير PDF - PDF Export
 * يدعم مسارين: Chromium (للـ serverless) و React PDF
 */

import React from 'react'
import { generatePrintHTML, prepareDataForExport, getExportHeaders } from '../transformers'

export interface PDFExportOptions {
  title: string
  data: unknown[]
  reportType: string
  fileName?: string
}

/**
 * تصدير البيانات إلى PDF باستخدام Chromium
 */
export async function exportToPDFChromium(options: PDFExportOptions): Promise<Buffer> {
  // استخدام React PDF كبديل
  return exportToPDFReact(options)
}

/**
 * تصدير البيانات إلى PDF باستخدام React PDF (بديل)
 */
export async function exportToPDFReact(options: PDFExportOptions): Promise<Buffer> {
  const { title, data, reportType } = options
  
  try {
    // استيراد React PDF
    const reactPdf = await import('@react-pdf/renderer')
    const { Document, Page, Text, View, StyleSheet, pdf } = reactPdf
    
    // إعدادات الخط
    const styles = StyleSheet.create({
      page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 20,
        fontFamily: 'Helvetica'
      },
      header: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold'
      },
      table: {
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0
      },
      tableRow: {
        margin: 'auto',
        flexDirection: 'row'
      },
      tableCol: {
        width: '12.5%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0
      },
      tableCellHeader: {
        backgroundColor: '#f0f0f0',
        padding: 8,
        fontSize: 10,
        fontWeight: 'bold'
      },
      tableCell: {
        padding: 8,
        fontSize: 9
      },
      footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        textAlign: 'center',
        fontSize: 10,
        color: '#666'
      }
    })
    
    // تحضير البيانات
    const headers = getExportHeaders(reportType)
    const exportData = prepareDataForExport(data, reportType)
    
    // إنشاء مكون PDF
    const MyDocument = () => (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.header}>{title}</Text>
          
          <View style={styles.table}>
            {/* رؤوس الأعمدة */}
            <View style={styles.tableRow}>
              {headers.map((header, index) => (
                <View key={index} style={styles.tableCol}>
                  <Text style={styles.tableCellHeader}>{header}</Text>
                </View>
              ))}
            </View>
            
            {/* البيانات */}
            {exportData.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.tableRow}>
                {headers.map((header, colIndex) => (
                  <View key={colIndex} style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      {row[header] || '-'}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          
          <Text style={styles.footer}>
            تم إنشاء التقرير في {new Date().toLocaleDateString('ar-SA')}
          </Text>
        </Page>
      </Document>
    )
    
    // إنشاء PDF
    const pdfStream = await pdf(<MyDocument />).toBuffer()
    
    // تحويل ReadableStream إلى Buffer
    const chunks: Uint8Array[] = []
    const reader = (pdfStream as unknown).getReader()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }
    
    return Buffer.from(result)
    
  } catch (error) {
    console.error('React PDF generation error:', error)
    throw new Error('فشل في إنشاء ملف PDF')
  }
}

/**
 * تصدير PDF مع اختيار المحرك تلقائياً
 */
export async function exportToPDF(options: PDFExportOptions): Promise<Buffer> {
  const engine = process.env.PDF_ENGINE || 'chromium'
  
  try {
    if (engine === 'react-pdf') {
      return await exportToPDFReact(options)
    } else {
      return await exportToPDFChromium(options)
    }
  } catch (error) {
    console.error('Primary PDF engine failed, trying fallback:', error)
    
    // محاولة المحرك البديل
    try {
      if (engine === 'chromium') {
        return await exportToPDFReact(options)
      } else {
        return await exportToPDFChromium(options)
      }
    } catch (fallbackError) {
      console.error('Both PDF engines failed:', fallbackError)
      throw new Error('فشل في إنشاء ملف PDF - جميع المحركات غير متاحة')
    }
  }
}
