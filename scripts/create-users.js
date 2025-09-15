import { PrismaClient  } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUsers() {
  console.log('🔐 فحص المستخدمين...');
  try {
    // Check if any users exist
    const existingUsers = await prisma.user.findMany();
    
    if (existingUsers.length === 0) {
      console.log('📝 لا يوجد مستخدمين في النظام');
      console.log('🚀 يمكنك الآن إنشاء المستخدم الأول من صفحة الإعداد');
      console.log('🔗 اذهب إلى /setup لإنشاء المستخدم الأول');
    } else {
      console.log(`✅ يوجد ${existingUsers.length} مستخدم في النظام`);
    }

  } catch (error) {
    console.error('❌ خطأ في فحص المستخدمين:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();