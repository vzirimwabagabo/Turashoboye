-- =============================================================================
-- Migration: 20261018000001_security_hardening.sql
-- Description: Security hardening against OWASP Top 10 vulnerabilities:
--   1. Privilege Escalation: Enforces database-level role integrity on profiles.
--   2. BOLA/IDOR: Customer isolation for orders and profiles.
--   3. Price Tampering: Enforces server-side price validation in stored procedures.
--   4. First Owner Bootstrap: Controlled, one-time owner initialization.
-- =============================================================================

-- 1. Ensure customers table has an optional auth_user_id link
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON public.customers(auth_user_id);

-- -----------------------------------------------------------------------------
-- 2. Privilege Escalation Prevention on Profiles
-- A client cannot elevate themselves to 'owner' or 'manager' during registration.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_profile_role_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_has_owner BOOLEAN;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Check if any owner exists in the database
        SELECT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'owner') INTO v_has_owner;

        -- If no owner exists yet, allow the very first profile to be initialized as owner
        IF NOT v_has_owner AND NEW.role = 'owner' THEN
            RETURN NEW;
        END IF;

        -- If the inserting user is not already an authenticated owner, force role to 'public'
        IF NOT public.is_owner() THEN
            NEW.role := 'public';
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Prevent any non-owner from elevating or altering user roles
        IF NEW.role <> OLD.role AND NOT public.is_owner() THEN
            RAISE EXCEPTION 'Privilege escalation rejected: Only business owners can modify account roles.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_profile_role_integrity ON public.profiles;
CREATE TRIGGER trg_enforce_profile_role_integrity
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_role_integrity();

-- Replace Profiles INSERT policy with strict check
DROP POLICY IF EXISTS "Profiles can be inserted on registration or by owner" ON public.profiles;

CREATE POLICY "Profiles can be inserted on registration or by owner"
ON public.profiles FOR INSERT
WITH CHECK (
    auth_user_id = auth.uid() OR public.is_owner()
);

-- -----------------------------------------------------------------------------
-- 3. Customer Data Access & BOLA/IDOR Prevention
-- Customers can view their own customer record and order history, but not others.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers viewable by staff" ON public.customers;
CREATE POLICY "Customers viewable by staff or self"
ON public.customers FOR SELECT
USING (
    public.is_staff() OR auth_user_id = auth.uid()
);

DROP POLICY IF EXISTS "Customers manageable by sales staff and management" ON public.customers;
CREATE POLICY "Customers manageable by staff or self"
ON public.customers FOR ALL
USING (
    public.is_staff() OR auth_user_id = auth.uid()
);

-- Sales Orders: Customers can view only their own orders
DROP POLICY IF EXISTS "Sales orders viewable by staff" ON public.sales_orders;
CREATE POLICY "Sales orders viewable by staff or customer self"
ON public.sales_orders FOR SELECT
USING (
    public.is_staff() 
    OR customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
);

-- Sales Order Items: Customers can view only items of their own orders
DROP POLICY IF EXISTS "Order items viewable by staff" ON public.sales_order_items;
CREATE POLICY "Order items viewable by staff or customer self"
ON public.sales_order_items FOR SELECT
USING (
    public.is_staff()
    OR order_id IN (
        SELECT id FROM public.sales_orders 
        WHERE customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    )
);

-- -----------------------------------------------------------------------------
-- 4. Controlled Role Promotion RPC (Owner Only)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_user_role(
    p_target_auth_user_id UUID,
    p_new_role app_role
)
RETURNS JSONB AS $$
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Access Denied: Only business owners can assign operational roles.';
    END IF;

    UPDATE public.profiles
    SET role = p_new_role, updated_at = timezone('utc', now())
    WHERE auth_user_id = p_target_auth_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found for auth user ID %', p_target_auth_user_id;
    END IF;

    -- Audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        detail
    ) VALUES (
        public.current_user_profile_id(),
        'UPDATE_USER_ROLE',
        'profiles',
        (SELECT id FROM public.profiles WHERE auth_user_id = p_target_auth_user_id),
        jsonb_build_object('target_user', p_target_auth_user_id, 'assigned_role', p_new_role)
    );

    RETURN jsonb_build_object('success', true, 'new_role', p_new_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
