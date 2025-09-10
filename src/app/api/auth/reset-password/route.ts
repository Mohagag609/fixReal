import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'
import { clearUserCache } from '@/lib/cached-auth'
import * as bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, token } = await getSharedAuth(request)
    
    if (!user || !token) {
      return NextResponse.json(
        { error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const { username, adminKey, newPassword } = await request.json()

    if (!username || !adminKey || !newPassword) {
      return NextResponse.json(
        { error: 'جميع البيانات مطلوبة' },
        { status: 400 }
      )
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'غير مخول للوصول - يجب أن تكون مدير' },
        { status: 403 }
      )
    }

    // Get database config and client
    const config = getConfig()
    if (!config) {
      return NextResponse.json(
        { error: 'قاعدة البيانات غير مُعدة' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient(config)
    
    // Connect to database
    await prisma.$connect()

    // Check if user exists using raw SQL
    const userResult = await prisma.$queryRaw`
      SELECT id, username, email, role, "isActive" 
      FROM users 
      WHERE username = ${username}
    ` as any[]

    if (!userResult || userResult.length === 0) {
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    const targetUser = userResult[0]

    // Verify admin key
    const correctAdminKey = process.env.ADMIN_KEY || 'ADMIN_SECRET_2024'
    if (adminKey !== correctAdminKey) {
      await prisma.$disconnect()
      return NextResponse.json(
        { error: 'مفتاح الإدارة غير صحيح' },
        { status: 401 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password using raw SQL
    await prisma.$executeRaw`
      UPDATE users 
      SET password = ${hashedPassword}, "updatedAt" = NOW()
      WHERE id = ${targetUser.id}
    `

    await prisma.$disconnect()

    // Clear user cache to force re-authentication
    clearUserCache(token)

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      {
        error: 'فشل في تغيير كلمة المرور',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}