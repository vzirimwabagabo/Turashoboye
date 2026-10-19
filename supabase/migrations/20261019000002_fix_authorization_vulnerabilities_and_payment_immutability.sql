-- =============================================================================
-- Migration: 20261019000002_fix_authorization_vulnerabilities_and_payment_immutability.sql
-- Description:
-- 1. Drops legacy/backdoor set_user_role function that allowed Owner -> Super Admin escalation.
-- 2. Hardens enforce_profile_role_integrity() trigger so ONLY Super Admins can assign or alter super_admin role.
-- 3. Resets owner@turashoboye.rw to 'owner'.
-- 4. Replaces insecure "FOR ALL" customers policy with explicit SELECT, INSERT, UPDATE, DELETE policies with WITH CHECK.
-- 5. Implements immutable financial ledger trigger on public.payments preventing alteration of confirmed payment amounts.
-- 6. Ensures super_admin is recognized across all operational policies.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Eliminate Legacy / Backdoor set_user_role Function
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.set_user_role(UUID, public.app_role);
DROP FUNCTION IF EXISTS public.set_user_role(UUID, text);

-- -----------------------------------------------------------------------------
-- 2. Harden Role Integrity Trigger Against Owner -> Super Admin Escalation
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_profile_role_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_has_owner BOOLEAN;
BEGIN
    -- If executed by database administrator / migration script outside an HTTP auth session
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        -- Check if any owner exists in the database
        SELECT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'owner') INTO v_has_owner;

        -- If no owner exists yet, allow the very first profile to be initialized as owner
        IF NOT v_has_owner AND NEW.role = 'owner' THEN
            RETURN NEW;
        END IF;

        -- Prevent assigning super_admin unless current user is an authenticated super_admin
        IF NEW.role = 'super_admin' AND NOT public.is_super_admin() THEN
            RAISE EXCEPTION 'Privilege escalation rejected: Only an existing Super Administrator can create a Super Admin profile.';
        END IF;

        -- If the inserting user is not already an authenticated owner or super_admin, force role to 'public'
        IF NOT public.is_owner() THEN
            NEW.role := 'public';
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Strict Super Admin Boundary: An owner CANNOT elevate anyone to super_admin or demote a super_admin
        IF (NEW.role = 'super_admin' OR OLD.role = 'super_admin') AND NOT public.is_super_admin() THEN
            RAISE EXCEPTION 'Privilege escalation rejected: Only Super Administrators can assign or modify the Super Admin privilege.';
        END IF;

        -- General Role Integrity: Only business owners or super admins can modify roles
        IF NEW.role <> OLD.role AND NOT public.is_owner() THEN
            RAISE EXCEPTION 'Privilege escalation rejected: Only business owners or super administrators can modify account roles.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset owner@turashoboye.rw to authentic owner role
UPDATE public.profiles
SET role = 'owner', updated_at = timezone('utc', now())
WHERE email = 'owner@turashoboye.rw';

-- -----------------------------------------------------------------------------
-- 3. Harden Customers Table RLS (Prevent IDOR, BOLA, and Arbitrary Delete)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers manageable by staff or self" ON public.customers;
DROP POLICY IF EXISTS "Customers viewable by staff or self" ON public.customers;
DROP POLICY IF EXISTS "Customers viewable by staff" ON public.customers;
DROP POLICY IF EXISTS "Customers manageable by sales staff and management" ON public.customers;

-- SELECT: Staff can view all; individual customers can only view their own linked record
CREATE POLICY "Customers viewable by staff or self"
ON public.customers FOR SELECT
USING (
    public.is_staff() OR auth_user_id = auth.uid()
);

-- INSERT: Staff can insert; customer can only insert a record linked to their own auth.uid()
CREATE POLICY "Customers insertable by staff or self"
ON public.customers FOR INSERT
WITH CHECK (
    public.is_staff() OR (auth_user_id IS NOT NULL AND auth_user_id = auth.uid())
);

-- UPDATE: Staff can update; customer can only update their own record and cannot reassign auth_user_id
CREATE POLICY "Customers updatable by staff or self"
ON public.customers FOR UPDATE
USING (
    public.is_staff() OR auth_user_id = auth.uid()
)
WITH CHECK (
    public.is_staff() OR (auth_user_id IS NOT NULL AND auth_user_id = auth.uid())
);

-- DELETE: Strictly restricted to business owner / super_admin
CREATE POLICY "Customers deletable by owner only"
ON public.customers FOR DELETE
USING (
    public.is_owner()
);

-- -----------------------------------------------------------------------------
-- 4. Financial Payment Ledger Immutability & Anti-Tampering Trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_payment_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Security Violation: Payment records are immutable financial transactions and cannot be deleted.';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- Only management (manager, owner, super_admin) can update payments
        IF NOT public.is_manager_or_owner() THEN
            RAISE EXCEPTION 'Unauthorized: Only management can update payment records.';
        END IF;

        -- Once confirmed, financial parameters are permanent
        IF OLD.status = 'confirmed' THEN
            IF NEW.amount_rwf <> OLD.amount_rwf THEN
                RAISE EXCEPTION 'Security Violation: Cannot alter the financial amount of a confirmed payment record.';
            END IF;

            IF NEW.order_id <> OLD.order_id THEN
                RAISE EXCEPTION 'Security Violation: Cannot reassign the sales order of a confirmed payment record.';
            END IF;

            IF NEW.method <> OLD.method THEN
                RAISE EXCEPTION 'Security Violation: Cannot alter the payment method of a confirmed payment record.';
            END IF;

            IF NEW.idempotency_key <> OLD.idempotency_key THEN
                RAISE EXCEPTION 'Security Violation: Cannot alter the idempotency key of a confirmed payment record.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_payment_immutability ON public.payments;
CREATE TRIGGER trg_enforce_payment_immutability
BEFORE UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.enforce_payment_immutability();

-- Harden payments UPDATE RLS policy with explicit WITH CHECK
DROP POLICY IF EXISTS "Payments updatable only by management" ON public.payments;
CREATE POLICY "Payments updatable only by management"
ON public.payments FOR UPDATE
USING (public.is_manager_or_owner())
WITH CHECK (public.is_manager_or_owner());

-- -----------------------------------------------------------------------------
-- 5. Harden Production Batches Output Immutability
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_production_batch_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Security Violation: Production batch records cannot be deleted.';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- If already completed, lock down actual yield and recipe links
        IF OLD.status = 'completed' THEN
            IF NEW.actual_output_qty <> OLD.actual_output_qty THEN
                RAISE EXCEPTION 'Security Violation: Completed production batch output quantity is sealed and cannot be modified.';
            END IF;

            IF NEW.product_variant_id <> OLD.product_variant_id THEN
                RAISE EXCEPTION 'Security Violation: Completed production batch product variant cannot be modified.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_production_batch_immutability ON public.production_batches;
CREATE TRIGGER trg_enforce_production_batch_immutability
BEFORE UPDATE OR DELETE ON public.production_batches
FOR EACH ROW EXECUTE FUNCTION public.enforce_production_batch_immutability();
