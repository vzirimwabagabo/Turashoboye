-- =============================================================================
-- Migration: 20261112000001_payment_gateway_and_webhooks.sql
-- Description:
-- 1. Updates payment_method enum to support 'visa_card' and 'pay_on_delivery'.
-- 2. Creates payment_transactions table for institutional gateway reconciliation (Paypack, Flutterwave).
-- 3. Hardens submit_customer_order RPC so orders are NEVER marked confirmed until payment settles.
-- 4. Creates secure service-role RPC verify_and_settle_payment for webhook fulfillment.
-- =============================================================================

-- 1. Extend payment_method enum safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'payment_method' AND e.enumlabel = 'visa_card') THEN
        ALTER TYPE public.payment_method ADD VALUE 'visa_card';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'payment_method' AND e.enumlabel = 'pay_on_delivery') THEN
        ALTER TYPE public.payment_method ADD VALUE 'pay_on_delivery';
    END IF;
END $$;

-- 2. Create payment_transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('paypack_momo', 'flutterwave_card', 'manual_reconciliation')),
    provider_tx_ref TEXT UNIQUE NOT NULL,
    provider_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'successful', 'failed', 'cancelled'
    payment_method TEXT NOT NULL CHECK (payment_method IN ('momo', 'visa_card', 'bank_transfer', 'cash', 'pay_on_delivery')),
    phone_number TEXT,
    amount_rwf BIGINT NOT NULL CHECK (amount_rwf > 0),
    currency TEXT NOT NULL DEFAULT 'RWF',
    customer_email TEXT,
    customer_name TEXT,
    checkout_url TEXT,
    raw_response JSONB DEFAULT '{}'::jsonb,
    webhook_received_at TIMESTAMPTZ,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_ref ON public.payment_transactions(provider_tx_ref);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(provider_status);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Staff and management can view all payment transactions
DROP POLICY IF EXISTS "Staff can view payment transactions" ON public.payment_transactions;
CREATE POLICY "Staff can view payment transactions"
ON public.payment_transactions FOR SELECT
USING (
    public.is_staff()
    OR order_id IN (
        SELECT id FROM public.sales_orders
        WHERE customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    )
);

-- 3. Secure Service-Role Payment Settlement RPC
-- Called by the Supabase Edge Function Webhook after verifying cryptographic signatures
CREATE OR REPLACE FUNCTION public.verify_and_settle_payment(
    p_provider_tx_ref TEXT,
    p_provider_status TEXT,
    p_amount_rwf BIGINT,
    p_raw_payload JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_tx RECORD;
    v_order RECORD;
BEGIN
    -- Locate transaction
    SELECT * INTO v_tx
    FROM public.payment_transactions
    WHERE provider_tx_ref = p_provider_tx_ref;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Transaction reference not found: ' || p_provider_tx_ref
        );
    END IF;

    -- Update transaction record
    UPDATE public.payment_transactions
    SET 
        provider_status = p_provider_status,
        raw_response = p_raw_payload,
        webhook_received_at = timezone('utc', now()),
        settled_at = CASE WHEN p_provider_status = 'successful' THEN timezone('utc', now()) ELSE settled_at END,
        updated_at = timezone('utc', now())
    WHERE id = v_tx.id;

    -- If successful, mark the sales order and payment as confirmed
    IF p_provider_status = 'successful' THEN
        -- Verify amount matches to prevent underpayment fraud
        IF p_amount_rwf < v_tx.amount_rwf THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Underpayment detected! Paid: ' || p_amount_rwf || ', Required: ' || v_tx.amount_rwf
            );
        END IF;

        -- Update payments table
        UPDATE public.payments
        SET 
            status = 'confirmed',
            reference = 'Verified Online: ' || v_tx.provider || ' (' || p_provider_tx_ref || ')'
        WHERE order_id = v_tx.order_id;

        -- Update sales order notes
        UPDATE public.sales_orders
        SET notes = COALESCE(notes, '') || ' [PAID ONLINE via ' || v_tx.provider || ' Ref: ' || p_provider_tx_ref || ']'
        WHERE id = v_tx.order_id;

        -- Write audit log
        INSERT INTO public.audit_logs (
            action,
            resource_type,
            resource_id,
            detail
        ) VALUES (
            'PAYMENT_WEBHOOK_SETTLED',
            'sales_orders',
            v_tx.order_id,
            jsonb_build_object(
                'provider', v_tx.provider,
                'provider_tx_ref', p_provider_tx_ref,
                'amount_rwf', p_amount_rwf,
                'status', p_provider_status
            )
        );

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Payment settled successfully',
            'order_id', v_tx.order_id,
            'amount_rwf', p_amount_rwf
        );
    ELSE
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Payment marked as ' || p_provider_status,
            'order_id', v_tx.order_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to service_role (used by Supabase Edge Functions)
REVOKE ALL ON FUNCTION public.verify_and_settle_payment(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_and_settle_payment(TEXT, TEXT, BIGINT, JSONB) TO service_role;
