-- Estate Management System Database Schema
-- PostgreSQL Database Schema for Estate Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    national_id VARCHAR(20) UNIQUE,
    address TEXT,
    status VARCHAR(50) DEFAULT 'نشط',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Units table
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255),
    unit_type VARCHAR(50) DEFAULT 'سكني',
    area VARCHAR(50),
    floor VARCHAR(50),
    building VARCHAR(100),
    total_price DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'متاحة',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Partners table
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Unit Partners table (relationship between units and partners)
CREATE TABLE IF NOT EXISTS unit_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    percentage DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(unit_id, partner_id)
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    broker_name VARCHAR(255),
    broker_percent DECIMAL(5,2) DEFAULT 0,
    broker_amount DECIMAL(15,2) DEFAULT 0,
    commission_safe_id UUID,
    down_payment_safe_id UUID,
    maintenance_deposit DECIMAL(15,2) DEFAULT 0,
    installment_type VARCHAR(50) DEFAULT 'شهري',
    installment_count INTEGER DEFAULT 0,
    extra_annual INTEGER DEFAULT 0,
    annual_payment_value DECIMAL(15,2) DEFAULT 0,
    down_payment DECIMAL(15,2) DEFAULT 0,
    payment_type VARCHAR(50) DEFAULT 'installment',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Installments table
CREATE TABLE IF NOT EXISTS installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'معلق',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Partner Debts table
CREATE TABLE IF NOT EXISTS partner_debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'معلق',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Safes table
CREATE TABLE IF NOT EXISTS safes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Transfers table
CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_safe_id UUID NOT NULL REFERENCES safes(id) ON DELETE CASCADE,
    to_safe_id UUID NOT NULL REFERENCES safes(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- 'receipt' or 'payment'
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    safe_id UUID NOT NULL REFERENCES safes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    payer VARCHAR(255),
    beneficiary VARCHAR(255),
    linked_ref UUID, -- Reference to unit, contract, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Brokers table
CREATE TABLE IF NOT EXISTS brokers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Broker Dues table
CREATE TABLE IF NOT EXISTS broker_dues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'معلق',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Partner Groups table
CREATE TABLE IF NOT EXISTS partner_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Partner Group Partners table (relationship between partner groups and partners)
CREATE TABLE IF NOT EXISTS partner_group_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_group_id UUID NOT NULL REFERENCES partner_groups(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    percentage DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(partner_group_id, partner_id)
);

-- Unit Partner Groups table (relationship between units and partner groups)
CREATE TABLE IF NOT EXISTS unit_partner_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    partner_group_id UUID NOT NULL REFERENCES partner_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(unit_id, partner_group_id)
);

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values TEXT, -- JSON string
    new_values TEXT, -- JSON string
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL
);

-- Key-Value table
CREATE TABLE IF NOT EXISTS keyval (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL
);

-- Users table (for future authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- 'critical', 'important', 'info'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    data TEXT -- JSON string
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

CREATE INDEX IF NOT EXISTS idx_units_status ON units(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_units_unit_type ON units(unit_type, deleted_at);
CREATE INDEX IF NOT EXISTS idx_units_total_price ON units(total_price);
CREATE INDEX IF NOT EXISTS idx_units_created_at ON units(created_at);
CREATE INDEX IF NOT EXISTS idx_units_code ON units(code);

CREATE INDEX IF NOT EXISTS idx_partners_name ON partners(name);
CREATE INDEX IF NOT EXISTS idx_partners_phone ON partners(phone);
CREATE INDEX IF NOT EXISTS idx_partners_deleted_at ON partners(deleted_at);

CREATE INDEX IF NOT EXISTS idx_unit_partners_unit_id ON unit_partners(unit_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_unit_partners_partner_id ON unit_partners(partner_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_contracts_unit_id ON contracts(unit_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_total_price ON contracts(total_price);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);

CREATE INDEX IF NOT EXISTS idx_installments_unit_id ON installments(unit_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_amount ON installments(amount);

CREATE INDEX IF NOT EXISTS idx_vouchers_safe_id ON vouchers(safe_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_vouchers_type ON vouchers(type, deleted_at);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(date);
CREATE INDEX IF NOT EXISTS idx_vouchers_amount ON vouchers(amount);

CREATE INDEX IF NOT EXISTS idx_transfers_from_safe_id ON transfers(from_safe_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_transfers_to_safe_id ON transfers(to_safe_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert default safes
INSERT INTO safes (name, balance) VALUES 
    ('الخزنة الرئيسية', 0),
    ('خزنة المبيعات', 0),
    ('خزنة المصروفات', 0)
ON CONFLICT (name) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
    ('company_name', 'شركة العقارات المتطورة'),
    ('company_address', 'المملكة العربية السعودية'),
    ('company_phone', '+966500000000'),
    ('currency', 'SAR'),
    ('tax_rate', '15'),
    ('default_installment_type', 'شهري')
ON CONFLICT (key) DO NOTHING;