import { useState } from "react";
import { supabase } from "../lib/supabase.js";

// Inline subscribe form — used in NewsletterPage and sidebar
export default function NewsletterSignup({ compact = false, showToast }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    if (supabase) {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .upsert({ email: email.trim(), name: name.trim() || null }, { onConflict: "email" });
      if (error) {
        showToast?.("Already subscribed or invalid email.");
        setLoading(false);
        return;
      }
    }

    setDone(true);
    setLoading(false);
    showToast?.("You're subscribed! ✓ First issue arrives tomorrow morning.");
  }

  if (done) {
    return (
      <div style={{ background: "rgba(0,201,167,0.1)", border: "1.5px solid var(--teal)", borderRadius: 12, padding: compact ? "14px 18px" : "22px 28px", textAlign: "center" }}>
        <div style={{ fontSize: compact ? 20 : 28, marginBottom: 6 }}>✅</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: compact ? 14 : 16, color: "var(--dark)" }}>You're in!</div>
        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>First issue: tomorrow morning.</div>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          className="form-input"
          type="email"
          placeholder="Your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ flex: 1, fontSize: 13, padding: "8px 12px" }}
        />
        <button type="submit" className="btn-primary" disabled={loading} style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}>
          {loading ? "…" : "Subscribe"}
        </button>
      </form>
    );
  }

  return (
    <div style={{ background: "var(--dark)", borderRadius: "var(--radius)", padding: "32px 36px", marginTop: 40, border: "2px solid #222" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="section-label" style={{ color: "var(--yellow)" }}>Daily Intelligence</div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "white", lineHeight: 1.2, marginBottom: 8 }}>
            Get The TradeFeed Brief
          </h3>
          <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
            Market data, contract awards, material prices, and legislative updates — delivered every weekday at 6 AM. 1,200+ contractors already subscribed.
          </p>
          <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
            {["⚡ Free forever", "📬 Weekdays only", "🔕 1-click unsubscribe"].map(f => (
              <span key={f} style={{ fontSize: 11, color: "#555", fontWeight: 600 }}>{f}</span>
            ))}
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 280, flex: 1 }}>
          <input
            className="form-input"
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ background: "#1a1a1a", border: "1.5px solid #333", color: "white" }}
          />
          <input
            className="form-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ background: "#1a1a1a", border: "1.5px solid #333", color: "white" }}
          />
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Subscribing…" : "Subscribe Free →"}
          </button>
          <div style={{ fontSize: 11, color: "#444", textAlign: "center" }}>
            🔒 No spam. Unsubscribe any time.
          </div>
        </form>
      </div>
    </div>
  );
}
