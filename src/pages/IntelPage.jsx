import { useState } from "react";
import { isSupabaseConnected, supabase } from "../lib/supabase.js";

const FAKE_INTEL = [
  { title: "Bid Alert: $2.1M MEP package opening in Charlotte Q2", type: "BID", hot: true },
  { title: "Supplier warning: 3 concrete suppliers with delayed payments flagged by members", type: "ALERT", hot: false },
  { title: "Private thread: GC rate negotiation strategies that actually work", type: "DISCUSSION", hot: true },
  { title: "Salary data: What verified foremen are actually making in NC right now", type: "DATA", hot: false },
  { title: "Deal flow: Meridian Build Group opening 4 new projects — subs needed now", type: "DEAL", hot: true },
  { title: "Member poll: Payment terms — who's getting net-15 and how", type: "POLL", hot: false },
];

export default function IntelPage({ isVerifiedUser, isProUser, openSignup, showToast }) {
  const [upgrading, setUpgrading] = useState(false);

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      if (isSupabaseConnected) {
        // Call the stripe-checkout edge function
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
          }
        );
        const { url, error } = await res.json();
        if (error) throw new Error(error);
        window.location.href = url;
      } else {
        // Demo mode — simulate redirect
        if (showToast) showToast("Demo: would redirect to Stripe checkout ($20/mo)");
        setTimeout(() => setUpgrading(false), 1500);
      }
    } catch (err) {
      if (showToast) showToast("Checkout error: " + err.message);
      setUpgrading(false);
    }
  }

  return (
    <div className="page">
      <div className="locked-page">
        {/* Blurred content preview */}
        <div className={isProUser ? "" : "locked-content-blur"}>
          <div style={{ padding: "28px 0" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginBottom: 20 }}>
              🔒 Pro Intel
            </div>
            {FAKE_INTEL.map((item, i) => (
              <div key={i} style={{ background: "white", borderRadius: 12, border: "1px solid #e2dfd8", padding: "18px 20px", marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ background: item.hot ? "#FF6B2B" : "#0057FF", color: "white", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap", marginTop: 2 }}>{item.type}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>Verified members only · Posted by verified contractor</div>
                </div>
                {item.hot && <div style={{ background: "#FFD600", color: "#111", fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20, marginLeft: "auto", whiteSpace: "nowrap" }}>HOT</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Gate overlay — only shown when not pro */}
        {!isProUser && (
          <div className="locked-overlay">
            {isVerifiedUser ? (
              /* Verified but not pro → Stripe upgrade CTA */
              <div className="pro-upgrade-box">
                <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
                <h2>Upgrade to Pro Intel</h2>
                <p>
                  You're verified — one step away from bid alerts, deal flow, salary data,
                  contractor warnings, and private discussions you won't find anywhere else.
                </p>
                <div className="pro-price-display">
                  <div className="pro-price">$20</div>
                  <div className="pro-price-period">/month · cancel anytime</div>
                </div>
                <div className="locked-features" style={{ marginBottom: 24 }}>
                  {[
                    { icon: "📡", text: "Real-time bid alerts and project opportunities" },
                    { icon: "⚠️", text: "Contractor and supplier warnings from the community" },
                    { icon: "💰", text: "Real wage and rate data from verified members" },
                    { icon: "🤝", text: "Private deal flow and sub referrals" },
                    { icon: "🗣️", text: "Off-the-record discussions about GCs and payments" },
                  ].map((f, i) => (
                    <div key={i} className="locked-feature">
                      <div className="locked-feature-icon">{f.icon}</div>
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="pro-stripe-btn"
                  onClick={handleUpgrade}
                  disabled={upgrading}
                >
                  {upgrading ? "Redirecting to Stripe..." : "Upgrade to Pro — $20/mo →"}
                </button>
                <div className="pro-note">Secure checkout via Stripe · Cancel any time</div>
              </div>
            ) : (
              /* Not verified → apply for verification (free) */
              <div className="locked-box">
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
                <h2>Pro Intel — Verified Access Only</h2>
                <p>
                  Private bid alerts, deal flow, contractor warnings, salary data, and discussions
                  you won't find anywhere else. Get verified free, then unlock Pro for $20/mo.
                </p>
                <div className="locked-features">
                  {[
                    { icon: "📡", text: "Real-time bid alerts and project opportunities" },
                    { icon: "⚠️", text: "Contractor and supplier warnings from the community" },
                    { icon: "💰", text: "Real wage and rate data from verified members" },
                    { icon: "🤝", text: "Private deal flow and sub referrals" },
                    { icon: "🗣️", text: "Off-the-record discussions about GCs and payments" },
                  ].map((f, i) => (
                    <div key={i} className="locked-feature">
                      <div className="locked-feature-icon">{f.icon}</div>
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>
                <button className="btn-primary" onClick={openSignup} style={{ marginBottom: 12 }}>
                  Apply for Verification — Free
                </button>
                <div style={{ fontSize: 11, color: "#555" }}>Free · 24h review · License and insurance required</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
