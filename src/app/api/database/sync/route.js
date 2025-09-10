/**
 * API endpoint لمزامنة البيانات بين قواعد البيانات
 * Database Sync API Endpoint
 */

import { NextResponse } from 'next/server';
import dbManager from '../../../../lib/database-manager';

export async function POST(request) {
    try {
        const { fromMode = 'local', toMode = 'cloud' } = await request.json();

        if (!['local', 'cloud'].includes(fromMode) || !['local', 'cloud'].includes(toMode)) {
            return NextResponse.json({
                success: false,
                error: 'يجب تحديد الوضع الصحيح: local أو cloud'
            }, { status: 400 });
        }

        if (fromMode === toMode) {
            return NextResponse.json({
                success: false,
                error: 'لا يمكن المزامنة مع نفس قاعدة البيانات'
            }, { status: 400 });
        }

        // تنفيذ المزامنة
        const result = await dbManager.syncData(fromMode, toMode);

        return NextResponse.json({
            success: true,
            message: `تمت مزامنة البيانات من ${fromMode} إلى ${toMode}`,
            data: result
        });

    } catch (error) {
        console.error('خطأ في مزامنة البيانات:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}