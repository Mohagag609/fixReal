-- Database performance optimizations for PostgreSQL
-- Run these queries to optimize database performance

-- 1. Create indexes for frequently queried columns
-- Customer indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_status_deleted 
ON customers(status, deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_name 
ON customers(name) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_phone 
ON customers(phone) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_created_at 
ON customers(created_at) WHERE deleted_at IS NULL;

-- Unit indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_status_deleted 
ON units(status, deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_type_deleted 
ON units(unit_type, deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_price 
ON units(total_price) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_created_at 
ON units(created_at) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_code 
ON units(code) WHERE deleted_at IS NULL;

-- Partner indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_name 
ON partners(name) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_phone 
ON partners(phone) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_deleted 
ON partners(deleted_at) WHERE deleted_at IS NULL;

-- UnitPartner indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unit_partners_unit_deleted 
ON unit_partners(unit_id, deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unit_partners_partner_deleted 
ON unit_partners(partner_id, deleted_at) WHERE deleted_at IS NULL;

-- Contract indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_unit_deleted 
ON contracts(unit_id, deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_customer_deleted 
ON contracts(customer_id, deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_start_date 
ON contracts(start) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_total_price 
ON contracts(total_price) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_created_at 
ON contracts(created_at) WHERE deleted_at IS NULL;

-- Installment indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installments_unit_deleted 
ON installments(unit_id, deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installments_status_deleted 
ON installments(status, deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installments_due_date 
ON installments(due_date) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installments_amount 
ON installments(amount) WHERE deleted_at IS NULL;

-- 2. Create partial indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_active 
ON customers(name, phone) WHERE deleted_at IS NULL AND status = 'نشط';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_available 
ON units(code, name, total_price) WHERE deleted_at IS NULL AND status = 'متاحة';

-- 3. Create composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_unit_customer_date 
ON contracts(unit_id, customer_id, start) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installments_unit_status_date 
ON installments(unit_id, status, due_date) WHERE deleted_at IS NULL;

-- 4. Create indexes for text search (if using full-text search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_name_trgm 
ON customers USING gin(name gin_trgm_ops) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_name_trgm 
ON units USING gin(name gin_trgm_ops) WHERE deleted_at IS NULL;

-- 5. Update table statistics for better query planning
ANALYZE customers;
ANALYZE units;
ANALYZE partners;
ANALYZE contracts;
ANALYZE installments;
ANALYZE unit_partners;

-- 6. Set optimal PostgreSQL configuration (run as superuser)
-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET effective_cache_size = '1GB';
-- ALTER SYSTEM SET maintenance_work_mem = '64MB';
-- ALTER SYSTEM SET checkpoint_completion_target = 0.9;
-- ALTER SYSTEM SET wal_buffers = '16MB';
-- ALTER SYSTEM SET default_statistics_target = 100;
-- ALTER SYSTEM SET random_page_cost = 1.1;
-- ALTER SYSTEM SET effective_io_concurrency = 200;

-- 7. Create materialized views for complex aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL) as total_customers,
  (SELECT COUNT(*) FROM units WHERE deleted_at IS NULL) as total_units,
  (SELECT COUNT(*) FROM contracts WHERE deleted_at IS NULL) as total_contracts,
  (SELECT COUNT(*) FROM units WHERE deleted_at IS NULL AND status = 'متاحة') as available_units,
  (SELECT COUNT(*) FROM contracts WHERE deleted_at IS NULL AND start >= CURRENT_DATE - INTERVAL '30 days') as recent_contracts,
  (SELECT COALESCE(SUM(total_price), 0) FROM contracts WHERE deleted_at IS NULL) as total_contract_value,
  (SELECT COALESCE(AVG(total_price), 0) FROM contracts WHERE deleted_at IS NULL) as avg_contract_value;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_stats ON mv_dashboard_stats (1);

-- 8. Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to get optimized dashboard data
CREATE OR REPLACE FUNCTION get_dashboard_kpis()
RETURNS TABLE (
  total_customers bigint,
  total_units bigint,
  total_contracts bigint,
  available_units bigint,
  recent_contracts bigint,
  total_contract_value numeric,
  avg_contract_value numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM mv_dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- 10. Create indexes for foreign keys (if not already created)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_unit_id ON contracts(unit_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installments_unit_id ON installments(unit_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unit_partners_unit_id ON unit_partners(unit_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unit_partners_partner_id ON unit_partners(partner_id);

-- 11. Vacuum and analyze tables
VACUUM ANALYZE customers;
VACUUM ANALYZE units;
VACUUM ANALYZE partners;
VACUUM ANALYZE contracts;
VACUUM ANALYZE installments;
VACUUM ANALYZE unit_partners;
