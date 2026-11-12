// supabase/functions/initiate-momo-push/index.ts
/**
 * Backend Edge Function: Initiates real Rwandan Mobile Money (MTN MoMo / Airtel) Cash-In push.
 * 
 * NEVER exposes client secrets or private keys to the browser.
 * Reads authoritative order details from the database to prevent client-side price tampering.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const paypackClientId = Deno.env.get("PAYPACK_CLIENT_ID");
    const paypackClientSecret = Deno.env.get("PAYPACK_CLIENT_SECRET");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not configured.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { order_id, phone_number } = await req.json();

    if (!order_id || !phone_number) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing order_id or phone_number." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Authoritative Order Lookup (Guarantees hacker cannot tamper with price)
    const { data: order, error: orderError } = await supabaseAdmin
      .from("sales_orders")
      .select("id, order_number, total_amount_rwf, status, customer_id")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ success: false, error: "Order not found in database: " + order_id }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amountRwf = Number(order.total_amount_rwf);
    const cleanPhone = phone_number.replace(/\s+/g, "").replace(/^\+/, "");

    // 2. Real Paypack Rwanda Gateway Connection (if configured)
    if (paypackClientId && paypackClientSecret) {
      // Step A: Authenticate with Paypack
      const authRes = await fetch("https://payments.paypack.rw/api/auth/agents/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: paypackClientId,
          client_secret: paypackClientSecret,
        }),
      });

      if (!authRes.ok) {
        throw new Error(`Paypack authorization failed: ${authRes.statusText}`);
      }

      const authData = await authRes.json();
      const accessToken = authData.access_token;

      // Step B: Dispatch Cash-In USSD Push to customer phone
      const pushRes = await fetch("https://payments.paypack.rw/api/transactions/cashin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          amount: amountRwf,
          number: cleanPhone,
        }),
      });

      const pushData = await pushRes.json();

      if (!pushRes.ok) {
        throw new Error(`Paypack cash-in failed: ${JSON.stringify(pushData)}`);
      }

      const txRef = pushData.ref || `PAYPACK-${Date.now()}`;

      // Step C: Record transaction in database
      await supabaseAdmin.from("payment_transactions").insert({
        order_id: order.id,
        provider: "paypack_momo",
        provider_tx_ref: txRef,
        provider_status: "pending",
        payment_method: "momo",
        phone_number: cleanPhone,
        amount_rwf: amountRwf,
        raw_response: pushData,
      });

      return new Response(
        JSON.stringify({
          success: true,
          mode: "live",
          provider: "paypack_momo",
          transaction_ref: txRef,
          message: `USSD push sent to ${cleanPhone}. Please approve prompt on phone.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Graceful Sandbox Simulation (when live merchant credentials are not yet set)
    const sandboxRef = `SANDBOX-MOMO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await supabaseAdmin.from("payment_transactions").insert({
      order_id: order.id,
      provider: "paypack_momo",
      provider_tx_ref: sandboxRef,
      provider_status: "pending",
      payment_method: "momo",
      phone_number: cleanPhone,
      amount_rwf: amountRwf,
      raw_response: { mode: "sandbox", note: "Add PAYPACK_CLIENT_ID & PAYPACK_CLIENT_SECRET to enable live debit." },
    });

    return new Response(
      JSON.stringify({
        success: true,
        mode: "mock_sandbox",
        provider: "paypack_momo",
        transaction_ref: sandboxRef,
        message: `[SANDBOX] Simulated MoMo prompt to ${cleanPhone} for ${amountRwf.toLocaleString()} RWF.`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
