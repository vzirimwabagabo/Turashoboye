-- =============================================================================
-- Migration: 20261019000003_superadmin_user_management_and_audit.sql
-- Description:
-- 1. Adds account status (is_active, status, suspension metadata) to public.profiles.
-- 2. Updates security helper functions (is_super_admin, is_owner, is_manager_or_owner, is_staff)
--    to strictly enforce account activation (is_active = TRUE).
-- 3. Provides secure administrative RPCs for user role assignment and account suspension.
-- 4. Records security audit logs for all role and status modifications.
-- 5. Hardens enforce_profile_role_integrity() trigger against client-side status and role tampering.
-- 6. Updates get_my_profile() to return account status.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add Status and Suspension Columns to public.profiles
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'deactivated')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- -----------------------------------------------------------------------------
-- 2. Update Security Helper Functions with Active Status Requirement
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid()
          AND role::text = 'super_admin'
          AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid()
          AND role::text IN ('owner', 'super_admin')
          AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_manager_or_owner()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid()
          AND role::text IN ('manager', 'owner', 'super_admin')
          AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE auth_user_id = auth.uid()
          AND role::text IN ('sales_staff', 'inventory', 'manager', 'owner', 'super_admin')
          AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 3. SuperAdmin & Owner Role Assignment RPC with Full Audit Trail
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
    target_profile_id UUID,
    new_role public.app_role
)
RETURNS VOID AS $$
DECLARE
    v_caller_profile_id UUID;
    v_target RECORD;
    v_super_count INT;
BEGIN
    v_caller_profile_id := public.current_user_profile_id();

    -- Retrieve target record
    SELECT * INTO v_target
    FROM public.profiles
    WHERE id = target_profile_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target user profile % does not exist.', target_profile_id;
    END IF;

    -- Authorization validation
    IF NOT (public.is_super_admin() OR public.is_owner()) THEN
        -- Record security audit event for unauthorized elevation attempt
        INSERT INTO public.audit_logs (
            user_id, action, resource_type, resource_id, detail
        ) VALUES (
            v_caller_profile_id,
            'UNAUTHORIZED_ROLE_CHANGE_ATTEMPT',
            'profiles',
            target_profile_id,
            jsonb_build_object(
                'attempted_role', new_role,
                'target_email', v_target.email,
                'caller_auth_uid', auth.uid()
            )
        );
        RAISE EXCEPTION 'Unauthorized: Only Super Administrators or Business Owners can reassign user roles.';
    END IF;

    -- Strict Super Admin Boundary: Only super_admin can assign or revoke super_admin
    IF (new_role::text = 'super_admin' OR v_target.role::text = 'super_admin') AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only an existing Super Administrator can assign or modify the Super Admin privilege.';
    END IF;

    -- Last Super Administrator Protection
    IF v_target.role::text = 'super_admin' AND new_role::text <> 'super_admin' THEN
        SELECT COUNT(*) INTO v_super_count
        FROM public.profiles
        WHERE role::text = 'super_admin' AND is_active = TRUE;

        IF v_super_count <= 1 THEN
            RAISE EXCEPTION 'Platform Security: Cannot remove or demote the last remaining active Super Administrator.';
        END IF;
    END IF;

    -- Execute role update
    UPDATE public.profiles
    SET role = new_role,
        updated_at = timezone('utc', now())
    WHERE id = target_profile_id;

    -- Record official administrative audit log
    INSERT INTO public.audit_logs (
        user_id, action, resource_type, resource_id, detail
    ) VALUES (
        v_caller_profile_id,
        'USER_ROLE_CHANGE',
        'profiles',
        target_profile_id,
        jsonb_build_object(
            'old_role', v_target.role,
            'new_role', new_role,
            'target_email', v_target.email
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, public.app_role) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. SuperAdmin & Owner User Suspension / Reactivation RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_user_status(
    target_profile_id UUID,
    new_status TEXT,
    reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_caller_profile_id UUID;
    v_target RECORD;
    v_is_active BOOLEAN;
BEGIN
    v_caller_profile_id := public.current_user_profile_id();

    IF new_status NOT IN ('active', 'suspended', 'deactivated') THEN
        RAISE EXCEPTION 'Invalid status "%". Must be one of: active, suspended, deactivated.', new_status;
    END IF;

    -- Retrieve target record
    SELECT * INTO v_target
    FROM public.profiles
    WHERE id = target_profile_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target user profile % does not exist.', target_profile_id;
    END IF;

    -- Prevent self-suspension (Self-lockout defense)
    IF v_target.auth_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Security Policy: You cannot suspend or deactivate your own administrative account.';
    END IF;

    -- Authorization validation
    IF NOT (public.is_super_admin() OR public.is_owner()) THEN
        INSERT INTO public.audit_logs (
            user_id, action, resource_type, resource_id, detail
        ) VALUES (
            v_caller_profile_id,
            'UNAUTHORIZED_STATUS_CHANGE_ATTEMPT',
            'profiles',
            target_profile_id,
            jsonb_build_object(
                'attempted_status', new_status,
                'target_email', v_target.email
            )
        );
        RAISE EXCEPTION 'Unauthorized: Only Super Administrators or Business Owners can suspend or reactivate accounts.';
    END IF;

    -- Business owner cannot suspend super_admin or other owners
    IF NOT public.is_super_admin() AND v_target.role::text IN ('super_admin', 'owner') THEN
        RAISE EXCEPTION 'Unauthorized: Only Super Administrators can alter status for executive accounts.';
    END IF;

    v_is_active := (new_status = 'active');

    UPDATE public.profiles
    SET status = new_status,
        is_active = v_is_active,
        suspended_at = CASE WHEN v_is_active THEN NULL ELSE timezone('utc', now()) END,
        suspended_by = CASE WHEN v_is_active THEN NULL ELSE v_caller_profile_id END,
        suspension_reason = CASE WHEN v_is_active THEN NULL ELSE COALESCE(reason, 'Administrative suspension') END,
        updated_at = timezone('utc', now())
    WHERE id = target_profile_id;

    -- Record audit log
    INSERT INTO public.audit_logs (
        user_id, action, resource_type, resource_id, detail
    ) VALUES (
        v_caller_profile_id,
        CASE WHEN v_is_active THEN 'REACTIVATE_USER' ELSE 'SUSPEND_USER' END,
        'profiles',
        target_profile_id,
        jsonb_build_object(
            'old_status', v_target.status,
            'new_status', new_status,
            'reason', reason,
            'target_email', v_target.email
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'target_id', target_profile_id,
        'status', new_status,
        'is_active', v_is_active
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_set_user_status(UUID, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. Harden Profile Role & Status Integrity Trigger
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

        -- Status must default to active for self-signups
        IF NOT public.is_owner() THEN
            NEW.is_active := TRUE;
            NEW.status := 'active';
            NEW.suspended_at := NULL;
            NEW.suspended_by := NULL;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Status and activation tampering prevention: Only admin can change status or is_active
        IF (NEW.is_active <> OLD.is_active OR NEW.status <> OLD.status) AND NOT (public.is_super_admin() OR public.is_owner()) THEN
            RAISE EXCEPTION 'Privilege escalation rejected: Only administrators can modify account status.';
        END IF;

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

-- -----------------------------------------------------------------------------
-- 6. Update get_my_profile() to return status information
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT id, auth_user_id, email, role, display_name, full_name, phone,
           avatar_url, mfa_enabled, status, is_active, suspended_at,
           suspension_reason, created_at, updated_at
    INTO v_profile
    FROM public.profiles
    WHERE auth_user_id = auth.uid()
    LIMIT 1;

    -- If no profile exists yet for authenticated user, initialize as 'public'
    IF NOT FOUND THEN
        INSERT INTO public.profiles (auth_user_id, email, display_name, full_name, role, status, is_active)
        VALUES (
            auth.uid(),
            (SELECT email FROM auth.users WHERE id = auth.uid()),
            COALESCE((SELECT raw_user_meta_data->>'displayName' FROM auth.users WHERE id = auth.uid()), 'User'),
            COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()), 'User'),
            'public'::public.app_role,
            'active',
            TRUE
        )
        RETURNING id, auth_user_id, email, role, display_name, full_name, phone,
                  avatar_url, mfa_enabled, status, is_active, suspended_at,
                  suspension_reason, created_at, updated_at
        INTO v_profile;
    END IF;

    RETURN to_jsonb(v_profile);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
