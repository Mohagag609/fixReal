# دليل النشر - نظام المحاسبة العقارية

هذا الدليل يوضح كيفية نشر نظام المحاسبة العقارية على منصات مختلفة.

## 🚀 النشر على Render

### 1. إعداد قاعدة البيانات

1. **إنشاء قاعدة بيانات PostgreSQL**:
   - اذهب إلى [Render Dashboard](https://dashboard.render.com)
   - اضغط على "New +" → "PostgreSQL"
   - اختر اسم قاعدة البيانات (مثل: `accounting-db`)
   - اختر المنطقة الأقرب لك
   - اضغط على "Create Database"

2. **الحصول على DATABASE_URL**:
   - بعد إنشاء قاعدة البيانات، اذهب إلى إعداداتها
   - انسخ `DATABASE_URL` من قسم "Connections"

### 2. إعداد Web Service

1. **ربط المشروع**:
   - اذهب إلى [Render Dashboard](https://dashboard.render.com)
   - اضغط على "New +" → "Web Service"
   - اختر "Build and deploy from a Git repository"
   - اربط المشروع بـ GitHub repository

2. **إعدادات البناء**:
   ```
   Name: accounting-system
   Environment: Python 3
   Region: Choose closest to your users
   Branch: cursor/migrate-nodejs-accounting-to-django-5749
   Root Directory: (leave empty)
   ```

3. **Build Command**:
   ```bash
   pip install -r requirements.txt
   python manage.py collectstatic --noinput
   python manage.py migrate
   ```

4. **Start Command**:
   ```bash
   gunicorn accounting_project.wsgi
   ```

5. **Environment Variables**:
   ```
   DATABASE_URL=postgres://user:password@host:port/dbname
   SECRET_KEY=your-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=your-app-name.onrender.com
   ```

### 3. النشر

1. **مراجعة الإعدادات**:
   - تأكد من صحة جميع الإعدادات
   - تأكد من ربط قاعدة البيانات الصحيحة

2. **النشر**:
   - اضغط على "Create Web Service"
   - انتظر حتى يكتمل البناء (5-10 دقائق)
   - افتح الرابط المقدم

3. **إنشاء مستخدم إداري**:
   ```bash
   # عبر Render Shell
   python manage.py createsuperuser
   ```

## 🐳 النشر باستخدام Docker

### 1. إنشاء Dockerfile

```dockerfile
FROM python:3.11.6-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput

# Run migrations
RUN python manage.py migrate

# Create superuser (optional)
RUN echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin')" | python manage.py shell

# Expose port
EXPOSE 8000

# Run the application
CMD ["gunicorn", "accounting_project.wsgi", "--bind", "0.0.0.0:8000"]
```

### 2. إنشاء docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: accounting_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  web:
    build: .
    command: gunicorn accounting_project.wsgi --bind 0.0.0.0:8000
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/accounting_db
      - SECRET_KEY=your-secret-key-here
      - DEBUG=False
      - ALLOWED_HOSTS=localhost,127.0.0.1

volumes:
  postgres_data:
```

### 3. تشغيل التطبيق

```bash
# بناء وتشغيل التطبيق
docker-compose up --build

# تشغيل في الخلفية
docker-compose up -d

# إيقاف التطبيق
docker-compose down
```

## ☁️ النشر على Heroku

### 1. إعداد المشروع

1. **تثبيت Heroku CLI**:
   ```bash
   # على macOS
   brew install heroku/brew/heroku
   
   # على Ubuntu/Debian
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **تسجيل الدخول**:
   ```bash
   heroku login
   ```

3. **إنشاء تطبيق**:
   ```bash
   heroku create accounting-system
   ```

### 2. إعداد قاعدة البيانات

```bash
# إضافة PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# الحصول على DATABASE_URL
heroku config:get DATABASE_URL
```

### 3. إعداد متغيرات البيئة

```bash
# إعداد متغيرات البيئة
heroku config:set SECRET_KEY=your-secret-key-here
heroku config:set DEBUG=False
heroku config:set ALLOWED_HOSTS=accounting-system.herokuapp.com
```

### 4. النشر

```bash
# رفع الكود
git push heroku main

# تشغيل migrations
heroku run python manage.py migrate

# إنشاء مستخدم إداري
heroku run python manage.py createsuperuser

# فتح التطبيق
heroku open
```

## 🔧 النشر على VPS

### 1. إعداد الخادم

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Python و pip
sudo apt install python3.11 python3.11-pip python3.11-venv -y

# تثبيت PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# تثبيت Nginx
sudo apt install nginx -y

# تثبيت Gunicorn
pip3 install gunicorn
```

### 2. إعداد قاعدة البيانات

```bash
# الدخول إلى PostgreSQL
sudo -u postgres psql

# إنشاء قاعدة البيانات والمستخدم
CREATE DATABASE accounting_db;
CREATE USER accounting_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE accounting_db TO accounting_user;
\q
```

### 3. إعداد التطبيق

```bash
# إنشاء مجلد التطبيق
sudo mkdir -p /var/www/accounting
sudo chown $USER:$USER /var/www/accounting

# نسخ المشروع
cd /var/www/accounting
git clone <repository-url> .

# إنشاء بيئة افتراضية
python3.11 -m venv venv
source venv/bin/activate

# تثبيت المتطلبات
pip install -r requirements.txt

# إعداد متغيرات البيئة
nano .env
```

### 4. إعداد Nginx

```bash
# إنشاء ملف إعداد Nginx
sudo nano /etc/nginx/sites-available/accounting
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location = /favicon.ico { access_log off; log_not_found off; }
    location /static/ {
        root /var/www/accounting;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/var/www/accounting/accounting.sock;
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/accounting /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

### 5. إعداد Gunicorn

```bash
# إنشاء ملف Gunicorn
nano /var/www/accounting/gunicorn.service
```

```ini
[Unit]
Description=Gunicorn instance to serve accounting
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/accounting
Environment="PATH=/var/www/accounting/venv/bin"
ExecStart=/var/www/accounting/venv/bin/gunicorn --workers 3 --bind unix:accounting.sock accounting_project.wsgi
ExecReload=/bin/kill -s HUP $MAINPID
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
# تفعيل الخدمة
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
```

## 🔒 إعداد SSL

### 1. باستخدام Let's Encrypt

```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx -y

# الحصول على شهادة SSL
sudo certbot --nginx -d your-domain.com

# تجديد تلقائي
sudo crontab -e
# أضف السطر التالي:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 مراقبة الأداء

### 1. إعداد Logging

```python
# في settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/accounting/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

### 2. مراقبة قاعدة البيانات

```bash
# مراقبة استعلامات PostgreSQL
sudo -u postgres psql
SELECT * FROM pg_stat_activity;
```

## 🚨 استكشاف الأخطاء

### 1. مشاكل شائعة

- **خطأ 500**: تحقق من logs في `/var/log/accounting/`
- **خطأ 502**: تأكد من تشغيل Gunicorn
- **خطأ 404**: تحقق من إعدادات Nginx
- **مشاكل قاعدة البيانات**: تحقق من اتصال PostgreSQL

### 2. أوامر مفيدة

```bash
# مراقبة الخدمات
sudo systemctl status nginx
sudo systemctl status gunicorn

# مراقبة Logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/accounting/django.log

# إعادة تشغيل الخدمات
sudo systemctl restart nginx
sudo systemctl restart gunicorn
```

## 📈 تحسين الأداء

### 1. إعدادات قاعدة البيانات

```python
# في settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'accounting_db',
        'USER': 'accounting_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
        'OPTIONS': {
            'MAX_CONNS': 20,
            'OPTIONS': {
                'MAX_CONNS': 20,
            }
        }
    }
}
```

### 2. إعدادات Gunicorn

```bash
# في gunicorn.service
ExecStart=/var/www/accounting/venv/bin/gunicorn --workers 4 --worker-class gevent --worker-connections 1000 --bind unix:accounting.sock accounting_project.wsgi
```

### 3. إعدادات Nginx

```nginx
# في nginx.conf
worker_processes auto;
worker_connections 1024;

http {
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    client_max_body_size 10M;
    keepalive_timeout 65;
}
```

## 🔄 النسخ الاحتياطي

### 1. نسخ احتياطي لقاعدة البيانات

```bash
# إنشاء نسخة احتياطية
pg_dump -h localhost -U accounting_user accounting_db > backup_$(date +%Y%m%d_%H%M%S).sql

# استعادة النسخة الاحتياطية
psql -h localhost -U accounting_user accounting_db < backup_20240101_120000.sql
```

### 2. نسخ احتياطي للملفات

```bash
# نسخ احتياطي للمشروع
tar -czf accounting_backup_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/accounting

# نسخ احتياطي للملفات الثابتة
tar -czf static_backup_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/accounting/staticfiles
```

## 📞 الدعم

للدعم والمساعدة، يرجى:
1. فتح issue في GitHub repository
2. مراجعة هذا الدليل
3. التحقق من logs للتشخيص
4. الاتصال بفريق التطوير