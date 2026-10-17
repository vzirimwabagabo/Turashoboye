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
