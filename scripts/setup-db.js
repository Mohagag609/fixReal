const { PrismaClient } = require('@prisma/client')

async function setupDatabase() {
  console.log('Setting up database...')

  // في بيئة الإنتاج (Netlify)، استخدم DATABASE_URL مباشرة
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('🔍 إعداد قاعدة البيانات للإنتاج...')
      
      const prisma = new PrismaClient()
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ قاعدة البيانات متاحة')
      await prisma.$disconnect()

      // تطبيق Schema
      const { execSync } = require('child_process')
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })

      console.log('✅ تم إعداد قاعدة البيانات بنجاح!')
      return
    } catch (error) {
      console.error('❌ فشل في إعداد قاعدة البيانات:', error.message)
      process.exit(1)
    }
  }

  // في بيئة التطوير، جرب المحلية أولاً ثم السحابية
  try {
    console.log('🔍 محاولة الاتصال بقاعدة البيانات المحلية...')
    
    // استخدام SQLite للتطوير المحلي
    const localPrisma = new PrismaClient({
      datasources: {
        db: {
          url: "file:./dev.db"
        }
      }
    })

    await localPrisma.$queryRaw`SELECT 1`
    console.log('✅ قاعدة البيانات المحلية متاحة')
    await localPrisma.$disconnect()

    const { execSync } = require('child_process')
    // تغيير provider مؤقتاً للتطوير المحلي
    const fs = require('fs')
    const schemaPath = 'prisma/schema.prisma'
    const schema = fs.readFileSync(schemaPath, 'utf8')
    const tempSchema = schema.replace('provider = "postgresql"', 'provider = "sqlite"')
    fs.writeFileSync(schemaPath, tempSchema)
    
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })
    
    // استعادة PostgreSQL
    fs.writeFileSync(schemaPath, schema)

    console.log('✅ تم إعداد قاعدة البيانات المحلية بنجاح!')

  } catch (localError) {
    console.log('⚠️ قاعدة البيانات المحلية غير متاحة، محاولة الاتصال بالسحابية...')
    
    try {
      const cloudPrisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.NEON_DATABASE_URL
          }
        }
      })

      await cloudPrisma.$queryRaw`SELECT 1`
      console.log('✅ قاعدة البيانات السحابية (Neon) متاحة')
      await cloudPrisma.$disconnect()

      const { execSync } = require('child_process')
      process.env.DATABASE_URL = process.env.NEON_DATABASE_URL
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })

      console.log('✅ تم إعداد قاعدة البيانات السحابية بنجاح!')

    } catch (cloudError) {
      console.error('❌ فشل في الاتصال بجميع قواعد البيانات:')
      console.error('   المحلية:', localError.message)
      console.error('   السحابية:', cloudError.message)
      console.log('\n💡 التوصيات:')
      console.log('   1. تأكد من تشغيل PostgreSQL محلياً')
      console.log('   2. تحقق من إعدادات NEON_DATABASE_URL')
      console.log('   3. جرب: npm run db:setup:local')
      process.exit(1)
    }
  }
}

setupDatabase()