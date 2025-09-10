/**
 * API endpoint للحصول على حالة قاعدة البيانات
 * Database Status API Endpoint
 */

import { NextResponse } from 'next/server';
import dbManager from '../../../../lib/database-manager';

export async function GET() {
    try {
        // اختبار الاتصالات
        const connectionTests = await dbManager.testConnections();
        const status = dbManager.getStatus();

        return NextResponse.json({
            success: true,
            data: {
                status,
                connections: connectionTests,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('خطأ في الحصول على حالة قاعدة البيانات:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}