#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as tar from 'tar'
// Simple database manager for scripts
const getDatabaseConfig = () => {
  const databaseType = process.env.DATABASE_TYPE as 'postgresql-cloud' | 'postgresql-local' | 'sqlite'
  
  if (!databaseType) {
    throw new Error('DATABASE_TYPE environment variable is required')
  }

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

interface ImportOptions {
  dryRun?: boolean
  mode?: 'replace' | 'upsert'
  batchSize?: number
}

interface BackupManifest {
  backup_version: string
  app_version: string
  schema: {
    provider: 'postgresql' | 'sqlite'
    prisma_migration_id: string
    models: readonly string[]
  }
  database_type: string
  created_at: string
  count_by_model: Record<string, number>
}

export async function runImport(archivePath: string, options: ImportOptions = {}): Promise<{
  success: boolean
  dryRun: boolean
  stats: Record<string, number>
  warnings: string[]
}> {
  const { dryRun = false, mode = 'replace', batchSize = 1000 } = options
  
  console.log(`🚀 Starting database import from: ${archivePath}`)
  console.log(`📋 Mode: ${dryRun ? 'DRY RUN' : mode}`)
  
  const config = getDatabaseConfig()
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.url
      }
    }
  })
  
  // Create temporary directory for extraction
  const tempDir = path.join('/tmp', `import-${Date.now()}`)
  fs.mkdirSync(tempDir, { recursive: true })

  const warnings: string[] = []
  const stats: Record<string, number> = {}

  try {
    // Extract archive
    console.log('📦 Extracting archive...')
    await tar.extract({
      file: archivePath,
      cwd: tempDir
    })

    // Read manifest
    const manifestPath = path.join(tempDir, 'manifest.json')
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Manifest file not found in backup')
    }

    const manifest: BackupManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    
    // Check provider compatibility
    if (manifest.schema.provider !== config.provider) {
      const warning = `⚠️  Provider mismatch: backup is ${manifest.schema.provider}, current is ${config.provider}`
      console.warn(warning)
      warnings.push(warning)
    }

    console.log(`📊 Backup info:`)
    console.log(`   Version: ${manifest.backup_version}`)
    console.log(`   Created: ${manifest.created_at}`)
    console.log(`   Database: ${manifest.database_type}`)
    console.log(`   Provider: ${manifest.schema.provider}`)

    const dataDir = path.join(tempDir, 'data')
    if (!fs.existsSync(dataDir)) {
      throw new Error('Data directory not found in backup')
    }

    // Process each model
    for (const [modelName, expectedCount] of Object.entries(manifest.count_by_model)) {
      console.log(`📦 Processing ${modelName}...`)
      
      const model = (prisma as any)[modelName.toLowerCase()]
      if (!model) {
        console.warn(`⚠️  Model ${modelName} not found in Prisma client`)
        continue
      }

      const filePath = path.join(dataDir, `${modelName}.ndjson`)
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Data file for ${modelName} not found`)
        continue
      }

      const records: unknown[] = []
      const fileContent = fs.readFileSync(filePath, 'utf8')
      
      for (const line of fileContent.trim().split('\n')) {
        if (line.trim()) {
          records.push(JSON.parse(line))
        }
      }

      console.log(`   Found ${records.length} records (expected: ${expectedCount})`)

      if (dryRun) {
        stats[modelName] = records.length
        console.log(`   ✅ DRY RUN: Would import ${records.length} records`)
        continue
      }

      // Apply changes
      if (mode === 'replace') {
        console.log(`   🗑️  Clearing existing ${modelName} records...`)
        await prisma.$transaction(async (tx) => {
          await ((tx as any)[modelName.toLowerCase()] as any).deleteMany({})
        })
      }

      // Import records in batches
      let imported = 0
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)
        
        await prisma.$transaction(async (tx) => {
          if (mode === 'replace') {
            await ((tx as any)[modelName.toLowerCase()] as any).createMany({
              data: batch,
              skipDuplicates: true
            })
          } else if (mode === 'upsert') {
            for (const record of batch) {
              const { id, ...data } = record as any
              await ((tx as any)[modelName.toLowerCase()] as any).upsert({
                where: { id },
                update: data,
                create: record
              })
            }
          }
        })
        
        imported += batch.length
        console.log(`   📈 Imported ${imported}/${records.length} records`)
      }

      stats[modelName] = imported
      console.log(`   ✅ ${modelName}: ${imported} records imported`)
    }

    console.log('✅ Import completed successfully!')
    
    return {
      success: true,
      dryRun,
      stats,
      warnings
    }

  } catch (error) {
    console.error('❌ Import failed:', error)
    throw error
  } finally {
    // Clean up temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true })
    await prisma.$disconnect()
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2)
  const archivePath = args[0]
  const apply = args.includes('--apply')
  
  if (!archivePath) {
    console.error('❌ Archive path is required')
    console.log('Usage: ts-node import.ts <archive-path> [--apply]')
    process.exit(1)
  }

  if (!fs.existsSync(archivePath)) {
    console.error(`❌ Archive file not found: ${archivePath}`)
    process.exit(1)
  }

  runImport(archivePath, { dryRun: !apply })
    .then((result) => {
      console.log(`🎉 Import ${result.dryRun ? 'dry run' : 'completed'} successfully!`)
      console.log('📊 Statistics:', result.stats)
      if (result.warnings.length > 0) {
        console.log('⚠️  Warnings:', result.warnings)
      }
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Import failed:', error)
      process.exit(1)
    })
}