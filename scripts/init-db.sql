-- إعداد قاعدة البيانات المحلية
-- هذا الملف يتم تشغيله عند إنشاء قاعدة البيانات لأول مرة

-- إنشاء قاعدة البيانات إذا لم تكن موجودة
CREATE DATABASE estate_pro_db;

-- الاتصال بقاعدة البيانات
\c estate_pro_db;

-- إنشاء المستخدم إذا لم يكن موجوداً
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
        CREATE USER postgres WITH PASSWORD 'password';
    END IF;
END
$$;

-- منح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE estate_pro_db TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;

-- إنشاء جدول للتحقق من الاتصال
CREATE TABLE IF NOT EXISTS connection_test (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إدراج بيانات تجريبية
INSERT INTO connection_test (message) VALUES ('قاعدة البيانات المحلية تعمل بشكل صحيح');

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_connection_test_created_at ON connection_test(created_at);

-- إعدادات إضافية للأداء
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- إعادة تحميل الإعدادات
SELECT pg_reload_conf();