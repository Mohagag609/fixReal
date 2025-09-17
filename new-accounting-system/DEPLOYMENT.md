# دليل النشر على Netlify

## المشكلة الحالية
المشروع يحاول تشغيل `./build.sh` لكن الملف غير موجود في المستودع.

## الحل المطبق
تم تحديث الإعدادات لاستخدام `npm run build` بدلاً من `./build.sh`.

## خطوات النشر

### 1. إعداد متغيرات البيئة في Netlify

اذهب إلى Site Settings > Environment Variables وأضف:

```
DATABASE_URL=postgresql://neondb_owner:npg_fjdbuB2cR3rW@ep-snowy-sunset-adekgsy7-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DATABASE_PROVIDER=postgresql
NEXTAUTH_URL=https://your-app-name.netlify.app
NEXTAUTH_SECRET=your-production-secret-key-here
NEXT_PUBLIC_APP_URL=https://your-app-name.netlify.app
```

### 2. إعدادات البناء

- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Node Version**: `18`

### 3. النشر

1. اربط مستودع GitHub مع Netlify
2. اختر الفرع `cursor/build-new-accounting-app-with-modern-ui-12a1`
3. أضف متغيرات البيئة
4. اضغط على "Deploy site"

## الملفات المحدثة

- `netlify.toml` - تم تحديث command إلى `npm run build`
- `package.json` - تم إضافة `postinstall` script
- `next.config.js` - تم إزالة `output: 'standalone'`
- `.env.production` - تم إنشاء ملف متغيرات البيئة للإنتاج

## اختبار النشر

بعد النشر، تأكد من:
1. تحميل الصفحة الرئيسية
2. اختبار API endpoints
3. اختبار قاعدة البيانات
4. اختبار جميع الصفحات

## استكشاف الأخطاء

إذا واجهت مشاكل:
1. تحقق من Logs في Netlify
2. تحقق من متغيرات البيئة
3. تأكد من اتصال قاعدة البيانات
4. تحقق من إصدار Node.js