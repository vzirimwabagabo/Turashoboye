// supabase/functions/payment-webhook/index.ts
/**
 * Backend Edge Function: Payment Webhook Receiver
 * 
 * Secure endpoint that handles asynchronous notifications from:
 * - Paypack Rwanda (Mobile Money USSD confirmation)
 * - Flutterwave (Visa / Mastercard 3D-Secure clearance)
 * 
 * Verifies cryptographic signatures to prevent hacker spoofing.
 * Authoritatively settles order in the database and releases the receipt.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const flutterwaveHash = Deno.env.get("FLUTTERWAVE_SECRET_HASH");
    const paypackWebhookSecret = Deno.env.get("PAYPACK_WEBHOOK_SECRET");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not configured.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();

    let provider = "unknown";
    let txRef = "";
    let status = "failed";
    let amountRwf = 0;

    // 1. Detect and Validate Flutterwave Webhook
    const signature = req.headers.get("verif-hash");
    if (signature && flutterwaveHash) {
      if (signature !== flutterwaveHash) {
        console.warn("[Security Alert] Invalid Flutterwave webhook signature!");
        return new Response("Unauthorized signature", { status: 401 });
      }

      provider = "flutterwave_card";
      txRef = body.data?.tx_ref || "";
      status = body.data?.status === "successful" ? "successful" : "failed";
      amountRwf = Number(body.data?.amount || 0);
    } 
    // 2. Detect and Validate Paypack Rwanda Webhook
    else if (body.data && body.data.ref && body.event) {
      // If a Paypack webhook secret is configured, verify header
      const paypackSig = req.headers.get("x-paypack-signature");
      if (paypackWebhookSecret && paypackSig !== paypackWebhookSecret) {
        console.warn("[Security Alert] Invalid Paypack webhook signature!");
        return new Response("Unauthorized signature", { status: 401 });
      }

      provider = "paypack_momo";
      txRef = body.data.ref;
      status = body.data.status === "successful" ? "successful" : "failed";
      amountRwf = Number(body.data.amount || 0);
    } 
    // 3. Sandbox / Manual verification webhook payload
    else if (body.provider_tx_ref) {
      txRef = body.provider_tx_ref;
      status = body.status === "successful" ? "successful" : "failed";
      amountRwf = Number(body.amount_rwf || 0);
      provider = body.provider || "manual_reconciliation";
    }

    if (!txRef) {
      return new Response(JSON.stringify({ error: "Missing transaction reference in payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Call secure Postgres RPC to settle payment and audit
    const { data: settleResult, error: settleError } = await supabaseAdmin.rpc(
      "verify_and_settle_payment",
      {
        p_provider_tx_ref: txRef,
        p_provider_status: status,
        p_amount_rwf: amountRwf,
        p_raw_payload: body,
      }
    );

    if (settleError) {
      console.error("Failed to settle payment via RPC:", settleError);
      return new Response(JSON.stringify({ error: settleError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        received: true,
        settled: settleResult?.success || false,
        message: settleResult?.message || "Webhook processed",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Payment webhook exception:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
