import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/db/config'
import { getPrismaClient } from '@/lib/prisma-clients'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const config = getConfig()
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'قاعدة البيانات غير مُعدة' },
        { status: 400 }
      )
    }
    
    const prisma = getPrismaClient(config)
    const { id } = params

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'المستخدم غير موجود'
        },
        { status: 404 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'فشل في حذف المستخدم',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const config = getConfig()
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'قاعدة البيانات غير مُعدة' },
        { status: 400 }
      )
    }
    
    const prisma = getPrismaClient(config)
    const { id } = params
    const body = await request.json()
    const { username, email, role } = body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'المستخدم غير موجود'
        },
        { status: 404 }
      )
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        username: username || existingUser.username,
        email: email || existingUser.email,
        role: role || existingUser.role
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
      user,
      message: 'تم تحديث المستخدم بنجاح'
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'فشل في تحديث المستخدم',
        details: error instanceof Error ? error.message : 'خطأ غير معروف'
      },
      { status: 500 }
    )
  }
}