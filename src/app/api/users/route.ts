import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, token } = await getSharedAuth(request)
    
    if (!user || !token) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const config = getConfig()
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'قاعدة البيانات غير مُعدة' },
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const cursor = searchParams.get('cursor')

    const whereClause: any = {}
    if (cursor) {
      whereClause.id = { lt: cursor }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        id: 'desc'
      },
      take: limit + 1
    })

    const hasMore = users.length > limit
    const data = hasMore ? users.slice(0, limit) : users
    const nextCursor = hasMore ? data[data.length - 1].id : null

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        limit,
        nextCursor,
        hasMore
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
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
        success: false,
        error: 'فشل في جلب المستخدمين',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Skip authentication for user creation - this is needed for first user
    // Authentication will be required after users exist

    const config = getConfig()
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'قاعدة البيانات غير مُعدة' },
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
    
    const body = await request.json()
    const { username, password, email, role = 'user', adminKey } = body

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'اسم المستخدم وكلمة المرور مطلوبان'
        },
        { status: 400 }
      )
    }

    // Check if this is the first user (allow creation without admin key)
    const existingUsers = await prisma.user.count()
    
    // If there are existing users, require admin key
    if (existingUsers > 0) {
      const requiredAdminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || 'ADMIN_SECRET_2024'
      if (!adminKey || adminKey !== requiredAdminKey) {
        return NextResponse.json(
          {
            success: false,
            error: 'المفتاح السري للإدارة غير صحيح. إنشاء المستخدمين مقيد'
          },
          { status: 403 }
        )
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'اسم المستخدم موجود بالفعل'
        },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email: email || null,
        role
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'تم إنشاء المستخدم بنجاح'
    })
  } catch (error) {
    console.error('Error creating user:', error)
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
        success: false,
        error: 'فشل في إنشاء المستخدم',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  }
}