import { execSync  } from 'child_process'

console.log('🔧 إعداد البناء للإنتاج...')

try {
  // تأكد من أن Prisma schema يستخدم PostgreSQL
  import fs from 'fs'
  const schemaPath = 'prisma/schema.prisma'
  const schema = fs.readFileSync(schemaPath, 'utf8')
  
  if (!schema.includes('provider = "postgresql"')) {
    console.log('❌ Prisma schema يجب أن يستخدم PostgreSQL للإنتاج')
    process.exit(1)
  }

  // تشغيل prisma generate
  console.log('📦 توليد Prisma Client...')
  execSync('npx prisma generate', { stdio: 'inherit' })

  // تشغيل next build
  console.log('🏗️ بناء التطبيق...')
  execSync('npx next build', { stdio: 'inherit' })

  console.log('✅ تم البناء بنجاح!')
} catch (error) {
  console.error('❌ فشل في البناء:', error.message)
  process.exit(1)
}