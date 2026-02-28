import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

/**
 * Verify Stripe webhook signature using HMAC-SHA256.
 * Stripe format: "t=<ts>,v1=<hex>,v1=<hex>..."
 */
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  const parts: Record<string, string[]> = {};
  for (const chunk of sigHeader.split(",")) {
    const eq = chunk.indexOf("=");
    const k = chunk.slice(0, eq);
    const v = chunk.slice(eq + 1);
    (parts[k] ??= []).push(v);
  }

  const timestamp = parts["t"]?.[0];
  const signatures = parts["v1"] ?? [];
  if (!timestamp || !signatures.length) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signed = new TextEncoder().encode(`${timestamp}.${payload}`);
  const macBuf = await crypto.subtle.sign("HMAC", key, signed);
  const hex = Array.from(new Uint8Array(macBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signatures.includes(hex);
}

serve(async (req) => {
  const sigHeader = req.headers.get("stripe-signature") ?? "";
  const body = await req.text();

  if (!await verifyStripeSignature(body, sigHeader, STRIPE_WEBHOOK_SECRET)) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object;
      await supabase.rpc("handle_stripe_payment", {
        p_customer_id:     sub.customer,
        p_subscription_id: sub.id,
        p_status:          sub.status,
      });
      console.log(`Subscription ${sub.status} for customer ${sub.customer}`);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await supabase.rpc("handle_stripe_payment", {
        p_customer_id:     sub.customer,
        p_subscription_id: sub.id,
        p_status:          "canceled",
      });
      console.log(`Subscription canceled for customer ${sub.customer}`);
      break;
    }

    case "invoice.payment_failed": {
      const inv = event.data.object;
      // Mark as past_due — role reverts via handle_stripe_payment
      await supabase.rpc("handle_stripe_payment", {
        p_customer_id:     inv.customer,
        p_subscription_id: inv.subscription ?? "",
        p_status:          "past_due",
      });
      break;
    }

    default:
      // Unhandled event type — log and ignore
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(
    JSON.stringify({ received: true }),
    { headers: { "Content-Type": "application/json" } }
  );
});
