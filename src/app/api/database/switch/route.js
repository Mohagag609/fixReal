/**
 * API endpoint للتبديل بين قواعد البيانات
 * Database Switch API Endpoint
 */

import { NextResponse } from 'next/server';
import dbManager from '../../../../lib/database-manager';

export async function POST(request) {
    try {
        const { mode } = await request.json();

        if (!mode || !['local', 'cloud'].includes(mode)) {
            return NextResponse.json({
                success: false,
                error: 'يجب تحديد الوضع: local أو cloud'
            }, { status: 400 });
        }

        // التبديل إلى الوضع المطلوب
        if (mode === 'local') {
            dbManager.switchToLocal();
        } else {
            dbManager.switchToCloud();
        }

        // اختبار الاتصال الجديد
        const connectionTests = await dbManager.testConnections();
        const status = dbManager.getStatus();

        return NextResponse.json({
            success: true,
            message: `تم التبديل إلى قاعدة البيانات ${mode === 'local' ? 'المحلية' : 'السحابية'}`,
            data: {
                status,
                connections: connectionTests
            }
        });

    } catch (error) {
        console.error('خطأ في التبديل بين قواعد البيانات:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}