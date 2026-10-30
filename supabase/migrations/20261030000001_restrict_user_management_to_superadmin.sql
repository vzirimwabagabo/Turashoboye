-- =============================================================================
-- Migration: 20261030000001_restrict_user_management_to_superadmin.sql
-- Description:
-- 1. Strictly restricts user role modification (admin_set_user_role) to super_admin.
-- 2. Strictly restricts user account suspension/reactivation (admin_set_user_status) to super_admin.
-- 3. Hardens enforce_profile_role_integrity() trigger so only super_admin can modify roles or status.
-- 4. Removes user control from the business owner, ensuring owner focuses on business operations.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Restrict admin_set_user_role to Super Administrator Only
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

    -- Authorization validation: Strictly Super Administrator Only
    IF NOT public.is_super_admin() THEN
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
        RAISE EXCEPTION 'Unauthorized: Only Super Administrators can assign or modify user roles.';
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

-- -----------------------------------------------------------------------------
-- 2. Restrict admin_set_user_status to Super Administrator Only
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

    -- Authorization validation: Strictly Super Administrator Only
    IF NOT public.is_super_admin() THEN
        INSERT INTO public.audit_logs (
            user_id, action, resource_type, resource_id, detail
        ) VALUES (
            v_caller_profile_id,
            'UNAUTHORIZED_STATUS_CHANGE_ATTEMPT',
            'profiles',
            target_profile_id,
            jsonb_build_object(
                'attempted_status', new_status,
                'target_email', v_target.email,
                'caller_auth_uid', auth.uid()
            )
        );
        RAISE EXCEPTION 'Unauthorized: Only Super Administrators can suspend or reactivate accounts.';
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

-- -----------------------------------------------------------------------------
-- 3. Harden Profile Role & Status Integrity Trigger
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

        -- If the inserting user is not an authenticated super_admin, force role to 'public'
        IF NOT public.is_super_admin() THEN
            NEW.role := 'public';
        END IF;

        -- Status must default to active for self-signups
        IF NOT public.is_super_admin() THEN
            NEW.is_active := TRUE;
            NEW.status := 'active';
            NEW.suspended_at := NULL;
            NEW.suspended_by := NULL;
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Status and activation tampering prevention: Only Super Administrator can change status or is_active
        IF (NEW.is_active <> OLD.is_active OR NEW.status <> OLD.status) AND NOT public.is_super_admin() THEN
            RAISE EXCEPTION 'Privilege escalation rejected: Only Super Administrators can modify account status.';
        END IF;

        -- Role Integrity: Only Super Administrator can modify roles
        IF NEW.role <> OLD.role AND NOT public.is_super_admin() THEN
            RAISE EXCEPTION 'Privilege escalation rejected: Only Super Administrators can modify account roles.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
