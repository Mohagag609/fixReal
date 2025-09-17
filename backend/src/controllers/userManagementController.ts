import { Request, Response } from 'express'
import { UserManagementService } from '../services/userManagementService'
import { auditMiddleware } from '../middleware/auditMiddleware'

export class UserManagementController {
  // إنشاء مستخدم جديد
  static async createUser(req: Request, res: Response) {
    try {
      const userData = req.body

      const user = await UserManagementService.createUser(userData)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'CREATE_USER', {
        userId: user.id,
        username: user.username
      })

      res.status(201).json({
        success: true,
        message: 'تم إنشاء المستخدم بنجاح',
        data: user
      })
    } catch (error) {
      console.error('Error creating user:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في إنشاء المستخدم',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تحديث مستخدم
  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userData = req.body

      const user = await UserManagementService.updateUser(id, userData)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'UPDATE_USER', {
        userId: id,
        username: user.username
      })

      res.json({
        success: true,
        message: 'تم تحديث المستخدم بنجاح',
        data: user
      })
    } catch (error) {
      console.error('Error updating user:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تحديث المستخدم',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // حذف مستخدم
  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params

      await UserManagementService.deleteUser(id)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'DELETE_USER', {
        userId: id
      })

      res.json({
        success: true,
        message: 'تم حذف المستخدم بنجاح'
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في حذف المستخدم',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على قائمة المستخدمين
  static async getUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search, roleId, isActive } = req.query

      const result = await UserManagementService.getUsers(
        parseInt(page as string),
        parseInt(limit as string),
        search as string,
        roleId as string,
        isActive === 'true' ? true : isActive === 'false' ? false : undefined
      )

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Error getting users:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على قائمة المستخدمين',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على مستخدم
  static async getUser(req: Request, res: Response) {
    try {
      const { id } = req.params

      const user = await UserManagementService.getUser(id)

      res.json({
        success: true,
        data: user
      })
    } catch (error) {
      console.error('Error getting user:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على المستخدم',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تغيير كلمة المرور
  static async changePassword(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { currentPassword, newPassword } = req.body

      await UserManagementService.changePassword(id, currentPassword, newPassword)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'CHANGE_PASSWORD', {
        userId: id
      })

      res.json({
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح'
      })
    } catch (error) {
      console.error('Error changing password:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تغيير كلمة المرور',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // إعادة تعيين كلمة المرور
  static async resetPassword(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { newPassword } = req.body

      await UserManagementService.resetPassword(id, newPassword)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'RESET_PASSWORD', {
        userId: id
      })

      res.json({
        success: true,
        message: 'تم إعادة تعيين كلمة المرور بنجاح'
      })
    } catch (error) {
      console.error('Error resetting password:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في إعادة تعيين كلمة المرور',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // إنشاء دور جديد
  static async createRole(req: Request, res: Response) {
    try {
      const roleData = req.body

      const role = await UserManagementService.createRole(roleData)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'CREATE_ROLE', {
        roleId: role.id,
        roleName: role.name
      })

      res.status(201).json({
        success: true,
        message: 'تم إنشاء الدور بنجاح',
        data: role
      })
    } catch (error) {
      console.error('Error creating role:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في إنشاء الدور',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تحديث دور
  static async updateRole(req: Request, res: Response) {
    try {
      const { id } = req.params
      const roleData = req.body

      const role = await UserManagementService.updateRole(id, roleData)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'UPDATE_ROLE', {
        roleId: id,
        roleName: role.name
      })

      res.json({
        success: true,
        message: 'تم تحديث الدور بنجاح',
        data: role
      })
    } catch (error) {
      console.error('Error updating role:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تحديث الدور',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // حذف دور
  static async deleteRole(req: Request, res: Response) {
    try {
      const { id } = req.params

      await UserManagementService.deleteRole(id)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'DELETE_ROLE', {
        roleId: id
      })

      res.json({
        success: true,
        message: 'تم حذف الدور بنجاح'
      })
    } catch (error) {
      console.error('Error deleting role:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في حذف الدور',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على قائمة الأدوار
  static async getRoles(req: Request, res: Response) {
    try {
      const roles = await UserManagementService.getRoles()

      res.json({
        success: true,
        data: roles
      })
    } catch (error) {
      console.error('Error getting roles:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على قائمة الأدوار',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على دور
  static async getRole(req: Request, res: Response) {
    try {
      const { id } = req.params

      const role = await UserManagementService.getRole(id)

      res.json({
        success: true,
        data: role
      })
    } catch (error) {
      console.error('Error getting role:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على الدور',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // إنشاء صلاحية جديدة
  static async createPermission(req: Request, res: Response) {
    try {
      const permissionData = req.body

      const permission = await UserManagementService.createPermission(permissionData)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'CREATE_PERMISSION', {
        permissionId: permission.id,
        permissionName: permission.name
      })

      res.status(201).json({
        success: true,
        message: 'تم إنشاء الصلاحية بنجاح',
        data: permission
      })
    } catch (error) {
      console.error('Error creating permission:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في إنشاء الصلاحية',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تحديث صلاحية
  static async updatePermission(req: Request, res: Response) {
    try {
      const { id } = req.params
      const permissionData = req.body

      const permission = await UserManagementService.updatePermission(id, permissionData)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'UPDATE_PERMISSION', {
        permissionId: id,
        permissionName: permission.name
      })

      res.json({
        success: true,
        message: 'تم تحديث الصلاحية بنجاح',
        data: permission
      })
    } catch (error) {
      console.error('Error updating permission:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تحديث الصلاحية',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // حذف صلاحية
  static async deletePermission(req: Request, res: Response) {
    try {
      const { id } = req.params

      await UserManagementService.deletePermission(id)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'DELETE_PERMISSION', {
        permissionId: id
      })

      res.json({
        success: true,
        message: 'تم حذف الصلاحية بنجاح'
      })
    } catch (error) {
      console.error('Error deleting permission:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في حذف الصلاحية',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على قائمة الصلاحيات
  static async getPermissions(req: Request, res: Response) {
    try {
      const permissions = await UserManagementService.getPermissions()

      res.json({
        success: true,
        data: permissions
      })
    } catch (error) {
      console.error('Error getting permissions:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على قائمة الصلاحيات',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // ربط صلاحيات بدور
  static async assignPermissionsToRole(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { permissionIds } = req.body

      await UserManagementService.assignPermissionsToRole(id, permissionIds)

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'ASSIGN_PERMISSIONS_TO_ROLE', {
        roleId: id,
        permissionCount: permissionIds.length
      })

      res.json({
        success: true,
        message: 'تم ربط الصلاحيات بالدور بنجاح'
      })
    } catch (error) {
      console.error('Error assigning permissions to role:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في ربط الصلاحيات بالدور',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على صلاحيات دور
  static async getRolePermissions(req: Request, res: Response) {
    try {
      const { id } = req.params

      const permissions = await UserManagementService.getRolePermissions(id)

      res.json({
        success: true,
        data: permissions
      })
    } catch (error) {
      console.error('Error getting role permissions:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على صلاحيات الدور',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // التحقق من صلاحية المستخدم
  static async checkUserPermission(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { resource, action } = req.query

      const hasPermission = await UserManagementService.checkUserPermission(
        id,
        resource as string,
        action as string
      )

      res.json({
        success: true,
        data: { hasPermission }
      })
    } catch (error) {
      console.error('Error checking user permission:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في التحقق من صلاحية المستخدم',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // الحصول على إحصائيات المستخدمين
  static async getUserStats(req: Request, res: Response) {
    try {
      const stats = await UserManagementService.getUserStats()

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Error getting user stats:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في الحصول على إحصائيات المستخدمين',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }

  // تصدير بيانات المستخدمين
  static async exportUsers(req: Request, res: Response) {
    try {
      const { format = 'json' } = req.query

      const users = await UserManagementService.exportUsers(format as 'json' | 'csv')

      // تسجيل العملية
      await auditMiddleware.logAction(req, 'EXPORT_USERS', {
        format,
        userCount: users.length
      })

      res.json({
        success: true,
        data: users
      })
    } catch (error) {
      console.error('Error exporting users:', error)
      res.status(500).json({
        success: false,
        message: 'فشل في تصدير بيانات المستخدمين',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      })
    }
  }
}