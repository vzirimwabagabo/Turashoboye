-- =============================================================================
-- Migration: 20261017000001_initial_schema.sql
-- Description: Core schema definitions for Turashoboye Feeds (Mahama, Rwanda)
-- Conforms to Master Specification: UUID primary keys, append-only ledgers,
-- integer whole RWF monetary units, explicit location tracking, GS1-ready fields.
-- =============================================================================

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Roles and User Profiles
-- -----------------------------------------------------------------------------
CREATE TYPE app_role AS ENUM (
    'public',
    'sales_staff',
    'inventory',
    'manager',
    'owner'
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NOT NULL, -- references auth.users(id) in Supabase
    role app_role NOT NULL DEFAULT 'sales_staff',
    display_name TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Index for looking up profile by auth user id
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);

-- -----------------------------------------------------------------------------
-- 2. Units of Measure
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.units_of_measure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g. "Kilogram", "50kg Bag", "25kg Bag", "Metric Ton"
    abbreviation TEXT NOT NULL UNIQUE, -- e.g. "kg", "bag_50kg", "bag_25kg", "t"
    conversion_factor_to_base NUMERIC(12, 4) NOT NULL DEFAULT 1.0000, -- base is 1 kg
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 3. Inventory Locations (Single active location at launch, ready for multi-depot)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    gln TEXT, -- GS1 Global Location Number (optional future use)
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 4. Product Categories
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 5. Products & Product Variants
-- -----------------------------------------------------------------------------
CREATE TYPE product_type AS ENUM (
    'finished_feed',
    'raw_ingredient',
    'packaging',
    'mineral_premix'
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    type product_type NOT NULL DEFAULT 'finished_feed',
    target_animal TEXT, -- e.g. "Broiler", "Layer", "Pig", "Dairy Cattle"
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    sku TEXT NOT NULL UNIQUE,
    package_size TEXT NOT NULL, -- e.g. "50kg bag", "25kg bag", "1kg bulk"
    unit_id UUID NOT NULL REFERENCES public.units_of_measure(id) ON DELETE RESTRICT,
    price_rwf BIGINT NOT NULL CHECK (price_rwf >= 0), -- Whole Rwandan Francs
    cost_rwf BIGINT NOT NULL DEFAULT 0 CHECK (cost_rwf >= 0), -- Cost per unit in whole RWF (manager/owner only)
    currency_code VARCHAR(3) NOT NULL DEFAULT 'RWF',
    reorder_threshold NUMERIC(12, 2) NOT NULL DEFAULT 10.00 CHECK (reorder_threshold >= 0),
    gtin TEXT, -- GS1 Global Trade Item Number (optional)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    cloudinary_public_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 6. Suppliers & Procurement
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    tin_number TEXT, -- Rwandan Tax Identification Number
    gln TEXT, -- GS1 GLN
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TYPE po_status AS ENUM (
    'draft',
    'ordered',
    'partially_received',
    'received',
    'cancelled'
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number TEXT NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    status po_status NOT NULL DEFAULT 'draft',
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    total_amount_rwf BIGINT NOT NULL DEFAULT 0 CHECK (total_amount_rwf >= 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'RWF',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    ordered_quantity NUMERIC(12, 2) NOT NULL CHECK (ordered_quantity > 0),
    unit_price_rwf BIGINT NOT NULL CHECK (unit_price_rwf >= 0),
    received_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (received_quantity >= 0)
);

-- -----------------------------------------------------------------------------
-- 7. Ingredient Lots (Traceability: Origin -> Production)
-- -----------------------------------------------------------------------------
CREATE TYPE lot_status AS ENUM (
    'available',
    'depleted',
    'held',
    'rejected'
);

CREATE TABLE IF NOT EXISTS public.ingredient_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
    lot_number TEXT NOT NULL UNIQUE, -- Human-readable identifier e.g. LOT-SOYA-20261017-01
    supplier_lot_number TEXT,
    received_quantity NUMERIC(12, 2) NOT NULL CHECK (received_quantity > 0),
    unit_id UUID NOT NULL REFERENCES public.units_of_measure(id) ON DELETE RESTRICT,
    manufacturing_date DATE,
    expiry_date DATE,
    status lot_status NOT NULL DEFAULT 'available',
    gtin TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_ingredient_lots_variant ON public.ingredient_lots(variant_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_lots_supplier ON public.ingredient_lots(supplier_id);

-- Goods Receipts
CREATE TABLE IF NOT EXISTS public.goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT NOT NULL UNIQUE,
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    received_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.goods_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_receipt_id UUID NOT NULL REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
    lot_id UUID NOT NULL REFERENCES public.ingredient_lots(id) ON DELETE RESTRICT,
    quantity_received NUMERIC(12, 2) NOT NULL CHECK (quantity_received > 0)
);

-- -----------------------------------------------------------------------------
-- 8. Production Formulations & Production Runs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.production_formulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    current_version_number INT NOT NULL DEFAULT 1,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.formula_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formula_id UUID NOT NULL REFERENCES public.production_formulas(id) ON DELETE RESTRICT,
    version_number INT NOT NULL,
    output_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    expected_output_qty NUMERIC(12, 2) NOT NULL CHECK (expected_output_qty > 0),
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(formula_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.formula_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formula_version_id UUID NOT NULL REFERENCES public.formula_versions(id) ON DELETE CASCADE,
    ingredient_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    expected_quantity NUMERIC(12, 2) NOT NULL CHECK (expected_quantity > 0),
    unit_id UUID NOT NULL REFERENCES public.units_of_measure(id) ON DELETE RESTRICT
);

CREATE TYPE batch_status AS ENUM (
    'planned',
    'in_progress',
    'completed',
    'held',
    'cancelled'
);

CREATE TABLE IF NOT EXISTS public.production_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number TEXT NOT NULL UNIQUE, -- Unique internal human-readable e.g. BATCH-20261017-001
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    formula_version_id UUID REFERENCES public.formula_versions(id) ON DELETE RESTRICT,
    planned_output_qty NUMERIC(12, 2) NOT NULL CHECK (planned_output_qty > 0),
    actual_output_qty NUMERIC(12, 2) CHECK (actual_output_qty >= 0),
    loss_qty NUMERIC(12, 2) CHECK (loss_qty >= 0),
    loss_percentage NUMERIC(5, 2), -- e.g. 3.50%
    status batch_status NOT NULL DEFAULT 'planned',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    operator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    supervisor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    notes TEXT,
    gtin TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.production_batch_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
    lot_id UUID NOT NULL REFERENCES public.ingredient_lots(id) ON DELETE RESTRICT,
    quantity_used NUMERIC(12, 2) NOT NULL CHECK (quantity_used > 0)
);

CREATE TABLE IF NOT EXISTS public.production_batch_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    quantity_produced NUMERIC(12, 2) NOT NULL CHECK (quantity_produced > 0)
);

CREATE TYPE quality_result AS ENUM (
    'passed',
    'failed',
    'held'
);

CREATE TABLE IF NOT EXISTS public.quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.production_batches(id) ON DELETE RESTRICT,
    inspector_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    result quality_result NOT NULL DEFAULT 'passed',
    notes TEXT,
    action_taken TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 9. Append-Only Inventory Movements (Source of Truth for Stock)
-- -----------------------------------------------------------------------------
CREATE TYPE movement_type AS ENUM (
    'opening_balance',
    'receipt',
    'consumption',
    'production_output',
    'sale',
    'adjustment',
    'return',
    'damage',
    'transfer'
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    location_id UUID NOT NULL REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
    type movement_type NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL, -- positive for additions, negative for deductions
    unit_id UUID NOT NULL REFERENCES public.units_of_measure(id) ON DELETE RESTRICT,
    reference_id UUID, -- FK to orders, goods_receipts, batches, or adjustments
    lot_id UUID REFERENCES public.ingredient_lots(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES public.production_batches(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_movements_variant_loc ON public.inventory_movements(variant_id, location_id);
CREATE INDEX IF NOT EXISTS idx_movements_reference ON public.inventory_movements(reference_id);
CREATE INDEX IF NOT EXISTS idx_movements_lot ON public.inventory_movements(lot_id);
CREATE INDEX IF NOT EXISTS idx_movements_batch ON public.inventory_movements(batch_id);

-- -----------------------------------------------------------------------------
-- 10. Customers, Sales Orders & Line Items
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    sector TEXT, -- Rwanda administrative sector e.g. Mahama
    preferred_contact TEXT DEFAULT 'phone',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TYPE order_status AS ENUM (
    'draft',
    'confirmed',
    'fulfilled',
    'cancelled'
);

CREATE TABLE IF NOT EXISTS public.sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE, -- e.g. ORD-20261017-001
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    location_id UUID NOT NULL REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
    status order_status NOT NULL DEFAULT 'draft',
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal_rwf BIGINT NOT NULL DEFAULT 0 CHECK (subtotal_rwf >= 0),
    discount_rwf BIGINT NOT NULL DEFAULT 0 CHECK (discount_rwf >= 0),
    total_amount_rwf BIGINT NOT NULL DEFAULT 0 CHECK (total_amount_rwf >= 0),
    currency_code VARCHAR(3) NOT NULL DEFAULT 'RWF',
    recorded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    batch_id UUID REFERENCES public.production_batches(id) ON DELETE SET NULL, -- Traceability link
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_price_rwf BIGINT NOT NULL CHECK (unit_price_rwf >= 0),
    discount_rwf BIGINT NOT NULL DEFAULT 0 CHECK (discount_rwf >= 0),
    line_total_rwf BIGINT NOT NULL CHECK (line_total_rwf >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.sales_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_batch ON public.sales_order_items(batch_id);

-- -----------------------------------------------------------------------------
-- 11. Payments & Accounts Receivable
-- -----------------------------------------------------------------------------
CREATE TYPE payment_method AS ENUM (
    'cash',
    'momo',
    'bank_transfer'
);

CREATE TYPE payment_status AS ENUM (
    'pending_verification',
    'confirmed',
    'failed'
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE RESTRICT,
    method payment_method NOT NULL,
    amount_rwf BIGINT NOT NULL CHECK (amount_rwf > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference TEXT, -- MoMo txn id, bank slip number, etc.
    status payment_status NOT NULL DEFAULT 'confirmed',
    is_offline_recorded BOOLEAN NOT NULL DEFAULT FALSE,
    idempotency_key UUID NOT NULL UNIQUE, -- Prevents duplicate payment submissions
    recorded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);

-- -----------------------------------------------------------------------------
-- 12. Rwanda Regulatory & Compliance Records (Configurable)
-- -----------------------------------------------------------------------------
CREATE TYPE regulatory_category AS ENUM (
    'company_registration',
    'premises_licence',
    'product_registration',
    'standard_certification',
    'inspection_record',
    'supplier_permit'
);

CREATE TYPE regulatory_status AS ENUM (
    'not_entered',
    'pending_verification',
    'verified',
    'expired',
    'not_applicable'
);

CREATE TABLE IF NOT EXISTS public.regulatory_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category regulatory_category NOT NULL,
    authority TEXT NOT NULL, -- e.g. "RICA", "RSB", "RDB", "RRA"
    title TEXT NOT NULL,
    reference_number TEXT NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    status regulatory_status NOT NULL DEFAULT 'not_entered',
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verification_source TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.regulatory_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regulatory_record_id UUID NOT NULL REFERENCES public.regulatory_records(id) ON DELETE CASCADE,
    cloudinary_public_id TEXT NOT NULL,
    document_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 13. Audit Logs (Immutable security trail)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    detail JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- -----------------------------------------------------------------------------
-- 14. Offline Sync Operations Queue (Server-Side Ingestion Record)
-- -----------------------------------------------------------------------------
CREATE TYPE sync_status AS ENUM (
    'pending',
    'syncing',
    'synced',
    'failed',
    'conflict'
);

CREATE TABLE IF NOT EXISTS public.sync_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Client operation UUID
    client_id TEXT NOT NULL, -- Unique hardware or client instance identifier
    operation_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status sync_status NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sync_ops_client ON public.sync_operations(client_id, status);

-- -----------------------------------------------------------------------------
-- 15. Configurable System Settings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
