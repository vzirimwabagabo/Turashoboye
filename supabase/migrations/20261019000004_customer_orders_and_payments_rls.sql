-- =============================================================================
-- Migration: 20261019000004_customer_orders_and_payments_rls.sql
-- Description:
-- 1. Adds RLS policy allowing customers to view payment records belonging to their orders.
-- 2. Provides secure customer self-service order placement RPC (submit_customer_order).
-- 3. Ensures complete farmer data access for order receipts and history.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Payments RLS: Allow customers to view their own payments
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Payments viewable by customer self" ON public.payments;
CREATE POLICY "Payments viewable by customer self"
ON public.payments FOR SELECT
USING (
    public.is_staff()
    OR order_id IN (
        SELECT id FROM public.sales_orders
        WHERE customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    )
);

-- -----------------------------------------------------------------------------
-- 2. Customer Order Placement RPC: submit_customer_order
-- Allows an authenticated farmer/customer to place an order securely.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_customer_order(
    p_variant_id UUID,
    p_quantity NUMERIC,
    p_payment_method TEXT DEFAULT 'cash',
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_auth_uid UUID;
    v_profile RECORD;
    v_customer_id UUID;
    v_default_loc_id UUID;
    v_variant RECORD;
    v_order_id UUID;
    v_order_number TEXT;
    v_total_amount BIGINT;
    v_payment_id UUID;
BEGIN
    v_auth_uid := auth.uid();
    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required to place an order.';
    END IF;

    -- Retrieve caller profile
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE auth_user_id = v_auth_uid AND is_active = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active user profile not found for authenticated user.';
    END IF;

    -- Validate quantity
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Order quantity must be greater than zero.';
    END IF;

    -- Retrieve or create customer record linked to auth_user_id
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE auth_user_id = v_auth_uid
    LIMIT 1;

    IF v_customer_id IS NULL THEN
        INSERT INTO public.customers (
            name,
            phone,
            address,
            auth_user_id,
            recorded_by
        ) VALUES (
            COALESCE(v_profile.display_name, v_profile.full_name, 'Customer'),
            COALESCE(v_profile.phone, '+250 788 000 000'),
            'Kirehe / Mahama District',
            v_auth_uid,
            v_profile.id
        )
        RETURNING id INTO v_customer_id;
    END IF;

    -- Retrieve default inventory location (Mahama Central Depot)
    SELECT id INTO v_default_loc_id
    FROM public.inventory_locations
    WHERE type = 'depot'
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_default_loc_id IS NULL THEN
        SELECT id INTO v_default_loc_id FROM public.inventory_locations LIMIT 1;
    END IF;

    -- Retrieve product variant and price
    SELECT pv.*, p.name AS product_name
    INTO v_variant
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = p_variant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product variant % not found.', p_variant_id;
    END IF;

    v_total_amount := ROUND(p_quantity * v_variant.price_rwf);
    v_order_id := gen_random_uuid();
    v_order_number := 'ORD-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6);

    -- Insert sales order
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
        v_customer_id,
        v_default_loc_id,
        'confirmed',
        CURRENT_DATE,
        v_total_amount,
        0,
        v_total_amount,
        'RWF',
        v_profile.id,
        p_notes
    );

    -- Insert sales order item
    INSERT INTO public.sales_order_items (
        order_id,
        variant_id,
        quantity,
        unit_price_rwf,
        discount_rwf,
        line_total_rwf
    ) VALUES (
        v_order_id,
        p_variant_id,
        p_quantity,
        v_variant.price_rwf,
        0,
        v_total_amount
    );

    -- Insert payment record
    v_payment_id := gen_random_uuid();
    INSERT INTO public.payments (
        id,
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
        v_payment_id,
        v_order_id,
        CASE WHEN p_payment_method IN ('cash', 'momo', 'bank_transfer') THEN p_payment_method::payment_method ELSE 'cash'::payment_method END,
        v_total_amount,
        CURRENT_DATE,
        'Customer Portal Self-Order',
        'confirmed',
        false,
        gen_random_uuid(),
        v_profile.id
    );

    -- Audit Log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        detail
    ) VALUES (
        v_profile.id,
        'CUSTOMER_SELF_ORDER',
        'sales_orders',
        v_order_id,
        jsonb_build_object(
            'order_number', v_order_number,
            'variant_id', p_variant_id,
            'quantity', p_quantity,
            'total_amount_rwf', v_total_amount,
            'customer_id', v_customer_id
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_amount_rwf', v_total_amount,
        'customer_id', v_customer_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.submit_customer_order(UUID, NUMERIC, TEXT, TEXT) TO authenticated;
