// ═══════════════════════════════════════════════════════════════════
// LandingHero — full marketing hero shown to logged-out visitors
// Replaces the minimal hero-strip on HomePage when user === null.
// ═══════════════════════════════════════════════════════════════════

const STATS = [
  { value: "1,800+", label: "Verified Contractors" },
  { value: "$4.2M",  label: "Jobs Posted This Month" },
  { value: "420+",   label: "Open Positions" },
  { value: "4.9★",   label: "Avg. Contractor Rating" },
];

const PERKS = [
  { icon: "📡", title: "Real-Time Bid Alerts",    body: "Get notified the moment a relevant job or RFP hits the feed — before the recruiters see it." },
  { icon: "👷", title: "Verified Directory",       body: "Every contractor is manually reviewed. No fake profiles, no ghost listings." },
  { icon: "🔒", title: "Intel Members Only",       body: "Salary benchmarks, owner scorecards, bid-rigging warnings, and M&A deal flow." },
  { icon: "💬", title: "Direct Messaging",         body: "Talk to GCs and subs directly — no middlemen, no recruiter gatekeeping." },
];

export default function LandingHero({ openSignup, openLogin }) {
  return (
    <div className="landing-hero">
      {/* Main headline */}
      <div className="landing-hero-inner">
        <div className="landing-hero-eyebrow">🏗️ Built for the trades</div>
        <h1 className="landing-hero-h1">
          Construction intel for <span>people who build</span>
        </h1>
        <p className="landing-hero-sub">
          Bid alerts, verified contractors, a private jobs board, and insider
          intel — all in one place. No agencies. No fluff. Just the Southeast's
          most trusted network for subs and GCs.
        </p>

        <div className="landing-hero-ctas">
          <button className="btn-primary landing-hero-cta-primary" onClick={openSignup}>
            Join Free — No Credit Card
          </button>
          <button className="nav-ghost landing-hero-cta-ghost" onClick={openLogin}>
            Log In
          </button>
        </div>

        <p className="landing-hero-note">
          Free forever for verified members · Pro plan $20/mo for Intel access
        </p>
      </div>

      {/* Stats strip */}
      <div className="landing-stats">
        {STATS.map(s => (
          <div key={s.label} className="landing-stat">
            <div className="landing-stat-val">{s.value}</div>
            <div className="landing-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Feature grid */}
      <div className="landing-perks">
        {PERKS.map(p => (
          <div key={p.title} className="landing-perk">
            <div className="landing-perk-icon">{p.icon}</div>
            <div className="landing-perk-title">{p.title}</div>
            <div className="landing-perk-body">{p.body}</div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="landing-bottom-cta">
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
          Ready to get in the loop?
        </div>
        <div style={{ fontSize: 14, color: "#888", marginBottom: 20 }}>
          Join 1,800+ contractors who get their intel here first.
        </div>
        <button className="btn-primary" style={{ width: "auto", padding: "12px 32px" }} onClick={openSignup}>
          Create Free Account →
        </button>
      </div>
    </div>
  );
}
