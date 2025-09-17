# نظام المحاسبة المتقدم

نظام محاسبة شامل مبني باستخدام Node.js + Express + TypeScript + Prisma + PostgreSQL + Angular + TailwindCSS

## 🚀 الميزات

### Backend
- **Node.js + Express + TypeScript** - خادم قوي وآمن
- **Prisma + PostgreSQL** - قاعدة بيانات متقدمة
- **JWT Authentication** - نظام مصادقة آمن
- **Rate Limiting** - حماية من الهجمات
- **Audit Logging** - تتبع جميع العمليات
- **File Upload/Download** - رفع وتحميل الملفات
- **Excel/PDF Export** - تصدير التقارير
- **Performance Monitoring** - مراقبة الأداء

### Frontend
- **Angular 17** - إطار عمل حديث
- **TailwindCSS** - تصميم متجاوب وجميل
- **HttpClient** - ربط مع Backend
- **Responsive Design** - متوافق مع جميع الأجهزة
- **RTL Support** - دعم اللغة العربية

### الميزات المتقدمة
- **نظام سجل التدقيق** - تتبع جميع العمليات
- **نظام الإشعارات** - إشعارات فورية
- **تصدير واستيراد البيانات** - Excel, PDF, CSV
- **البحث المتقدم** - فلاتر متعددة
- **إدارة مجموعات الشركاء** - تنظيم الشركاء
- **إدارة ديون الشركاء** - تتبع السداد
- **إدارة مستحقات السماسرة** - نظام شامل
- **نظام السندات** - سندات القبض والدفع
- **نظام التحويلات** - بين الخزائن
- **صفحة الإعدادات** - إعدادات شاملة
- **نظام النسخ الاحتياطية** - حماية البيانات
- **منشئ التقارير** - تقارير مخصصة
- **تحسينات الأداء** - مراقبة وتحسين
- **لوحة الإدارة** - إدارة شاملة
- **إدارة المستخدمين** - نظام أمان متقدم

## 📋 المتطلبات

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (اختياري)

## 🛠️ التثبيت

### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd accounting-system
```

### 2. إعداد Backend
```bash
cd backend
npm install
cp .env.example .env
# تعديل متغيرات البيئة في .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 3. إعداد Frontend
```bash
cd frontend
npm install
npm start
```

### 4. إعداد قاعدة البيانات
```bash
# إنشاء قاعدة البيانات
createdb accounting

# تشغيل المايجريشن
cd backend
npx prisma migrate deploy
```

## 🐳 التثبيت باستخدام Docker

```bash
# تشغيل جميع الخدمات
docker-compose up --build

# تشغيل في الخلفية
docker-compose up -d --build
```

## 🔧 متغيرات البيئة

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/accounting
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:4200
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend
```env
API_URL=http://localhost:3000/api
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/logout` - تسجيل الخروج

### Customers
- `GET /api/customers` - قائمة العملاء
- `POST /api/customers` - إضافة عميل
- `PUT /api/customers/:id` - تحديث عميل
- `DELETE /api/customers/:id` - حذف عميل

### Transactions
- `GET /api/transactions` - قائمة المعاملات
- `POST /api/transactions` - إضافة معاملة
- `PUT /api/transactions/:id` - تحديث معاملة
- `DELETE /api/transactions/:id` - حذف معاملة

### Reports
- `GET /api/reports` - قائمة التقارير
- `POST /api/reports/generate` - توليد تقرير

## 🧪 الاختبارات

```bash
# تشغيل اختبارات Backend
cd backend
npm test

# تشغيل اختبارات Frontend
cd frontend
npm test
```

## 📦 البناء للإنتاج

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

## 🚀 النشر

### باستخدام Docker
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### يدوياً
1. بناء Backend و Frontend
2. إعداد خادم ويب (Nginx)
3. إعداد قاعدة البيانات
4. تشغيل التطبيق

## 📊 مراقبة الأداء

- **Health Check**: `GET /health`
- **Performance Metrics**: `GET /api/performance/stats`
- **System Health**: `GET /api/admin/health`

## 🔒 الأمان

- JWT Authentication
- Rate Limiting
- CORS Protection
- Input Validation
- SQL Injection Protection
- XSS Protection

## 📝 الترخيص

هذا المشروع مرخص تحت رخصة MIT.

## 🤝 المساهمة

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة
3. Commit التغييرات
4. Push للفرع
5. فتح Pull Request

## 📞 الدعم

للحصول على الدعم، يرجى فتح issue في GitHub.

## 🎯 Roadmap

- [ ] تطبيق الهاتف المحمول
- [ ] تكامل مع أنظمة الدفع
- [ ] تقارير متقدمة
- [ ] ذكاء اصطناعي للتنبؤات
- [ ] تكامل مع أنظمة المحاسبة الأخرى

---

تم تطوير هذا النظام بواسطة فريق التطوير المتخصص في أنظمة المحاسبة المتقدمة.