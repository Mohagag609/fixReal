-- Database Indexes for Performance Optimization
-- This script creates all recommended indexes for the Estate Management System
-- Run this script after the initial database setup

-- ==============================================
-- 1. SOFT DELETE INDEXES
-- ==============================================

-- Contracts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_deleted_at ON contracts ("deletedAt") WHERE "deletedAt" IS NULL;

-- Vouchers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vouchers_deleted_at ON vouchers ("deletedAt") WHERE "deletedAt" IS NULL;

-- Installments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installments_deleted_at ON installments ("deletedAt") WHERE "deletedAt" IS NULL;

-- Units
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_deleted_at ON units ("deletedAt") WHERE "deletedAt" IS NULL;

-- Customers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_deleted_at ON customers ("deletedAt") WHERE "deletedAt" IS NULL;

-- Partners
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_deleted_at ON partners ("deletedAt") WHERE "deletedAt" IS NULL;

-- Brokers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brokers_deleted_at ON brokers ("deletedAt") WHERE "deletedAt" IS NULL;

-- Safes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_safes_deleted_at ON safes ("deletedAt") WHERE "deletedAt" IS NULL;

-- Users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_deleted_at ON users ("deletedAt") WHERE "deletedAt" IS NULL;

-- ==============================================
-- 2. CURSOR PAGINATION INDEXES
-- ==============================================

-- Contracts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_id_desc ON contracts (id DESC) WHERE "deletedAt" IS NULL;

-- Vouchers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vouchers_id_desc ON vouchers (id DESC) WHERE "deletedAt" IS NULL;

-- Installments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installments_id_desc ON installments (id DESC) WHERE "deletedAt" IS NULL;

-- Units
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_id_desc ON units (id DESC) WHERE "deletedAt" IS NULL;

-- Customers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_id_desc ON customers (id DESC) WHERE "deletedAt" IS NULL;

-- Partners
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_id_desc ON partners (id DESC) WHERE "deletedAt" IS NULL;

-- Brokers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brokers_id_desc ON brokers (id DESC) WHERE "deletedAt" IS NULL;

-- Safes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_safes_id_desc ON safes (id DESC) WHERE "deletedAt" IS NULL;

-- ==============================================
-- 3. STATUS-BASED INDEXES
-- ==============================================

-- Installments status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installments_status ON installments (status) WHERE "deletedAt" IS NULL;

-- Units status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_status ON units (status) WHERE "deletedAt" IS NULL;

-- Brokers status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brokers_status ON brokers (status) WHERE "deletedAt" IS NULL;

-- Users active status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_active ON users ("isActive") WHERE "deletedAt" IS NULL;

-- ==============================================
-- 4. SEARCH INDEXES
-- ==============================================

-- Units search (code, name, unitType)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_search_code ON units USING gin (to_tsvector('arabic', code)) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_search_name ON units USING gin (to_tsvector('arabic', name)) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_search_type ON units USING gin (to_tsvector('arabic', "unitType")) WHERE "deletedAt" IS NULL;

-- Partners search (name, phone)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_search_name ON partners USING gin (to_tsvector('arabic', name)) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_search_phone ON partners (phone) WHERE "deletedAt" IS NULL;

-- Brokers search (name, phone)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brokers_search_name ON brokers USING gin (to_tsvector('arabic', name)) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brokers_search_phone ON brokers (phone) WHERE "deletedAt" IS NULL;

-- Customers search (name, phone)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_search_name ON customers USING gin (to_tsvector('arabic', name)) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_search_phone ON customers (phone) WHERE "deletedAt" IS NULL;

-- ==============================================
-- 5. FOREIGN KEY INDEXES
-- ==============================================

-- Unit Partners
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unit_partners_unit_id ON unit_partners ("unitId") WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unit_partners_partner_id ON unit_partners ("partnerId") WHERE "deletedAt" IS NULL;

-- Partner Debts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partner_debts_partner_id ON partner_debts ("partnerId") WHERE "deletedAt" IS NULL;

-- Broker Dues
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_broker_due_broker_id ON broker_due ("brokerId") WHERE "deletedAt" IS NULL;

-- Vouchers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vouchers_safe_id ON vouchers ("safeId") WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vouchers_contract_id ON vouchers ("contractId") WHERE "deletedAt" IS NULL;

-- Installments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installments_contract_id ON installments ("contractId") WHERE "deletedAt" IS NULL;

-- Transfers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfers_from_safe ON transfers ("fromSafeId") WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfers_to_safe ON transfers ("toSafeId") WHERE "deletedAt" IS NULL;

-- ==============================================
-- 6. DATE-BASED INDEXES
-- ==============================================

-- Created at indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_created_at ON contracts ("createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vouchers_created_at ON vouchers ("createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installments_created_at ON installments ("createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_created_at ON units ("createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_created_at ON customers ("createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_created_at ON partners ("createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brokers_created_at ON brokers ("createdAt" DESC) WHERE "deletedAt" IS NULL;

-- ==============================================
-- 7. COMPOSITE INDEXES
-- ==============================================

-- Units: status + deletedAt
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_status_deleted ON units (status, "deletedAt") WHERE "deletedAt" IS NULL;

-- Installments: status + deletedAt
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installments_status_deleted ON installments (status, "deletedAt") WHERE "deletedAt" IS NULL;

-- Contracts: totalPrice + deletedAt (for value-based queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_value_deleted ON contracts ("totalPrice", "deletedAt") WHERE "deletedAt" IS NULL;

-- Vouchers: amount + deletedAt
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vouchers_amount_deleted ON vouchers (amount, "deletedAt") WHERE "deletedAt" IS NULL;

-- ==============================================
-- 8. PERFORMANCE MONITORING QUERIES
-- ==============================================

-- Create a view for index usage monitoring
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_level
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Create a view for index sizes
CREATE OR REPLACE VIEW index_size_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    pg_relation_size(indexrelid) as size_bytes
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ==============================================
-- 9. MAINTENANCE FUNCTIONS
-- ==============================================

-- Function to check for unused indexes
CREATE OR REPLACE FUNCTION find_unused_indexes()
RETURNS TABLE (
    tablename text,
    indexname text,
    size_pretty text,
    size_bytes bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.tablename,
        i.indexname,
        pg_size_pretty(pg_relation_size(i.indexrelid)) as size_pretty,
        pg_relation_size(i.indexrelid) as size_bytes
    FROM pg_stat_user_indexes i
    WHERE i.schemaname = 'public' 
    AND i.idx_scan = 0
    AND i.indexname NOT LIKE '%_pkey'  -- Exclude primary keys
    ORDER BY pg_relation_size(i.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get table bloat information
CREATE OR REPLACE FUNCTION get_table_bloat()
RETURNS TABLE (
    tablename text,
    n_dead_tup bigint,
    n_live_tup bigint,
    dead_tuple_percent numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename,
        t.n_dead_tup,
        t.n_live_tup,
        ROUND(t.n_dead_tup::numeric / NULLIF(t.n_live_tup::numeric, 0) * 100, 2) as dead_tuple_percent
    FROM pg_stat_user_tables t
    WHERE t.schemaname = 'public'
    ORDER BY dead_tuple_percent DESC;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 10. GRANTS AND PERMISSIONS
-- ==============================================

-- Grant permissions for monitoring views
GRANT SELECT ON index_usage_stats TO PUBLIC;
GRANT SELECT ON index_size_stats TO PUBLIC;
GRANT EXECUTE ON FUNCTION find_unused_indexes() TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_table_bloat() TO PUBLIC;

-- ==============================================
-- 11. COMPLETION MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Database indexes creation completed successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Monitor index usage with: SELECT * FROM index_usage_stats;';
    RAISE NOTICE '2. Check for unused indexes with: SELECT * FROM find_unused_indexes();';
    RAISE NOTICE '3. Monitor table bloat with: SELECT * FROM get_table_bloat();';
    RAISE NOTICE '4. Update table statistics: ANALYZE;';
    RAISE NOTICE '==============================================';
END $$;
