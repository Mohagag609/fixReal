/**
 * مدير قاعدة البيانات - للتبديل بين PostgreSQL المحلي والسحابي
 * Database Manager - Switch between Local and Cloud PostgreSQL
 */

import { PrismaClient } from '@prisma/client';

class DatabaseManager {
    constructor() {
        this.localClient = null;
        this.cloudClient = null;
        this.currentMode = process.env.DB_MODE || 'local'; // 'local' or 'cloud'
    }

    /**
     * تهيئة اتصالات قاعدة البيانات
     * Initialize database connections
     */
    async initialize() {
        try {
            // إنشاء اتصال قاعدة البيانات المحلية
            if (process.env.DATABASE_URL) {
                this.localClient = new PrismaClient({
                    datasources: {
                        db: {
                            url: process.env.DATABASE_URL
                        }
                    }
                });
                console.log('✅ تم إنشاء اتصال قاعدة البيانات المحلية');
            }

            // إنشاء اتصال قاعدة البيانات السحابية (Neon)
            if (process.env.NEON_DATABASE_URL) {
                this.cloudClient = new PrismaClient({
                    datasources: {
                        db: {
                            url: process.env.NEON_DATABASE_URL
                        }
                    }
                });
                console.log('✅ تم إنشاء اتصال قاعدة البيانات السحابية (Neon)');
            }

            // اختبار الاتصالات
            await this.testConnections();
            
        } catch (error) {
            console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
            throw error;
        }
    }

    /**
     * اختبار الاتصالات مع قواعد البيانات
     * Test database connections
     */
    async testConnections() {
        const results = {};

        // اختبار قاعدة البيانات المحلية
        if (this.localClient) {
            try {
                await this.localClient.$queryRaw`SELECT 1`;
                results.local = { status: 'success', message: 'قاعدة البيانات المحلية تعمل بشكل صحيح' };
                console.log('✅ قاعدة البيانات المحلية: متصلة');
            } catch (error) {
                results.local = { status: 'error', message: error.message };
                console.log('❌ قاعدة البيانات المحلية: غير متصلة');
            }
        }

        // اختبار قاعدة البيانات السحابية
        if (this.cloudClient) {
            try {
                await this.cloudClient.$queryRaw`SELECT 1`;
                results.cloud = { status: 'success', message: 'قاعدة البيانات السحابية (Neon) تعمل بشكل صحيح' };
                console.log('✅ قاعدة البيانات السحابية (Neon): متصلة');
            } catch (error) {
                results.cloud = { status: 'error', message: error.message };
                console.log('❌ قاعدة البيانات السحابية (Neon): غير متصلة');
            }
        }

        return results;
    }

    /**
     * الحصول على العميل الحالي
     * Get current database client
     */
    getClient() {
        if (this.currentMode === 'cloud' && this.cloudClient) {
            return this.cloudClient;
        }
        return this.localClient;
    }

    /**
     * التبديل إلى قاعدة البيانات المحلية
     * Switch to local database
     */
    switchToLocal() {
        if (!this.localClient) {
            throw new Error('قاعدة البيانات المحلية غير متاحة');
        }
        this.currentMode = 'local';
        console.log('🔄 تم التبديل إلى قاعدة البيانات المحلية');
        return this.localClient;
    }

    /**
     * التبديل إلى قاعدة البيانات السحابية
     * Switch to cloud database
     */
    switchToCloud() {
        if (!this.cloudClient) {
            throw new Error('قاعدة البيانات السحابية غير متاحة');
        }
        this.currentMode = 'cloud';
        console.log('🔄 تم التبديل إلى قاعدة البيانات السحابية (Neon)');
        return this.cloudClient;
    }

    /**
     * مزامنة البيانات بين قواعد البيانات
     * Sync data between databases
     */
    async syncData(fromMode = 'local', toMode = 'cloud') {
        try {
            const sourceClient = fromMode === 'local' ? this.localClient : this.cloudClient;
            const targetClient = toMode === 'local' ? this.localClient : this.cloudClient;

            if (!sourceClient || !targetClient) {
                throw new Error('إحدى قواعد البيانات غير متاحة');
            }

            console.log(`🔄 بدء مزامنة البيانات من ${fromMode} إلى ${toMode}`);

            // قائمة الجداول للمزامنة
            const tables = [
                'customers', 'units', 'partners', 'unitPartners', 'contracts', 
                'installments', 'partnerDebts', 'safes', 'transfers', 'vouchers',
                'brokers', 'brokerDues', 'partnerGroups', 'auditLogs', 'settings'
            ];

            for (const table of tables) {
                try {
                    // جلب البيانات من المصدر
                    const sourceData = await sourceClient[table].findMany();
                    
                    // حذف البيانات الموجودة في الهدف
                    await targetClient[table].deleteMany();
                    
                    // إدراج البيانات الجديدة
                    if (sourceData.length > 0) {
                        await targetClient[table].createMany({
                            data: sourceData,
                            skipDuplicates: true
                        });
                    }
                    
                    console.log(`✅ تم مزامنة جدول ${table}: ${sourceData.length} سجل`);
                } catch (error) {
                    console.error(`❌ خطأ في مزامنة جدول ${table}:`, error.message);
                }
            }

            console.log('✅ تمت مزامنة البيانات بنجاح');
            return { success: true, message: 'تمت مزامنة البيانات بنجاح' };

        } catch (error) {
            console.error('❌ خطأ في مزامنة البيانات:', error);
            throw error;
        }
    }

    /**
     * إنشاء نسخة احتياطية من قاعدة البيانات
     * Create database backup
     */
    async createBackup(mode = 'local') {
        try {
            const client = mode === 'local' ? this.localClient : this.cloudClient;
            if (!client) {
                throw new Error(`قاعدة البيانات ${mode} غير متاحة`);
            }

            const backup = {
                timestamp: new Date().toISOString(),
                mode: mode,
                data: {}
            };

            // قائمة الجداول للنسخ الاحتياطي
            const tables = [
                'customers', 'units', 'partners', 'unitPartners', 'contracts', 
                'installments', 'partnerDebts', 'safes', 'transfers', 'vouchers',
                'brokers', 'brokerDues', 'partnerGroups', 'auditLogs', 'settings'
            ];

            for (const table of tables) {
                try {
                    backup.data[table] = await client[table].findMany();
                } catch (error) {
                    console.error(`خطأ في نسخ جدول ${table}:`, error.message);
                }
            }

            return backup;

        } catch (error) {
            console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
            throw error;
        }
    }

    /**
     * استعادة نسخة احتياطية
     * Restore from backup
     */
    async restoreBackup(backup, targetMode = 'local') {
        try {
            const client = targetMode === 'local' ? this.localClient : this.cloudClient;
            if (!client) {
                throw new Error(`قاعدة البيانات ${targetMode} غير متاحة`);
            }

            console.log(`🔄 بدء استعادة النسخة الاحتياطية إلى ${targetMode}`);

            for (const [table, data] of Object.entries(backup.data)) {
                try {
                    // حذف البيانات الموجودة
                    await client[table].deleteMany();
                    
                    // إدراج البيانات المستعادة
                    if (data.length > 0) {
                        await client[table].createMany({
                            data: data,
                            skipDuplicates: true
                        });
                    }
                    
                    console.log(`✅ تم استعادة جدول ${table}: ${data.length} سجل`);
                } catch (error) {
                    console.error(`❌ خطأ في استعادة جدول ${table}:`, error.message);
                }
            }

            console.log('✅ تمت استعادة النسخة الاحتياطية بنجاح');
            return { success: true, message: 'تمت استعادة النسخة الاحتياطية بنجاح' };

        } catch (error) {
            console.error('❌ خطأ في استعادة النسخة الاحتياطية:', error);
            throw error;
        }
    }

    /**
     * إغلاق الاتصالات
     * Close database connections
     */
    async disconnect() {
        try {
            if (this.localClient) {
                await this.localClient.$disconnect();
                console.log('✅ تم إغلاق اتصال قاعدة البيانات المحلية');
            }
            if (this.cloudClient) {
                await this.cloudClient.$disconnect();
                console.log('✅ تم إغلاق اتصال قاعدة البيانات السحابية');
            }
        } catch (error) {
            console.error('❌ خطأ في إغلاق الاتصالات:', error);
        }
    }

    /**
     * الحصول على حالة قاعدة البيانات
     * Get database status
     */
    getStatus() {
        return {
            currentMode: this.currentMode,
            localAvailable: !!this.localClient,
            cloudAvailable: !!this.cloudClient,
            timestamp: new Date().toISOString()
        };
    }
}

// إنشاء مثيل واحد من مدير قاعدة البيانات
const dbManager = new DatabaseManager();

export default dbManager;