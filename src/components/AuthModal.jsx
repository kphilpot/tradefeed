import { useState, useRef } from "react";

export default function AuthModal({ mode, setMode, onLogin, onSignup, onClose }) {
  const [tier, setTier] = useState("free");
  const formRef = useRef(null);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {mode === "login" ? (
          <>
            <h2>Welcome back</h2>
            <p className="modal-sub">Log in to access TradeFeed</p>
            <form onSubmit={onLogin}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input name="email" className="form-input" type="email" placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input name="password" className="form-input" type="password" placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn-primary">Log In</button>
            </form>
            <div className="form-toggle">New here? <a onClick={() => setMode("signup")}>Create account</a></div>
          </>
        ) : (
          <>
            <h2>Join TradeFeed</h2>
            <p className="modal-sub">Free for everyone. Verified for those who build.</p>

            <div className="tier-grid">
              <div className={`tier-opt ${tier === "free" ? "active" : ""}`} onClick={() => setTier("free")}>
                <div className="tier-opt-title">Browse Free</div>
                <div className="tier-opt-price">$0/mo</div>
                <div className="tier-opt-badge">⚡ Instant</div>
              </div>
              <div className={`tier-opt ${tier === "verified_sub" ? "active" : ""}`} onClick={() => setTier("verified_sub")}>
                <div className="tier-opt-title">✓ Verified Sub</div>
                <div className="tier-opt-price">Free</div>
                <div className="tier-opt-badge">24h review</div>
              </div>
              <div className={`tier-opt ${tier === "verified_gc" ? "active" : ""}`} onClick={() => setTier("verified_gc")}>
                <div className="tier-opt-title">✓ Verified GC</div>
                <div className="tier-opt-price">Free</div>
                <div className="tier-opt-badge">24h review</div>
              </div>
              <div className="tier-opt" style={{ opacity: 0.5, cursor: "default" }}>
                <div className="tier-opt-title">🔒 Intel</div>
                <div className="tier-opt-price">Coming soon</div>
                <div className="tier-opt-badge">Verified only</div>
              </div>
            </div>

            {(tier === "verified_sub" || tier === "verified_gc") && (
              <div className="verify-section">
                <h4><span style={{ color: "var(--verified)" }}>✓</span> Get Verified — It's Free</h4>
                <p>Verified contractors get the blue checkmark, forum access, appear in the contractor directory, and can post jobs. We review within 24 hours.</p>
                <div className="verify-fields">
                  <input className="form-input" type="text" placeholder={tier === "verified_gc" ? "Company / Business Name" : "Your Name or Company"} />
                  <input className="form-input" type="text" placeholder="NC Contractor License #" />
                  <input className="form-input" type="text" placeholder={tier === "verified_sub" ? "Trade (e.g. Electrical, Framing)" : "Type of work (commercial, residential)"} />
                  <input className="form-input" type="text" placeholder="Years in operation" />
                </div>
              </div>
            )}

            <form ref={formRef} onSubmit={(e) => { e.preventDefault(); e.target.setAttribute("data-tier", tier); onSignup(e); }}>
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">Full Name</label>
                <input name="name" className="form-input" type="text" placeholder="John Smith" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input name="email" className="form-input" type="email" placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input name="password" className="form-input" type="password" placeholder="Min 8 characters" required />
              </div>

              <div style={{ background: "#f8f7f2", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, color: "#555", cursor: "pointer", lineHeight: 1.5 }}>
                  <input type="checkbox" style={{ marginTop: 2, accentColor: "var(--blue)", flexShrink: 0 }} />
                  <span>
                    <strong>Connect me with contractors and opportunities.</strong> I agree to allow TradeFeed to share my contact information with verified contractors and GCs on the platform who may reach out about relevant work, projects, or hiring opportunities. I understand I can opt out at any time. See our <span style={{ color: "var(--blue)", cursor: "pointer" }}>Privacy Policy</span>.
                  </span>
                </label>
              </div>

              <button type="submit" className="btn-primary">
                {tier === "free" ? "Create Free Account" : tier === "verified_gc" ? "Apply as Verified GC" : "Apply as Verified Subcontractor"}
              </button>
            </form>
            <div className="form-toggle">Already a member? <a onClick={() => setMode("login")}>Log in</a></div>
          </>
        )}
      </div>
    </div>
  );
}
