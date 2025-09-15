import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getUserFromToken } from '@/lib/auth'
import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'
import { tmpdir } from 'os'

// Validation schema
const ImportRequestSchema = z.object({
  base64: z.string().optional(),
  url: z.string().url().optional(),
  apply: z.boolean().default(false),
  mode: z.enum(['replace', 'upsert']).default('replace')
}).refine(
  (data) => data.base64 || data.url,
  {
    message: "Either 'base64' or 'url' must be provided"
  }
)

export async function POST(request: NextRequest) {
  try {

    console.log('🚀 Starting backup import via API...')
    
    const body = await request.json()
    const validatedData = ImportRequestSchema.parse(body)
    
    const { base64, url, apply, mode } = validatedData

    let backupData: unknown

    if (base64) {
      // Handle base64 data
      console.log('📦 Processing base64 backup data...')
      
      const buffer = Buffer.from(base64, 'base64')
      backupData = JSON.parse(buffer.toString('utf8'))
      
    } else if (url) {
      // Handle URL download
      console.log(`📥 Downloading backup from URL: ${url}`)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to download backup: ${response.statusText}`)
      }
      
      backupData = await response.json()
    } else {
      throw new Error('No backup data provided')
    }

    // Get database config
    const config = getConfig()
    if (!config) {
      return NextResponse.json({ error: 'قاعدة البيانات غير مُعدة' }, { status: 400 })
    }

    const prisma = getPrismaClient(config)

    try {
      // Run import
      const result = await runImport(prisma, backupData, {
        dryRun: !apply,
        mode
      })

      console.log(`✅ Import ${result.dryRun ? 'dry run' : 'completed'} successfully!`)

      const totalChanges = Object.values(result.changes).reduce((a, b) => a + Math.abs(b.difference), 0)
      
      return NextResponse.json({
        success: true,
        dryRun: result.dryRun,
        mode,
        stats: result.stats,
        warnings: result.warnings,
        changes: result.changes,
        totalChanges,
        message: result.dryRun 
          ? `تم فحص النسخة الاحتياطية - تم اكتشاف ${totalChanges} تغيير في البيانات`
          : 'تم استيراد النسخة الاحتياطية بنجاح'
      })

    } finally {
      await prisma.$disconnect()
    }

  } catch (error) {
    console.error('❌ Import API failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'فشل في استيراد النسخة الاحتياطية',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 400 }
    )
  }
}

async function runImport(prisma: unknown, backupData: unknown, options: { dryRun?: boolean; mode?: 'replace' | 'upsert' } = {}): Promise<{
  success: boolean
  dryRun: boolean
  stats: Record<string, number>
  warnings: string[]
  changes: Record<string, { current: number; backup: number; difference: number }>
}> {
  const { dryRun = false, mode = 'replace' } = options
  
  console.log(`🚀 Starting database import (${dryRun ? 'dry run' : 'live'})...`)
  
  const stats: Record<string, number> = {}
  const warnings: string[] = []
  const changes: Record<string, { current: number; backup: number; difference: number }> = {}

  // Models to import (in correct order to respect foreign key constraints)
  const MODELS = [
    'user', 'customer', 'broker', 'partner', 'partnerGroup', 
    'unit', 'contract', 'installment', 'safe', 'voucher',
    'transfer', 'auditLog', 'notification', 'unitPartner',
    'partnerDebt', 'brokerDue', 'partnerGroupPartner',
    'unitPartnerGroup', 'settings', 'keyVal'
  ]

  // First, get current data counts for comparison
  console.log('📊 Analyzing current database state...')
  for (const modelName of MODELS) {
    try {
      const model = prisma[modelName]
      if (!model) {
        changes[modelName] = { current: 0, backup: 0, difference: 0 }
        continue
      }

      const currentCount = await model.count()
      const backupCount = backupData[modelName]?.length || 0
      const difference = backupCount - currentCount

      changes[modelName] = {
        current: currentCount,
        backup: backupCount,
        difference: difference
      }

      console.log(`📊 ${modelName}: Current=${currentCount}, Backup=${backupCount}, Diff=${difference}`)
    } catch (error) {
      console.error(`❌ Error counting ${modelName}:`, error)
      changes[modelName] = { current: 0, backup: 0, difference: 0 }
    }
  }

    if (mode === 'replace') {
      // Clear existing data first
      console.log('🗑️ Clearing existing data...')
      
      for (const modelName of MODELS.reverse()) { // Reverse order for deletion
        try {
        const model = prisma[modelName]
          if (!model) continue

          if (!dryRun) {
            const result = await model.deleteMany({})
            console.log(`✅ Cleared ${modelName}: ${result.count} records`)
          } else {
            const count = await model.count()
            console.log(`🔍 Would clear ${modelName}: ${count} records`)
          }
        } catch (error) {
          console.error(`❌ Error clearing ${modelName}:`, error)
          warnings.push(`Failed to clear ${modelName}: ${error}`)
        }
      }
    }

    // Import data
    for (const modelName of MODELS) {
      try {
      const records = backupData[modelName] || []
      
      if (!Array.isArray(records) || records.length === 0) {
          console.log(`📦 ${modelName}: No records to import`)
          stats[modelName] = 0
          continue
        }

      console.log(`📦 Importing ${modelName}: ${records.length} records`)

      if (dryRun) {
        stats[modelName] = records.length
        console.log(`🔍 Would import ${modelName}: ${records.length} records`)
        continue
      }

      // Get model
      const model = prisma[modelName]
        if (!model) {
          console.log(`⚠️  Model ${modelName} not found in Prisma client`)
          stats[modelName] = 0
          continue
        }

        let imported = 0

          if (mode === 'upsert') {
            // Use upsert for each record
            for (const record of records) {
              try {
            // Import all data as-is without filtering
            const processedRecord = record
            
                await model.upsert({
                  where: { id: record.id },
              update: processedRecord,
              create: processedRecord
                })
                imported++
              } catch (error) {
                console.error(`❌ Error upserting record in ${modelName}:`, error)
                warnings.push(`Failed to upsert record in ${modelName}: ${error}`)
              }
            }
          } else {
            // Use createMany for replace mode
            try {
          let processedRecords = records
          
          // Import all data as-is without filtering
          processedRecords = records
          
              await model.createMany({
            data: processedRecords,
                skipDuplicates: true
              })
          imported = processedRecords.length
            } catch (error) {
              console.error(`❌ Error creating records in ${modelName}:`, error)
              warnings.push(`Failed to create records in ${modelName}: ${error}`)
          }
        }

        stats[modelName] = imported
        console.log(`✅ ${modelName}: ${imported} records imported`)

      } catch (error) {
        console.error(`❌ Error importing ${modelName}:`, error)
        stats[modelName] = 0
        warnings.push(`Failed to import ${modelName}: ${error}`)
      }
    }

    const totalImported = Object.values(stats).reduce((a, b) => a + b, 0)
  const totalChanges = Object.values(changes).reduce((a, b) => a + Math.abs(b.difference), 0)

    console.log(`✅ Import ${dryRun ? 'dry run' : 'completed'}! Total records: ${totalImported}`)
  console.log(`📊 Total changes detected: ${totalChanges}`)

    return {
      success: true,
      dryRun,
      stats,
    warnings,
    changes
  }
}