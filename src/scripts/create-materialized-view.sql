-- إنشاء Materialized View للوحة التحكم لتحسين الأداء
-- هذا الملف يحتوي على استعلامات SQL لإنشاء Materialized View

-- حذف Materialized View إذا كان موجود
DROP MATERIALIZED VIEW IF EXISTS dashboard_summary;

-- إنشاء Materialized View جديد
CREATE MATERIALIZED VIEW dashboard_summary AS
SELECT 
  (SELECT COUNT(*) FROM contracts WHERE "deletedAt" IS NULL) as contract_count,
  (SELECT COUNT(*) FROM vouchers WHERE "deletedAt" IS NULL) as voucher_count,
  (SELECT COUNT(*) FROM installments WHERE "deletedAt" IS NULL) as installment_count,
  (SELECT COUNT(*) FROM units WHERE "deletedAt" IS NULL) as unit_count,
  (SELECT COUNT(*) FROM customers WHERE "deletedAt" IS NULL) as customer_count,
  (SELECT COALESCE(SUM("totalPrice"), 0) FROM contracts WHERE "deletedAt" IS NULL) as total_contract_value,
  (SELECT COALESCE(SUM(amount), 0) FROM vouchers WHERE "deletedAt" IS NULL) as total_voucher_amount,
  (SELECT COUNT(*) FROM installments WHERE "deletedAt" IS NULL AND status = 'مدفوعة') as paid_installments_count,
  (SELECT COUNT(*) FROM installments WHERE "deletedAt" IS NULL AND status = 'غير مدفوعة') as pending_installments_count,
  NOW() as last_updated;

-- إنشاء فهرس فريد للمادة
CREATE UNIQUE INDEX IF NOT EXISTS dashboard_summary_pkey ON dashboard_summary (last_updated);

-- إنشاء دالة لتحديث Materialized View
CREATE OR REPLACE FUNCTION refresh_dashboard_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_summary;
END;
$$ LANGUAGE plpgsql;

-- إنشاء جدول لتتبع آخر تحديث
CREATE TABLE IF NOT EXISTS dashboard_refresh_log (
  id SERIAL PRIMARY KEY,
  refreshed_at TIMESTAMP DEFAULT NOW(),
  duration_ms INTEGER
);

-- إدراج سجل التحديث الأول
INSERT INTO dashboard_refresh_log (refreshed_at, duration_ms) 
VALUES (NOW(), 0);

