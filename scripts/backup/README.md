# نظام النسخ الاحتياطية والاستعادة

نظام شامل للنسخ الاحتياطية والاستعادة يدعم ثلاثة أنواع من قواعد البيانات:
- PostgreSQL السحابي (Neon, Supabase, إلخ)
- PostgreSQL المحلي
- SQLite

## المتغيرات البيئية المطلوبة

```bash
# نوع قاعدة البيانات
DATABASE_TYPE=postgresql-cloud  # أو postgresql-local أو sqlite

# عناوين الاتصال
DATABASE_URL_POSTGRES_CLOUD=postgresql://...
DATABASE_URL_POSTGRES_LOCAL=postgresql://...
DATABASE_URL_SQLITE=file:./dev.db

# إعدادات إضافية
APP_VERSION=1.0.0
PRISMA_MIGRATION_ID=latest
ALLOW_HARD_WIPE=false  # للسماح بالمسح الكامل
```

## الاستخدام

### 1. إنشاء نسخة احتياطية

```bash
# تصدير البيانات
npm run backup:export

# أو مع مجلد مخصص
ts-node scripts/backup/export.ts ./my-backups
```

### 2. استيراد نسخة احتياطية

```bash
# فحص النسخة الاحتياطية (dry run)
npm run backup:import:dry

# تطبيق النسخة الاحتياطية
npm run backup:import:apply

# أو مع ملف مخصص
ts-node scripts/backup/import.ts ./backup-file.tar.gz --apply
```

### 3. مسح البيانات

```bash
# مسح ناعم (soft delete)
npm run backup:wipe

# مسح كامل (يتطلب ALLOW_HARD_WIPE=true)
ts-node scripts/backup/wipe.ts hard
```

## API Routes

### تصدير البيانات
```bash
POST /api/system/export
```

### استيراد البيانات
```bash
POST /api/system/import
Content-Type: application/json

{
  "base64": "base64-encoded-backup-file",
  "apply": false,
  "mode": "replace"
}
```

### مسح البيانات
```bash
POST /api/system/wipe
Content-Type: application/json

{
  "mode": "soft",
  "confirm": true
}
```

## هيكل النسخة الاحتياطية

```
backup-<env>-<timestamp>.tar.gz
├── manifest.json          # معلومات النسخة الاحتياطية
└── data/
    ├── User.ndjson        # بيانات المستخدمين
    ├── Customer.ndjson    # بيانات العملاء
    ├── Unit.ndjson        # بيانات الوحدات
    └── ...                # باقي الجداول
```

## ملاحظات مهمة

1. **تحديث قائمة النماذج**: عند إضافة نماذج جديدة إلى `schema.prisma`، يجب تحديث قائمة `MODELS` في `export.ts`

2. **الترتيب مهم**: في عملية المسح، يتم حذف الجداول بالترتيب الصحيح لتجنب مشاكل المفاتيح الخارجية

3. **الأمان**: المسح الكامل (hard wipe) معطل افتراضياً ويتطلب `ALLOW_HARD_WIPE=true`

4. **الأداء**: يتم معالجة البيانات في دفعات (batches) لتحسين الأداء

5. **التوافق**: النظام يعمل مع جميع أنواع قواعد البيانات المدعومة عبر Prisma

## استكشاف الأخطاء

- تأكد من صحة متغيرات البيئة
- تحقق من اتصال قاعدة البيانات
- راجع سجلات الأخطاء في وحدة التحكم
- تأكد من وجود مساحة كافية للتخزين المؤقت