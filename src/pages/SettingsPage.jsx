import { useState } from "react";
import { isSupabaseConnected, supabase } from "../lib/supabase.js";

function Toggle({ checked, onChange }) {
  return (
    <label className="settings-toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="settings-toggle-slider" />
    </label>
  );
}

export default function SettingsPage({ user, showToast, navigateTo }) {
  // Account
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  // Password change
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  // Notification prefs (local state — would write to profiles.notif_prefs jsonb in production)
  const [notifPrefs, setNotifPrefs] = useState({
    new_messages:    true,
    new_application: true,
    lead_match:      true,
    weekly_digest:   true,
    marketing:       false,
  });

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState("");

  function togglePref(key) {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    showToast("Preference saved ✓");
  }

  async function handleSaveName() {
    if (!displayName.trim()) return;
    setSaving(true);
    if (isSupabaseConnected) {
      await supabase.from("profiles").update({ name: displayName }).eq("id", user?.id);
    }
    setSaving(false);
    showToast("Name updated ✓");
  }

  async function handleChangePassword() {
    if (pwNew !== pwConfirm) { showToast("Passwords don't match."); return; }
    if (pwNew.length < 8)    { showToast("Password must be at least 8 characters."); return; }
    setPwSaving(true);
    if (isSupabaseConnected) {
      const { error } = await supabase.auth.updateUser({ password: pwNew });
      if (error) { showToast("Error: " + error.message); setPwSaving(false); return; }
    }
    setPwCurrent("");
    setPwNew("");
    setPwConfirm("");
    setPwSaving(false);
    showToast("Password updated ✓");
  }

  async function handleCancelSubscription() {
    showToast("Cancellation request sent. Access continues until end of billing period.");
    // In production: call stripe portal or cancel endpoint
  }

  return (
    <div className="page">
      <div className="accent-bar" />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button
          style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#777", padding: "4px 8px 4px 0" }}
          onClick={() => navigateTo("profile")}
        >
          ←
        </button>
        <div>
          <div className="section-label">Account</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800 }}>Settings</h2>
        </div>
      </div>

      {/* Account section */}
      <div className="settings-section">
        <div className="settings-section-title">👤 Account</div>
        <div className="form-group">
          <label className="form-label">Display Name</label>
          <div style={{ display: "flex", gap: 10 }}>
            <input className="form-input" style={{ flex: 1 }} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            <button className="btn-primary" style={{ width: "auto", padding: "10px 18px" }} onClick={handleSaveName} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" value={user?.email || "korey@tradefeed.io"} readOnly style={{ background: "#f8f7f2", color: "#888" }} />
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Email cannot be changed. Contact support if needed.</div>
        </div>
      </div>

      {/* Change password */}
      <div className="settings-section">
        <div className="settings-section-title">🔑 Change Password</div>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input className="form-input" type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} placeholder="Current password" />
        </div>
        <div className="profile-edit-grid">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} placeholder="Min. 8 characters" />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} placeholder="Repeat new password" />
          </div>
        </div>
        <button className="btn-primary" style={{ width: "auto", padding: "10px 22px" }} onClick={handleChangePassword} disabled={pwSaving}>
          {pwSaving ? "Updating…" : "Update Password"}
        </button>
      </div>

      {/* Notification preferences */}
      <div className="settings-section">
        <div className="settings-section-title">🔔 Notification Preferences</div>
        {[
          { key: "new_messages",    label: "New messages",         desc: "When someone sends you a direct message" },
          { key: "new_application", label: "Job applications",     desc: "When someone applies to one of your job posts" },
          { key: "lead_match",      label: "Lead matches",         desc: "When a new job seeker matches your trade and location" },
          { key: "weekly_digest",   label: "Weekly digest email",  desc: "Summary of top posts, jobs, and intel every Monday" },
          { key: "marketing",       label: "Product updates",      desc: "New features, announcements, and occasional promotions" },
        ].map(({ key, label, desc }) => (
          <div key={key} className="settings-row">
            <div>
              <div className="settings-label">{label}</div>
              <div className="settings-desc">{desc}</div>
            </div>
            <Toggle checked={notifPrefs[key]} onChange={() => togglePref(key)} />
          </div>
        ))}
      </div>

      {/* Subscription */}
      <div className="settings-section">
        <div className="settings-section-title">💳 Subscription</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
          <div>
            <div className="settings-label">
              {user?.role === "pro"
                ? "Pro Member — $20/month"
                : user?.role === "verified_sub" || user?.role === "verified_gc"
                ? "Verified Member — Free"
                : "Free Member"}
            </div>
            <div className="settings-desc">
              {user?.role === "pro"
                ? "Active · Managed via Stripe · Cancel anytime"
                : "Upgrade to Pro for Intel access, exclusive deal flow, and more"}
            </div>
          </div>
          {user?.role === "pro" ? (
            <button
              style={{ background: "none", border: "1.5px solid #ddd", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, color: "#888", cursor: "pointer", fontFamily: "var(--font-body)" }}
              onClick={handleCancelSubscription}
            >
              Cancel Plan
            </button>
          ) : (
            <button className="btn-primary" style={{ width: "auto", padding: "9px 18px", fontSize: 13 }} onClick={() => navigateTo("intel")}>
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="danger-zone">
        <div className="danger-zone-title">⚠ Danger Zone</div>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 14, lineHeight: 1.6 }}>
          Deleting your account is permanent. Your profile, posts, and applications will be removed.
          This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            className="form-input"
            style={{ maxWidth: 240 }}
            placeholder={`Type "${user?.name || "your name"}" to confirm`}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
          <button
            style={{ background: deleteConfirm === user?.name ? "#cc0000" : "#eee", color: deleteConfirm === user?.name ? "white" : "#ccc", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: deleteConfirm === user?.name ? "pointer" : "not-allowed", fontFamily: "var(--font-body)" }}
            disabled={deleteConfirm !== user?.name}
            onClick={() => showToast("Account deletion requested. Support team will follow up.")}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
