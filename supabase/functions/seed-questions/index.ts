// ═══════════════════════════════════════════════════════════════════
// Supabase Edge Function: seed-questions
//
// Runs daily at 6:00 AM via Supabase cron job.
// Can also be triggered manually from Admin dashboard.
//
// Deploy: npx supabase functions deploy seed-questions
//
// Set cron in Supabase dashboard (Database → Extensions → pg_cron):
//   select cron.schedule('seed-questions-daily', '0 6 * * *',
//     $$select net.http_post(
//       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/seed-questions',
//       headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
//     )$$
//   );
// ═══════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REDDIT_SUBREDDITS = "Construction+Homebuilding+DIY";
const FETCH_LIMIT = 20;

serve(async (req) => {
  // Allow OPTIONS for CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── 1. Fetch Reddit hot posts (no auth needed for read-only) ──
    const redditUrl = `https://www.reddit.com/r/${REDDIT_SUBREDDITS}/hot.json?limit=${FETCH_LIMIT}&t=day`;
    const redditRes = await fetch(redditUrl, {
      headers: { "User-Agent": "TradeFeed/1.0 (community platform for contractors)" },
    });

    if (!redditRes.ok) {
      throw new Error(`Reddit API error: ${redditRes.status} ${redditRes.statusText}`);
    }

    const redditData = await redditRes.json();
    const posts = redditData?.data?.children ?? [];

    // ── 2. Score and filter posts ─────────────────────────────────
    // Score = upvotes + (comments × 3)  — comments weighted more as engagement signal
    const questions = posts
      .map((p: any) => ({
        source: `r/${p.data.subreddit}`,
        content: p.data.title,
        engagement_score: (p.data.score || 0) + (p.data.num_comments || 0) * 3,
        used: false,
      }))
      .filter((q: any) => q.content && q.content.length > 20) // skip very short titles
      .sort((a: any, b: any) => b.engagement_score - a.engagement_score)
      .slice(0, FETCH_LIMIT);

    if (questions.length === 0) {
      return Response.json({ ok: true, inserted: 0, message: "No suitable questions found" });
    }

    // ── 3. Insert into seeded_questions ───────────────────────────
    // Mark all old unused ones as used first to keep the queue clean
    await supabase
      .from("seeded_questions")
      .update({ used: true })
      .eq("used", false)
      .lt("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()); // older than 48h

    const { data, error } = await supabase
      .from("seeded_questions")
      .insert(questions)
      .select();

    if (error) throw error;

    return Response.json({
      ok: true,
      inserted: data?.length ?? 0,
      top: questions[0]?.content,
    });

  } catch (err: any) {
    console.error("seed-questions error:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
});
