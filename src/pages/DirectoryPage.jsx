import { useState } from "react";
import { DUMMY_VERIFIED_CONTRACTORS, NC_LOCATIONS, TRADES_LIST } from "../data/index.js";
import { captureLead } from "../lib/supabase.js";

export default function DirectoryPage({ user, onSelectContractor, showToast }) {
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [tradeFilter, setTradeFilter] = useState("All Trades");
  const [typeFilter, setTypeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dirUnlocked, setDirUnlocked] = useState(false);
  const [unlockEmail, setUnlockEmail] = useState("");
  const [unlockName, setUnlockName] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const FREE_VISIBLE = 4;

  const filtered = DUMMY_VERIFIED_CONTRACTORS.filter(c => {
    if (locationFilter !== "All Locations" && c.location !== locationFilter) return false;
    if (tradeFilter !== "All Trades" && c.trade !== tradeFilter) return false;
    if (typeFilter !== "All" && c.type !== typeFilter) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.trade.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Featured contractors sorted first
  const sorted = [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  const visibleContractors = dirUnlocked || user ? sorted : sorted.slice(0, FREE_VISIBLE);
  const hiddenCount = filtered.length - FREE_VISIBLE;

  async function handleUnlock(e) {
    e.preventDefault();
    if (!unlockEmail || !unlockName) return;
    await captureLead({
      email: unlockEmail,
      name: unlockName,
      type: "directory_unlock",
      consent_given: consentChecked,
      source_page: "directory",
    });
    setDirUnlocked(true);
    showToast("Directory unlocked! ✓");
  }

  return (
    <div className="page">
      <div className="accent-bar" />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="section-label">Verified Network</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800 }}>Contractor Directory</h2>
          <p style={{ color: "#666", fontSize: 14, marginTop: 6, maxWidth: 520, lineHeight: 1.6 }}>
            Every contractor listed here has been verified by TradeFeed — license checked, insurance confirmed, and approved by our team.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ textAlign: "center", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800 }}>{DUMMY_VERIFIED_CONTRACTORS.length}</div>
            <div style={{ fontSize: 11, color: "#888" }}>Verified members</div>
          </div>
        </div>
      </div>

      <div className="verify-how">
        <h3>✓ How Verification Works</h3>
        <p>Every contractor with a blue check has passed our 4-step verification process.</p>
        <div className="verify-steps">
          {[
            { num: "1", title: "License Check", desc: "We verify your state contractor license is active and in good standing." },
            { num: "2", title: "Insurance Confirm", desc: "Certificate of insurance verified — general liability and workers comp." },
            { num: "3", title: "Business Check", desc: "We confirm your business is registered and operating." },
            { num: "4", title: "Team Review", desc: "Manual review by our team within 24 hours." },
          ].map(s => (
            <div key={s.num} className="verify-step">
              <div className="verify-step-num">{s.num}</div>
              <div className="verify-step-title">{s.title}</div>
              <div className="verify-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="filter-bar">
        <input className="filter-input" placeholder="Search by name or trade..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        <select className="filter-select" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
          {NC_LOCATIONS.map(l => <option key={l}>{l}</option>)}
        </select>
        <select className="filter-select" value={tradeFilter} onChange={e => setTradeFilter(e.target.value)}>
          {TRADES_LIST.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option>All</option><option>GC</option><option>Sub</option>
        </select>
      </div>

      <div className="contractor-grid">
        {visibleContractors.map(c => (
          <div key={c.id} className={`contractor-card ${c.featured ? "featured" : ""}`} onClick={() => onSelectContractor(c)}>
            <div className="contractor-avatar-wrap">
              <div className="contractor-avatar" style={{ background: c.avatarColor }}>{c.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="contractor-name">
                  {c.name}
                  <span style={{ color: "var(--verified)", fontSize: 14 }}>✓</span>
                  <span className={`contractor-type-badge ${c.type === "GC" ? "badge-gc" : "badge-sub"}`}>{c.type}</span>
                </div>
                <div className="contractor-trade">{c.trade}</div>
              </div>
              {c.featured && <span className="featured-badge">⭐ Featured</span>}
            </div>
            <div className="contractor-location">📍 {c.location}</div>
            <div className="contractor-rating">
              ⭐ {c.rating} <span style={{ color: "#aaa", fontWeight: 400 }}>({c.reviews} reviews)</span>
            </div>
            <p style={{ fontSize: 12, color: "#777", marginTop: 8, lineHeight: 1.5 }}>{c.bio}</p>
            <div className="contractor-badges">
              {c.licensed && <span className="trust-badge green">✓ Licensed</span>}
              {c.insured && <span className="trust-badge green">✓ Insured</span>}
              <span className="trust-badge">{c.yearsOp} yrs operating</span>
            </div>
          </div>
        ))}
      </div>

      {!dirUnlocked && !user && hiddenCount > 0 && (
        <div className="dir-gate">
          <h3>🔓 {hiddenCount} more contractors in your area</h3>
          <p>Enter your name and email to unlock the full directory. Free — no credit card.</p>

          {!showUnlockForm ? (
            <button className="btn-primary" style={{ maxWidth: 280, margin: "0 auto" }} onClick={() => setShowUnlockForm(true)}>
              Unlock Full Directory
            </button>
          ) : (
            <>
              <form onSubmit={handleUnlock} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 440, margin: "0 auto" }}>
                <input className="form-input" style={{ background: "#1a1a1a", border: "1.5px solid #333", color: "white" }} placeholder="Your full name" value={unlockName} onChange={e => setUnlockName(e.target.value)} required />
                <input className="form-input" style={{ background: "#1a1a1a", border: "1.5px solid #333", color: "white" }} type="email" placeholder="Your email address" value={unlockEmail} onChange={e => setUnlockEmail(e.target.value)} required />
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 11, color: "#666", cursor: "pointer", textAlign: "left", lineHeight: 1.5, marginTop: 4 }}>
                  <input type="checkbox" checked={consentChecked} onChange={e => setConsentChecked(e.target.checked)} style={{ marginTop: 2, accentColor: "var(--yellow)", flexShrink: 0 }} />
                  <span>
                    I consent to TradeFeed sharing my contact information with verified contractors and GCs who may reach out about relevant opportunities, projects, or hiring. I can opt out at any time. By submitting I agree to TradeFeed's <span style={{ color: "var(--yellow)" }}>Terms</span> and <span style={{ color: "var(--yellow)" }}>Privacy Policy</span>.
                  </span>
                </label>
                <button type="submit" className="btn-primary" style={{ marginTop: 4 }}>
                  Unlock Full Directory →
                </button>
              </form>
              <div className="dir-consent" style={{ marginTop: 8 }}>
                🔒 We never spam. Your info is shared only with verified TradeFeed contractors.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
