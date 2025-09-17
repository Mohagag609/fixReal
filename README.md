# نظام المحاسبة العقارية

نظام محاسبة شامل لإدارة العقارات والعقود والأقساط، مطور باستخدام Django و PostgreSQL.

## المميزات

- **إدارة العملاء**: إضافة وتعديل وحذف بيانات العملاء
- **إدارة الوحدات**: إدارة الوحدات العقارية مع تفاصيل كاملة
- **إدارة العقود**: إنشاء وإدارة العقود مع حساب الأقساط تلقائياً
- **إدارة الأقساط**: تتبع حالة الأقساط والمدفوعات
- **إدارة الخزائن**: إدارة الخزائن المالية والأرصدة
- **إدارة السندات**: سندات القبض والدفع مع تحديث الأرصدة
- **واجهة حديثة**: تصميم عصري باستخدام Tailwind CSS
- **تفاعل سلس**: استخدام HTMX و Alpine.js للتفاعل

## التقنيات المستخدمة

- **Backend**: Django 4.2.7
- **Database**: PostgreSQL
- **Frontend**: Tailwind CSS, HTMX, Alpine.js
- **Deployment**: Gunicorn, Render

## التثبيت والتشغيل محلياً

### المتطلبات

- Python 3.11+
- PostgreSQL
- pip

### خطوات التثبيت

1. **استنساخ المشروع**
```bash
git clone <repository-url>
cd accounting_project
```

2. **إنشاء بيئة افتراضية**
```bash
python -m venv venv
source venv/bin/activate  # على Linux/Mac
# أو
venv\Scripts\activate  # على Windows
```

3. **تثبيت المتطلبات**
```bash
pip install -r requirements.txt
```

4. **إعداد قاعدة البيانات**
```bash
# إنشاء قاعدة بيانات PostgreSQL
createdb accounting_db
```

5. **إعداد متغيرات البيئة**
```bash
# إنشاء ملف .env
cp .env.example .env
# تعديل القيم في ملف .env
```

6. **تشغيل Migrations**
```bash
python manage.py migrate
```

7. **إنشاء مستخدم إداري (اختياري)**
```bash
python manage.py createsuperuser
```

8. **تشغيل الخادم**
```bash
python manage.py runserver
```

9. **فتح المتصفح**
```
http://localhost:8000
```

## النشر على Render

### 1. إعداد قاعدة البيانات

1. أنشئ قاعدة بيانات PostgreSQL جديدة على Render
2. احصل على `DATABASE_URL` من إعدادات قاعدة البيانات

### 2. إعداد Web Service

1. اربط المشروع بـ GitHub repository
2. اختر "Web Service"
3. استخدم الإعدادات التالية:

**Build Command:**
```bash
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
```

**Start Command:**
```bash
gunicorn accounting_project.wsgi
```

**Environment Variables:**
```
DATABASE_URL=postgres://user:password@host:port/dbname
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-app-name.onrender.com
```

### 3. النشر

1. اضغط على "Create Web Service"
2. انتظر حتى يكتمل البناء
3. افتح الرابط المقدم

## هيكل المشروع

```
accounting_project/
├── manage.py
├── accounting_app/
│   ├── migrations/
│   ├── templates/
│   │   └── accounting_app/
│   │       ├── customers/
│   │       ├── units/
│   │       ├── contracts/
│   │       ├── installments/
│   │       ├── safes/
│   │       └── vouchers/
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   └── admin.py
├── templates/
│   └── base.html
├── static/
├── requirements.txt
├── runtime.txt
├── Procfile
└── README.md
```

## النماذج (Models)

- **Customer**: العملاء
- **Unit**: الوحدات العقارية
- **Contract**: العقود
- **Installment**: الأقساط
- **Safe**: الخزائن
- **Voucher**: السندات
- **Partner**: الشركاء
- **Broker**: السماسرة

## الصفحات المتاحة

- `/` - الصفحة الرئيسية (Dashboard)
- `/customers/` - قائمة العملاء
- `/customers/create/` - إضافة عميل جديد
- `/units/` - قائمة الوحدات
- `/units/create/` - إضافة وحدة جديدة
- `/contracts/` - قائمة العقود
- `/contracts/create/` - إضافة عقد جديد
- `/installments/` - قائمة الأقساط
- `/safes/` - قائمة الخزائن
- `/safes/create/` - إضافة خزنة جديدة
- `/vouchers/` - قائمة السندات
- `/vouchers/create/` - إضافة سند جديد

## API Endpoints

- `/api/customers/` - قائمة العملاء (JSON)
- `/api/units/` - قائمة الوحدات (JSON)
- `/api/safes/` - قائمة الخزائن (JSON)

## المميزات التقنية

- **Class-Based Views**: استخدام ListView, CreateView, UpdateView, DeleteView
- **Database Transactions**: ضمان اتساق البيانات المالية
- **Soft Delete**: حذف منطقي للبيانات
- **Search & Filter**: بحث وتصفية متقدم
- **Pagination**: تقسيم الصفحات
- **Responsive Design**: تصميم متجاوب
- **RTL Support**: دعم اللغة العربية

## المساهمة

1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى Branch (`git push origin feature/amazing-feature`)
5. افتح Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## الدعم

للدعم والمساعدة، يرجى فتح issue في GitHub repository.