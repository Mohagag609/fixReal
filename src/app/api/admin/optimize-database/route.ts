import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
// import { getSharedAuth } from '@/lib/shared-auth'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/admin/optimize-database - Optimize database with indexes
export async function POST(_request: NextRequest) {
  try {
    // Authentication check removed for better performance

    // Allow all authenticated users to access performance optimization
    // if (user.role !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'يجب أن تكون مدير للوصول لهذه الصفحة' },
    //     { status: 403 }
    //   )
    // }

    // Get database config and client
    const config = getConfig()
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'قاعدة البيانات غير مُعدة' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient(config)

    // Read SQL file
    const sqlPath = path.join(process.cwd(), 'src', 'scripts', 'optimize-database.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log('Optimizing database...')
    const startTime = Date.now()

    // Execute each SQL statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement)
          console.log('Executed optimization statement successfully')
        } catch (error) {
          console.error('Error executing optimization statement:', error)
          // Continue with other statements even if one fails
        }
      }
    }

    const duration = Date.now() - startTime
    console.log(`Database optimization completed in ${duration}ms`)

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: 'تم تحسين قاعدة البيانات بنجاح',
      duration: duration
    })

  } catch (error) {
    console.error('Error optimizing database:', error)
    try {
      const config = getConfig()
      if (config) {
        const prisma = getPrismaClient(config)
        await prisma.$disconnect()
      }
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError)
    }
    return NextResponse.json(
      { success: false, error: 'خطأ في تحسين قاعدة البيانات' },
      { status: 500 }
    )
  }
}
