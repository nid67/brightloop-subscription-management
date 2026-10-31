-- Brightloop Software - PostgreSQL Database Schema for Supabase
-- Run this script in the Supabase SQL Editor to initialize all tables and constraints

-- 1. Users Table (Credentials & RBAC)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'STAFF', 'CUSTOMER')),
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    gstin VARCHAR(15),
    billing_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Dynamic Product Variant Attributes
-- Implements formula: Final Price = Base Price + SUM(Attribute Surcharges)
CREATE TABLE IF NOT EXISTS product_variant_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value VARCHAR(100) NOT NULL,
    surcharge_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Plans Table (Billing Schedules)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plan_code VARCHAR(100) UNIQUE NOT NULL,
    interval_unit VARCHAR(20) NOT NULL CHECK (interval_unit IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
    interval_count INT NOT NULL DEFAULT 1,
    recurring_price NUMERIC(10, 2) NOT NULL,
    auto_close_days INT DEFAULT 15,
    allow_pause BOOLEAN DEFAULT TRUE,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Subscriptions Table (Contract Lifecycle)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_code VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED')),
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    recurring_amount NUMERIC(10, 2) NOT NULL,
    idempotency_token VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Dual-GST Recurring Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    subtotal NUMERIC(10, 2) NOT NULL,
    cgst_rate NUMERIC(5, 2) DEFAULT 9.00,
    cgst_amount NUMERIC(10, 2) DEFAULT 0.00,
    sgst_rate NUMERIC(5, 2) DEFAULT 9.00,
    sgst_amount NUMERIC(10, 2) DEFAULT 0.00,
    igst_rate NUMERIC(5, 2) DEFAULT 0.00,
    igst_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('PAID', 'UNPAID', 'OVERDUE', 'VOID')),
    due_date DATE NOT NULL,
    -- Unique idempotency key to strictly prevent duplicate invoice generation
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    hsn_sac VARCHAR(20) DEFAULT '998313',
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL
);

-- 9. Payments & Reconciliation Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL,
    payment_channel VARCHAR(50) NOT NULL CHECK (payment_channel IN ('UPI', 'BANK_TRANSFER', 'CARD', 'CASH')),
    transaction_ref VARCHAR(255) NOT NULL,
    reconciled BOOLEAN DEFAULT FALSE,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Discounts & Promo Codes Table
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
    discount_value NUMERIC(10, 2) NOT NULL,
    max_redemptions INT DEFAULT NULL,
    redemption_count INT DEFAULT 0,
    valid_until DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Revenue Leakage Sentinel Logs Table
CREATE TABLE IF NOT EXISTS revenue_leakage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anomaly_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    financial_impact NUMERIC(10, 2) DEFAULT 0.00,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'DISMISSED')),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-performance reporting and analytics
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- ============================================================
-- Row Level Security (RLS) & Access Control
-- ============================================================

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_variant_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.revenue_leakage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for app" ON public.users;
DROP POLICY IF EXISTS "Enable all access for app" ON public.customers;
DROP POLICY IF EXISTS "Enable all access for app" ON public.products;
DROP POLICY IF EXISTS "Enable all access for app" ON public.product_variant_attributes;
DROP POLICY IF EXISTS "Enable all access for app" ON public.plans;
DROP POLICY IF EXISTS "Enable all access for app" ON public.subscriptions;
DROP POLICY IF EXISTS "Enable all access for app" ON public.invoices;
DROP POLICY IF EXISTS "Enable all access for app" ON public.invoice_items;
DROP POLICY IF EXISTS "Enable all access for app" ON public.payments;
DROP POLICY IF EXISTS "Enable all access for app" ON public.discounts;
DROP POLICY IF EXISTS "Enable all access for app" ON public.revenue_leakage_logs;

CREATE POLICY "Enable all access for app" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for app" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for app" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for app" ON public.product_variant_attributes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for app" ON public.plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for app" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for app" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for app" ON public.invoice_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for app" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for app" ON public.discounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for app" ON public.revenue_leakage_logs FOR ALL USING (true) WITH CHECK (true);

