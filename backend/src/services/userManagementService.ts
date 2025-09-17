import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { config } from '../config/env'

const prisma = new PrismaClient()

export interface UserRole {
  id: string
  name: string
  description: string
  permissions: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserPermission {
  id: string
  name: string
  description: string
  resource: string
  action: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  isActive: boolean
  roleId: string
  role?: UserRole
  permissions?: UserPermission[]
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserData {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  roleId: string
  isActive?: boolean
}

export interface UpdateUserData {
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  roleId?: string
  isActive?: boolean
}

export class UserManagementService {
  // إنشاء مستخدم جديد
  static async createUser(userData: CreateUserData): Promise<User> {
    try {
      // التحقق من وجود المستخدم
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: userData.username },
            { email: userData.email }
          ]
        }
      })

      if (existingUser) {
        throw new Error('اسم المستخدم أو البريد الإلكتروني موجود بالفعل')
      }

      // تشفير كلمة المرور
      const hashedPassword = await bcrypt.hash(userData.password, 12)

      // إنشاء المستخدم
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          roleId: userData.roleId,
          isActive: userData.isActive ?? true
        },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      })

      return user
    } catch (error) {
      console.error('Error creating user:', error)
      throw new Error('فشل في إنشاء المستخدم')
    }
  }

  // تحديث مستخدم
  static async updateUser(userId: string, userData: UpdateUserData): Promise<User> {
    try {
      // التحقق من وجود المستخدم
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!existingUser) {
        throw new Error('المستخدم غير موجود')
      }

      // التحقق من عدم تكرار اسم المستخدم أو البريد الإلكتروني
      if (userData.username || userData.email) {
        const duplicateUser = await prisma.user.findFirst({
          where: {
            AND: [
              { id: { not: userId } },
              {
                OR: [
                  userData.username ? { username: userData.username } : {},
                  userData.email ? { email: userData.email } : {}
                ]
              }
            ]
          }
        })

        if (duplicateUser) {
          throw new Error('اسم المستخدم أو البريد الإلكتروني موجود بالفعل')
        }
      }

      // تحديث المستخدم
      const user = await prisma.user.update({
        where: { id: userId },
        data: userData,
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      })

      return user
    } catch (error) {
      console.error('Error updating user:', error)
      throw new Error('فشل في تحديث المستخدم')
    }
  }

  // حذف مستخدم
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      // التحقق من وجود المستخدم
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!existingUser) {
        throw new Error('المستخدم غير موجود')
      }

      // حذف المستخدم
      await prisma.user.delete({
        where: { id: userId }
      })

      return true
    } catch (error) {
      console.error('Error deleting user:', error)
      throw new Error('فشل في حذف المستخدم')
    }
  }

  // الحصول على قائمة المستخدمين
  static async getUsers(page: number = 1, limit: number = 10, search?: string, roleId?: string, isActive?: boolean) {
    try {
      const where: any = {}

      if (search) {
        where.OR = [
          { username: { contains: search } },
          { email: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } }
        ]
      }

      if (roleId) {
        where.roleId = roleId
      }

      if (isActive !== undefined) {
        where.isActive = isActive
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.user.count({ where })
      ])

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('Error getting users:', error)
      throw new Error('فشل في الحصول على قائمة المستخدمين')
    }
  }

  // الحصول على مستخدم
  static async getUser(userId: string): Promise<User> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      })

      if (!user) {
        throw new Error('المستخدم غير موجود')
      }

      return user
    } catch (error) {
      console.error('Error getting user:', error)
      throw new Error('فشل في الحصول على المستخدم')
    }
  }

  // تغيير كلمة المرور
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // الحصول على المستخدم
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        throw new Error('المستخدم غير موجود')
      }

      // التحقق من كلمة المرور الحالية
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
      if (!isCurrentPasswordValid) {
        throw new Error('كلمة المرور الحالية غير صحيحة')
      }

      // تشفير كلمة المرور الجديدة
      const hashedNewPassword = await bcrypt.hash(newPassword, 12)

      // تحديث كلمة المرور
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      })

      return true
    } catch (error) {
      console.error('Error changing password:', error)
      throw new Error('فشل في تغيير كلمة المرور')
    }
  }

  // إعادة تعيين كلمة المرور
  static async resetPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      // التحقق من وجود المستخدم
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!existingUser) {
        throw new Error('المستخدم غير موجود')
      }

      // تشفير كلمة المرور الجديدة
      const hashedPassword = await bcrypt.hash(newPassword, 12)

      // تحديث كلمة المرور
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      })

      return true
    } catch (error) {
      console.error('Error resetting password:', error)
      throw new Error('فشل في إعادة تعيين كلمة المرور')
    }
  }

  // إنشاء دور جديد
  static async createRole(roleData: Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserRole> {
    try {
      // التحقق من وجود الدور
      const existingRole = await prisma.role.findFirst({
        where: { name: roleData.name }
      })

      if (existingRole) {
        throw new Error('الدور موجود بالفعل')
      }

      // إنشاء الدور
      const role = await prisma.role.create({
        data: {
          ...roleData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return role
    } catch (error) {
      console.error('Error creating role:', error)
      throw new Error('فشل في إنشاء الدور')
    }
  }

  // تحديث دور
  static async updateRole(roleId: string, roleData: Partial<UserRole>): Promise<UserRole> {
    try {
      // التحقق من وجود الدور
      const existingRole = await prisma.role.findUnique({
        where: { id: roleId }
      })

      if (!existingRole) {
        throw new Error('الدور غير موجود')
      }

      // تحديث الدور
      const role = await prisma.role.update({
        where: { id: roleId },
        data: {
          ...roleData,
          updatedAt: new Date()
        }
      })

      return role
    } catch (error) {
      console.error('Error updating role:', error)
      throw new Error('فشل في تحديث الدور')
    }
  }

  // حذف دور
  static async deleteRole(roleId: string): Promise<boolean> {
    try {
      // التحقق من وجود الدور
      const existingRole = await prisma.role.findUnique({
        where: { id: roleId }
      })

      if (!existingRole) {
        throw new Error('الدور غير موجود')
      }

      // التحقق من عدم استخدام الدور
      const usersWithRole = await prisma.user.count({
        where: { roleId }
      })

      if (usersWithRole > 0) {
        throw new Error('لا يمكن حذف الدور لأنه مستخدم من قبل مستخدمين')
      }

      // حذف الدور
      await prisma.role.delete({
        where: { id: roleId }
      })

      return true
    } catch (error) {
      console.error('Error deleting role:', error)
      throw new Error('فشل في حذف الدور')
    }
  }

  // الحصول على قائمة الأدوار
  static async getRoles(): Promise<UserRole[]> {
    try {
      const roles = await prisma.role.findMany({
        include: {
          permissions: true
        },
        orderBy: { name: 'asc' }
      })

      return roles
    } catch (error) {
      console.error('Error getting roles:', error)
      throw new Error('فشل في الحصول على قائمة الأدوار')
    }
  }

  // الحصول على دور
  static async getRole(roleId: string): Promise<UserRole> {
    try {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: true
        }
      })

      if (!role) {
        throw new Error('الدور غير موجود')
      }

      return role
    } catch (error) {
      console.error('Error getting role:', error)
      throw new Error('فشل في الحصول على الدور')
    }
  }

  // إنشاء صلاحية جديدة
  static async createPermission(permissionData: Omit<UserPermission, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserPermission> {
    try {
      // التحقق من وجود الصلاحية
      const existingPermission = await prisma.permission.findFirst({
        where: { name: permissionData.name }
      })

      if (existingPermission) {
        throw new Error('الصلاحية موجودة بالفعل')
      }

      // إنشاء الصلاحية
      const permission = await prisma.permission.create({
        data: {
          ...permissionData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return permission
    } catch (error) {
      console.error('Error creating permission:', error)
      throw new Error('فشل في إنشاء الصلاحية')
    }
  }

  // تحديث صلاحية
  static async updatePermission(permissionId: string, permissionData: Partial<UserPermission>): Promise<UserPermission> {
    try {
      // التحقق من وجود الصلاحية
      const existingPermission = await prisma.permission.findUnique({
        where: { id: permissionId }
      })

      if (!existingPermission) {
        throw new Error('الصلاحية غير موجودة')
      }

      // تحديث الصلاحية
      const permission = await prisma.permission.update({
        where: { id: permissionId },
        data: {
          ...permissionData,
          updatedAt: new Date()
        }
      })

      return permission
    } catch (error) {
      console.error('Error updating permission:', error)
      throw new Error('فشل في تحديث الصلاحية')
    }
  }

  // حذف صلاحية
  static async deletePermission(permissionId: string): Promise<boolean> {
    try {
      // التحقق من وجود الصلاحية
      const existingPermission = await prisma.permission.findUnique({
        where: { id: permissionId }
      })

      if (!existingPermission) {
        throw new Error('الصلاحية غير موجودة')
      }

      // حذف الصلاحية
      await prisma.permission.delete({
        where: { id: permissionId }
      })

      return true
    } catch (error) {
      console.error('Error deleting permission:', error)
      throw new Error('فشل في حذف الصلاحية')
    }
  }

  // الحصول على قائمة الصلاحيات
  static async getPermissions(): Promise<UserPermission[]> {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: { name: 'asc' }
      })

      return permissions
    } catch (error) {
      console.error('Error getting permissions:', error)
      throw new Error('فشل في الحصول على قائمة الصلاحيات')
    }
  }

  // ربط صلاحيات بدور
  static async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<boolean> {
    try {
      // التحقق من وجود الدور
      const existingRole = await prisma.role.findUnique({
        where: { id: roleId }
      })

      if (!existingRole) {
        throw new Error('الدور غير موجود')
      }

      // حذف الصلاحيات الحالية
      await prisma.rolePermission.deleteMany({
        where: { roleId }
      })

      // إضافة الصلاحيات الجديدة
      await prisma.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({
          roleId,
          permissionId
        }))
      })

      return true
    } catch (error) {
      console.error('Error assigning permissions to role:', error)
      throw new Error('فشل في ربط الصلاحيات بالدور')
    }
  }

  // الحصول على صلاحيات دور
  static async getRolePermissions(roleId: string): Promise<UserPermission[]> {
    try {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId },
        include: {
          permission: true
        }
      })

      return rolePermissions.map(rp => rp.permission)
    } catch (error) {
      console.error('Error getting role permissions:', error)
      throw new Error('فشل في الحصول على صلاحيات الدور')
    }
  }

  // التحقق من صلاحية المستخدم
  static async checkUserPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      })

      if (!user || !user.role) {
        return false
      }

      const hasPermission = user.role.permissions.some(permission => 
        permission.resource === resource && 
        permission.action === action && 
        permission.isActive
      )

      return hasPermission
    } catch (error) {
      console.error('Error checking user permission:', error)
      return false
    }
  }

  // الحصول على إحصائيات المستخدمين
  static async getUserStats() {
    try {
      const [totalUsers, activeUsers, inactiveUsers, totalRoles, totalPermissions] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { isActive: false } }),
        prisma.role.count(),
        prisma.permission.count()
      ])

      const usersByRole = await prisma.role.findMany({
        include: {
          _count: {
            select: { users: true }
          }
        }
      })

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalRoles,
        totalPermissions,
        usersByRole: usersByRole.map(role => ({
          roleName: role.name,
          userCount: role._count.users
        }))
      }
    } catch (error) {
      console.error('Error getting user stats:', error)
      throw new Error('فشل في الحصول على إحصائيات المستخدمين')
    }
  }

  // تصدير بيانات المستخدمين
  static async exportUsers(format: 'json' | 'csv' = 'json') {
    try {
      const users = await prisma.user.findMany({
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      })

      if (format === 'csv') {
        // يمكن إضافة تصدير CSV هنا
        return users
      }

      return users
    } catch (error) {
      console.error('Error exporting users:', error)
      throw new Error('فشل في تصدير بيانات المستخدمين')
    }
  }
}