import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/auth/verify - Verify token
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const user = await getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'غير مخول للوصول' },
        { status: 401 }
      )
    }

    const response: ApiResponse = {
      success: true,
      data: user,
      message: 'التوكن صحيح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error verifying token:', error)
    return NextResponse.json(
      { success: false, error: 'خطأ في التحقق من التوكن' },
      { status: 500 }
    )
  }
}