import { useState } from "react";

const AVATAR_COLORS = [
  "#FFD600", "#FF6B2B", "#0057FF", "#00C9A7", "#E74C3C",
  "#9B59B6", "#2ECC71", "#F39C12", "#1ABC9C", "#8E44AD",
];

const TIER_INFO = {
  free:         { label: "Free Member",         cls: "tier-free",     icon: "👤" },
  verified_sub: { label: "Verified Subcontractor", cls: "tier-verified", icon: "✓" },
  verified_gc:  { label: "Verified GC",          cls: "tier-verified", icon: "✓" },
  pro:          { label: "Pro Member",           cls: "tier-pro",      icon: "⭐" },
  superadmin:   { label: "Admin",                cls: "tier-admin",    icon: "⚙" },
};

export default function ProfilePage({ user, posts, onUpdateProfile, showToast, navigateTo }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [trade, setTrade] = useState(user?.trade || "");
  const [location, setLocation] = useState(user?.location || "");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || user?.avatar_color || "#0057FF");
  const [saving, setSaving] = useState(false);

  const tier = TIER_INFO[user?.role] || TIER_INFO.free;
  const initial = (user?.name || "U")[0].toUpperCase();

  // Filter posts by this user
  const myPosts = posts.filter(
    (p) => p.author === user?.name || p.authorId === user?.id
  ).slice(0, 5);

  async function handleSave() {
    setSaving(true);
    const { error } = await onUpdateProfile({ name, bio, trade, location, avatar_color: avatarColor, avatarColor });
    setSaving(false);
    if (error) {
      showToast("Save failed: " + error.message);
    } else {
      setEditing(false);
      showToast("Profile updated! ✓");
    }
  }

  function handleCancel() {
    setName(user?.name || "");
    setBio(user?.bio || "");
    setTrade(user?.trade || "");
    setLocation(user?.location || "");
    setAvatarColor(user?.avatarColor || user?.avatar_color || "#0057FF");
    setEditing(false);
  }

  return (
    <div className="page">
      {/* Profile Header */}
      <div className="profile-page-header">
        <div className="profile-page-avatar" style={{ background: editing ? avatarColor : (user?.avatarColor || user?.avatar_color || "#0057FF") }}>
          {initial}
        </div>
        <div className="profile-page-info">
          <div className="profile-page-name">
            {user?.name}
            {user?.verified && <span style={{ color: "var(--verified)", fontSize: 16 }}>✓</span>}
            <span className={`profile-tier-badge ${tier.cls}`}>{tier.icon} {tier.label}</span>
          </div>
          <div className="profile-page-handle">{user?.handle || "@" + (user?.name || "user").toLowerCase().replace(/\s+/g, "")}</div>
          {(user?.trade || user?.location) && (
            <div className="profile-page-trade">
              {[user?.trade, user?.location].filter(Boolean).join(" · ")}
            </div>
          )}
          {user?.bio && (
            <div style={{ fontSize: 13, color: "#aaa", marginTop: 8, lineHeight: 1.6, maxWidth: 480 }}>{user.bio}</div>
          )}
        </div>
        <button
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid #333", borderRadius: 8, color: "#aaa", fontSize: 12, fontWeight: 600, padding: "7px 14px", cursor: "pointer", fontFamily: "var(--font-body)", flexShrink: 0 }}
          onClick={() => setEditing(!editing)}
        >
          {editing ? "Cancel" : "✏ Edit Profile"}
        </button>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="profile-edit-form">
          <div className="profile-edit-title">✏ Edit Your Profile</div>
          <div className="profile-edit-grid">
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Trade / Specialty</label>
              <input className="form-input" value={trade} onChange={(e) => setTrade(e.target.value)} placeholder="e.g. Framing, Electrical, Plumbing" />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Charlotte, NC" />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 4 }}>
            <label className="form-label">Bio</label>
            <textarea
              className="form-input"
              style={{ minHeight: 72, resize: "vertical" }}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short description about your work and experience..."
            />
          </div>
          <div className="form-group" style={{ marginTop: 4 }}>
            <label className="form-label">Avatar Color</label>
            <div className="color-picker-row">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  className={`color-swatch ${avatarColor === c ? "selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => setAvatarColor(c)}
                  aria-label={`Pick color ${c}`}
                />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button className="btn-primary" style={{ width: "auto", padding: "10px 24px" }} onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button className="btn-secondary" style={{ width: "auto", padding: "10px 20px" }} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Subscription Status */}
      <div className="profile-subscription-card">
        <div>
          <div className="profile-subscription-label">Current Plan</div>
          <div className="profile-subscription-name">
            {tier.icon} {tier.label}
          </div>
          {user?.role === "pro" && (
            <div style={{ fontSize: 12, color: "var(--teal)", marginTop: 4 }}>Active · Renews monthly via Stripe</div>
          )}
          {(user?.role === "verified_sub" || user?.role === "verified_gc") && (
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Upgrade to Pro for $20/mo to unlock Intel access</div>
          )}
          {user?.role === "free" && (
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Apply for verification (free) to post, hire, and access the forum</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {user?.role !== "pro" && user?.role !== "superadmin" && (
            <button className="btn-primary" style={{ width: "auto", padding: "9px 18px", fontSize: 13 }} onClick={() => navigateTo("intel")}>
              {user?.role === "free" ? "Get Verified →" : "Upgrade to Pro →"}
            </button>
          )}
          <button className="btn-secondary" style={{ width: "auto", padding: "8px 16px", fontSize: 13 }} onClick={() => navigateTo("settings")}>
            Settings
          </button>
        </div>
      </div>

      {/* Your Posts */}
      <div style={{ marginBottom: 28 }}>
        <div className="profile-section-title">Your Posts ({myPosts.length})</div>
        {myPosts.length === 0 ? (
          <div style={{ color: "#aaa", fontSize: 13, padding: "20px 0" }}>No posts yet. Share something with the community from the Feed.</div>
        ) : (
          myPosts.map((p) => (
            <div key={p.id} className="profile-post-mini">
              <div className="profile-post-content">{p.content}</div>
              <div className="profile-post-meta">
                <span>🤍 {p.likes}</span>
                <span>💬 {p.replies}</span>
                <span>↗️ {p.reposts}</span>
                <span style={{ marginLeft: "auto" }}>{p.time}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Links */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn-secondary" style={{ width: "auto", padding: "9px 18px", fontSize: 13 }} onClick={() => navigateTo("messages")}>
          💬 Messages
        </button>
        {(user?.role === "verified_sub" || user?.role === "verified_gc" || user?.role === "superadmin") && (
          <button className="btn-secondary" style={{ width: "auto", padding: "9px 18px", fontSize: 13 }} onClick={() => navigateTo("dashboard")}>
            📊 My Dashboard
          </button>
        )}
        <button
          style={{ background: "none", border: "1.5px solid var(--border)", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer", fontFamily: "var(--font-body)" }}
          onClick={() => navigateTo("settings")}
        >
          ⚙ Account Settings
        </button>
      </div>
    </div>
  );
}
