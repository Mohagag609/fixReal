-- تحسين قاعدة البيانات لزيادة السرعة
-- إضافة فهارس لتحسين الأداء

-- فهارس للجداول الرئيسية
CREATE INDEX IF NOT EXISTS idx_contracts_deleted_at ON contracts("deletedAt");
CREATE INDEX IF NOT EXISTS idx_contracts_total_price ON contracts("totalPrice");
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts("createdAt");

CREATE INDEX IF NOT EXISTS idx_vouchers_deleted_at ON vouchers("deletedAt");
CREATE INDEX IF NOT EXISTS idx_vouchers_amount ON vouchers(amount);
CREATE INDEX IF NOT EXISTS idx_vouchers_created_at ON vouchers("createdAt");

CREATE INDEX IF NOT EXISTS idx_installments_deleted_at ON installments("deletedAt");
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments("dueDate");

CREATE INDEX IF NOT EXISTS idx_units_deleted_at ON units("deletedAt");
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_units_unit_type ON units("unitType");

CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers("deletedAt");
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers("createdAt");

CREATE INDEX IF NOT EXISTS idx_partners_deleted_at ON partners("deletedAt");
CREATE INDEX IF NOT EXISTS idx_partners_created_at ON partners("createdAt");

CREATE INDEX IF NOT EXISTS idx_unit_partners_deleted_at ON unit_partners("deletedAt");
CREATE INDEX IF NOT EXISTS idx_unit_partners_unit_id ON unit_partners("unitId");
CREATE INDEX IF NOT EXISTS idx_unit_partners_partner_id ON unit_partners("partnerId");

-- فهارس مركبة لتحسين الاستعلامات المعقدة
CREATE INDEX IF NOT EXISTS idx_contracts_status_deleted ON contracts(status, "deletedAt");
CREATE INDEX IF NOT EXISTS idx_installments_status_deleted ON installments(status, "deletedAt");
CREATE INDEX IF NOT EXISTS idx_units_status_deleted ON units(status, "deletedAt");

-- تحسين إعدادات PostgreSQL
-- هذه الإعدادات تحتاج صلاحيات SUPERUSER
-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET effective_cache_size = '1GB';
-- ALTER SYSTEM SET maintenance_work_mem = '64MB';
-- ALTER SYSTEM SET checkpoint_completion_target = 0.9;
-- ALTER SYSTEM SET wal_buffers = '16MB';
-- ALTER SYSTEM SET default_statistics_target = 100;

-- إحصائيات الجداول
ANALYZE contracts;
ANALYZE vouchers;
ANALYZE installments;
ANALYZE units;
ANALYZE customers;
ANALYZE partners;
ANALYZE unit_partners;

