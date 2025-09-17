# نظام إدارة العقارات - Angular + Laravel + MySQL

نظام إدارة العقارات المتطور تم تحويله من Node.js + Prisma + Next.js إلى Angular + Laravel + MySQL.

## البنية العامة

```
estate-management/
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Models/
│   │   └── Services/
│   ├── database/migrations/
│   └── routes/api.php
├── frontend/               # Angular App
│   ├── src/app/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── models/
│   └── tailwind.config.js
└── README.md
```

## المتطلبات

### Backend (Laravel)
- PHP 8.1+
- Composer
- MySQL 8.0+
- Laravel 10+

### Frontend (Angular)
- Node.js 18+
- Angular 17+
- Tailwind CSS 3.4+

## التثبيت والتشغيل

### 1. إعداد Backend (Laravel)

```bash
cd backend

# تثبيت التبعيات
composer install

# نسخ ملف البيئة
cp .env.example .env

# توليد مفتاح التطبيق
php artisan key:generate

# إعداد قاعدة البيانات في .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=estate_management
DB_USERNAME=root
DB_PASSWORD=your_password

# تشغيل المايجريشن
php artisan migrate

# تشغيل الخادم
php artisan serve --host=0.0.0.0 --port=8000
```

### 2. إعداد Frontend (Angular)

```bash
cd frontend

# تثبيت التبعيات
npm install

# تشغيل الخادم
npm start
# أو
ng serve --host 0.0.0.0 --port 4200
```

## الوصول للتطبيق

- Frontend: http://localhost:4200
- Backend API: http://localhost:8000/api

## الميزات المنجزة

### Backend (Laravel)
- ✅ Models مطابقة لـ Prisma Schema
- ✅ Migrations لجميع الجداول
- ✅ API Controllers للعملاء والوحدات
- ✅ Services للحسابات المالية
- ✅ Dashboard API
- ✅ MySQL Database Structure

### Frontend (Angular)
- ✅ Angular 17 مع Standalone Components
- ✅ Tailwind CSS مع التصميم المطلوب
- ✅ Dashboard مع KPIs
- ✅ إدارة العملاء (CRUD)
- ✅ إدارة الوحدات (CRUD)
- ✅ Sidebar و Header
- ✅ Responsive Design
- ✅ Arabic RTL Support

## التصميم

- **الألوان**: Deep Blue/Navy و Teal/Cyan
- **الخلفية**: بطاقات بيضاء مع خلفية فاتحة
- **الزوايا**: مستديرة 8-16px
- **الأنيميشن**: Fade/Slide للبطاقات، Hover Scale للأزرار
- **Layout**: Sidebar ثابت، Header ثابت، محتوى في الوسط

## API Endpoints

### Dashboard
- `GET /api/dashboard` - مؤشرات الأداء الرئيسية

### Customers
- `GET /api/customers` - قائمة العملاء
- `POST /api/customers` - إضافة عميل جديد
- `GET /api/customers/{id}` - تفاصيل عميل
- `PUT /api/customers/{id}` - تحديث عميل
- `DELETE /api/customers/{id}` - حذف عميل

### Units
- `GET /api/units` - قائمة الوحدات
- `POST /api/units` - إضافة وحدة جديدة
- `GET /api/units/{id}` - تفاصيل وحدة
- `PUT /api/units/{id}` - تحديث وحدة
- `DELETE /api/units/{id}` - حذف وحدة

## النشر على Render

### Backend (Laravel)
1. إنشاء Web Service جديد
2. ربط المستودع
3. إعداد متغيرات البيئة
4. Build Command: `composer install --no-dev --prefer-dist && php artisan migrate --force && php artisan config:cache`
5. Start Command: `php artisan serve --host=0.0.0.0 --port=$PORT`

### Frontend (Angular)
1. إنشاء Static Site
2. ربط المستودع
3. Build Command: `npm ci && npm run build`
4. Publish Directory: `dist/estate-management`

## التطوير المستقبلي

- [ ] إكمال باقي Controllers
- [ ] إضافة Authentication
- [ ] إكمال باقي الصفحات
- [ ] إضافة التقارير
- [ ] إضافة النسخ الاحتياطية
- [ ] تحسين الأداء
- [ ] إضافة الاختبارات

## الدعم

لأي استفسارات أو مشاكل، يرجى فتح issue في المستودع.