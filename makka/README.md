# نظام إدارة العقارات - مكة

نظام شامل لإدارة العقارات والعقود والوحدات السكنية والتجارية.

## الميزات الرئيسية

### 🏠 إدارة العقارات
- إدارة العملاء والوحدات والعقود
- تتبع المدفوعات والأقساط
- إدارة الشركاء والمستثمرين
- نظام الخزائن والمعاملات المالية

### 📊 التقارير والتحليلات
- تقارير مالية شاملة
- تحليلات المبيعات والأداء
- رسوم بيانية تفاعلية
- تصدير PDF و Excel

### 🔔 نظام الإشعارات
- إشعارات العقود الجديدة
- تنبيهات الاستحقاق
- إشعارات المدفوعات
- نظام إشعارات متقدم

### 🗄️ إدارة قاعدة البيانات
- نسخ احتياطية تلقائية
- استيراد وتصدير البيانات
- تحسين الأداء
- إدارة الجداول

### ⚙️ الإعدادات
- إعدادات النظام
- مفاتيح وقيم مخصصة
- نسخ احتياطي للإعدادات
- استيراد وتصدير الإعدادات

## التقنيات المستخدمة

- **Backend**: Django 4.2.7
- **Database**: PostgreSQL
- **Frontend**: HTML, CSS, JavaScript, Tailwind CSS
- **Charts**: Chart.js
- **Reports**: ReportLab, Pandas
- **Styling**: Tailwind CSS, Alpine.js

## التثبيت والتشغيل

### 1. متطلبات النظام
- Python 3.8+
- PostgreSQL 12+
- Node.js (للموارد الثابتة)

### 2. تثبيت المتطلبات
```bash
pip install -r requirements.txt
```

### 3. إعداد قاعدة البيانات
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. إنشاء مستخدم مدير
```bash
python manage.py createsuperuser
```

### 5. تشغيل الخادم
```bash
python manage.py runserver
```

## هيكل المشروع

```
makka/
├── makka/                 # إعدادات Django الرئيسية
├── realpp/               # التطبيق الرئيسي
│   ├── models.py         # نماذج البيانات
│   ├── views.py          # عروض البيانات
│   ├── forms.py          # نماذج الإدخال
│   ├── services/         # خدمات الأعمال
│   └── templates/        # قوالب HTML
├── dbms_app/             # إدارة قاعدة البيانات
├── reports_app/          # التقارير
├── notifications_app/    # الإشعارات
├── analytics_app/        # التحليلات
├── settings_app/         # الإعدادات
├── templates/            # القوالب المشتركة
├── static/               # الملفات الثابتة
└── requirements.txt      # متطلبات Python
```

## الاستخدام

### 1. لوحة التحكم
- عرض KPIs رئيسية
- إحصائيات سريعة
- روابط سريعة للوحدات الرئيسية

### 2. إدارة العملاء
- إضافة وتعديل العملاء
- تتبع معلومات الاتصال
- عرض تاريخ العقود

### 3. إدارة الوحدات
- إضافة وتعديل الوحدات
- تتبع الحالة والأسعار
- إدارة الشركاء

### 4. إدارة العقود
- إنشاء عقود جديدة
- تتبع المدفوعات
- إدارة الأقساط

### 5. التقارير
- تقارير مالية
- تقارير العملاء
- تقارير الوحدات
- تصدير PDF/Excel

### 6. الإشعارات
- إشعارات تلقائية
- تنبيهات الاستحقاق
- إدارة الإشعارات

## الإعدادات

### متغيرات البيئة
```bash
# قاعدة البيانات
POSTGRES_DB=makka_db
POSTGRES_USER=makka_user
POSTGRES_PASSWORD=makka_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Django
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
```

### إعدادات قاعدة البيانات
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'makka_db',
        'USER': 'makka_user',
        'PASSWORD': 'makka_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## التطوير

### تشغيل الاختبارات
```bash
python manage.py test
```

### إنشاء تطبيق جديد
```bash
python manage.py startapp app_name
```

### إنشاء نماذج جديدة
```bash
python manage.py makemigrations
python manage.py migrate
```

## النشر

### استخدام Docker
```bash
docker-compose up -d
```

### استخدام Gunicorn
```bash
gunicorn makka.wsgi:application
```

## المساهمة

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة
3. Commit التغييرات
4. Push للفرع
5. إنشاء Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.

## الدعم

للحصول على الدعم، يرجى التواصل عبر:
- البريد الإلكتروني: support@makka.com
- الهاتف: +966 50 123 4567

## التحديثات

### الإصدار 1.0.0
- إطلاق النسخة الأولى
- جميع الميزات الأساسية
- واجهة مستخدم حديثة
- نظام تقارير شامل

---

**نظام إدارة العقارات - مكة**  
*نظام شامل لإدارة العقارات والعقود*