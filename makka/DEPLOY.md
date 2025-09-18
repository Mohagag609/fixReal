# دليل النشر - نظام إدارة العقارات

## متطلبات النظام

### الحد الأدنى
- **OS**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **RAM**: 4GB
- **CPU**: 2 cores
- **Storage**: 50GB SSD
- **Network**: 100 Mbps

### الموصى به
- **OS**: Ubuntu 22.04 LTS
- **RAM**: 8GB+
- **CPU**: 4+ cores
- **Storage**: 100GB+ SSD
- **Network**: 1 Gbps

## التثبيت على Ubuntu 22.04

### 1. تحديث النظام
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. تثبيت Python 3.9+
```bash
sudo apt install python3.9 python3.9-venv python3.9-dev python3-pip -y
```

### 3. تثبيت PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. إعداد قاعدة البيانات
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE makka_db;
CREATE USER makka_user WITH PASSWORD 'makka_password';
GRANT ALL PRIVILEGES ON DATABASE makka_db TO makka_user;
ALTER USER makka_user CREATEDB;
\q
```

### 5. تثبيت Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. تثبيت Gunicorn
```bash
pip3 install gunicorn
```

## إعداد المشروع

### 1. إنشاء مجلد المشروع
```bash
sudo mkdir -p /var/www/makka
sudo chown $USER:$USER /var/www/makka
cd /var/www/makka
```

### 2. نسخ الملفات
```bash
# نسخ ملفات المشروع إلى /var/www/makka
cp -r /path/to/makka/* /var/www/makka/
```

### 3. إنشاء البيئة الافتراضية
```bash
python3.9 -m venv venv
source venv/bin/activate
```

### 4. تثبيت المتطلبات
```bash
pip install -r requirements.txt
```

### 5. إعداد متغيرات البيئة
```bash
nano .env
```

```env
# قاعدة البيانات
POSTGRES_DB=makka_db
POSTGRES_USER=makka_user
POSTGRES_PASSWORD=makka_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Django
DJANGO_SECRET_KEY=your-very-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# البريد الإلكتروني
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# النسخ الاحتياطية
BACKUP_DIR=/var/backups/makka
```

### 6. إعداد قاعدة البيانات
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

## إعداد Gunicorn

### 1. إنشاء ملف Gunicorn
```bash
nano /var/www/makka/gunicorn.conf.py
```

```python
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
```

### 2. إنشاء خدمة Systemd
```bash
sudo nano /etc/systemd/system/makka.service
```

```ini
[Unit]
Description=Makka Real Estate Management System
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/makka
Environment="PATH=/var/www/makka/venv/bin"
ExecStart=/var/www/makka/venv/bin/gunicorn --config gunicorn.conf.py makka.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
```

### 3. تشغيل الخدمة
```bash
sudo systemctl daemon-reload
sudo systemctl start makka
sudo systemctl enable makka
```

## إعداد Nginx

### 1. إنشاء ملف التكوين
```bash
sudo nano /etc/nginx/sites-available/makka
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location = /favicon.ico { access_log off; log_not_found off; }
    
    location /static/ {
        root /var/www/makka;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /media/ {
        root /var/www/makka;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location / {
        include proxy_params;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. تفعيل الموقع
```bash
sudo ln -s /etc/nginx/sites-available/makka /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## إعداد SSL (Let's Encrypt)

### 1. تثبيت Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. الحصول على شهادة SSL
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. تجديد تلقائي
```bash
sudo crontab -e
```

```cron
0 12 * * * /usr/bin/certbot renew --quiet
```

## النسخ الاحتياطية

### 1. إنشاء مجلد النسخ الاحتياطية
```bash
sudo mkdir -p /var/backups/makka
sudo chown www-data:www-data /var/backups/makka
```

### 2. إنشاء سكريبت النسخ الاحتياطي
```bash
nano /var/www/makka/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/makka"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="makka_db"
DB_USER="makka_user"

# نسخ احتياطي لقاعدة البيانات
pg_dump -h localhost -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# نسخ احتياطي للملفات
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/makka

# حذف النسخ القديمة (أكثر من 30 يوم)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### 3. جعل السكريبت قابل للتنفيذ
```bash
chmod +x /var/www/makka/backup.sh
```

### 4. جدولة النسخ الاحتياطية
```bash
sudo crontab -e
```

```cron
# نسخ احتياطي يومي في الساعة 2 صباحاً
0 2 * * * /var/www/makka/backup.sh
```

## المراقبة والصيانة

### 1. مراقبة الخدمات
```bash
# حالة الخدمات
sudo systemctl status makka
sudo systemctl status nginx
sudo systemctl status postgresql

# سجلات التطبيق
sudo journalctl -u makka -f

# سجلات Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. مراقبة الأداء
```bash
# استخدام الذاكرة
free -h

# استخدام القرص
df -h

# استخدام المعالج
top

# اتصالات الشبكة
netstat -tulpn
```

### 3. تحديث النظام
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# إعادة تشغيل الخدمات
sudo systemctl restart makka
sudo systemctl restart nginx
```

## استكشاف الأخطاء

### 1. مشاكل قاعدة البيانات
```bash
# فحص حالة PostgreSQL
sudo systemctl status postgresql

# فحص الاتصال
psql -h localhost -U makka_user -d makka_db

# فحص السجلات
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### 2. مشاكل Django
```bash
# فحص السجلات
sudo journalctl -u makka -f

# تشغيل في وضع التطوير
cd /var/www/makka
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

### 3. مشاكل Nginx
```bash
# فحص التكوين
sudo nginx -t

# إعادة تحميل التكوين
sudo systemctl reload nginx

# فحص السجلات
sudo tail -f /var/log/nginx/error.log
```

## الأمان

### 1. جدار الحماية
```bash
# تثبيت UFW
sudo apt install ufw -y

# إعداد القواعد
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. تحديثات الأمان
```bash
# تفعيل التحديثات التلقائية
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. نسخ احتياطية خارجية
```bash
# رفع النسخ الاحتياطية إلى S3
pip install awscli
aws s3 sync /var/backups/makka s3://your-backup-bucket/makka/
```

## التوسع

### 1. Load Balancer
```nginx
upstream makka_backend {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
}

server {
    location / {
        proxy_pass http://makka_backend;
    }
}
```

### 2. Redis Cache
```bash
# تثبيت Redis
sudo apt install redis-server -y

# إعداد Django
pip install django-redis
```

### 3. CDN
```bash
# استخدام CloudFlare أو AWS CloudFront
# تحديث إعدادات STATIC_URL و MEDIA_URL
```

## الدعم والصيانة

### 1. مراقبة مستمرة
- استخدام أدوات المراقبة مثل Nagios أو Zabbix
- إعداد تنبيهات للخدمات الحرجة
- مراقبة استخدام الموارد

### 2. نسخ احتياطية منتظمة
- اختبار استعادة النسخ الاحتياطية
- تخزين النسخ في مواقع متعددة
- توثيق عملية الاستعادة

### 3. تحديثات الأمان
- مراقبة تحديثات Django
- تحديث المكتبات بانتظام
- فحص الثغرات الأمنية

---

**ملاحظة**: هذا الدليل مخصص للاستخدام في بيئة الإنتاج. تأكد من اختبار جميع الإعدادات في بيئة التطوير أولاً.