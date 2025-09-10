import { NextRequest } from 'next/server'
import { getCachedUser } from './cached-auth'

// Shared authentication state for multiple API calls
let sharedAuthState: {
  user: any | null
  token: string | null
  timestamp: number
} | null = null

const AUTH_CACHE_DURATION = 30 * 1000 // 30 seconds

export async function getSharedAuth(request: NextRequest) {
  const now = Date.now()
  
  // Check if we have valid cached auth
  if (sharedAuthState && 
      sharedAuthState.token && 
      sharedAuthState.user && 
      (now - sharedAuthState.timestamp) < AUTH_CACHE_DURATION) {
    return { user: sharedAuthState.user, token: sharedAuthState.token }
  }

  // Get token from request
  let token = null
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }

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
    return { user: null, token: null }
  }

  // Get user from cache
  const user = await getCachedUser(token)
  
  // Cache the result
  sharedAuthState = {
    user,
    token,
    timestamp: now
  }

  return { user, token }
}

export function clearSharedAuth() {
  sharedAuthState = null
}
