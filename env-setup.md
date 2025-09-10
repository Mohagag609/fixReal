# إعداد متغيرات البيئة

## إنشاء ملف .env.local

أنشئ ملف `.env.local` في جذر المشروع مع المحتوى التالي:

```env
# إعدادات قاعدة البيانات
# اختر نوع قاعدة البيانات: sqlite, postgresql-local, postgresql-cloud
DATABASE_TYPE=sqlite

# رابط قاعدة البيانات
# للـ SQLite: مسار الملف (مثال: ./data/dev.db)
# للـ PostgreSQL: رابط الاتصال الكامل
DATABASE_URL=./data/dev.db

# إعدادات التطبيق
NODE_ENV=development
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

## أنواع قواعد البيانات المدعومة:

### 1. SQLite (مستحسن للتطوير):
```env
DATABASE_TYPE=sqlite
DATABASE_URL=./data/dev.db
```

### 2. PostgreSQL محلي:
```env
DATABASE_TYPE=postgresql-local
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

### 3. PostgreSQL سحابي:
```env
DATABASE_TYPE=postgresql-cloud
DATABASE_URL=postgresql://username:password@host:port/database_name
```

## كيفية التطبيق:

1. انسخ المحتوى أعلاه
2. أنشئ ملف `.env.local` في جذر المشروع
3. الصق المحتوى في الملف
4. عدّل القيم حسب احتياجاتك
5. أعد تشغيل البرنامج: `npm run dev`



