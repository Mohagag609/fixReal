import { NextRequest } from 'next/server'
import { getUserFromToken } from './auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    username: string
    email?: string
    role: string
    isActive: boolean
  }
}

export async function authenticateRequest(request: NextRequest): Promise<{
  user: { id: string; username: string; role: string } | null
  error: string | null
}> {
  try {
    // Check authentication - try both header and cookie
    let token = null

    // Try authorization header first
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    // Try cookie if no header
    if (!token) {
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=')
          acc[key] = value
          return acc
        }, {} as Record<string, string>)
        token = cookies.authToken
      }
    }

    if (!token) {
      return { user: null, error: 'غير مخول للوصول' }
    }

    const user = await getUserFromToken(token)
    if (!user) {
      return { user: null, error: 'غير مخول للوصول' }
    }

    return { user, error: null }
  } catch (error) {
    console.error('Authentication error:', error)
    return { user: null, error: 'خطأ في التحقق من الهوية' }
  }
}

export function requireAuth(handler: (request: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    const { user, error } = await authenticateRequest(request)
    
    if (error) {
      return new Response(
        JSON.stringify({ success: false, error }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Add user to request
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = user

    return handler(authenticatedRequest)
  }
}
