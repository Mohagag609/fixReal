import { Router } from 'express'
import { UserManagementController } from '../controllers/userManagementController'
import { authMiddleware } from '../middleware/authMiddleware'
import { adminMiddleware } from '../middleware/adminMiddleware'

const router = Router()

// جميع المسارات تتطلب مصادقة
router.use(authMiddleware)

// إدارة المستخدمين
router.post('/users', adminMiddleware, UserManagementController.createUser)
router.get('/users', UserManagementController.getUsers)
router.get('/users/:id', UserManagementController.getUser)
router.put('/users/:id', adminMiddleware, UserManagementController.updateUser)
router.delete('/users/:id', adminMiddleware, UserManagementController.deleteUser)
router.post('/users/:id/change-password', UserManagementController.changePassword)
router.post('/users/:id/reset-password', adminMiddleware, UserManagementController.resetPassword)

// إدارة الأدوار
router.post('/roles', adminMiddleware, UserManagementController.createRole)
router.get('/roles', UserManagementController.getRoles)
router.get('/roles/:id', UserManagementController.getRole)
router.put('/roles/:id', adminMiddleware, UserManagementController.updateRole)
router.delete('/roles/:id', adminMiddleware, UserManagementController.deleteRole)
router.post('/roles/:id/permissions', adminMiddleware, UserManagementController.assignPermissionsToRole)
router.get('/roles/:id/permissions', UserManagementController.getRolePermissions)

// إدارة الصلاحيات
router.post('/permissions', adminMiddleware, UserManagementController.createPermission)
router.get('/permissions', UserManagementController.getPermissions)
router.put('/permissions/:id', adminMiddleware, UserManagementController.updatePermission)
router.delete('/permissions/:id', adminMiddleware, UserManagementController.deletePermission)

// التحقق من الصلاحيات
router.get('/users/:id/permissions/check', UserManagementController.checkUserPermission)

// الإحصائيات والتصدير
router.get('/stats', UserManagementController.getUserStats)
router.get('/export', adminMiddleware, UserManagementController.exportUsers)

export default router