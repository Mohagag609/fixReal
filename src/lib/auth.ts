// Authentication utilities

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { getConfig } from './db/config'
import { getPrismaClient } from './prisma-clients'

const JWT_SECRET = process.env.JWT_SECRET || 'estate-management-super-secret-key-2024'

// Generate JWT token
export function generateToken(payload: { id: string; username: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Get user from request
export function getUserFromRequest(request: NextRequest): any {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  return verifyToken(token)
}

// Get user from token
export async function getUserFromToken(token: string): Promise<any> {
  const decoded = verifyToken(token)
  if (!decoded) {
    return null
  }
  
  try {
    const config = getConfig()
    if (!config) {
      return null
    }
    
    const prisma = getPrismaClient(config)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true
      }
    })
    
    if (!user || !user.isActive) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error getting user from token:', error)
    return null
  }
}

// Check if user has permission
export function hasPermission(user: any, requiredRole: string): boolean {
  if (!user) return false
  
  const roleHierarchy = {
    'admin': 3,
    'user': 1
  }
  
  const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0
  
  return userLevel >= requiredLevel
}

// Middleware for protected routes
export function requireAuth(requiredRole: string = 'user') {
  return async (request: NextRequest) => {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'غير مخول للوصول' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    if (!hasPermission(user, requiredRole)) {
      return new Response(
        JSON.stringify({ success: false, error: 'غير مخول للوصول' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return null
  }
}

// Create default users - DISABLED
export async function createDefaultUsers(): Promise<void> {
  // No default users created - admin panel is open access
  console.log('No default users created - admin panel is open access')
}