import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'
import * as tar from 'tar'

// Simple database config for API use
const getDatabaseConfig = () => {
  const databaseType = (process.env.DATABASE_TYPE || 'postgresql-cloud') as 'postgresql-cloud' | 'postgresql-local' | 'sqlite'

  console.log('🔍 Database type from env:', process.env.DATABASE_TYPE)
  console.log('🔍 Using database type:', databaseType)

  let url: string
  let provider: 'postgresql' | 'sqlite'

  switch (databaseType) {
    case 'postgresql-cloud':
      url = process.env.DATABASE_URL_POSTGRES_CLOUD || process.env.DATABASE_URL || ''
      provider = 'postgresql'
      break
    case 'postgresql-local':
      url = process.env.DATABASE_URL_POSTGRES_LOCAL || process.env.DATABASE_URL || ''
      provider = 'postgresql'
      break
    case 'sqlite':
      url = process.env.DATABASE_URL_SQLITE || process.env.DATABASE_URL || ''
      provider = 'sqlite'
      break
    default:
      throw new Error(`Unsupported DATABASE_TYPE: ${databaseType}`)
  }

  if (!url) {
    throw new Error(`Database URL not found for type: ${databaseType}`)
  }

  return { type: databaseType, url, provider }
}

// Models to import (in correct order to respect foreign key constraints)
const MODELS = [
  'User', 'Customer', 'Unit', 'Contract', 'Installment', 'Voucher', 'Safe',
  'Partner', 'Broker', 'Transfer'
]

async function runImport(archivePath: string, options: { dryRun?: boolean; mode?: 'replace' | 'upsert'; batchSize?: number } = {}): Promise<{
  success: boolean
  dryRun: boolean
  stats: Record<string, number>
  warnings: string[]
}> {
  const { dryRun = false, mode = 'replace', batchSize = 1000 } = options
  
  console.log(`🚀 Starting database import (${dryRun ? 'dry run' : 'live'})...`)
  
  const config = getDatabaseConfig()
  console.log(`📊 Database type: ${config.type}`)
  console.log(`🔗 Provider: ${config.provider}`)
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.url
      }
    }
  })

  try {
    // Extract archive
    const extractDir = path.join('/tmp', `import-${Date.now()}`)
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true })
    }

    await tar.extract({
      file: archivePath,
      cwd: extractDir
    })

    // Read manifest
    const manifestPath = path.join(extractDir, 'manifest.json')
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Manifest file not found in backup')
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    console.log(`📋 Backup info: ${manifest.totalRecords} records from ${Object.keys(manifest.models).length} models`)

    // Validate schema compatibility
    if (manifest.database.provider !== config.provider) {
      throw new Error(`Schema provider mismatch: backup is ${manifest.database.provider}, current is ${config.provider}`)
    }

    const stats: Record<string, number> = {}
    const warnings: string[] = []

    if (mode === 'replace') {
      // Clear existing data first
      console.log('🗑️ Clearing existing data...')
      
      for (const modelName of MODELS.reverse()) { // Reverse order for deletion
        try {
          const model = (prisma as any)[modelName.toLowerCase()]
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
        const filePath = path.join(extractDir, 'data', `${modelName}.ndjson`)
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️  No data file for ${modelName}`)
          continue
        }

        const content = fs.readFileSync(filePath, 'utf8')
        const lines = content.trim().split('\n').filter(line => line.trim())
        
        if (lines.length === 0) {
          console.log(`📦 ${modelName}: No records to import`)
          stats[modelName] = 0
          continue
        }

        console.log(`📦 Importing ${modelName}: ${lines.length} records`)

        if (dryRun) {
          stats[modelName] = lines.length
          console.log(`🔍 Would import ${modelName}: ${lines.length} records`)
          continue
        }

        // Parse and import records in batches
        const model = (prisma as any)[modelName.toLowerCase()]
        if (!model) {
          console.log(`⚠️  Model ${modelName} not found in Prisma client`)
          stats[modelName] = 0
          continue
        }

        let imported = 0
        for (let i = 0; i < lines.length; i += batchSize) {
          const batch = lines.slice(i, i + batchSize)
          const records = batch.map((line: string) => JSON.parse(line))

          if (mode === 'upsert') {
            // Use upsert for each record
            for (const record of records) {
              try {
                await model.upsert({
                  where: { id: record.id },
                  update: record,
                  create: record
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
              await model.createMany({
                data: records,
                skipDuplicates: true
              })
              imported += records.length
            } catch (error) {
              console.error(`❌ Error creating records in ${modelName}:`, error)
              warnings.push(`Failed to create records in ${modelName}: ${error}`)
            }
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

    // Clean up
    fs.rmSync(extractDir, { recursive: true, force: true })

    const totalImported = Object.values(stats).reduce((a, b) => a + b, 0)
    console.log(`✅ Import ${dryRun ? 'dry run' : 'completed'}! Total records: ${totalImported}`)

    return {
      success: true,
      dryRun,
      stats,
      warnings
    }

  } finally {
    await prisma.$disconnect()
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

    let archivePath: string

    if (base64) {
      // Handle base64 data
      console.log('📦 Processing base64 backup data...')
      
      const buffer = Buffer.from(base64, 'base64')
      const fileName = `backup-${Date.now()}.tar.gz`
      archivePath = path.join('/tmp', fileName)
      
      fs.writeFileSync(archivePath, buffer)
      
    } else if (url) {
      // Handle URL download
      console.log(`📥 Downloading backup from URL: ${url}`)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to download backup: ${response.statusText}`)
      }
      
      const buffer = await response.arrayBuffer()
      const fileName = `backup-${Date.now()}.tar.gz`
      archivePath = path.join('/tmp', fileName)
      
      fs.writeFileSync(archivePath, Buffer.from(buffer))
    } else {
      throw new Error('No backup data provided')
    }

    // Verify file exists and is valid
    if (!fs.existsSync(archivePath)) {
      throw new Error('Backup file was not created')
    }

    const stats = fs.statSync(archivePath)
    console.log(`📊 Backup file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)

    // Run import
    const result = await runImport(archivePath, {
      dryRun: !apply,
      mode
    })

    // Clean up the temporary file
    fs.unlinkSync(archivePath)

    console.log(`✅ Import ${result.dryRun ? 'dry run' : 'completed'} successfully!`)

    return NextResponse.json({
      success: true,
      dryRun: result.dryRun,
      mode,
      stats: result.stats,
      warnings: result.warnings,
      message: result.dryRun 
        ? 'Dry run completed - no changes made'
        : 'Import completed successfully'
    })

  } catch (error) {
    console.error('❌ Import API failed:', error)
    
    // Clean up any temporary files
    try {
      const tempFiles = fs.readdirSync('/tmp').filter(f => f.startsWith('backup-'))
      tempFiles.forEach(f => fs.unlinkSync(path.join('/tmp', f)))
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary files:', cleanupError)
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import backup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    )
  }
}