// supabase/functions/initiate-card-payment/index.ts
/**
 * Backend Edge Function: Initiates secure 3D-Secure Visa / Mastercard card payment.
 * 
 * Powered by Flutterwave East Africa (settles in Rwandan Francs into BK / Equity Bank).
 * Client card details never touch Turashoboye servers (PCI-DSS compliant).
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
    const flutterwaveSecretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not configured.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { order_id, customer_email, customer_name, redirect_url } = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing order_id." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Authoritative Order Lookup from DB
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
    const txRef = `CARD-${order.order_number}-${Date.now()}`;
    const email = customer_email || "customer@turashoboye.rw";
    const name = customer_name || "Valued Farmer";

    // 2. Real Flutterwave East Africa Gateway (if configured)
    if (flutterwaveSecretKey) {
      const flwRes = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${flutterwaveSecretKey}`,
        },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: amountRwf,
          currency: "RWF",
          redirect_url: redirect_url || "https://turashoboye.rw/customer/orders",
          payment_options: "card",
          customer: {
            email,
            name,
          },
          customizations: {
            title: "Turashoboye Feed Mills Ltd",
            description: `Payment for Order ${order.order_number}`,
            logo: "https://turashoboye.rw/logo.png",
          },
        }),
      });

      const flwData = await flwRes.json();

      if (!flwRes.ok || flwData.status !== "success") {
        throw new Error(`Flutterwave initiation failed: ${flwData.message || flwRes.statusText}`);
      }

      const checkoutUrl = flwData.data?.link;

      // Record in payment_transactions table
      await supabaseAdmin.from("payment_transactions").insert({
        order_id: order.id,
        provider: "flutterwave_card",
        provider_tx_ref: txRef,
        provider_status: "pending",
        payment_method: "visa_card",
        amount_rwf: amountRwf,
        customer_email: email,
        customer_name: name,
        checkout_url: checkoutUrl,
        raw_response: flwData,
      });

      return new Response(
        JSON.stringify({
          success: true,
          mode: "live",
          provider: "flutterwave_card",
          transaction_ref: txRef,
          checkout_url: checkoutUrl,
          message: "Secure 3D-Secure Visa/Mastercard checkout initialized.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Graceful Sandbox Simulation
    const sandboxRef = `SANDBOX-CARD-${Date.now()}`;
    await supabaseAdmin.from("payment_transactions").insert({
      order_id: order.id,
      provider: "flutterwave_card",
      provider_tx_ref: sandboxRef,
      provider_status: "pending",
      payment_method: "visa_card",
      amount_rwf: amountRwf,
      customer_email: email,
      customer_name: name,
      raw_response: { mode: "sandbox", note: "Add FLUTTERWAVE_SECRET_KEY to enable live Visa/Mastercard processing." },
    });

    return new Response(
      JSON.stringify({
        success: true,
        mode: "mock_sandbox",
        provider: "flutterwave_card",
        transaction_ref: sandboxRef,
        checkout_url: null,
        message: `[SANDBOX] Simulated Visa/Mastercard payment for ${amountRwf.toLocaleString()} RWF.`,
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
