// ═══════════════════════════════════════════════════════════════════
// ContractorDashboard — verified contractor analytics & activity
// Only shown to verified_sub, verified_gc, and superadmin roles.
// Demo mode: fully populated with mock data.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { supabase, isSupabaseConnected } from "../lib/supabase.js";

// ─── Mock data ────────────────────────────────────────────────────

const MOCK_STATS = {
  profileViews7d: 38,
  profileViewsDelta: +12,   // change vs prior 7d
  openJobs: 2,
  pendingApplications: 4,
  avgRating: 4.8,
  totalReviews: 17,
};

const MOCK_APPLICATIONS = [
  {
    id: "a1",
    jobTitle: "Framing Foreman — Charlotte",
    applicantName: "Jake Martinez",
    applicantHandle: "@jakemartinez",
    appliedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: "pending",
  },
  {
    id: "a2",
    jobTitle: "Framing Foreman — Charlotte",
    applicantName: "Devon Shaw",
    applicantHandle: "@devshaw",
    appliedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    status: "pending",
  },
  {
    id: "a3",
    jobTitle: "Commercial Framing — Greensboro",
    applicantName: "Tyler Brooks",
    applicantHandle: "@tbrooks",
    appliedAt: new Date(Date.now() - 32 * 3600000).toISOString(),
    status: "reviewed",
  },
  {
    id: "a4",
    jobTitle: "Framing Foreman — Charlotte",
    applicantName: "Marcus Reyes",
    applicantHandle: "@mreyes",
    appliedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: "hired",
  },
];

const MOCK_REVIEWS = [
  {
    id: "r1",
    reviewerName: "Apex Structures",
    rating: 5,
    body: "Absolute pro. Showed up on time every day, crew was tight. Would hire again without question.",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "r2",
    reviewerName: "Meridian Build",
    rating: 5,
    body: "Fastest framing crew in the Carolinas. On budget, zero punch-list items.",
    createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
  },
  {
    id: "r3",
    reviewerName: "Volt Forward Electric",
    rating: 4,
    body: "Great communication throughout the project. Minor delay on week 2 but recovered well.",
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────

const STATUS_STYLES = {
  pending:  { label: "Pending",  bg: "#fff8e1", color: "#b8860b" },
  reviewed: { label: "Reviewed", bg: "#e8f4ff", color: "#1565c0" },
  hired:    { label: "Hired",    bg: "#e8f5e9", color: "#2e7d32" },
  rejected: { label: "Rejected", bg: "#fce4e4", color: "#c62828" },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function Stars({ rating }) {
  return (
    <span style={{ color: "#FFD600", fontSize: 14, letterSpacing: 1 }}>
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────

export default function ContractorDashboard({ user, navigateTo, showToast }) {
  const [stats, setStats] = useState(MOCK_STATS);
  const [applications, setApplications] = useState(MOCK_APPLICATIONS);
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [updatingApp, setUpdatingApp] = useState(null);

  useEffect(() => {
    if (!user || !isSupabaseConnected) return;

    // Fetch real stats / applications / reviews from Supabase
    Promise.all([
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("author_id", user.id)
        .eq("active", true),
      supabase
        .from("applications")
        .select("*, jobs(title)")
        .eq("job_author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("reviews")
        .select("*")
        .eq("subject_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]).then(([jobsRes, appsRes, revsRes]) => {
      if (jobsRes.count != null) setStats((s) => ({ ...s, openJobs: jobsRes.count }));
      if (appsRes.data) setApplications(appsRes.data);
      if (revsRes.data) setReviews(revsRes.data);
    });
  }, [user?.id]);

  async function updateAppStatus(appId, newStatus) {
    setUpdatingApp(appId);
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    if (isSupabaseConnected) {
      await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", appId);
    }
    setUpdatingApp(null);
    showToast("Application status updated ✓");
  }

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const tier = user?.role;
  const isVerified = tier === "verified_sub" || tier === "verified_gc" || tier === "superadmin";
  const isPro = tier === "pro";

  return (
    <div className="page">
      <div className="accent-bar" />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div className="section-label">Contractor</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          Dashboard
        </h2>
        <p style={{ fontSize: 13, color: "#888" }}>
          Welcome back, {user?.name?.split(" ")[0] || "there"}. Here's your activity summary.
        </p>
      </div>

      {/* Stats grid */}
      <div className="dashboard-grid">
        <div className="dashboard-stat">
          <div className="dashboard-stat-label">Profile Views</div>
          <div className="dashboard-stat-val">{stats.profileViews7d}</div>
          <div className="dashboard-stat-sub">
            <span style={{ color: stats.profileViewsDelta >= 0 ? "#2e7d32" : "#c62828" }}>
              {stats.profileViewsDelta >= 0 ? "+" : ""}{stats.profileViewsDelta}
            </span>{" "}vs last 7 days
          </div>
        </div>

        <div className="dashboard-stat">
          <div className="dashboard-stat-label">Open Job Posts</div>
          <div className="dashboard-stat-val">{stats.openJobs}</div>
          <div className="dashboard-stat-sub">
            <button
              style={{ background: "none", border: "none", color: "#FFD600", fontWeight: 700, fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "var(--font-body)" }}
              onClick={() => navigateTo("jobs")}
            >
              View jobs →
            </button>
          </div>
        </div>

        <div className="dashboard-stat">
          <div className="dashboard-stat-label">Pending Applications</div>
          <div className="dashboard-stat-val" style={{ color: pendingCount > 0 ? "#b8860b" : "inherit" }}>
            {pendingCount}
          </div>
          <div className="dashboard-stat-sub">of {applications.length} total</div>
        </div>

        <div className="dashboard-stat">
          <div className="dashboard-stat-label">Avg. Rating</div>
          <div className="dashboard-stat-val">{stats.avgRating}</div>
          <div className="dashboard-stat-sub">
            <Stars rating={Math.round(stats.avgRating)} />{" "}
            <span style={{ fontSize: 11, color: "#aaa" }}>({stats.totalReviews})</span>
          </div>
        </div>
      </div>

      {/* Two-column section */}
      <div className="dashboard-two-col">
        {/* Recent Applications */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">Recent Applications</div>
          {applications.length === 0 ? (
            <div style={{ fontSize: 13, color: "#aaa", padding: "12px 0" }}>No applications yet.</div>
          ) : (
            applications.slice(0, 5).map((app) => {
              const s = STATUS_STYLES[app.status] || STATUS_STYLES.pending;
              return (
                <div key={app.id} style={{ padding: "12px 0", borderBottom: "1px solid #f0efe9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {app.applicantName || app.applicant_name}
                      </div>
                      <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                        {app.jobTitle || app.jobs?.title}
                      </div>
                      <div style={{ fontSize: 11, color: "#bbb" }}>{timeAgo(app.appliedAt || app.created_at)}</div>
                    </div>
                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                        {s.label}
                      </span>
                      {app.status === "pending" && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            style={{ background: "#e8f4ff", color: "#1565c0", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}
                            onClick={() => updateAppStatus(app.id, "reviewed")}
                            disabled={updatingApp === app.id}
                          >
                            Review
                          </button>
                          <button
                            style={{ background: "#e8f5e9", color: "#2e7d32", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}
                            onClick={() => updateAppStatus(app.id, "hired")}
                            disabled={updatingApp === app.id}
                          >
                            Hire
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Recent Reviews */}
        <div className="dashboard-card">
          <div className="dashboard-card-title">Recent Reviews</div>
          {reviews.length === 0 ? (
            <div style={{ fontSize: 13, color: "#aaa", padding: "12px 0" }}>No reviews yet.</div>
          ) : (
            reviews.slice(0, 3).map((rev) => (
              <div key={rev.id} style={{ padding: "12px 0", borderBottom: "1px solid #f0efe9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{rev.reviewerName || rev.reviewer_name}</div>
                  <Stars rating={rev.rating} />
                </div>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5, marginBottom: 4 }}>"{rev.body}"</div>
                <div style={{ fontSize: 11, color: "#bbb" }}>{timeAgo(rev.createdAt || rev.created_at)}</div>
              </div>
            ))
          )}
          {reviews.length > 3 && (
            <div style={{ paddingTop: 10 }}>
              <button
                style={{ background: "none", border: "none", color: "#FFD600", fontWeight: 700, fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "var(--font-body)" }}
                onClick={() => navigateTo("profile")}
              >
                See all {reviews.length} reviews →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Boost / Pro CTA */}
      {!isPro && (
        <div className="dashboard-boost">
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, fontFamily: "var(--font-display)" }}>
              ⭐ Boost Your Profile
            </div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>
              Featured listings appear at the top of the directory with a gold badge.
              Pro members also unlock Intel, exclusive deal flow, and priority support.
            </div>
          </div>
          <button
            className="btn-primary"
            style={{ width: "auto", padding: "10px 20px", flexShrink: 0 }}
            onClick={() => navigateTo("intel")}
          >
            Go Pro — $20/mo
          </button>
        </div>
      )}

      {/* Quick links */}
      <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
        {[
          { label: "Edit Profile", page: "profile" },
          { label: "Messages", page: "messages" },
          { label: "Browse Jobs", page: "jobs" },
          { label: "Settings", page: "settings" },
        ].map(({ label, page }) => (
          <button
            key={page}
            style={{ background: "#f8f7f2", border: "1.5px solid #eee", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#444", fontFamily: "var(--font-body)" }}
            onClick={() => navigateTo(page)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
