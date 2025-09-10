import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'
import { getSharedAuth } from '@/lib/shared-auth'
import { validateCustomer } from '@/utils/validation'
import { ApiResponse, Customer, PaginatedResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/customers - Get customers with pagination
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, token } = await getSharedAuth(request)
    
    // For now, allow access without authentication for customers list
    // You can uncomment the following lines to require authentication
    // if (!user || !token) {
    //   return NextResponse.json(
    //     { success: false, error: 'غير مخول للوصول' },
    //     { status: 401 }
    //   )
    // }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const cursor = searchParams.get('cursor')
    const search = searchParams.get('search') || ''

    let whereClause: any = { deletedAt: null }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (cursor) {
      whereClause.id = { lt: cursor }
    }

    // Get database config and client
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

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { id: 'desc' },
      take: limit + 1,
      select: {
        id: true,
        name: true,
        phone: true,
        nationalId: true,
        address: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    })

    await prisma.$disconnect()

    const hasMore = customers.length > limit
    const data = hasMore ? customers.slice(0, limit) : customers
    const nextCursor = hasMore ? data[data.length - 1].id : null

    const response: PaginatedResponse<Customer> = {
      success: true,
      data,
      pagination: {
        limit,
        nextCursor,
        hasMore
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting customers:', error)
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
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, token } = await getSharedAuth(request)
    
    // For now, allow access without authentication for customer creation
    // You can uncomment the following lines to require authentication
    // if (!user || !token) {
    //   return NextResponse.json(
    //     { success: false, error: 'غير مخول للوصول' },
    //     { status: 401 }
    //   )
    // }

    const body = await request.json()
    const { name, phone, nationalId, address, status, notes } = body

    // Validate customer data
    const validation = validateCustomer({ name, phone, nationalId, address, status, notes })
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Get database config and client
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

    // Check if phone already exists (only if phone is provided)
    if (phone && phone.trim()) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { 
          phone,
          deletedAt: null
        }
      })

      if (existingCustomer) {
        return NextResponse.json(
          { success: false, error: 'رقم الهاتف مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    // Check if nationalId already exists (only if nationalId is provided)
    if (nationalId && nationalId.trim()) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { 
          nationalId,
          deletedAt: null
        }
      })

      if (existingCustomer) {
        return NextResponse.json(
          { success: false, error: 'الرقم القومي مستخدم بالفعل' },
          { status: 400 }
        )
      }
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name,
        phone: phone || null,
        nationalId: nationalId || null,
        address: address || null,
        status: status || 'نشط',
        notes: notes || null
      }
    })

    await prisma.$disconnect()

    const response: ApiResponse<Customer> = {
      success: true,
      data: customer,
      message: 'تم إضافة العميل بنجاح'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating customer:', error)
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
      { success: false, error: 'خطأ في قاعدة البيانات' },
      { status: 500 }
    )
  }
}