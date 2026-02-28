import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_PRICE_ID   = Deno.env.get("STRIPE_PRICE_ID") || "price_pro_monthly_20";
const SITE_URL          = Deno.env.get("SITE_URL") || "https://tradefeed.io";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is an authenticated Supabase user
    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: { user }, error: authError } =
      await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Look up (or create) a Stripe customer for this user
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, role")
      .eq("id", user.id)
      .single();

    // If already pro, return early
    if (profile?.role === "pro") {
      return new Response(
        JSON.stringify({ error: "Already subscribed" }),
        { status: 400, headers: corsHeaders }
      );
    }

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create a new Stripe customer
      const custRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: user.email!,
          "metadata[user_id]": user.id,
        }),
      });
      const cust = await custRes.json();
      customerId = cust.id;

      // Persist customer ID
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Create Stripe Checkout Session (subscription mode)
    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer:                  customerId,
        "line_items[0][price]":    STRIPE_PRICE_ID,
        "line_items[0][quantity]": "1",
        mode:                      "subscription",
        success_url:               `${SITE_URL}?upgrade=success`,
        cancel_url:                `${SITE_URL}?upgrade=cancel`,
        allow_promotion_codes:     "true",
      }),
    });

    const session = await sessionRes.json();

    if (!session.url) {
      console.error("Stripe session error:", session);
      return new Response(
        JSON.stringify({ error: session.error?.message ?? "Stripe error" }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
