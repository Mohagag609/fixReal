# دليل النشر على Netlify

## متطلبات النشر

### 1. إعداد قاعدة البيانات
- تم إعداد قاعدة البيانات PostgreSQL على Neon
- تم إنشاء الجداول والبيانات الأولية

### 2. متغيرات البيئة المطلوبة

في Netlify، أضف هذه المتغيرات في Site Settings > Environment Variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_fjdbuB2cR3rW@ep-snowy-sunset-adekgsy7-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DATABASE_PROVIDER=postgresql
NEXTAUTH_URL=https://your-app-name.netlify.app
NEXTAUTH_SECRET=your-secret-key-here
```

### 3. إعدادات البناء

- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Node Version**: 18

### 4. خطوات النشر

1. **ربط المستودع**:
   - اربط مستودع GitHub مع Netlify
   - اختر الفرع الرئيسي

2. **إعداد البناء**:
   - Build Command: `npm run build`
   - Publish Directory: `.next`
   - Node Version: 18

3. **إضافة متغيرات البيئة**:
   - اذهب إلى Site Settings > Environment Variables
   - أضف المتغيرات المذكورة أعلاه

4. **النشر**:
   - اضغط على "Deploy site"
   - انتظر حتى يكتمل البناء

### 5. اختبار النشر

بعد النشر، تأكد من:
- تحميل الصفحة الرئيسية
- تسجيل الدخول
- إضافة عميل جديد
- عرض التقارير

### 6. استكشاف الأخطاء

إذا واجهت مشاكل:

1. **تحقق من Logs**:
   - اذهب إلى Functions > Logs
   - ابحث عن أخطاء في البناء

2. **تحقق من متغيرات البيئة**:
   - تأكد من صحة DATABASE_URL
   - تأكد من وجود جميع المتغيرات المطلوبة

3. **تحقق من قاعدة البيانات**:
   - تأكد من اتصال قاعدة البيانات
   - تحقق من وجود الجداول

### 7. التحديثات المستقبلية

لنشر تحديثات جديدة:
1. ادفع التغييرات إلى GitHub
2. سيقوم Netlify بنشر التحديثات تلقائياً

## معلومات إضافية

- **قاعدة البيانات**: PostgreSQL على Neon
- **الاستضافة**: Netlify
- **النطاق**: https://your-app-name.netlify.app
- **النسخة**: Next.js 15.5.3

## الدعم

إذا واجهت أي مشاكل، تحقق من:
1. Logs في Netlify
2. اتصال قاعدة البيانات
3. متغيرات البيئة