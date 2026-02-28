// ═══════════════════════════════════════════════════════════════════
// send-notification — Supabase Edge Function
// Triggered by Supabase Database Webhooks on INSERT to the
// `notifications` table.  Sends a transactional email via Resend
// to the notification recipient so they're alerted even when they
// aren't actively browsing TradeFeed.
//
// Required secrets (set in Supabase dashboard → Edge Functions):
//   RESEND_API_KEY      — from resend.com
//   SITE_URL            — e.g. https://tradefeed.io
//   FROM_EMAIL          — e.g. alerts@tradefeed.io
//
// The webhook payload shape from Supabase matches the Postgres
// record shape, so `record` is a row from the notifications table.
// ═══════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SITE_URL       = Deno.env.get("SITE_URL")       ?? "https://tradefeed.io";
const FROM_EMAIL     = Deno.env.get("FROM_EMAIL")     ?? "alerts@tradefeed.io";
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")   ?? "";
const SUPABASE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Notification type → email subject + action CTA
const TYPE_META: Record<string, { subject: string; cta: string; page: string }> = {
  message:     { subject: "You have a new message on TradeFeed",          cta: "Read Message",      page: "messages"   },
  application: { subject: "New application received for your job post",   cta: "View Applications", page: "dashboard"  },
  lead_match:  { subject: "New lead match — someone viewed your profile", cta: "View Dashboard",    page: "dashboard"  },
  review:      { subject: "You received a new review on TradeFeed",       cta: "See Your Reviews",  page: "profile"    },
  verification:{ subject: "Your TradeFeed verification status changed",   cta: "View Profile",      page: "profile"    },
};

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    const payload = await req.json();
    // Supabase sends { type: "INSERT", table: "notifications", record: {...} }
    const record = payload?.record;
    if (!record) return new Response("no record", { status: 400 });

    // Fetch recipient email from profiles
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: profile, error: profErr } = await sb
      .from("profiles")
      .select("name, email")
      .eq("id", record.user_id)
      .single();

    if (profErr || !profile?.email) {
      return new Response("recipient not found", { status: 200 }); // not fatal
    }

    const meta = TYPE_META[record.type] ?? {
      subject: "New notification on TradeFeed",
      cta: "View TradeFeed",
      page: "",
    };

    const ctaUrl = `${SITE_URL}/?page=${meta.page}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${meta.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f5f4ef;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #e8e7e2;">
    <tr>
      <td style="background:#111;padding:24px 32px;">
        <span style="font-size:22px;font-weight:900;color:white;letter-spacing:-0.5px;">
          Trade<span style="color:#FFD600;">Feed</span>
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 8px;">
          Hi ${profile.name || "there"},
        </p>
        <h2 style="font-size:20px;font-weight:800;color:#111;margin:0 0 16px;">${record.title}</h2>
        <p style="font-size:14px;color:#666;line-height:1.6;margin:0 0 28px;">${record.body}</p>
        <a href="${ctaUrl}"
           style="display:inline-block;background:#FFD600;color:#111;font-size:14px;font-weight:700;
                  padding:12px 28px;border-radius:10px;text-decoration:none;">
          ${meta.cta} →
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 32px;border-top:1px solid #f0efe9;">
        <p style="font-size:11px;color:#bbb;margin:0;">
          You're receiving this because you have notifications enabled on TradeFeed.
          <a href="${SITE_URL}/?page=settings" style="color:#bbb;">Manage preferences</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `TradeFeed Alerts <${FROM_EMAIL}>`,
        to:   [profile.email],
        subject: meta.subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error", res.status, body);
      return new Response("resend error", { status: 500 });
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("send-notification error", err);
    return new Response("internal error", { status: 500 });
  }
});
