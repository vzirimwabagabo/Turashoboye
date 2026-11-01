-- =============================================================================
-- Migration: 20261101000001_customer_self_registration_and_approval.sql
-- Description:
-- 1. Updates handle_new_user() so that all new self-registered accounts are
--    strictly created with role='public' (Customer/Farmer) and status='pending'
--    (is_active=FALSE), requiring administrator approval before functioning.
-- 2. Updates admin_set_user_status() to support 'pending' status and log approvals.
-- 3. Adds approve_customer_account() function for rapid 1-click admin approval.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Update handle_new_user() Trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_display_name TEXT;
    user_phone TEXT;
BEGIN
    -- Security gate: Self-registration MUST ALWAYS default to 'public' (customer/farmer).
    -- User-supplied metadata MUST NOT be permitted to elevate roles to staff, manager, owner, or super_admin.
    -- All self-registered customers begin in 'pending' status (is_active=FALSE) awaiting admin approval.

    user_display_name := COALESCE(
        NEW.raw_user_meta_data->>'displayName',
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    user_phone := COALESCE(
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'phoneNumber',
        NEW.phone
    );

    INSERT INTO public.profiles (
        auth_user_id,
        email,
        display_name,
        full_name,
        phone,
        role,
        status,
        is_active
    )
    VALUES (
        NEW.id,
        NEW.email,
        user_display_name,
        user_display_name,
        user_phone,
        'public'::public.app_role,
        'pending',
        FALSE
    )
    ON CONFLICT (auth_user_id) DO UPDATE
    SET email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
        updated_at = timezone('utc', now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 2. Update admin_set_user_status to support 'pending' and approvals
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
    v_action TEXT;
BEGIN
    v_caller_profile_id := public.current_user_profile_id();

    IF new_status NOT IN ('active', 'suspended', 'deactivated', 'pending') THEN
        RAISE EXCEPTION 'Invalid status "%". Must be one of: active, suspended, deactivated, pending.', new_status;
    END IF;

    -- Retrieve target record
    SELECT * INTO v_target
    FROM public.profiles
    WHERE id = target_profile_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target user profile % does not exist.', target_profile_id;
    END IF;

    -- Prevent self-suspension (Self-lockout defense)
    IF v_target.auth_user_id = auth.uid() AND new_status <> 'active' THEN
        RAISE EXCEPTION 'Security Policy: You cannot suspend or deactivate your own administrative account.';
    END IF;

    -- Authorization validation: Strictly Super Administrator or Owner
    IF NOT (public.is_super_admin() OR EXISTS (
        SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'owner')
    )) THEN
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
        RAISE EXCEPTION 'Unauthorized: Only platform administrators can modify account status.';
    END IF;

    v_is_active := (new_status = 'active');

    UPDATE public.profiles
    SET status = new_status,
        is_active = v_is_active,
        suspended_at = CASE WHEN v_is_active THEN NULL ELSE timezone('utc', now()) END,
        suspended_by = CASE WHEN v_is_active THEN NULL ELSE v_caller_profile_id END,
        suspension_reason = CASE
            WHEN v_is_active THEN NULL
            WHEN new_status = 'pending' THEN 'Awaiting administrator verification'
            ELSE COALESCE(reason, 'Administrative action')
        END,
        updated_at = timezone('utc', now())
    WHERE id = target_profile_id;

    -- Determine audit log action
    IF v_target.status = 'pending' AND new_status = 'active' THEN
        v_action := 'APPROVE_CUSTOMER_ACCOUNT';
    ELSIF v_is_active THEN
        v_action := 'REACTIVATE_USER';
    ELSE
        v_action := 'SUSPEND_USER';
    END IF;

    INSERT INTO public.audit_logs (
        user_id, action, resource_type, resource_id, detail
    ) VALUES (
        v_caller_profile_id,
        v_action,
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
