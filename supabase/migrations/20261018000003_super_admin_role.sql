-- =============================================================================
-- Migration: 20261018000003_super_admin_role.sql
-- Description:
-- 1. Adds 'super_admin' to app_role enum
-- 2. Creates security definer helper public.is_super_admin()
-- 3. Grants super_admin unrestricted platform governance
-- =============================================================================

-- 1. Add super_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 2. Helper function to check if current caller is super_admin (casts to text to avoid Postgres 55P04 within same transaction)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid() AND role::text = 'super_admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Update is_owner to include super_admin
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid() AND role::text IN ('owner', 'super_admin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Super Admin User Role Management Function
CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_profile_id UUID, new_role public.app_role)
RETURNS VOID AS $$
BEGIN
    IF NOT (public.is_super_admin() OR public.is_owner()) THEN
        RAISE EXCEPTION 'Unauthorized: Only Super Administrators or Business Owners can reassign user roles.';
    END IF;

    -- Business owners cannot promote anyone to super_admin or demote a super_admin
    IF new_role::text = 'super_admin' AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only an existing Super Administrator can assign the Super Admin privilege.';
    END IF;

    UPDATE public.profiles
    SET role = new_role, updated_at = timezone('utc', now())
    WHERE id = target_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
