# دليل النشر - نظام إدارة العقارات

## نظرة عامة
هذا الدليل يوضح كيفية نشر نظام إدارة العقارات على Render.com.

## 1. متطلبات النشر

### 1.1 متطلبات النظام
- Python 3.11.8
- PostgreSQL 14+
- Node.js 18+ (لبناء Tailwind CSS)

### 1.2 متغيرات البيئة المطلوبة
```
DATABASE_URL=postgres://user:password@host:port/dbname
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
```

## 2. إعداد Render.com

### 2.1 إنشاء Web Service
1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. انقر على "New +" ثم "Web Service"
3. اربط مع GitHub repository
4. اختر الفرع المطلوب (main/master)

### 2.2 إعدادات البناء
- **Build Command**: `pip install -r requirements.txt && npm install && npm run build:css`
- **Start Command**: `gunicorn accounting_project.wsgi`
- **Python Version**: 3.11.8

### 2.3 إعدادات البيئة
- **Environment**: Python 3
- **Region**: اختر الأقرب لك
- **Plan**: اختر الخطة المناسبة

## 3. إعداد قاعدة البيانات

### 3.1 إنشاء PostgreSQL Database
1. في Render Dashboard، انقر على "New +" ثم "PostgreSQL"
2. اختر الخطة المناسبة
3. انسخ DATABASE_URL من إعدادات قاعدة البيانات
4. أضف DATABASE_URL إلى متغيرات البيئة في Web Service

### 3.2 إعداد قاعدة البيانات
```bash
# تشغيل migrations
python manage.py migrate

# إنشاء superuser (اختياري)
python manage.py createsuperuser

# جمع الملفات الثابتة
python manage.py collectstatic --noinput
```

## 4. ملفات النشر

### 4.1 Procfile
```
web: gunicorn accounting_project.wsgi
```

### 4.2 runtime.txt
```
python-3.11.8
```

### 4.3 requirements.txt
```
Django==4.2.7
psycopg2-binary==2.9.9
python-decouple==3.8
gunicorn==21.2.0
whitenoise==6.6.0
dj-database-url==2.1.0
```

### 4.4 package.json
```json
{
  "name": "accounting-project",
  "version": "1.0.0",
  "description": "Real Estate Accounting System",
  "scripts": {
    "build:css": "npx tailwindcss -i ./assets/input.css -o ./static/css/tailwind.css --minify",
    "watch:css": "npx tailwindcss -i ./assets/input.css -o ./static/css/tailwind.css --watch"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.17"
  }
}
```

## 5. خطوات النشر

### 5.1 إعداد المشروع محلياً
```bash
# 1. استنساخ المشروع
git clone <repository-url>
cd accounting-project

# 2. إنشاء virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# أو
venv\Scripts\activate  # Windows

# 3. تثبيت المتطلبات
pip install -r requirements.txt
npm install

# 4. بناء Tailwind CSS
npm run build:css

# 5. إعداد متغيرات البيئة
cp .env.example .env
# قم بتعديل .env مع القيم الصحيحة

# 6. تشغيل migrations
python manage.py migrate

# 7. جمع الملفات الثابتة
python manage.py collectstatic --noinput

# 8. تشغيل الخادم
python manage.py runserver
```

### 5.2 النشر على Render
1. ادفع الكود إلى GitHub
2. في Render Dashboard، انقر على "Deploy"
3. انتظر حتى يكتمل البناء
4. تحقق من logs للتأكد من عدم وجود أخطاء
5. اختبر الموقع للتأكد من عمله

## 6. إعدادات Django للإنتاج

### 6.1 settings.py
```python
# Database
DATABASES = {
    'default': dj_database_url.parse(
        config('DATABASE_URL', default='sqlite:///db.sqlite3')
    )
}

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Security
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost').split(',')

# WhiteNoise
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    # ... باقي middleware
]
```

## 7. مراقبة الأداء

### 7.1 Render Metrics
- استخدم Render Dashboard لمراقبة:
  - CPU usage
  - Memory usage
  - Response time
  - Error rate

### 7.2 Application Logs
- تحقق من logs بانتظام
- راقب أخطاء 500
- راقب استعلامات قاعدة البيانات البطيئة

## 8. النسخ الاحتياطي

### 8.1 قاعدة البيانات
```bash
# إنشاء backup
pg_dump $DATABASE_URL > backup.sql

# استعادة backup
psql $DATABASE_URL < backup.sql
```

### 8.2 الملفات الثابتة
- الملفات الثابتة محفوظة في Render
- لا حاجة لنسخ احتياطي منفصل

## 9. استكشاف الأخطاء

### 9.1 مشاكل شائعة
- **Build failed**: تحقق من requirements.txt و package.json
- **Database connection error**: تحقق من DATABASE_URL
- **Static files not loading**: تحقق من collectstatic
- **HTMX not working**: تحقق من JavaScript console

### 9.2 حلول سريعة
```bash
# إعادة تشغيل الخدمة
# في Render Dashboard: Settings > Restart Service

# تشغيل migrations
python manage.py migrate

# جمع الملفات الثابتة
python manage.py collectstatic --noinput

# فحص logs
# في Render Dashboard: Logs tab
```

## 10. التحديثات المستقبلية

### 10.1 تحديث الكود
1. ادفع التحديثات إلى GitHub
2. Render سيقوم بالبناء والنشر تلقائياً
3. تحقق من logs للتأكد من نجاح النشر

### 10.2 تحديث قاعدة البيانات
```bash
# إنشاء migration جديد
python manage.py makemigrations

# تطبيق migration
python manage.py migrate
```

## 11. الأمان

### 11.1 متغيرات البيئة
- لا تشارك SECRET_KEY
- استخدم HTTPS دائماً
- قم بتحديث المتطلبات بانتظام

### 11.2 قاعدة البيانات
- استخدم كلمات مرور قوية
- قم بتحديث PostgreSQL بانتظام
- راقب محاولات الوصول المشبوهة

## 12. الدعم

### 12.1 Render Support
- [Render Documentation](https://render.com/docs)
- [Render Support](https://render.com/support)

### 12.2 Django Support
- [Django Documentation](https://docs.djangoproject.com/)
- [Django Forum](https://forum.djangoproject.com/)

---

## ملاحظات مهمة

1. **تأكد من تحديث ALLOWED_HOSTS** مع نطاقك
2. **استخدم HTTPS** في الإنتاج دائماً
3. **راقب الأداء** بانتظام
4. **قم بعمل backup** لقاعدة البيانات
5. **اختبر التحديثات** في بيئة التطوير أولاً

النظام جاهز للنشر على Render.com! 🚀