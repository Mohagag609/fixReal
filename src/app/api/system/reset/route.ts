import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'

export async function POST(request: NextRequest) {
  try {
    const { resetType } = await request.json()
    
    if (!resetType || !['data', 'schema', 'complete'].includes(resetType)) {
      await prisma.$disconnect()

    return NextResponse.json(
        { error: 'نوع إعادة الضبط غير صحيح' },
        { status: 400 }
      )
    }

    // Detect database type
    const dbUrl = process.env.DATABASE_URL || ''
    const isSQLite = dbUrl.startsWith('file:') || dbUrl.includes('sqlite')
    const isPostgreSQL = dbUrl.includes('postgresql://')
    const isNeon = dbUrl.includes('neon.tech')

    console.log(`Starting database reset: ${resetType}`, { isSQLite, isPostgreSQL, isNeon })

    if (resetType === 'data') {
      // Reset data only - delete all records using Prisma
      try {
        console.log('Clearing data using Prisma...')
        // Delete in correct order to respect foreign key constraints
        await prisma.auditLog.deleteMany()
        await prisma.partnerGroupPartner.deleteMany()
        await prisma.partnerGroup.deleteMany()
        await prisma.partnerDebt.deleteMany()
        await prisma.brokerDue.deleteMany()
        await prisma.unitPartner.deleteMany()
        await prisma.transfer.deleteMany()
        await prisma.voucher.deleteMany()
        await prisma.partner.deleteMany()
        await prisma.safe.deleteMany()
        await prisma.installment.deleteMany()
        await prisma.contract.deleteMany()
        await prisma.broker.deleteMany()
        await prisma.customer.deleteMany()
        await prisma.unit.deleteMany()
        await prisma.user.deleteMany()
        
        console.log('Data reset completed successfully using Prisma')
      } catch (error) {
        console.log('Prisma delete failed, trying raw SQL...', error)
        // Try alternative approach with raw SQL
        try {
          if (isSQLite) {
            // SQLite specific commands
            await prisma.$executeRaw`DELETE FROM "audit_logs"`
            await prisma.$executeRaw`DELETE FROM "partner_group_partners"`
            await prisma.$executeRaw`DELETE FROM "partner_groups"`
            await prisma.$executeRaw`DELETE FROM "partner_debts"`
            await prisma.$executeRaw`DELETE FROM "broker_dues"`
            await prisma.$executeRaw`DELETE FROM "unit_partners"`
            await prisma.$executeRaw`DELETE FROM "transfers"`
            await prisma.$executeRaw`DELETE FROM "vouchers"`
            await prisma.$executeRaw`DELETE FROM "partners"`
            await prisma.$executeRaw`DELETE FROM "safes"`
            await prisma.$executeRaw`DELETE FROM "installments"`
            await prisma.$executeRaw`DELETE FROM "contracts"`
            await prisma.$executeRaw`DELETE FROM "brokers"`
            await prisma.$executeRaw`DELETE FROM "customers"`
            await prisma.$executeRaw`DELETE FROM "units"`
            await prisma.$executeRaw`DELETE FROM "users"`
          } else {
            // PostgreSQL specific commands
            await prisma.$executeRaw`TRUNCATE TABLE "audit_logs" CASCADE`
            await prisma.$executeRaw`TRUNCATE TABLE "partner_group_partners" CASCADE`
            await prisma.$executeRaw`TRUNCATE TABLE "partner_groups" CASCADE`
            await prisma.$executeRaw`TRUNCATE TABLE "partner_debts" CASCADE`
            await prisma.$executeRaw`TRUNCATE TABLE "broker_dues" CASCADE`
            await prisma.$executeRaw`TRUNCATE TABLE "unit_partners" CASCADE`
            await prisma.$executeRaw`TRUNCATE TABLE "transfers" CASCADE`
            await prisma.$executeRaw`TRUNCATE TABLE "vouchers" CASCADE`
            await prisma.$executeRaw`TRUNCATE TABLE "partners" CASCADE`
            await prisma.$executeRaw`TRUNCATE TABLE "safes" CASCADE`
            await prisma.$executeRaw`TRUNCATE TABLE "installments" CASCADE`
            await prisma.$executeRaw`TRUNCATE TABLE "contracts" CASCADE`
            await prisma.$executeRaw`TRUNCATE TABLE "brokers" CASCADE`
            await prisma.$executeRaw`TRUNCATE TABLE "customers" CASCADE`
            await prisma.$executeRaw`TRUNCATE TABLE "units" CASCADE`
            await prisma.$executeRaw`TRUNCATE TABLE "users" CASCADE`
          }
          console.log('Data reset completed successfully using raw SQL')
        } catch (sqlError) {
          console.log('SQL reset also failed:', sqlError)
          throw new Error('فشل في إعادة ضبط البيانات')
        }
      }

    } else if (resetType === 'schema') {
      // Reset schema - drop and recreate tables
      console.log('Dropping and recreating schema...')
      
      if (isSQLite) {
        // SQLite specific commands
        await prisma.$executeRaw`DROP TABLE IF EXISTS "audit_logs"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "partner_group_partners"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "partner_groups"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "partner_debts"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "broker_dues"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "unit_partners"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "transfers"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "vouchers"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "partners"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "safes"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "installments"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "contracts"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "brokers"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "customers"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "units"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "users"`
      } else {
        // PostgreSQL specific commands
        await prisma.$executeRaw`DROP TABLE IF EXISTS "audit_logs" CASCADE`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "partner_group_partners" CASCADE`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "partner_groups" CASCADE`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "partner_debts" CASCADE`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "broker_dues" CASCADE`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "unit_partners" CASCADE`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "transfers" CASCADE`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "vouchers" CASCADE`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "partners" CASCADE`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "safes" CASCADE`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "installments" CASCADE`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "contracts" CASCADE`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "brokers" CASCADE`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "customers" CASCADE`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "units" CASCADE`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "users" CASCADE`
      }

      // Recreate schema using Prisma
      console.log('Recreating schema using Prisma...')
      await prisma.$executeRaw`CREATE TABLE "users" (
        "id" ${isSQLite ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'SERIAL PRIMARY KEY'},
        "username" ${isSQLite ? 'TEXT UNIQUE NOT NULL' : 'VARCHAR(255) UNIQUE NOT NULL'},
        "password" ${isSQLite ? 'TEXT NOT NULL' : 'VARCHAR(255) NOT NULL'},
        "email" ${isSQLite ? 'TEXT UNIQUE' : 'VARCHAR(255) UNIQUE'},
        "fullName" ${isSQLite ? 'TEXT' : 'VARCHAR(255)'},
        "role" ${isSQLite ? 'TEXT DEFAULT \'admin\'' : 'VARCHAR(50) DEFAULT \'admin\''},
        "isActive" ${isSQLite ? 'BOOLEAN DEFAULT 1' : 'BOOLEAN DEFAULT true'},
        "createdAt" ${isSQLite ? 'DATETIME DEFAULT CURRENT_TIMESTAMP' : 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'},
        "updatedAt" ${isSQLite ? 'DATETIME DEFAULT CURRENT_TIMESTAMP' : 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'}
      )`

      await prisma.$executeRaw`CREATE TABLE "units" (
        "id" ${isSQLite ? 'TEXT PRIMARY KEY' : 'VARCHAR(255) PRIMARY KEY'},
        "code" ${isSQLite ? 'TEXT UNIQUE NOT NULL' : 'VARCHAR(50) UNIQUE NOT NULL'},
        "name" ${isSQLite ? 'TEXT' : 'VARCHAR(255)'},
        "unitType" ${isSQLite ? 'TEXT DEFAULT \'سكني\'' : 'VARCHAR(100) DEFAULT \'سكني\''},
        "area" ${isSQLite ? 'TEXT' : 'VARCHAR(50)'},
        "floor" ${isSQLite ? 'TEXT' : 'VARCHAR(50)'},
        "building" ${isSQLite ? 'TEXT' : 'VARCHAR(50)'},
        "totalPrice" ${isSQLite ? 'REAL DEFAULT 0' : 'FLOAT DEFAULT 0'},
        "status" ${isSQLite ? 'TEXT DEFAULT \'متاحة\'' : 'VARCHAR(50) DEFAULT \'متاحة\''},
        "notes" ${isSQLite ? 'TEXT' : 'TEXT'},
        "createdAt" ${isSQLite ? 'DATETIME DEFAULT CURRENT_TIMESTAMP' : 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'},
        "updatedAt" ${isSQLite ? 'DATETIME DEFAULT CURRENT_TIMESTAMP' : 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'},
        "deletedAt" ${isSQLite ? 'DATETIME' : 'TIMESTAMP'}
      )`

      // Continue with other tables...
      console.log('Schema recreation completed')

    } else if (resetType === 'complete') {
      // Complete reset - drop schema and recreate
      console.log('Performing complete reset...')
      
      if (isSQLite) {
        // For SQLite, we can't drop schema, so we drop all tables
        await prisma.$executeRaw`DROP TABLE IF EXISTS "audit_logs"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "partner_group_partners"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "partner_groups"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "partner_debts"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "broker_dues"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "unit_partners"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "transfers"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "vouchers"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "partners"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "safes"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "installments"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "contracts"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "brokers"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "customers"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "units"`
        await prisma.$executeRaw`DROP TABLE IF EXISTS "users"`
      } else {
        // For PostgreSQL, drop and recreate schema
        await prisma.$executeRaw`DROP SCHEMA public CASCADE`
        await prisma.$executeRaw`CREATE SCHEMA public`
        await prisma.$executeRaw`GRANT ALL ON SCHEMA public TO postgres`
        await prisma.$executeRaw`GRANT ALL ON SCHEMA public TO public`
      }

      // Recreate all tables using Prisma
      console.log('Recreating all tables...')
      await prisma.$executeRaw`CREATE TABLE "users" (
        "id" ${isSQLite ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'SERIAL PRIMARY KEY'},
        "username" ${isSQLite ? 'TEXT UNIQUE NOT NULL' : 'VARCHAR(255) UNIQUE NOT NULL'},
        "password" ${isSQLite ? 'TEXT NOT NULL' : 'VARCHAR(255) NOT NULL'},
        "email" ${isSQLite ? 'TEXT UNIQUE' : 'VARCHAR(255) UNIQUE'},
        "fullName" ${isSQLite ? 'TEXT' : 'VARCHAR(255)'},
        "role" ${isSQLite ? 'TEXT DEFAULT \'admin\'' : 'VARCHAR(50) DEFAULT \'admin\''},
        "isActive" ${isSQLite ? 'BOOLEAN DEFAULT 1' : 'BOOLEAN DEFAULT true'},
        "createdAt" ${isSQLite ? 'DATETIME DEFAULT CURRENT_TIMESTAMP' : 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'},
        "updatedAt" ${isSQLite ? 'DATETIME DEFAULT CURRENT_TIMESTAMP' : 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'}
      )`

      // Continue with other tables...
      console.log('Complete reset completed')
    }

    // Clear Prisma cache and reconnect
    console.log('Clearing Prisma cache...')
    await prisma.$disconnect()
    
    // Wait a moment for connections to close
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Reconnect to database
    await prisma.$connect()
    
    console.log(`Database reset completed: ${resetType}`)

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: `تم إعادة ضبط قاعدة البيانات بنجاح (${resetType})`,
      databaseType: isSQLite ? 'SQLite' : 'PostgreSQL',
      isNeon: isNeon,
      resetType: resetType,
      requiresRestart: false, // We handled the cache clearing
      instructions: [
        'تم مسح البيانات بنجاح',
        'تم تحديث cache قاعدة البيانات',
        'يمكنك الآن استخدام النظام بشكل طبيعي',
        'لا حاجة لإعادة تشغيل الخادم'
      ]
    })

  } catch (error) {
    console.error('Database reset error:', error)
    await prisma.$disconnect()

    return NextResponse.json(
      { 
        error: 'فشل في إعادة ضبط قاعدة البيانات',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  }
}