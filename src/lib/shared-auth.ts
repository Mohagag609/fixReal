import { NextRequest } from 'next/server'
import { getCachedUser } from './cached-auth'

// Shared authentication state for multiple API calls
let sharedAuthState: {
  user: { id: string; username: string; role: string } | null
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

  // Get token from request (optimized)
  let token = null
  
  // Try Authorization header first (most common)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else {
    // Fallback to cookies (less common, so check only if needed)
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      // Optimized cookie parsing
      const authTokenMatch = cookieHeader.match(/authToken=([^;]+)/)
      if (authTokenMatch) {
        token = authTokenMatch[1]
      }
    }
  }

  if (!token) {
    return { user: null, token: null }
  }

  // Get user from cache (with timeout)
  try {
    const user = await Promise.race([
      getCachedUser(token),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 2000)
      )
    ]) as { id: string; username: string; role: string } | null
    
    // Cache the result
    sharedAuthState = {
      user,
      token,
      timestamp: now
    }

    return { user, token }
  } catch (error) {
    console.log('Auth error:', error)
    return { user: null, token: null }
  }
}

export function clearSharedAuth() {
  sharedAuthState = null
}
