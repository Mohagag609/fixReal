import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'

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

    const { username, adminKey } = await request.json()

    if (!username || !adminKey) {
      return NextResponse.json(
        { error: 'اسم المستخدم والمفتاح السري مطلوبان' },
        { status: 400 }
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
    
    // إعادة الاتصال في حالة انقطاع الاتصال
    try {
      await prisma.$connect()
    } catch (error) {
      console.log('Reconnecting to database...')
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }

    // Check admin key
    const correctAdminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || 'ADMIN_SECRET_2024'
    if (adminKey !== correctAdminKey) {
      return NextResponse.json(
        { error: 'المفتاح السري للإدارة غير صحيح. يرجى التحقق من المفتاح السري' },
        { status: 401 }
      )
    }

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: 'تم التحقق بنجاح',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Verify reset error:', error)
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
      {
        error: 'فشل في التحقق',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}