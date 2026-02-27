// ═══════════════════════════════════════════════════════════════════
// Supabase Edge Function: ghost-reply
//
// Runs daily at 7:00 AM via Supabase cron (after seed-questions at 6AM).
// Can also be triggered manually from Admin dashboard.
//
// What it does:
//   1. Fetches the 10 most-engaged posts from today
//   2. Fetches all 10 active ghost accounts
//   3. For each ghost, picks 5 posts and generates a reply via Anthropic
//   4. Uses the Anthropic Messages Batch API — 1 API call for all 50 replies
//   5. Polls for batch completion, then inserts all replies as posts
//
// Cost: ~$0.003/day at claude-haiku-4-5-20251001 pricing
// Deploy: npx supabase functions deploy ghost-reply
//
// Required secrets (set via: npx supabase secrets set KEY=value):
//   ANTHROPIC_API_KEY
//   SUPABASE_URL (auto-set by Supabase)
//   SUPABASE_SERVICE_ROLE_KEY (auto-set by Supabase)
// ═══════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const ANTHROPIC_BATCH_URL = "https://api.anthropic.com/v1/messages/batches";
const MODEL = "claude-haiku-4-5-20251001";
const REPLIES_PER_GHOST = 5;
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 60; // 5 min max wait

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── 1. Fetch today's top posts ────────────────────────────────
    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, content, author_id")
      .gte("created_at", since.toISOString())
      .eq("is_ghost", false)
      .order("likes", { ascending: false })
      .limit(10);

    if (postsError) throw postsError;
    if (!posts || posts.length === 0) {
      return Response.json({ ok: true, message: "No posts to reply to today" });
    }

    // ── 2. Fetch active ghost accounts ────────────────────────────
    const { data: ghosts, error: ghostsError } = await supabase
      .from("ghost_accounts")
      .select("*")
      .eq("is_active", true);

    if (ghostsError) throw ghostsError;
    if (!ghosts || ghosts.length === 0) {
      return Response.json({ ok: true, message: "No active ghost accounts" });
    }

    // ── 3. Build batch requests (10 ghosts × 5 posts = 50 max) ───
    const batchRequests: any[] = [];
    const replyMap: Record<string, { ghostId: string; postId: string }> = {};

    for (const ghost of ghosts) {
      // Each ghost picks a random sample of posts to reply to
      const shuffled = [...posts].sort(() => Math.random() - 0.5);
      const targets = shuffled.slice(0, REPLIES_PER_GHOST);

      for (const post of targets) {
        // Skip if ghost is the author (shouldn't happen but safeguard)
        if (post.author_id === ghost.id) continue;

        const requestId = `${ghost.id}_${post.id}`;
        replyMap[requestId] = { ghostId: ghost.id, postId: post.id };

        batchRequests.push({
          custom_id: requestId,
          params: {
            model: MODEL,
            max_tokens: 120,
            messages: [{
              role: "user",
              content: `You are ${ghost.name}, a ${ghost.trade} contractor in North Carolina. You are part of a professional contractor community called TradeFeed. Reply to this post in 1-2 short sentences, naturally and professionally. Stay in character. Do not start with "I". Do not use emojis. Keep it under 100 words.\n\nPost: "${post.content}"\n\nYour reply:`,
            }],
          },
        });
      }
    }

    if (batchRequests.length === 0) {
      return Response.json({ ok: true, message: "No batch requests to send" });
    }

    // ── 4. Submit Anthropic Messages Batch ────────────────────────
    const batchRes = await fetch(ANTHROPIC_BATCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "message-batches-2024-09-24",
      },
      body: JSON.stringify({ requests: batchRequests }),
    });

    if (!batchRes.ok) {
      const err = await batchRes.text();
      throw new Error(`Anthropic batch error: ${batchRes.status} ${err}`);
    }

    const batch = await batchRes.json();
    const batchId = batch.id;

    // ── 5. Poll for completion ────────────────────────────────────
    let completed = false;
    let results: any[] = [];

    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

      const statusRes = await fetch(`${ANTHROPIC_BATCH_URL}/${batchId}`, {
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "message-batches-2024-09-24",
        },
      });

      const status = await statusRes.json();

      if (status.processing_status === "ended") {
        // Fetch results
        const resultsRes = await fetch(`${ANTHROPIC_BATCH_URL}/${batchId}/results`, {
          headers: {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "anthropic-beta": "message-batches-2024-09-24",
          },
        });

        const resultsText = await resultsRes.text();
        // Results are JSONL (one JSON object per line)
        results = resultsText
          .split("\n")
          .filter(Boolean)
          .map(line => JSON.parse(line));

        completed = true;
        break;
      }
    }

    if (!completed) {
      return Response.json({ ok: false, error: "Batch timed out after 5 minutes", batchId });
    }

    // ── 6. Insert reply posts + update ghost last_posted_at ───────
    const replyPosts: any[] = [];
    const updatedGhostIds = new Set<string>();

    for (const result of results) {
      if (result.result?.type !== "succeeded") continue;
      const replyContent = result.result.message?.content?.[0]?.text?.trim();
      if (!replyContent) continue;

      const { ghostId, postId } = replyMap[result.custom_id] ?? {};
      if (!ghostId || !postId) continue;

      const ghost = ghosts.find(g => g.id === ghostId);
      if (!ghost) continue;

      replyPosts.push({
        author_id: null, // ghost posts don't have a profiles row
        content: replyContent,
        tags: [],
        is_ghost: true,
        // Store reply parent info in a custom field if needed
      });

      updatedGhostIds.add(ghostId);
    }

    // Insert all reply posts
    if (replyPosts.length > 0) {
      const { error: insertError } = await supabase.from("posts").insert(replyPosts);
      if (insertError) console.error("Insert error:", insertError);
    }

    // Update ghost last_posted_at for all active ghosts that replied
    if (updatedGhostIds.size > 0) {
      await supabase
        .from("ghost_accounts")
        .update({ last_posted_at: new Date().toISOString() })
        .in("id", [...updatedGhostIds]);
    }

    return Response.json({
      ok: true,
      batchId,
      requestsSent: batchRequests.length,
      repliesInserted: replyPosts.length,
      ghostsUpdated: updatedGhostIds.size,
    });

  } catch (err: any) {
    console.error("ghost-reply error:", err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
});
