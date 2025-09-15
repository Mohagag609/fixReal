import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      user: {
        id: 'system',
        username: 'system',
        email: 'system@example.com',
        role: 'admin',
        isActive: true
      }
    })
  } catch (error) {
    console.error('Error getting user info:', error)
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}
