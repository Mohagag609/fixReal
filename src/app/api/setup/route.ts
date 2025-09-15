import { NextRequest } from "next/server";
import { saveConfig, AppDbConfig } from "@/lib/db/config";
import { getSharedAuth } from "@/lib/shared-auth";
import { mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";

export async function POST(req: NextRequest) {
  try {
    // Skip authentication for initial setup - this is the first step
    // Authentication will be required after database is configured

    const body = (await req.json()) as AppDbConfig;

    // التحقق من صحة البيانات
    if (!body.type) {
      return new Response(JSON.stringify({ ok: false, error: "نوع قاعدة البيانات مطلوب" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // التحقق من وجود البيانات المطلوبة لكل نوع
    if (body.type === "sqlite" && !body.sqlite?.file) {
      return new Response(JSON.stringify({ ok: false, error: "مسار ملف SQLite مطلوب" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (body.type === "postgresql-local" && !body.pgLocal?.url) {
      return new Response(JSON.stringify({ ok: false, error: "رابط PostgreSQL المحلي مطلوب" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (body.type === "postgresql-cloud" && !body.pgCloud?.url) {
      return new Response(JSON.stringify({ ok: false, error: "رابط PostgreSQL السحابي مطلوب" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // لو SQLite تأكد من مجلد الملف
    if (body.type === "sqlite") {
      const file = body.sqlite?.file || "./data/dev.db";
      const dir = dirname(file);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }

    // اختبار الاتصال البسيط (بدون Prisma مؤقتاً)
    if (body.type === "sqlite") {
      // للـ SQLite، فقط تأكد من إمكانية إنشاء الملف
      const file = body.sqlite?.file || "./data/dev.db";
      const dir = dirname(file);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    } else {
      // للـ PostgreSQL، تحقق من صحة الرابط
      const url = body.type === "postgresql-cloud" ? body.pgCloud?.url : body.pgLocal?.url;
      if (!url || url.trim() === "") {
        return new Response(JSON.stringify({ ok: false, error: "يجب إدخال رابط قاعدة البيانات" }), { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (!url.startsWith("postgresql://")) {
        return new Response(JSON.stringify({ ok: false, error: "رابط PostgreSQL غير صحيح" }), { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // اختبار الاتصال الحقيقي
    try {
      const { getPrismaClient } = await import("@/lib/prisma-clients");
      const prisma = getPrismaClient(body);
      
      // اختبار الاتصال الحقيقي
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      
      // إنشاء الجداول الأساسية
      if (body.type === "sqlite") {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "users" (
            "id" TEXT PRIMARY KEY NOT NULL,
            "username" TEXT NOT NULL UNIQUE,
            "password" TEXT NOT NULL,
            "email" TEXT UNIQUE,
            "name" TEXT,
            "role" TEXT NOT NULL DEFAULT 'admin',
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `;
        
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "customers" (
            "id" TEXT PRIMARY KEY NOT NULL,
            "name" TEXT NOT NULL,
            "phone" TEXT UNIQUE,
            "nationalId" TEXT UNIQUE,
            "address" TEXT,
            "status" TEXT NOT NULL DEFAULT 'نشط',
            "notes" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "deletedAt" DATETIME
          )
        `;
        
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "units" (
            "id" TEXT PRIMARY KEY NOT NULL,
            "code" TEXT NOT NULL UNIQUE,
            "name" TEXT,
            "unitType" TEXT NOT NULL DEFAULT 'سكني',
            "area" TEXT,
            "floor" TEXT,
            "building" TEXT,
            "totalPrice" REAL NOT NULL DEFAULT 0,
            "status" TEXT NOT NULL DEFAULT 'متاحة',
            "notes" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "deletedAt" DATETIME
          )
        `;
        
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "safes" (
            "id" TEXT PRIMARY KEY NOT NULL,
            "name" TEXT NOT NULL UNIQUE,
            "balance" REAL NOT NULL DEFAULT 0,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "deletedAt" DATETIME
          )
        `;
      } else {
        // لـ PostgreSQL، استخدم db push لإنشاء الجداول
        import { execSync  } from 'child_process';
        const schemaFile = "prisma/postgres.prisma";
        
        try {
          const url = body.type === "postgresql-cloud" ? body.pgCloud?.url : body.pgLocal?.url;
          execSync(`npx prisma db push --schema ${schemaFile}`, { 
            stdio: 'pipe',
            env: { ...process.env, DATABASE_URL: url }
          });
        } catch (error) {
          console.log('Tables might already exist, continuing...');
        }
      }
      
      await prisma.$disconnect();
    } catch (connectionError: unknown) {
      console.error("Connection test failed:", connectionError);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: `فشل في الاتصال بقاعدة البيانات: ${connectionError.message || "خطأ غير معروف"}` 
      }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // احفظ الإعداد
    try {
      saveConfig(body);
    } catch (configError: unknown) {
      console.error("Config save error:", configError);
      return new Response(JSON.stringify({ ok: false, error: "فشل في حفظ الإعدادات" }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      message: "تم حفظ الإعدادات بنجاح",
      config: {
        type: body.type,
        hasConfig: true
      }
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

    } catch (e: unknown) {
    console.error("Setup API error:", e);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: e.message || "حدث خطأ غير متوقع" 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// GET endpoint للتحقق من حالة الإعداد
export async function GET() {
  try {
    const { hasConfig, getConfig } = await import("@/lib/db/config");
    
    if (!hasConfig()) {
      return new Response(JSON.stringify({ 
        configured: false,
        message: "لم يتم إعداد قاعدة البيانات بعد"
      }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const config = getConfig();
    return new Response(JSON.stringify({ 
      configured: true,
      type: config?.type,
      message: "تم إعداد قاعدة البيانات"
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

    } catch (e: unknown) {
    console.error("Setup GET error:", e);
    return new Response(JSON.stringify({ 
      configured: false,
      error: e.message || "خطأ في قراءة الإعدادات"
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}