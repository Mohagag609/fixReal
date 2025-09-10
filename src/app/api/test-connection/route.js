/**
 * API endpoint لاختبار الاتصال بقاعدة البيانات
 * Test Database Connection API Endpoint
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
    try {
        console.log('🔍 اختبار الاتصال بقاعدة البيانات...');
        
        // إنشاء اتصال بقاعدة البيانات
        const prisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
                }
            }
        });

        // اختبار الاتصال
        const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp`;
        
        // اختبار الجداول
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;

        await prisma.$disconnect();

        return NextResponse.json({
            success: true,
            message: 'قاعدة البيانات متصلة بنجاح',
            data: {
                connection: 'active',
                tables: tables.length,
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV,
                databaseUrl: process.env.DATABASE_URL ? 'DATABASE_URL' : 'NEON_DATABASE_URL'
            }
        });

    } catch (error) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
        
        return NextResponse.json({
            success: false,
            error: error.message,
            details: {
                message: error.message,
                code: error.code,
                environment: process.env.NODE_ENV,
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                hasNeonUrl: !!process.env.NEON_DATABASE_URL,
                timestamp: new Date().toISOString()
            }
        }, { status: 500 });
    }
}