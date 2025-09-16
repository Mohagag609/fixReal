import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
// import { getUserFromToken } from '@/lib/auth'
import { createReadStream, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

export async function POST(_request: NextRequest) {
  try {

    // الحصول على إعدادات قاعدة البيانات
    const config = getConfig()
    if (!config) {
      return NextResponse.json({ error: 'قاعدة البيانات غير مُعدة' }, { status: 400 })
    }

    const prisma = getPrismaClient(config)

    // إنشاء مجلد مؤقت للنسخة الاحتياطية
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = join(tmpdir(), `estate-backup-${timestamp}`)
    const backupFile = join(tmpdir(), `estate-backup-${timestamp}.json`)
    
    try {
      mkdirSync(backupDir, { recursive: true })

      // تصدير البيانات من قاعدة البيانات
      const exportData = await exportDatabaseData(prisma)
      
      // حفظ البيانات في ملف JSON
      writeFileSync(backupFile, JSON.stringify(exportData, null, 2))

      // قراءة الملف وإرساله
      const fileStream = createReadStream(backupFile)
      const chunks: Buffer[] = []
      
      for await (const chunk of fileStream) {
        chunks.push(chunk)
      }
      
      const fileBuffer = Buffer.concat(chunks)

      // تنظيف الملفات المؤقتة
      rmSync(backupDir, { recursive: true, force: true })
      rmSync(backupFile, { force: true })

      // إرسال الملف
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="estate-backup-${timestamp}.json"`,
          'Content-Length': fileBuffer.length.toString()
        }
      })

    } catch (error) {
      // تنظيف في حالة الخطأ
      try {
        rmSync(backupDir, { recursive: true, force: true })
        rmSync(backupFile, { force: true })
      } catch {}
      
      throw error
    } finally {
      await prisma.$disconnect()
    }

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { 
        error: 'فشل في إنشاء النسخة الاحتياطية',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  }
}

async function exportDatabaseData(prisma: unknown) {
  const data: Record<string, unknown> = {}

  // تصدير جميع الجداول
  const tables = [
    'user', 'customer', 'broker', 'partner', 'partnerGroup', 
    'unit', 'contract', 'installment', 'safe', 'voucher',
    'transfer', 'auditLog', 'notification', 'unitPartner',
    'partnerDebt', 'brokerDue', 'partnerGroupPartner',
    'unitPartnerGroup', 'settings', 'keyVal'
  ]

  for (const table of tables) {
    try {
      const records = await (prisma as any)[table].findMany({
        orderBy: { id: 'asc' }
      })
      data[table] = records
    } catch (error) {
      console.warn(`Failed to export table ${table}:`, error)
      data[table] = []
    }
  }

  return data
}