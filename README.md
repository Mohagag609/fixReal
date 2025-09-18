# نظام إدارة العقارات - Real Estate Accounting System

نظام شامل لإدارة العقارات والعقود والأقساط والخزائن المالية، مطور بـ Django مع واجهة حديثة باستخدام Tailwind CSS و HTMX.

## 🌟 المميزات

### 📊 إدارة شاملة
- **العملاء**: إدارة بيانات العملاء مع البحث المتقدم
- **الوحدات**: إدارة الوحدات العقارية مع أنواع مختلفة
- **العقود**: إنشاء وإدارة العقود مع حساب الأقساط التلقائي
- **الأقساط**: تتبع حالة الأقساط والمدفوعات
- **الخزائن**: إدارة الخزائن المالية مع تتبع الأرصدة
- **السندات**: سندات القبض والدفع مع تحديث تلقائي للأرصدة
- **الشركاء**: إدارة الشركاء والنسب المئوية
- **التحويلات**: تحويل الأموال بين الخزائن

### 🎨 واجهة مستخدم حديثة
- تصميم متجاوب (Responsive Design)
- واجهة باللغة العربية مع دعم RTL
- أنيميشن وانتقالات سلسة
- بحث مباشر ومتقدم
- تحديث ديناميكي بدون إعادة تحميل الصفحة

### 🔧 تقنيات متقدمة
- **Backend**: Django 4.2.7 مع PostgreSQL
- **Frontend**: Tailwind CSS + HTMX + Alpine.js
- **Database**: PostgreSQL مع فهرسة محسنة
- **Security**: CSRF protection, data validation
- **Performance**: Optimized queries, caching

## 🚀 التثبيت والتشغيل

### المتطلبات
- Python 3.11.8+
- PostgreSQL 14+
- Node.js 18+ (لبناء Tailwind CSS)

### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd accounting-project
```

### 2. إعداد البيئة الافتراضية
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# أو
venv\Scripts\activate  # Windows
```

### 3. تثبيت المتطلبات
```bash
# تثبيت متطلبات Python
pip install -r requirements.txt

# تثبيت متطلبات Node.js
npm install
```

### 4. إعداد متغيرات البيئة
```bash
cp .env.example .env
# قم بتعديل .env مع القيم الصحيحة
```

### 5. إعداد قاعدة البيانات
```bash
# تشغيل migrations
python manage.py migrate

# إنشاء superuser (اختياري)
python manage.py createsuperuser
```

### 6. بناء Tailwind CSS
```bash
npm run build:css
```

### 7. جمع الملفات الثابتة
```bash
python manage.py collectstatic --noinput
```

### 8. تشغيل الخادم
```bash
python manage.py runserver
```

افتح المتصفح على `http://localhost:8000`

## 📁 هيكل المشروع

```
accounting_project/
├── accounting_app/
│   ├── models.py              # نماذج قاعدة البيانات
│   ├── views.py               # Class-based views
│   ├── htmx_views.py          # HTMX endpoints
│   ├── urls.py                # URL patterns
│   ├── services/              # خدمات الأعمال
│   │   ├── financial_services.py
│   │   └── validation_services.py
│   ├── templates/             # قوالب HTML
│   │   ├── accounting_app/
│   │   │   ├── dashboard.html
│   │   │   ├── customers/
│   │   │   ├── units/
│   │   │   ├── contracts/
│   │   │   └── htmx/
│   └── migrations/            # Database migrations
├── static/                    # الملفات الثابتة
│   ├── css/
│   │   └── tailwind.css       # Tailwind CSS المبنية
│   └── js/
│       └── main.js            # JavaScript الرئيسي
├── templates/
│   └── base.html              # القالب الأساسي
├── assets/
│   └── input.css              # Tailwind CSS source
├── requirements.txt           # متطلبات Python
├── package.json               # متطلبات Node.js
├── tailwind.config.js         # إعدادات Tailwind
├── Procfile                   # إعدادات النشر
├── runtime.txt                # إصدار Python
└── README.md                  # هذا الملف
```

## 🎯 الاستخدام

### 1. لوحة التحكم
- عرض الإحصائيات الرئيسية
- إجراءات سريعة للعمليات الشائعة
- روابط سريعة لجميع الأقسام

### 2. إدارة العملاء
- إضافة عملاء جدد
- البحث في العملاء
- تحديث بيانات العملاء
- حذف العملاء (soft delete)

### 3. إدارة الوحدات
- إضافة وحدات عقارية
- تصنيف الوحدات حسب النوع
- إدارة الشركاء للوحدات
- تتبع حالة الوحدات

### 4. إدارة العقود
- إنشاء عقود جديدة
- حساب الأقساط تلقائياً
- ربط العقود بالوحدات والعملاء
- تتبع حالة العقود

### 5. إدارة الأقساط
- عرض جميع الأقساط
- تحديث حالة الأقساط
- تتبع الأقساط المتأخرة
- تحديث ديناميكي للحالة

### 6. إدارة الخزائن
- إدارة الخزائن المالية
- تتبع الأرصدة
- تحديث تلقائي للأرصدة
- عرض تاريخ المعاملات

### 7. إدارة السندات
- سندات القبض والدفع
- ربط السندات بالخزائن
- تحديث تلقائي للأرصدة
- تتبع المعاملات المالية

## 🔧 التطوير

### بناء Tailwind CSS
```bash
# بناء مرة واحدة
npm run build:css

# مراقبة التغييرات
npm run watch:css
```

### تشغيل الاختبارات
```bash
python manage.py test
```

### إنشاء migrations جديدة
```bash
python manage.py makemigrations
python manage.py migrate
```

### جمع الملفات الثابتة
```bash
python manage.py collectstatic --noinput
```

## 🚀 النشر

### النشر على Render.com
1. اتبع دليل النشر في `DEPLOY.md`
2. أضف متغيرات البيئة المطلوبة
3. اربط مع قاعدة بيانات PostgreSQL
4. شغل البناء والنشر

### متغيرات البيئة المطلوبة
```
DATABASE_URL=postgres://user:password@host:port/dbname
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.com
```

## 📊 API Endpoints

### HTMX Endpoints
- `GET /htmx/customers/` - البحث في العملاء
- `GET /htmx/units/` - البحث في الوحدات
- `GET /htmx/safes/` - قائمة الخزائن
- `POST /htmx/installments/<id>/status/` - تحديث حالة القسط
- `POST /htmx/vouchers/create/` - إنشاء سند
- `GET /htmx/dashboard/stats/` - إحصائيات لوحة التحكم

### JSON API
- `GET /api/customers/` - API العملاء
- `GET /api/units/` - API الوحدات
- `GET /api/safes/` - API الخزائن

## 🛡️ الأمان

- CSRF protection مفعل
- Data validation على الخادم والعميل
- Soft delete للحفاظ على البيانات
- Transaction integrity للعمليات المالية
- Input sanitization

## 📈 الأداء

- استعلامات محسنة مع select_related
- فهرسة قاعدة البيانات
- Pagination للقوائم الطويلة
- Caching للبيانات المتكررة
- Minified CSS و JavaScript

## 🤝 المساهمة

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة
3. Commit التغييرات
4. Push إلى الفرع
5. إنشاء Pull Request

## 📝 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف LICENSE للتفاصيل.

## 📞 الدعم

- إنشاء issue في GitHub
- مراجعة الوثائق
- فحص logs للأخطاء

## 🔄 التحديثات

### الإصدار 1.0.0
- إطلاق النسخة الأولى
- جميع الوظائف الأساسية
- واجهة مستخدم حديثة
- دعم HTMX و Alpine.js

---

**تم تطويره بـ ❤️ باستخدام Django و Tailwind CSS**