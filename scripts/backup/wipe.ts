#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client'
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

type WipeMode = 'soft' | 'hard'

interface WipeOptions {
  mode: WipeMode
  confirm?: boolean
}

// Order matters for foreign key constraints
// Children first, then parents
const WIPE_ORDER = [
  'AuditLog',
  'BrokerDue',
  'PartnerDebt', 
  'PartnerGroupPartner',
  'UnitPartner',
  'Transfer',
  'Installment',
  'Voucher',
  'Contract',
  'PartnerGroup',
  'Partner',
  'Broker',
  'Safe',
  'Unit',
  'Customer',
  'User'
] as const

export async function runWipe(options: WipeOptions): Promise<{
  success: boolean
  mode: WipeMode
  deletedCounts: Record<string, number>
}> {
  const { mode, confirm = false } = options
  
  console.log(`🚀 Starting database wipe...`)
  console.log(`📋 Mode: ${mode}`)
  
  if (mode === 'hard' && process.env.ALLOW_HARD_WIPE !== 'true') {
    throw new Error('Hard wipe is disabled. Set ALLOW_HARD_WIPE=true to enable.')
  }

  if (!confirm && mode === 'hard') {
    throw new Error('Hard wipe requires explicit confirmation')
  }

  const config = getDatabaseConfig()
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.url
      }
    }
  })
  
  console.log(`📊 Database: ${config.type} (${config.provider})`)

  const deletedCounts: Record<string, number> = {}

  try {
    if (mode === 'soft') {
      console.log('🗑️  Performing soft delete...')
      
      // Use Prisma's soft delete if available, otherwise use deleteMany
      for (const modelName of WIPE_ORDER) {
        const model = prisma[modelName.toLowerCase()]
        if (!model) {
          console.warn(`⚠️  Model ${modelName} not found`)
          continue
        }

        try {
          // Try soft delete first (if the model supports it)
          const result = await model.updateMany({
            where: { deletedAt: null },
            data: { deletedAt: new Date() }
          })
          deletedCounts[modelName] = result.count
          console.log(`✅ ${modelName}: ${result.count} records soft deleted`)
        } catch (error) {
          // Fallback to hard delete if soft delete is not supported
          console.log(`⚠️  Soft delete not supported for ${modelName}, using hard delete`)
          const result = await model.deleteMany({})
          deletedCounts[modelName] = result.count
          console.log(`✅ ${modelName}: ${result.count} records deleted`)
        }
      }

    } else if (mode === 'hard') {
      console.log('💥 Performing hard delete...')
      
      // Use transactions to ensure data integrity
      await prisma.$transaction(async (tx) => {
        for (const modelName of WIPE_ORDER) {
          const model = (tx as unknown)[modelName.toLowerCase()]
          if (!model) {
            console.warn(`⚠️  Model ${modelName} not found`)
            continue
          }

          const result = await model.deleteMany({})
          deletedCounts[modelName] = result.count
          console.log(`✅ ${modelName}: ${result.count} records deleted`)
        }
      })
    }

    const totalDeleted = Object.values(deletedCounts).reduce((a, b) => a + b, 0)
    console.log(`🎉 Wipe completed! Total records deleted: ${totalDeleted}`)

    return {
      success: true,
      mode,
      deletedCounts
    }

  } catch (error) {
    console.error('❌ Wipe failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2)
  const mode = args[0] as WipeMode
  
  if (!mode || !['soft', 'hard'].includes(mode)) {
    console.error('❌ Invalid mode. Use "soft" or "hard"')
    console.log('Usage: ts-node wipe.ts <soft|hard>')
    process.exit(1)
  }

  if (mode === 'hard') {
    console.log('⚠️  WARNING: Hard wipe will permanently delete all data!')
    console.log('   This action cannot be undone.')
    console.log('   Make sure you have a backup before proceeding.')
  }

  runWipe({ mode, confirm: true })
    .then((result) => {
      console.log(`🎉 Wipe completed successfully!`)
      console.log('📊 Deleted counts:', result.deletedCounts)
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Wipe failed:', error)
      process.exit(1)
    })
}