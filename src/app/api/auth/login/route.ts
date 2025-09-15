import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { generateToken, verifyPassword } from '@/lib/auth'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// POST /api/auth/login - Login user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم وكلمة المرور مطلوبان' },
        { status: 400 }
      )
    }

    // التحقق من إعداد قاعدة البيانات
    const config = getConfig()
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'قاعدة البيانات غير مُعدة. يرجى الذهاب إلى صفحة الإعداد أولاً' },
        { status: 400 }
      )
    }

    // الحصول على عميل Prisma
    const prisma = getPrismaClient(config)

    // البحث عن المستخدم في قاعدة البيانات
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      )
    }

    // التحقق من كلمة المرور
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      )
    }

    // إنشاء التوكن
    const token = generateToken({
      id: user.id.toString(),
      username: user.username,
      role: user.role as 'admin' | 'user'
    })

    const response: ApiResponse<{ token: string; user: { id: string; username: string; role: string } }> = {
      success: true,
      data: {
        token,
        user: {
          id: user.id.toString(),
          username: user.username,
          role: user.role
        }
      },
      message: 'تم تسجيل الدخول بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error during login:', error)
    
    // التحقق من نوع الخطأ
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // إذا كان الخطأ متعلق بقاعدة البيانات غير موجودة
    if (errorMessage.includes('does not exist') || 
        errorMessage.includes('Database') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('PrismaClientInitializationError')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'خطأ في قاعدة البيانات',
          redirectTo: '/setup',
          message: 'قاعدة البيانات غير مُعدة بشكل صحيح. سيتم توجيهك لصفحة الإعدادات'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}