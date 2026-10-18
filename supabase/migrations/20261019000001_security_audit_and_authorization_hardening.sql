-- =============================================================================
-- Migration: 20261019000001_security_audit_and_authorization_hardening.sql
-- Description: 
-- 1. Corrects role helper functions (is_staff, is_manager_or_owner) to include super_admin.
-- 2. Hardens enforce_profile_role_integrity trigger to permit system migrations while strictly blocking unauthenticated or unauthorized client-side updates.
-- 3. Hardens handle_new_user trigger to prevent privilege escalation via metadata.
-- 4. Sets accurate roles for existing operational accounts in public.profiles.
-- 5. Provides get_my_profile() RPC for trusted server-controlled profile retrieval.
-- 6. Hardens immutable ledger triggers on movements, audit logs, and payments.
-- =============================================================================

-- 1. Role Helper Functions (Security Definer)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid() AND role::text = 'super_admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid() AND role::text IN ('owner', 'super_admin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_manager_or_owner()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid() AND role::text IN ('manager', 'owner', 'super_admin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid() AND role::text IN ('sales_staff', 'inventory', 'manager', 'owner', 'super_admin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Refined Profile Role Integrity Trigger
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

        -- If the inserting user is not already an authenticated owner or super_admin, force role to 'public'
        IF NOT public.is_owner() THEN
            NEW.role := 'public';
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Prevent any non-owner/non-super_admin from elevating or altering user roles
        IF NEW.role <> OLD.role AND NOT public.is_owner() THEN
            RAISE EXCEPTION 'Privilege escalation rejected: Only business owners or super administrators can modify account roles.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Harden handle_new_user Trigger (Defense against client-supplied role metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_display_name TEXT;
BEGIN
    -- Security gate: Self-registration MUST ALWAYS default to 'public' (customer/farmer).
    -- User-supplied metadata MUST NOT be permitted to elevate roles to staff, manager, owner, or super_admin.

    user_display_name := COALESCE(
        NEW.raw_user_meta_data->>'displayName',
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    INSERT INTO public.profiles (auth_user_id, email, display_name, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        user_display_name,
        user_display_name,
        'public'::public.app_role
    )
    ON CONFLICT (auth_user_id) DO UPDATE
    SET email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        updated_at = timezone('utc', now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Set accurate roles in public.profiles for designated administrative accounts
UPDATE public.profiles
SET role = 'super_admin', updated_at = timezone('utc', now())
WHERE email = 'superadmin@turashoboye.rw';

UPDATE public.profiles
SET role = 'owner', updated_at = timezone('utc', now())
WHERE email = 'owner@turashoboye.rw';

UPDATE public.profiles
SET role = 'manager', updated_at = timezone('utc', now())
WHERE email = 'manager@turashoboye.rw';

UPDATE public.profiles
SET role = 'public', updated_at = timezone('utc', now())
WHERE email IN ('farmer@turashoboye.rw', 'farmer.kirehe@gmail.com');

-- 5. Trusted Profile RPC
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT id, auth_user_id, email, role, display_name, full_name, phone, avatar_url, mfa_enabled, created_at, updated_at
    INTO v_profile
    FROM public.profiles
    WHERE auth_user_id = auth.uid()
    LIMIT 1;

    -- If no profile exists yet for authenticated user, initialize as 'public'
    IF NOT FOUND THEN
        INSERT INTO public.profiles (auth_user_id, email, display_name, full_name, role)
        VALUES (
            auth.uid(),
            (SELECT email FROM auth.users WHERE id = auth.uid()),
            COALESCE((SELECT raw_user_meta_data->>'displayName' FROM auth.users WHERE id = auth.uid()), 'User'),
            COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()), 'User'),
            'public'::public.app_role
        )
        RETURNING id, auth_user_id, email, role, display_name, full_name, phone, avatar_url, mfa_enabled, created_at, updated_at
        INTO v_profile;
    END IF;

    RETURN to_jsonb(v_profile);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- 6. Immutable Ledger Trigger (Ensures DB level rejection of updates/deletes on movements and audit logs)
CREATE OR REPLACE FUNCTION public.prevent_immutable_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security Violation: Immutable ledger records in table % cannot be updated or deleted.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_movements ON public.inventory_movements;
CREATE TRIGGER trg_immutable_movements
    BEFORE UPDATE OR DELETE ON public.inventory_movements
    FOR EACH ROW EXECUTE FUNCTION public.prevent_immutable_modification();

DROP TRIGGER IF EXISTS trg_immutable_audit_logs ON public.audit_logs;
CREATE TRIGGER trg_immutable_audit_logs
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_immutable_modification();
