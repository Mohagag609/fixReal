# نظام إدارة العقارات المتطور

نظام شامل لإدارة العقارات مع واجهة حديثة ووظائف متقدمة للحسابات والتقارير.

## 🚀 المميزات

### Backend (Node.js + Express + TypeScript + Prisma + PostgreSQL)
- ✅ API RESTful كامل مع TypeScript
- ✅ قاعدة بيانات PostgreSQL مع Prisma ORM
- ✅ نظام مصادقة JWT متقدم
- ✅ حسابات مالية متقدمة (أرباح، خسائر، أرصدة)
- ✅ Middleware للحماية ومعالجة الأخطاء
- ✅ Unit Tests شاملة
- ✅ Rate Limiting و CORS
- ✅ Validation متقدم

### Frontend (Angular + TailwindCSS)
- ✅ واجهة مستخدم حديثة مع Angular 17
- ✅ تصميم متجاوب مع TailwindCSS
- ✅ نظام تنقل متقدم مع Sidebar و Header
- ✅ صفحات: Dashboard, العملاء, الوحدات, العقود, المعاملات, التقارير
- ✅ Animations و Transitions سلسة
- ✅ نظام إشعارات متقدم
- ✅ Loading States و Error Handling

### Production Ready
- ✅ Docker Compose للبيئة الإنتاجية
- ✅ Nginx Reverse Proxy
- ✅ SSL Support
- ✅ Health Checks
- ✅ Security Headers
- ✅ Rate Limiting

## 🛠️ التقنيات المستخدمة

### Backend
- **Node.js** - بيئة تشغيل JavaScript
- **Express.js** - إطار عمل الويب
- **TypeScript** - JavaScript مع أنواع البيانات
- **Prisma** - ORM للتعامل مع قاعدة البيانات
- **PostgreSQL** - قاعدة بيانات علائقية
- **JWT** - نظام المصادقة
- **Jest** - إطار الاختبارات

### Frontend
- **Angular 17** - إطار عمل الواجهة الأمامية
- **TailwindCSS** - إطار عمل CSS
- **RxJS** - برمجة تفاعلية
- **Angular Animations** - نظام الحركات
- **Angular Router** - نظام التنقل

### DevOps
- **Docker** - حاويات التطبيقات
- **Docker Compose** - إدارة الحاويات المتعددة
- **Nginx** - خادم الويب والبروكسي العكسي

## 📋 المتطلبات

- Node.js 18+
- npm 9+
- Docker & Docker Compose
- PostgreSQL 15+ (للتنمية المحلية)

## 🚀 التشغيل السريع

### 1. تشغيل مع Docker (مستحسن)

```bash
# استنساخ المشروع
git clone <repository-url>
cd estate-management-system

# تشغيل جميع الخدمات
docker-compose up --build

# الوصول للتطبيق
# Frontend: http://localhost:4200
# Backend API: http://localhost:3001/api
# Database: localhost:5432
```

### 2. التشغيل المحلي

#### Backend
```bash
cd backend

# تثبيت التبعيات
npm install

# إعداد قاعدة البيانات
npx prisma generate
npx prisma db push

# تشغيل قاعدة البيانات (PostgreSQL)
# تأكد من تشغيل PostgreSQL على localhost:5432

# تشغيل الخادم
npm run dev
```

#### Frontend
```bash
cd frontend

# تثبيت التبعيات
npm install

# تشغيل التطبيق
npm start
```

## 🗄️ إعداد قاعدة البيانات

### 1. إنشاء قاعدة البيانات
```bash
# الاتصال بـ PostgreSQL
psql -U postgres

# إنشاء قاعدة البيانات
CREATE DATABASE estate_management;
```

### 2. تشغيل Migration
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. إنشاء بيانات تجريبية
```bash
cd backend
npm run db:seed
```

## 🔐 بيانات الدخول الافتراضية

```
المدير:
Username: admin
Password: admin123

المستخدم:
Username: user
Password: user123
```

## 📁 هيكل المشروع

```
estate-management-system/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── controllers/     # Controllers
│   │   ├── services/        # Business Logic
│   │   ├── middleware/      # Middleware
│   │   ├── routes/          # API Routes
│   │   ├── types/           # TypeScript Types
│   │   └── config/          # Configuration
│   ├── prisma/              # Database Schema
│   ├── tests/               # Unit Tests
│   └── Dockerfile
├── frontend/                # Frontend App
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # Angular Components
│   │   │   ├── services/    # API Services
│   │   │   ├── models/      # TypeScript Models
│   │   │   ├── guards/      # Route Guards
│   │   │   └── interceptors/ # HTTP Interceptors
│   │   └── assets/          # Static Assets
│   └── Dockerfile
├── nginx/                   # Nginx Configuration
├── scripts/                 # Database Scripts
├── docker-compose.yml       # Docker Compose
└── README.md
```

## 🔧 الأوامر المفيدة

### Backend
```bash
# تشغيل التطوير
npm run dev

# بناء الإنتاج
npm run build

# تشغيل الإنتاج
npm start

# تشغيل الاختبارات
npm test

# مراقبة الاختبارات
npm run test:watch

# إعداد قاعدة البيانات
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:seed

# Prisma Studio
npm run db:studio
```

### Frontend
```bash
# تشغيل التطوير
npm start

# بناء الإنتاج
npm run build

# بناء الإنتاج المحسن
npm run build:prod

# تشغيل الاختبارات
npm test

# مراقبة الاختبارات
npm run test:watch

# Linting
npm run lint
```

### Docker
```bash
# تشغيل جميع الخدمات
docker-compose up

# تشغيل في الخلفية
docker-compose up -d

# إعادة بناء الحاويات
docker-compose up --build

# إيقاف الخدمات
docker-compose down

# عرض السجلات
docker-compose logs -f

# تنظيف النظام
docker-compose down -v
docker system prune -a
```

## 🧪 الاختبارات

### Backend Tests
```bash
cd backend
npm test                    # تشغيل جميع الاختبارات
npm run test:watch         # مراقبة الاختبارات
npm run test:coverage      # تقرير التغطية
```

### Frontend Tests
```bash
cd frontend
npm test                   # تشغيل جميع الاختبارات
npm run test:watch        # مراقبة الاختبارات
npm run test:coverage     # تقرير التغطية
```

## 📊 API Documentation

### Authentication Endpoints
```
POST /api/auth/login       # تسجيل الدخول
POST /api/auth/register    # تسجيل مستخدم جديد
GET  /api/auth/profile     # الملف الشخصي
PUT  /api/auth/profile     # تحديث الملف الشخصي
PUT  /api/auth/change-password # تغيير كلمة المرور
```

### Dashboard Endpoints
```
GET /api/dashboard/stats              # إحصائيات لوحة التحكم
GET /api/dashboard/financial-summary  # الملخص المالي
GET /api/dashboard/safe-balances      # أرصدة الخزائن
GET /api/dashboard/installment-status # حالة الأقساط
```

## 🔒 الأمان

- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt)
- ✅ Rate Limiting
- ✅ CORS Protection
- ✅ Input Validation
- ✅ SQL Injection Protection (Prisma)
- ✅ XSS Protection
- ✅ Security Headers

## 🚀 النشر

### 1. النشر على VPS
```bash
# رفع الملفات
scp -r . user@server:/path/to/app

# تشغيل على الخادم
ssh user@server
cd /path/to/app
docker-compose up -d
```

### 2. النشر على Netlify (Frontend)
```bash
cd frontend
npm run build:prod
# رفع مجلد dist إلى Netlify
```

### 3. النشر على Railway/Heroku (Backend)
```bash
# إعداد متغيرات البيئة
# تشغيل Migration
# رفع الكود
```

## 🐛 استكشاف الأخطاء

### مشاكل شائعة

1. **خطأ في الاتصال بقاعدة البيانات**
   ```bash
   # تحقق من تشغيل PostgreSQL
   sudo systemctl status postgresql
   
   # تحقق من الاتصال
   psql -U postgres -h localhost
   ```

2. **خطأ في Prisma**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

3. **خطأ في Docker**
   ```bash
   # تنظيف النظام
   docker system prune -a
   
   # إعادة بناء
   docker-compose up --build --force-recreate
   ```

4. **خطأ في Angular**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📈 الأداء

### تحسينات Backend
- ✅ Connection Pooling
- ✅ Query Optimization
- ✅ Caching Strategy
- ✅ Compression
- ✅ Rate Limiting

### تحسينات Frontend
- ✅ Lazy Loading
- ✅ OnPush Change Detection
- ✅ Tree Shaking
- ✅ Bundle Optimization
- ✅ Image Optimization

## 🤝 المساهمة

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 📞 الدعم

للحصول على الدعم، يرجى فتح issue في GitHub أو التواصل عبر البريد الإلكتروني.

## 🔄 التحديثات

### v1.0.0 (2024)
- ✅ إطلاق النسخة الأولى
- ✅ Backend API كامل
- ✅ Frontend Angular
- ✅ Docker Support
- ✅ Production Ready

---

**تم تطوير هذا المشروع بـ ❤️ باستخدام أحدث التقنيات**