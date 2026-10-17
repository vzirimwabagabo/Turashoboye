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
-- =============================================================================
-- Migration: 20261017000002_rls_and_security.sql
-- Description: Strict Row Level Security (RLS), role-based policies,
-- and immutable ledger enforcement for Turashoboye Feeds.
-- =============================================================================

-- Enable Row Level Security on ALL public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formula_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batch_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batch_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Helper Functions (Security Definer)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_profile_id()
RETURNS UUID AS $$
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS app_role AS $$
    SELECT role FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_manager_or_owner()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid() AND role IN ('manager', 'owner')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid() AND role = 'owner'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid() AND role IN ('sales_staff', 'inventory', 'manager', 'owner')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- Profiles Policies
-- -----------------------------------------------------------------------------
-- Users can read their own profile; managers and owners can read all profiles
CREATE POLICY "Profiles are viewable by self or management"
ON public.profiles FOR SELECT
USING (
    auth_user_id = auth.uid() OR public.is_manager_or_owner()
);

-- Users can update their own display name or phone; role assignment restricted to owner
CREATE POLICY "Users can update own basic profile"
ON public.profiles FOR UPDATE
USING (auth_user_id = auth.uid() OR public.is_owner())
WITH CHECK (
    (auth_user_id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE auth_user_id = auth.uid()))
    OR public.is_owner()
);

-- Profile creation: during registration, or by owner
CREATE POLICY "Profiles can be inserted on registration or by owner"
ON public.profiles FOR INSERT
WITH CHECK (
    auth_user_id = auth.uid() OR public.is_owner()
);

-- -----------------------------------------------------------------------------
-- Public Catalogue Policies (Categories, Products, Images, Units)
-- -----------------------------------------------------------------------------
-- Units of measure: anyone can view active units; managers/owners can manage
CREATE POLICY "Units of measure viewable by all"
ON public.units_of_measure FOR SELECT
USING (is_active = true OR public.is_staff());

CREATE POLICY "Units of measure manageable by manager or owner"
ON public.units_of_measure FOR ALL
USING (public.is_manager_or_owner());

-- Locations: staff can view; managers/owners can manage
CREATE POLICY "Locations viewable by staff"
ON public.inventory_locations FOR SELECT
USING (public.is_staff());

CREATE POLICY "Locations manageable by manager or owner"
ON public.inventory_locations FOR ALL
USING (public.is_manager_or_owner());

-- Categories: public can view; managers/owners can manage
CREATE POLICY "Categories viewable by public"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "Categories manageable by manager or owner"
ON public.categories FOR ALL
USING (public.is_manager_or_owner());

-- Products: published viewable by public; all viewable by staff; managers manage
CREATE POLICY "Published products viewable by public"
ON public.products FOR SELECT
USING (published = true OR public.is_staff());

CREATE POLICY "Products manageable by manager or owner"
ON public.products FOR ALL
USING (public.is_manager_or_owner());

-- Product Variants: published products' variants viewable by public; all by staff
CREATE POLICY "Variants viewable by public if product is published"
ON public.product_variants FOR SELECT
USING (
    (is_active = true AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_variants.product_id AND p.published = true))
    OR public.is_staff()
);

CREATE POLICY "Variants manageable by manager or owner"
ON public.product_variants FOR ALL
USING (public.is_manager_or_owner());

-- Product Images
CREATE POLICY "Product images viewable by all"
ON public.product_images FOR SELECT
USING (true);

CREATE POLICY "Product images manageable by manager or owner"
ON public.product_images FOR ALL
USING (public.is_manager_or_owner());

-- -----------------------------------------------------------------------------
-- Suppliers & Procurement Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Suppliers viewable by inventory staff and management"
ON public.suppliers FOR SELECT
USING (public.current_user_role() IN ('inventory', 'manager', 'owner'));

CREATE POLICY "Suppliers manageable by inventory staff and management"
ON public.suppliers FOR ALL
USING (public.current_user_role() IN ('inventory', 'manager', 'owner'));

CREATE POLICY "Purchase orders viewable by inventory and management"
ON public.purchase_orders FOR SELECT
USING (public.current_user_role() IN ('inventory', 'manager', 'owner'));

CREATE POLICY "Purchase orders manageable by inventory and management"
ON public.purchase_orders FOR ALL
USING (public.current_user_role() IN ('inventory', 'manager', 'owner'));

CREATE POLICY "PO items viewable by inventory and management"
ON public.purchase_order_items FOR SELECT
USING (public.current_user_role() IN ('inventory', 'manager', 'owner'));

CREATE POLICY "PO items manageable by inventory and management"
ON public.purchase_order_items FOR ALL
USING (public.current_user_role() IN ('inventory', 'manager', 'owner'));

-- -----------------------------------------------------------------------------
-- Ingredient Lots & Goods Receipts Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Ingredient lots viewable by staff"
ON public.ingredient_lots FOR SELECT
USING (public.is_staff());

CREATE POLICY "Ingredient lots creatable by inventory and management"
ON public.ingredient_lots FOR INSERT
WITH CHECK (public.current_user_role() IN ('inventory', 'manager', 'owner'));

CREATE POLICY "Ingredient lots updatable by inventory and management"
ON public.ingredient_lots FOR UPDATE
USING (public.current_user_role() IN ('inventory', 'manager', 'owner'));

CREATE POLICY "Goods receipts viewable by staff"
ON public.goods_receipts FOR SELECT
USING (public.is_staff());

CREATE POLICY "Goods receipts creatable by inventory and management"
ON public.goods_receipts FOR INSERT
WITH CHECK (public.current_user_role() IN ('inventory', 'manager', 'owner'));

CREATE POLICY "Goods receipt items viewable by staff"
ON public.goods_receipt_items FOR SELECT
USING (public.is_staff());

CREATE POLICY "Goods receipt items creatable by inventory and management"
ON public.goods_receipt_items FOR INSERT
WITH CHECK (public.current_user_role() IN ('inventory', 'manager', 'owner'));

-- -----------------------------------------------------------------------------
-- Production & Formulations Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Formulas viewable by management"
ON public.production_formulas FOR SELECT
USING (public.is_manager_or_owner());

CREATE POLICY "Formulas manageable by manager or owner"
ON public.production_formulas FOR ALL
USING (public.is_manager_or_owner());

CREATE POLICY "Formula versions viewable by management"
ON public.formula_versions FOR SELECT
USING (public.is_manager_or_owner());

CREATE POLICY "Formula versions manageable by manager or owner"
ON public.formula_versions FOR ALL
USING (public.is_manager_or_owner());

CREATE POLICY "Formula ingredients viewable by management"
ON public.formula_ingredients FOR SELECT
USING (public.is_manager_or_owner());

CREATE POLICY "Formula ingredients manageable by manager or owner"
ON public.formula_ingredients FOR ALL
USING (public.is_manager_or_owner());

CREATE POLICY "Production batches viewable by staff"
ON public.production_batches FOR SELECT
USING (public.is_staff());

CREATE POLICY "Production batches creatable by management and operator"
ON public.production_batches FOR INSERT
WITH CHECK (public.current_user_role() IN ('inventory', 'manager', 'owner'));

CREATE POLICY "Production batches updatable by management"
ON public.production_batches FOR UPDATE
USING (public.is_manager_or_owner());

CREATE POLICY "Batch inputs and outputs viewable by staff"
ON public.production_batch_inputs FOR SELECT
USING (public.is_staff());

CREATE POLICY "Batch inputs creatable by inventory and management"
ON public.production_batch_inputs FOR INSERT
WITH CHECK (public.current_user_role() IN ('inventory', 'manager', 'owner'));

CREATE POLICY "Batch outputs viewable by staff"
ON public.production_batch_outputs FOR SELECT
USING (public.is_staff());

CREATE POLICY "Batch outputs creatable by inventory and management"
ON public.production_batch_outputs FOR INSERT
WITH CHECK (public.current_user_role() IN ('inventory', 'manager', 'owner'));

CREATE POLICY "Quality checks viewable by staff"
ON public.quality_checks FOR SELECT
USING (public.is_staff());

CREATE POLICY "Quality checks creatable by management"
ON public.quality_checks FOR ALL
USING (public.is_manager_or_owner());

-- -----------------------------------------------------------------------------
-- Inventory Movements (Append-Only Ledger)
-- -----------------------------------------------------------------------------
CREATE POLICY "Movements viewable by staff"
ON public.inventory_movements FOR SELECT
USING (public.is_staff());

CREATE POLICY "Movements creatable by authorized staff"
ON public.inventory_movements FOR INSERT
WITH CHECK (public.is_staff());

-- Direct update and hard delete are NEVER allowed on inventory_movements
CREATE POLICY "No direct updates on movement ledger"
ON public.inventory_movements FOR UPDATE
USING (false);

CREATE POLICY "No direct deletes on movement ledger"
ON public.inventory_movements FOR DELETE
USING (false);

-- -----------------------------------------------------------------------------
-- Customers, Orders & Payments Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Customers viewable by staff"
ON public.customers FOR SELECT
USING (public.is_staff());

CREATE POLICY "Customers manageable by sales staff and management"
ON public.customers FOR ALL
USING (public.current_user_role() IN ('sales_staff', 'manager', 'owner'));

CREATE POLICY "Sales orders viewable by staff"
ON public.sales_orders FOR SELECT
USING (public.is_staff());

CREATE POLICY "Sales orders insertable by sales staff and management"
ON public.sales_orders FOR INSERT
WITH CHECK (public.current_user_role() IN ('sales_staff', 'manager', 'owner'));

CREATE POLICY "Sales orders updatable by sales staff and management"
ON public.sales_orders FOR UPDATE
USING (public.current_user_role() IN ('sales_staff', 'manager', 'owner'));

-- Disallow hard delete on sales orders
CREATE POLICY "No hard delete on sales orders"
ON public.sales_orders FOR DELETE
USING (false);

CREATE POLICY "Sales order items viewable by staff"
ON public.sales_order_items FOR SELECT
USING (public.is_staff());

CREATE POLICY "Sales order items manageable by sales staff and management"
ON public.sales_order_items FOR ALL
USING (public.current_user_role() IN ('sales_staff', 'manager', 'owner'));

CREATE POLICY "Payments viewable by staff"
ON public.payments FOR SELECT
USING (public.is_staff());

CREATE POLICY "Payments creatable by sales staff and management"
ON public.payments FOR INSERT
WITH CHECK (public.current_user_role() IN ('sales_staff', 'manager', 'owner'));

-- Payments cannot be deleted or arbitrarily updated once posted
CREATE POLICY "Payments updatable only by management"
ON public.payments FOR UPDATE
USING (public.is_manager_or_owner());

CREATE POLICY "No hard delete on payments"
ON public.payments FOR DELETE
USING (false);

-- -----------------------------------------------------------------------------
-- Regulatory & Compliance Records Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Regulatory records viewable by staff"
ON public.regulatory_records FOR SELECT
USING (public.is_staff());

CREATE POLICY "Regulatory records manageable by manager or owner"
ON public.regulatory_records FOR ALL
USING (public.is_manager_or_owner());

CREATE POLICY "Regulatory documents viewable by staff"
ON public.regulatory_documents FOR SELECT
USING (public.is_staff());

CREATE POLICY "Regulatory documents manageable by manager or owner"
ON public.regulatory_documents FOR ALL
USING (public.is_manager_or_owner());

-- -----------------------------------------------------------------------------
-- Audit Logs & Settings Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Audit logs viewable by manager or owner"
ON public.audit_logs FOR SELECT
USING (public.is_manager_or_owner());

CREATE POLICY "Audit logs insertable by any authenticated action"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "No update or delete on audit logs"
ON public.audit_logs FOR UPDATE
USING (false);

CREATE POLICY "No delete on audit logs"
ON public.audit_logs FOR DELETE
USING (false);

-- Sync operations: viewable and insertable by staff
CREATE POLICY "Sync operations accessible by staff"
ON public.sync_operations FOR ALL
USING (public.is_staff());

-- Settings: viewable by staff; updated by owner only
CREATE POLICY "Settings viewable by staff"
ON public.settings FOR SELECT
USING (public.is_staff());

CREATE POLICY "Settings manageable by owner"
ON public.settings FOR ALL
USING (public.is_owner());
-- =============================================================================
-- Migration: 20261017000003_inventory_and_production_functions.sql
-- Description: Atomic transactional functions for inventory, production,
-- stock validation, and live stock calculation for Turashoboye Feeds.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Stock On Hand View (Computed from Immutable Movement Ledger)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_stock_on_hand AS
SELECT
    m.variant_id,
    pv.product_id,
    p.name AS product_name,
    pv.sku,
    pv.package_size,
    u.name AS unit_name,
    u.abbreviation AS unit_abbr,
    m.location_id,
    loc.name AS location_name,
    SUM(m.quantity) AS physical_stock_qty,
    -- Available to sell excludes stock currently associated with batches on 'held' status
    COALESCE(
        SUM(
            CASE 
                WHEN m.batch_id IS NOT NULL AND b.status = 'held' THEN 0
                WHEN m.lot_id IS NOT NULL AND l.status = 'held' THEN 0
                ELSE m.quantity
            END
        ), 0
    ) AS available_to_sell_qty,
    pv.reorder_threshold,
    CASE 
        WHEN SUM(m.quantity) <= 0 THEN 'out_of_stock'
        WHEN SUM(m.quantity) <= pv.reorder_threshold THEN 'low_stock'
        ELSE 'adequate'
    END AS stock_status
FROM public.inventory_movements m
JOIN public.product_variants pv ON pv.id = m.variant_id
JOIN public.products p ON p.id = pv.product_id
JOIN public.units_of_measure u ON u.id = pv.unit_id
JOIN public.inventory_locations loc ON loc.id = m.location_id
LEFT JOIN public.production_batches b ON b.id = m.batch_id
LEFT JOIN public.ingredient_lots l ON l.id = m.lot_id
GROUP BY 
    m.variant_id, 
    pv.product_id, 
    p.name, 
    pv.sku, 
    pv.package_size, 
    u.name, 
    u.abbreviation, 
    m.location_id, 
    loc.name, 
    pv.reorder_threshold;

-- Grant select to authenticated staff
GRANT SELECT ON public.view_stock_on_hand TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. Atomic Function: Complete Production Batch
-- Atomically consumes ingredient lots, yields finished feed, and records movements.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_production_batch(
    p_batch_id UUID,
    p_actual_output_qty NUMERIC,
    p_location_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_batch RECORD;
    v_input RECORD;
    v_loss_qty NUMERIC;
    v_loss_pct NUMERIC;
    v_user_profile_id UUID;
    v_unit_id UUID;
BEGIN
    -- Check permissions: manager or owner only
    IF NOT public.is_manager_or_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Only managers or owners can complete production batches.';
    END IF;

    v_user_profile_id := public.current_user_profile_id();

    -- Lock and retrieve batch
    SELECT * INTO v_batch
    FROM public.production_batches
    WHERE id = p_batch_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Production batch % not found.', p_batch_id;
    END IF;

    IF v_batch.status = 'completed' THEN
        RAISE EXCEPTION 'Production batch % is already marked as completed.', v_batch.batch_number;
    END IF;

    -- Calculate loss
    v_loss_qty := GREATEST(v_batch.planned_output_qty - p_actual_output_qty, 0);
    v_loss_pct := ROUND((v_loss_qty / v_batch.planned_output_qty) * 100, 2);

    -- Retrieve unit of measure of the output variant
    SELECT unit_id INTO v_unit_id
    FROM public.product_variants
    WHERE id = v_batch.product_variant_id;

    -- 1. Deduct all inputs from inventory_movements (consumption)
    FOR v_input IN 
        SELECT bi.lot_id, bi.quantity_used, l.variant_id, l.unit_id
        FROM public.production_batch_inputs bi
        JOIN public.ingredient_lots l ON l.id = bi.lot_id
        WHERE bi.batch_id = p_batch_id
    LOOP
        INSERT INTO public.inventory_movements (
            variant_id,
            location_id,
            type,
            quantity,
            unit_id,
            reference_id,
            lot_id,
            batch_id,
            user_id,
            reason
        ) VALUES (
            v_input.variant_id,
            p_location_id,
            'consumption',
            -ABS(v_input.quantity_used),
            v_input.unit_id,
            p_batch_id,
            v_input.lot_id,
            p_batch_id,
            v_user_profile_id,
            format('Consumed in production batch %s', v_batch.batch_number)
        );
    END LOOP;

    -- 2. Add finished feed output to inventory_movements
    INSERT INTO public.inventory_movements (
        variant_id,
        location_id,
        type,
        quantity,
        unit_id,
        reference_id,
        batch_id,
        user_id,
        reason
    ) VALUES (
        v_batch.product_variant_id,
        p_location_id,
        'production_output',
        p_actual_output_qty,
        v_unit_id,
        p_batch_id,
        p_batch_id,
        v_user_profile_id,
        format('Finished feed yield from batch %s (Loss: %s%%)', v_batch.batch_number, v_loss_pct)
    );

    -- 3. Record output in production_batch_outputs
    INSERT INTO public.production_batch_outputs (
        batch_id,
        variant_id,
        quantity_produced
    ) VALUES (
        p_batch_id,
        v_batch.product_variant_id,
        p_actual_output_qty
    );

    -- 4. Update production batch record
    UPDATE public.production_batches
    SET 
        actual_output_qty = p_actual_output_qty,
        loss_qty = v_loss_qty,
        loss_percentage = v_loss_pct,
        status = 'completed',
        completed_at = timezone('utc', now()),
        notes = COALESCE(p_notes, notes),
        updated_at = timezone('utc', now())
    WHERE id = p_batch_id;

    -- 5. Audit Log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        detail
    ) VALUES (
        v_user_profile_id,
        'COMPLETE_BATCH',
        'production_batches',
        p_batch_id,
        jsonb_build_object(
            'batch_number', v_batch.batch_number,
            'actual_output', p_actual_output_qty,
            'planned_output', v_batch.planned_output_qty,
            'loss_percentage', v_loss_pct
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'batch_id', p_batch_id,
        'batch_number', v_batch.batch_number,
        'actual_output', p_actual_output_qty,
        'loss_percentage', v_loss_pct,
        'loss_warning', (v_loss_pct > 5.0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 3. Atomic Function: Record Sale Transaction
-- Validates stock, deducts inventory, creates sales order and line items atomically.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_sale_transaction(
    p_customer_id UUID,
    p_location_id UUID,
    p_order_items JSONB, -- Array of objects: [{ variant_id, batch_id, quantity, unit_price_rwf, discount_rwf }]
    p_payment JSONB DEFAULT NULL, -- Optional immediate payment: { method, amount_rwf, reference, idempotency_key }
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_item RECORD;
    v_current_stock NUMERIC;
    v_subtotal BIGINT := 0;
    v_total_discount BIGINT := 0;
    v_final_total BIGINT := 0;
    v_user_profile_id UUID;
    v_unit_id UUID;
    v_line_total BIGINT;
    v_item_qty NUMERIC;
    v_item_price BIGINT;
    v_item_discount BIGINT;
    v_item_variant_id UUID;
    v_item_batch_id UUID;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Unauthorized: Only staff members can record sales.';
    END IF;

    v_user_profile_id := public.current_user_profile_id();

    -- Generate human-readable order number
    v_order_number := 'ORD-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6);
    v_order_id := gen_random_uuid();

    -- 1. Validate items and verify available stock (prevent oversell)
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_order_items) AS x(
        variant_id UUID,
        batch_id UUID,
        quantity NUMERIC,
        unit_price_rwf BIGINT,
        discount_rwf BIGINT
    )
    LOOP
        v_item_variant_id := v_item.variant_id;
        v_item_batch_id := v_item.batch_id;
        v_item_qty := v_item.quantity;
        v_item_price := v_item.unit_price_rwf;
        v_item_discount := COALESCE(v_item.discount_rwf, 0);

        IF v_item_qty <= 0 THEN
            RAISE EXCEPTION 'Item quantity must be greater than zero.';
        END IF;

        -- Check available-to-sell stock in the designated location
        SELECT COALESCE(SUM(quantity), 0) INTO v_current_stock
        FROM public.inventory_movements
        WHERE variant_id = v_item_variant_id AND location_id = p_location_id;

        IF v_current_stock < v_item_qty THEN
            RAISE EXCEPTION 'Insufficient stock for variant %. Available: %, Requested: %',
                v_item_variant_id, v_current_stock, v_item_qty;
        END IF;

        v_line_total := (v_item_qty * v_item_price) - v_item_discount;
        v_subtotal := v_subtotal + (v_item_qty * v_item_price);
        v_total_discount := v_total_discount + v_item_discount;
    END LOOP;

    v_final_total := v_subtotal - v_total_discount;

    -- 2. Insert Sales Order Header
    INSERT INTO public.sales_orders (
        id,
        order_number,
        customer_id,
        location_id,
        status,
        order_date,
        subtotal_rwf,
        discount_rwf,
        total_amount_rwf,
        currency_code,
        recorded_by,
        notes
    ) VALUES (
        v_order_id,
        v_order_number,
        p_customer_id,
        p_location_id,
        'confirmed',
        CURRENT_DATE,
        v_subtotal,
        v_total_discount,
        v_final_total,
        'RWF',
        v_user_profile_id,
        p_notes
    );

    -- 3. Insert Line Items and Record Stock Movement Deductions
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_order_items) AS x(
        variant_id UUID,
        batch_id UUID,
        quantity NUMERIC,
        unit_price_rwf BIGINT,
        discount_rwf BIGINT
    )
    LOOP
        v_item_variant_id := v_item.variant_id;
        v_item_batch_id := v_item.batch_id;
        v_item_qty := v_item.quantity;
        v_item_price := v_item.unit_price_rwf;
        v_item_discount := COALESCE(v_item.discount_rwf, 0);
        v_line_total := (v_item_qty * v_item_price) - v_item_discount;

        SELECT unit_id INTO v_unit_id
        FROM public.product_variants
        WHERE id = v_item_variant_id;

        INSERT INTO public.sales_order_items (
            order_id,
            variant_id,
            batch_id,
            quantity,
            unit_price_rwf,
            discount_rwf,
            line_total_rwf
        ) VALUES (
            v_order_id,
            v_item_variant_id,
            v_item_batch_id,
            v_item_qty,
            v_item_price,
            v_item_discount,
            v_line_total
        );

        -- Deduct stock in append-only ledger
        INSERT INTO public.inventory_movements (
            variant_id,
            location_id,
            type,
            quantity,
            unit_id,
            reference_id,
            batch_id,
            user_id,
            reason
        ) VALUES (
            v_item_variant_id,
            p_location_id,
            'sale',
            -ABS(v_item_qty),
            v_unit_id,
            v_order_id,
            v_item_batch_id,
            v_user_profile_id,
            format('Sale order %s', v_order_number)
        );
    END LOOP;

    -- 4. Record Payment if provided
    IF p_payment IS NOT NULL AND (p_payment->>'amount_rwf')::BIGINT > 0 THEN
        INSERT INTO public.payments (
            order_id,
            method,
            amount_rwf,
            payment_date,
            reference,
            status,
            is_offline_recorded,
            idempotency_key,
            recorded_by
        ) VALUES (
            v_order_id,
            (p_payment->>'method')::payment_method,
            (p_payment->>'amount_rwf')::BIGINT,
            CURRENT_DATE,
            p_payment->>'reference',
            CASE 
                WHEN p_payment->>'method' = 'cash' THEN 'confirmed'::payment_status
                ELSE 'pending_verification'::payment_status
            END,
            COALESCE((p_payment->>'is_offline')::BOOLEAN, false),
            COALESCE((p_payment->>'idempotency_key')::UUID, gen_random_uuid()),
            v_user_profile_id
        );
    END IF;

    -- 5. Audit Log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        detail
    ) VALUES (
        v_user_profile_id,
        'CREATE_SALE',
        'sales_orders',
        v_order_id,
        jsonb_build_object(
            'order_number', v_order_number,
            'total_amount_rwf', v_final_total,
            'customer_id', p_customer_id
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_amount_rwf', v_final_total
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 4. Atomic Function: Record Inventory Adjustment (with Reason & Thresholds)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_inventory_adjustment(
    p_variant_id UUID,
    p_location_id UUID,
    p_quantity NUMERIC, -- Positive for upward adjustment, negative for loss/damage
    p_reason TEXT,
    p_lot_id UUID DEFAULT NULL,
    p_batch_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_profile_id UUID;
    v_current_stock NUMERIC;
    v_unit_id UUID;
    v_threshold NUMERIC := 100.0; -- Default threshold for manager review
    v_setting_val JSONB;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Unauthorized: Only staff can submit inventory adjustments.';
    END IF;

    IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'A valid business reason is strictly required for any inventory adjustment.';
    END IF;

    -- Fetch threshold setting if configured
    SELECT value INTO v_setting_val FROM public.settings WHERE key = 'inventory_adjustment_approval_threshold_qty';
    IF v_setting_val IS NOT NULL THEN
        v_threshold := (v_setting_val->>'qty')::NUMERIC;
    END IF;

    -- If absolute quantity > threshold, require manager or owner
    IF ABS(p_quantity) >= v_threshold AND NOT public.is_manager_or_owner() THEN
        RAISE EXCEPTION 'Adjustments of % or greater require Manager approval.', v_threshold;
    END IF;

    v_user_profile_id := public.current_user_profile_id();

    -- Retrieve current physical stock
    SELECT COALESCE(SUM(quantity), 0) INTO v_current_stock
    FROM public.inventory_movements
    WHERE variant_id = p_variant_id AND location_id = p_location_id;

    -- Disallow negative stock
    IF (v_current_stock + p_quantity) < 0 THEN
        RAISE EXCEPTION 'Adjustment would result in negative stock. Current: %, Adjustment: %',
            v_current_stock, p_quantity;
    END IF;

    SELECT unit_id INTO v_unit_id FROM public.product_variants WHERE id = p_variant_id;

    -- Record movement
    INSERT INTO public.inventory_movements (
        variant_id,
        location_id,
        type,
        quantity,
        unit_id,
        lot_id,
        batch_id,
        user_id,
        reason
    ) VALUES (
        p_variant_id,
        p_location_id,
        'adjustment',
        p_quantity,
        v_unit_id,
        p_lot_id,
        p_batch_id,
        v_user_profile_id,
        p_reason
    );

    -- Audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        detail
    ) VALUES (
        v_user_profile_id,
        'INVENTORY_ADJUSTMENT',
        'inventory_movements',
        p_variant_id,
        jsonb_build_object(
            'quantity', p_quantity,
            'reason', p_reason,
            'previous_stock', v_current_stock,
            'new_stock', (v_current_stock + p_quantity)
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'variant_id', p_variant_id,
        'new_stock', (v_current_stock + p_quantity)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =============================================================================
-- Migration: 20261017000004_seed_data.sql
-- Description: Standard operational seed data for Turashoboye Feeds (Mahama, Rwanda)
-- Units of measure, launch depot location, categories, settings, and regulatory placeholders.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Standard Units of Measure
-- -----------------------------------------------------------------------------
INSERT INTO public.units_of_measure (name, abbreviation, conversion_factor_to_base)
VALUES
    ('Kilogram', 'kg', 1.0000),
    ('50kg Bag', 'bag_50kg', 50.0000),
    ('25kg Bag', 'bag_25kg', 25.0000),
    ('10kg Bag', 'bag_10kg', 10.0000),
    ('Metric Ton', 't', 1000.0000)
ON CONFLICT (abbreviation) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Launch Inventory Location (Mahama Depot)
-- -----------------------------------------------------------------------------
INSERT INTO public.inventory_locations (name, code, address, is_default, is_active)
VALUES
    ('Mahama Primary Feed Depot', 'DEPOT-MAHAMA-01', 'Sector Mahama, Kirehe District, Eastern Province, Rwanda', true, true)
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. Product Categories
-- -----------------------------------------------------------------------------
INSERT INTO public.categories (name, slug, description, display_order)
VALUES
    ('Poultry Feed', 'poultry-feed', 'Complete balanced feeds and mashes for broilers, layers, and chicks.', 1),
    ('Pig Feed', 'pig-feed', 'High-energy, protein-balanced feeds for piglets, growers, and sows.', 2),
    ('Cattle & Dairy Feed', 'cattle-feed', 'Concentrates and supplementary feeds for dairy and beef cattle.', 3),
    ('Raw Ingredients', 'raw-ingredients', 'Grains, meals, and cakes (maize, soya, bran) for grinding and mixing.', 4),
    ('Premixes & Minerals', 'premixes-minerals', 'Essential vitamins, calcium, and trace mineral premixes.', 5)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Initial Configurable System Settings
-- -----------------------------------------------------------------------------
INSERT INTO public.settings (key, value, description)
VALUES
    (
        'currency',
        '{"code": "RWF", "symbol": "FRW", "decimals": 0}'::jsonb,
        'Operating currency code and presentation format'
    ),
    (
        'production_loss_warning_threshold_pct',
        '{"pct": 5.0}'::jsonb,
        'Configurable production loss percentage warning threshold'
    ),
    (
        'inventory_adjustment_approval_threshold_qty',
        '{"qty": 100.0}'::jsonb,
        'Stock adjustment quantity above which Manager authorization is required'
    ),
    (
        'retention_policy_years',
        '{"financial_years": 10, "traceability_years": 10}'::jsonb,
        'Statutory and operational record retention baseline in years'
    )
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. Configurable Rwanda Regulatory Compliance Placeholders
-- Ready for staff verification with RICA, RSB, RDB, and RRA.
-- -----------------------------------------------------------------------------
INSERT INTO public.regulatory_records (category, authority, title, reference_number, status, notes)
VALUES
    (
        'premises_licence',
        'RICA',
        'Animal Feed Operating Licence / Facility Permit',
        'PENDING-RICA-APPLICATION',
        'not_entered',
        'RICA mandate covers animal feed safety and feed processor licensing.'
    ),
    (
        'product_registration',
        'RSB',
        'Animal Feed Product Registration (Zamukana Ubuziranenge)',
        'PENDING-RSB-REGISTRATION',
        'not_entered',
        'RSB program for agro-processing technical assistance and product quality certification.'
    ),
    (
        'company_registration',
        'RDB',
        'RDB Company Incorporation Certificate',
        'PENDING-RDB-VERIFICATION',
        'not_entered',
        'Rwanda Development Board official certificate of registration and enterprise TIN.'
    ),
    (
        'standard_certification',
        'RRA',
        'Taxpayer Registration & Fiscal Compliance',
        'PENDING-RRA-TIN',
        'not_entered',
        'Statutory 10-year retention rule applies to books of account and supporting transaction records.'
    )
ON CONFLICT DO NOTHING;
