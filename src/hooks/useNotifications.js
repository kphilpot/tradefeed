// ═══════════════════════════════════════════════════════════════════
// useNotifications — real-time notification state
//
// Supabase mode: fetches from notifications table + realtime subscription.
// Demo mode: returns mock notifications so the UI is fully functional.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConnected } from "../lib/supabase.js";

const MOCK_NOTIFICATIONS = [
  {
    id: "n1",
    type: "application",
    title: "New application received",
    body: "Jake Martinez applied for Framing Foreman — Charlotte",
    link_page: "dashboard",
    read: false,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "n2",
    type: "lead_match",
    title: "Lead match: Framing sub needed",
    body: "Apex Structures is looking for framers in Charlotte",
    link_page: "jobs",
    read: false,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "n3",
    type: "review",
    title: "New 5-star review",
    body: "Marcus T. left you a 5-star review: \u201cAbsolute pro.\u201d",
    link_page: "profile",
    read: true,
    created_at: new Date(Date.now() - 26 * 3600000).toISOString(),
  },
  {
    id: "n4",
    type: "message",
    title: "New message from Apex Structures",
    body: "Are you available for a Q2 framing project in Charlotte?",
    link_page: "messages",
    read: true,
    created_at: new Date(Date.now() - 50 * 3600000).toISOString(),
  },
  {
    id: "n5",
    type: "verification",
    title: "Verification approved ✓",
    body: "Your TradeFeed contractor verification is now active.",
    link_page: "profile",
    read: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    if (!isSupabaseConnected) {
      // Demo: show mock data only for verified/admin users so it feels realistic
      const isVerified =
        user.role === "verified_sub" ||
        user.role === "verified_gc" ||
        user.role === "superadmin";
      setNotifications(isVerified ? MOCK_NOTIFICATIONS : MOCK_NOTIFICATIONS.slice(3));
      return;
    }

    // Fetch existing notifications
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) setNotifications(data);
      });

    // Subscribe to new notifications in real time
    const channel = supabase
      .channel("notifs:" + user.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  const markRead = useCallback(
    async (id) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      if (isSupabaseConnected) {
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", id);
      }
    },
    []
  );

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (isSupabaseConnected && user) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
    }
  }, [user?.id]);

  return { notifications, unreadCount, markRead, markAllRead };
}
