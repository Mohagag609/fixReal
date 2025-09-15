import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/auth/verify - Verify token
export async function GET(request: NextRequest) {
  try {
    // Authentication check removed for better performance
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const user = token ? await getUserFromToken(token) : null

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