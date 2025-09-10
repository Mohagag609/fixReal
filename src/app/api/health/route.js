/**
 * API endpoint بسيط لاختبار الاتصال
 * Simple Health Check API Endpoint
 */

import { NextResponse } from 'next/server';

export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            message: 'API يعمل بشكل صحيح',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'خطأ في API',
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}