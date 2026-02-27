// ═══════════════════════════════════════════════════════════════════
// usePosts — Post feed hook
//
// When Supabase is connected: fetches from DB, subscribes to realtime.
// Without Supabase: uses DUMMY_POSTS as initial state.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConnected, fetchPosts, createPost } from "../lib/supabase.js";
import { DUMMY_POSTS } from "../data/index.js";

export function usePosts() {
  const [posts, setPosts] = useState(DUMMY_POSTS);
  const [loading, setLoading] = useState(isSupabaseConnected);

  // ── Initial fetch + realtime subscription ────────────────────────
  useEffect(() => {
    if (!isSupabaseConnected) return;

    let channel;

    (async () => {
      setLoading(true);
      const data = await fetchPosts({ limit: 40 });
      if (data) setPosts(normalizeSupabasePosts(data));
      setLoading(false);
    })();

    // Realtime: new posts appear instantly without refresh
    channel = supabase
      .channel("posts-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async (payload) => {
          // Fetch the full post with profile join
          const { data } = await supabase
            .from("posts")
            .select("*, profiles(name, handle, avatar_color, verified, role)")
            .eq("id", payload.new.id)
            .single();
          if (data) setPosts(prev => [normalizePost(data), ...prev]);
        }
      )
      .subscribe();

    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  // ── Create post ──────────────────────────────────────────────────
  const addPost = useCallback(async (user, content, media, pollOptions) => {
    if (!content?.trim() && !media) return;

    const optimistic = {
      id: Date.now(),
      author: user.name, handle: user.handle,
      avatar: user.name[0], avatarColor: user.avatarColor || "#0057FF",
      time: "just now", content: content || "",
      likes: 0, reposts: 0, replies: 0,
      tags: [], verified: user.verified, liked: false, reposted: false,
      trending: false, ghostReplies: [],
      imageUrl: media?.url || null,
      pollOptions: pollOptions || null,
    };

    // Optimistic update — show immediately
    setPosts(prev => [optimistic, ...prev]);

    if (isSupabaseConnected) {
      await createPost({
        author_id: user.id,
        content: content || "",
        image_url: media?.url || null,
        poll_options: pollOptions ? JSON.stringify(pollOptions) : null,
      });
      // Realtime will fire and replace the optimistic row
    }
  }, []);

  // ── Like / Unlike ────────────────────────────────────────────────
  const toggleLike = useCallback(async (postId, userId) => {
    // Optimistic toggle
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
      : p
    ));

    if (!isSupabaseConnected || !userId) return;

    const post = posts.find(p => p.id === postId);
    if (post?.liked) {
      await supabase.from("post_likes").delete().match({ post_id: postId, user_id: userId });
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
    }
  }, [posts]);

  // ── Repost ───────────────────────────────────────────────────────
  const toggleRepost = useCallback((postId) => {
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, reposted: !p.reposted, reposts: p.reposted ? p.reposts - 1 : p.reposts + 1 }
      : p
    ));
  }, []);

  return { posts, loading, addPost, toggleLike, toggleRepost };
}

// ── Normalize Supabase row → component shape ─────────────────────
function normalizePost(row) {
  const profile = row.profiles || {};
  return {
    id:          row.id,
    author:      profile.name || "Unknown",
    handle:      profile.handle || "@unknown",
    avatar:      (profile.name || "U")[0],
    avatarColor: profile.avatar_color || "#0057FF",
    time:        timeAgo(row.created_at),
    content:     row.content || "",
    imageUrl:    row.image_url || null,
    pollOptions: row.poll_options ? JSON.parse(row.poll_options) : null,
    likes:       row.likes || 0,
    reposts:     row.reposts || 0,
    replies:     row.replies || 0,
    tags:        row.tags || [],
    verified:    profile.verified || false,
    liked:       false,
    reposted:    false,
    trending:    row.trending || false,
    ghostReplies: [],
  };
}

function normalizeSupabasePosts(rows) {
  return rows.map(normalizePost);
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
