import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL     = Deno.env.get("FROM_EMAIL") || "newsletter@tradefeed.io";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate caller is superadmin
    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: { user }, error: authError } =
      await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "superadmin") {
      return new Response(JSON.stringify({ error: "Forbidden — superadmin only" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const { subject, html_body, preview_text } = await req.json();

    if (!subject || !html_body) {
      return new Response(
        JSON.stringify({ error: "subject and html_body are required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch all active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("newsletter_subscribers")
      .select("email, name")
      .eq("active", true);

    if (subError) {
      return new Response(JSON.stringify({ error: subError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    if (!subscribers?.length) {
      return new Response(JSON.stringify({ sent: 0, message: "No active subscribers" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Resend batch endpoint — max 100 per request
    const BATCH_SIZE = 100;
    let sent = 0;

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);

      const emailPayload = {
        from:    `TradeFeed Newsletter <${FROM_EMAIL}>`,
        to:      batch.map((s) => s.email),
        subject,
        html:    html_body,
        ...(preview_text ? { text: preview_text } : {}),
      };

      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      if (res.ok) {
        sent += batch.length;
      } else {
        const err = await res.json();
        console.error("Resend batch error:", err);
      }
    }

    // Record the send in newsletters table
    await supabase.from("newsletters").insert({
      title:      subject,
      date:       new Date().toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      }),
      sent_count: sent,
    });

    return new Response(
      JSON.stringify({ sent, total: subscribers.length }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
