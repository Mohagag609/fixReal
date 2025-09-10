import { NextRequest, NextResponse } from "next/server";
import { getConfig } from "@/lib/db/config";
import { getPrismaClient } from "@/lib/prisma-clients";
import { getSharedAuth } from "@/lib/shared-auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, token } = await getSharedAuth(request)
    
    if (!user || !token) {
      return NextResponse.json({
        success: false,
        error: "غير مخول للوصول"
      }, { status: 401 });
    }

    const config = getConfig();
    if (!config) {
      return NextResponse.json({
        success: false,
        error: "قاعدة البيانات غير مُعدة"
      }, { status: 400 });
    }

    const prisma = getPrismaClient(config);
    
    // إعادة الاتصال في حالة انقطاع الاتصال
    try {
      await prisma.$connect();
    } catch (error) {
      console.log('Reconnecting to database...');
    }

    // جلب إحصائيات بسيطة
    const [totalUsers, totalCustomers, totalUnits] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.customer.count().catch(() => 0),
      prisma.unit.count().catch(() => 0)
    ]);

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalCustomers,
        totalUnits,
        type: config.type
      }
    });

  } catch (error: any) {
    console.error("Setup stats error:", error);
    try {
      const config = getConfig();
      if (config) {
        const prisma = getPrismaClient(config);
        await prisma.$disconnect();
      }
    } catch (disconnectError) {
      console.error('Error disconnecting:', disconnectError);
    }
    return NextResponse.json({
      success: false,
      error: error.message || "خطأ في جلب الإحصائيات"
    }, { status: 500 });
  }
}
