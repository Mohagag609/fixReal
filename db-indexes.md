# Database Indexes for Performance Optimization

This document outlines the recommended database indexes for optimal performance in the Estate Management System.

## Overview

The following indexes are designed to improve query performance, especially for:
- Cursor-based pagination
- Soft delete filtering
- Status-based filtering
- Date-based ordering
- Search operations

## Core Indexes

### 1. Soft Delete Indexes
All tables with soft delete functionality should have indexes on `deletedAt`:

```sql
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
```

### 2. Cursor Pagination Indexes
For efficient cursor-based pagination using `id` field:

```sql
-- Primary ID indexes (usually already exist as primary keys)
-- These are essential for cursor pagination performance

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
```

### 3. Status-based Indexes
For filtering by status fields:

```sql
-- Installments status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installments_status ON installments (status) WHERE "deletedAt" IS NULL;

-- Units status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_status ON units (status) WHERE "deletedAt" IS NULL;

-- Brokers status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brokers_status ON brokers (status) WHERE "deletedAt" IS NULL;

-- Users active status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_active ON users ("isActive") WHERE "deletedAt" IS NULL;
```

### 4. Search Indexes
For text search operations:

```sql
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
```

### 5. Foreign Key Indexes
For efficient joins and relationship queries:

```sql
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
```

### 6. Date-based Indexes
For time-based queries and ordering:

```sql
-- Created at indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_created_at ON contracts ("createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vouchers_created_at ON vouchers ("createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installments_created_at ON installments ("createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_created_at ON units ("createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_created_at ON customers ("createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_partners_created_at ON partners ("createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brokers_created_at ON brokers ("createdAt" DESC) WHERE "deletedAt" IS NULL;
```

### 7. Composite Indexes
For complex queries combining multiple conditions:

```sql
-- Units: status + deletedAt
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_units_status_deleted ON units (status, "deletedAt") WHERE "deletedAt" IS NULL;

-- Installments: status + deletedAt
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installments_status_deleted ON installments (status, "deletedAt") WHERE "deletedAt" IS NULL;

-- Contracts: totalPrice + deletedAt (for value-based queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_value_deleted ON contracts ("totalPrice", "deletedAt") WHERE "deletedAt" IS NULL;

-- Vouchers: amount + deletedAt
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vouchers_amount_deleted ON vouchers (amount, "deletedAt") WHERE "deletedAt" IS NULL;
```

## Performance Monitoring

### Index Usage Queries
Monitor index usage with these queries:

```sql
-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
AND idx_scan = 0
ORDER BY tablename;
```

### Index Size Monitoring
```sql
-- Check index sizes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Implementation Notes

1. **CONCURRENTLY**: All indexes are created with `CONCURRENTLY` to avoid blocking operations
2. **Partial Indexes**: Many indexes use `WHERE "deletedAt" IS NULL` to only index active records
3. **GIN Indexes**: Used for full-text search on Arabic text fields
4. **Composite Indexes**: Order matters - most selective column first
5. **Monitoring**: Regular monitoring of index usage is recommended

## Maintenance

### Regular Maintenance Tasks
```sql
-- Update table statistics
ANALYZE;

-- Reindex if needed (use with caution in production)
-- REINDEX INDEX CONCURRENTLY index_name;

-- Check for bloat
SELECT 
    schemaname,
    tablename,
    n_dead_tup,
    n_live_tup,
    ROUND(n_dead_tup::numeric / n_live_tup::numeric * 100, 2) as dead_tuple_percent
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY dead_tuple_percent DESC;
```

## Migration Script

A complete migration script is available in `scripts/create-indexes.sql` that can be run to create all recommended indexes safely.
