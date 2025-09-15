# تشغيل مشروع إدارة العقارات باستخدام Docker

## المتطلبات

- Docker
- Docker Compose

## التشغيل السريع

### 1. تشغيل المشروع في وضع الإنتاج

```bash
# بناء الصور
make build

# تشغيل المشروع
make up

# أو مباشرة
docker-compose up -d
```

### 2. تشغيل المشروع في وضع التطوير

```bash
# تشغيل في وضع التطوير
make dev

# أو مباشرة
docker-compose -f docker-compose.dev.yml up -d
```

## الأوامر المتاحة

| الأمر | الوصف |
|-------|--------|
| `make build` | بناء الصور |
| `make up` | تشغيل المشروع (الإنتاج) |
| `make dev` | تشغيل المشروع (التطوير) |
| `make down` | إيقاف المشروع |
| `make logs` | عرض السجلات |
| `make clean` | تنظيف الصور والحاويات |
| `make restart` | إعادة تشغيل المشروع |
| `make status` | عرض حالة الخدمات |

## إعداد قاعدة البيانات

### للإنتاج
```bash
make db-setup
```

### للتطوير
```bash
make db-setup-dev
```

## إنشاء مستخدم إداري

### للإنتاج
```bash
make create-admin
```

### للتطوير
```bash
make create-admin-dev
```

## الوصول للتطبيق

- **الإنتاج**: http://localhost:3000
- **التطوير**: http://localhost:3000

## إعدادات قاعدة البيانات

- **PostgreSQL**: localhost:5432
- **قاعدة البيانات**: estate_db
- **المستخدم**: postgres
- **كلمة المرور**: postgres

## إعدادات Redis (اختياري)

- **Redis**: localhost:6379

## استكشاف الأخطاء

### عرض السجلات
```bash
# سجلات الإنتاج
make logs

# سجلات التطوير
make logs-dev
```

### إعادة تشغيل الخدمات
```bash
make restart
```

### تنظيف كامل
```bash
make clean
```

## الملفات المهمة

- `Dockerfile` - صورة الإنتاج
- `Dockerfile.dev` - صورة التطوير
- `docker-compose.yml` - إعدادات الإنتاج
- `docker-compose.dev.yml` - إعدادات التطوير
- `docker.env` - متغيرات البيئة
- `Makefile` - أوامر مساعدة

## ملاحظات مهمة

1. تأكد من تثبيت Docker و Docker Compose
2. في أول تشغيل، قد يستغرق بناء الصور بعض الوقت
3. قاعدة البيانات ستُهيأ تلقائياً عند أول تشغيل
4. البيانات محفوظة في Docker volumes
5. للتطوير، استخدم `docker-compose.dev.yml` للحصول على hot reload
