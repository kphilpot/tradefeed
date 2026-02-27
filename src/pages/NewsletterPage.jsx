import { useState } from "react";
import { DUMMY_NEWSLETTERS } from "../data/index.js";
import NewsletterSignup from "../components/NewsletterSignup.jsx";

export default function NewsletterPage({ showToast }) {
  const [expanded, setExpanded] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = DUMMY_NEWSLETTERS.filter(nl =>
    nl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nl.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page">
      <div className="accent-bar" />
      <div className="section-label">Daily Construction Intelligence</div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800, marginBottom: 6 }}>The TradeFeed Brief</h2>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 16, maxWidth: 540, lineHeight: 1.6 }}>
        Auto-published every weekday — market data, legislation, contract awards, material pricing, and global trends. Built for the subcontractor who reads in 5 minutes.
      </p>

      <div style={{ marginBottom: 24 }}>
        <input className="filter-input" style={{ maxWidth: 440 }} placeholder="Search past issues..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {filtered.map((nl, i) => (
        <div key={nl.id} className="nl-card">
          <div className="nl-header">
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="nl-date">{nl.date}</div>
                {i === 0 && <span style={{ background: "var(--yellow)", color: "#111", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>LATEST</span>}
              </div>
              <div className="nl-title">{nl.title}</div>
            </div>
            <span className="nl-api-badge">⚡ AI Pipeline</span>
          </div>
          <div className="nl-body">
            <div className="nl-summary">📌 {nl.summary}</div>
            {expanded === nl.id ? (
              <>
                <div className="nl-full">{nl.full}</div>
                <button style={{ marginTop: 14, background: "none", border: "none", color: "var(--blue)", fontSize: 13, fontWeight: 600, cursor: "pointer" }} onClick={() => setExpanded(null)}>Collapse ↑</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "#444" }}>{nl.preview}</div>
                <button style={{ marginTop: 10, background: "none", border: "none", color: "var(--blue)", fontSize: 13, fontWeight: 600, cursor: "pointer" }} onClick={() => setExpanded(nl.id)}>Read full issue →</button>
              </>
            )}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", color: "#aaa", padding: "40px 0", fontSize: 14 }}>No issues found for "{searchQuery}"</div>
      )}

      <NewsletterSignup showToast={showToast} />
    </div>
  );
}
