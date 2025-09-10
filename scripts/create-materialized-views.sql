-- Materialized Views for Performance Optimization
-- This file contains SQL scripts to create materialized views for better performance

-- Dashboard Summary Materialized View
-- This view aggregates all dashboard KPIs in a single materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_summary AS
SELECT 
    -- Contract statistics
    (SELECT COUNT(*) FROM contracts WHERE "deletedAt" IS NULL) as contract_count,
    (SELECT COALESCE(SUM("totalPrice"), 0) FROM contracts WHERE "deletedAt" IS NULL) as total_contract_value,
    
    -- Voucher statistics
    (SELECT COUNT(*) FROM vouchers WHERE "deletedAt" IS NULL) as voucher_count,
    (SELECT COALESCE(SUM(amount), 0) FROM vouchers WHERE "deletedAt" IS NULL) as total_voucher_amount,
    
    -- Installment statistics
    (SELECT COUNT(*) FROM installments WHERE "deletedAt" IS NULL) as installment_count,
    (SELECT COUNT(*) FROM installments WHERE "deletedAt" IS NULL AND status = 'مدفوعة') as paid_installments_count,
    (SELECT COUNT(*) FROM installments WHERE "deletedAt" IS NULL AND status = 'غير مدفوعة') as pending_installments_count,
    
    -- Unit statistics
    (SELECT COUNT(*) FROM units WHERE "deletedAt" IS NULL) as unit_count,
    (SELECT COUNT(*) FROM units WHERE "deletedAt" IS NULL AND status = 'متاح') as available_units_count,
    (SELECT COUNT(*) FROM units WHERE "deletedAt" IS NULL AND status = 'مباع') as sold_units_count,
    
    -- Customer statistics
    (SELECT COUNT(*) FROM customers WHERE "deletedAt" IS NULL) as customer_count,
    
    -- Partner statistics
    (SELECT COUNT(*) FROM partners WHERE "deletedAt" IS NULL) as partner_count,
    
    -- Broker statistics
    (SELECT COUNT(*) FROM brokers WHERE "deletedAt" IS NULL) as broker_count,
    
    -- Safe statistics
    (SELECT COUNT(*) FROM safes WHERE "deletedAt" IS NULL) as safe_count,
    (SELECT COALESCE(SUM(balance), 0) FROM safes WHERE "deletedAt" IS NULL) as total_safe_balance,
    
    -- Timestamp for cache invalidation
    NOW() as last_updated;

-- Create index on the materialized view for faster queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_summary_unique ON dashboard_summary (last_updated);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_summary;
    RAISE NOTICE 'Dashboard summary materialized view refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard data from materialized view
CREATE OR REPLACE FUNCTION get_dashboard_summary()
RETURNS TABLE (
    contract_count bigint,
    total_contract_value numeric,
    voucher_count bigint,
    total_voucher_amount numeric,
    installment_count bigint,
    paid_installments_count bigint,
    pending_installments_count bigint,
    unit_count bigint,
    available_units_count bigint,
    sold_units_count bigint,
    customer_count bigint,
    partner_count bigint,
    broker_count bigint,
    safe_count bigint,
    total_safe_balance numeric,
    last_updated timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM dashboard_summary
    ORDER BY last_updated DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-refresh materialized view when data changes
-- This is a simplified approach - in production, you might want more granular triggers

-- Trigger function for contracts
CREATE OR REPLACE FUNCTION trigger_refresh_dashboard()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh the materialized view asynchronously
    PERFORM pg_notify('refresh_dashboard', 'dashboard_summary');
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to main tables (simplified - in production, consider more specific triggers)
CREATE TRIGGER refresh_dashboard_on_contracts
    AFTER INSERT OR UPDATE OR DELETE ON contracts
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_dashboard();

CREATE TRIGGER refresh_dashboard_on_vouchers
    AFTER INSERT OR UPDATE OR DELETE ON vouchers
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_dashboard();

CREATE TRIGGER refresh_dashboard_on_installments
    AFTER INSERT OR UPDATE OR DELETE ON installments
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_dashboard();

CREATE TRIGGER refresh_dashboard_on_units
    AFTER INSERT OR UPDATE OR DELETE ON units
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_dashboard();

CREATE TRIGGER refresh_dashboard_on_customers
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_dashboard();

-- Grant necessary permissions
GRANT SELECT ON dashboard_summary TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_dashboard_summary() TO PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_dashboard_summary() TO PUBLIC;

-- Initial refresh
REFRESH MATERIALIZED VIEW dashboard_summary;
