# Makefile لإدارة مشروع إدارة العقارات مع Docker

.PHONY: help build up down dev logs clean restart status

# المساعدة
help:
	@echo "أوامر Docker المتاحة:"
	@echo "  make build     - بناء الصور"
	@echo "  make up        - تشغيل المشروع (الإنتاج)"
	@echo "  make dev       - تشغيل المشروع (التطوير)"
	@echo "  make down      - إيقاف المشروع"
	@echo "  make logs      - عرض السجلات"
	@echo "  make clean     - تنظيف الصور والحاويات"
	@echo "  make restart   - إعادة تشغيل المشروع"
	@echo "  make status    - عرض حالة الخدمات"

# بناء الصور
build:
	docker-compose build

# تشغيل المشروع في وضع الإنتاج
up:
	docker-compose up -d
	@echo "تم تشغيل المشروع على http://localhost:3000"

# تشغيل المشروع في وضع التطوير
dev:
	docker-compose -f docker-compose.dev.yml up -d
	@echo "تم تشغيل المشروع في وضع التطوير على http://localhost:3000"

# إيقاف المشروع
down:
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

# عرض السجلات
logs:
	docker-compose logs -f

# عرض سجلات التطوير
logs-dev:
	docker-compose -f docker-compose.dev.yml logs -f

# تنظيف الصور والحاويات
clean:
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f
	docker volume prune -f

# إعادة تشغيل المشروع
restart: down up

# عرض حالة الخدمات
status:
	docker-compose ps
	docker-compose -f docker-compose.dev.yml ps

# إعداد قاعدة البيانات
db-setup:
	docker-compose exec app npx prisma migrate deploy
	docker-compose exec app npx prisma db seed

# إعداد قاعدة البيانات للتطوير
db-setup-dev:
	docker-compose -f docker-compose.dev.yml exec app npx prisma migrate deploy
	docker-compose -f docker-compose.dev.yml exec app npx prisma db seed

# إنشاء مستخدم إداري
create-admin:
	docker-compose exec app node scripts/create-admin.js

# إنشاء مستخدم إداري للتطوير
create-admin-dev:
	docker-compose -f docker-compose.dev.yml exec app node scripts/create-admin.js
