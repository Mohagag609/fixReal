#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync  } from 'child_process';

console.log('🚀 إعداد نظام جديد نظيف...\n');

// 1. إنشاء المجلدات المطلوبة
const dirs = ['data', 'var', 'backups'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ تم إنشاء مجلد: ${dir}`);
  }
});

// 2. إنشاء ملف إعدادات افتراضي
const defaultConfig = {
  type: "sqlite",
  sqlite: {
    file: "./data/dev.db"
  },
  pgLocal: {
    url: "postgresql://postgres:postgres@localhost:5432/estate_db?schema=public"
  },
  pgCloud: {
    url: "postgresql://neondb_owner:npg_u3YRIwQsFy7t@ep-long-bird-adg5659h-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  }
};

fs.writeFileSync('var/app-config.json', JSON.stringify(defaultConfig, null, 2));
console.log('✅ تم إنشاء ملف الإعدادات الافتراضي');

// 3. إنشاء ملف .env.local
const envContent = `# JWT Secret for authentication
JWT_SECRET=your_super_secret_jwt_key_2024

# Admin Key for user management
NEXT_PUBLIC_ADMIN_KEY=ADMIN_SECRET_2024

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database URLs (will be overridden by app-config.json)
DATABASE_URL=file:./data/dev.db
DATABASE_URL_SQLITE=file:./data/dev.db
DATABASE_URL_POSTGRES_LOCAL=postgresql://postgres:postgres@localhost:5432/estate_db?schema=public
DATABASE_URL_POSTGRES_CLOUD=postgresql://neondb_owner:npg_u3YRIwQsFy7t@ep-long-bird-adg5659h-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
`;

fs.writeFileSync('.env.local', envContent);
console.log('✅ تم إنشاء ملف متغيرات البيئة');

// 4. توليد Prisma clients
try {
  console.log('\n🔄 توليد Prisma clients...');
  execSync('npm run prisma:gen', { stdio: 'inherit' });
  console.log('✅ تم توليد Prisma clients بنجاح');
} catch (error) {
  console.log('⚠️  فشل في توليد Prisma clients:', error.message);
}

console.log('\n🎉 تم إعداد النظام الجديد بنجاح!');
console.log('\n📋 الخطوات التالية:');
console.log('1. تشغيل النظام: npm run dev');
console.log('2. فتح المتصفح على: http://localhost:3000');
console.log('3. إعداد قاعدة البيانات من صفحة الإعداد');
console.log('4. تسجيل الدخول باستخدام: admin / admin123');
console.log('\n🔧 أنواع قواعد البيانات المدعومة:');
console.log('- SQLite: للتطوير والاختبار');
console.log('- PostgreSQL محلي: للإنتاج المحلي');
console.log('- PostgreSQL سحابي: للإنتاج السحابي');
