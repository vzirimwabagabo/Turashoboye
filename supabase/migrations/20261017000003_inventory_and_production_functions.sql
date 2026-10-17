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
