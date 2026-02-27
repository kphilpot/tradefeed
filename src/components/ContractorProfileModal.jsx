export default function ContractorProfileModal({ contractor: c, onClose, showToast }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" style={{ top: 12, right: 12, background: "rgba(255,255,255,0.1)", color: "white" }} onClick={onClose}>✕</button>
        <div className="profile-modal-header">
          <div className="profile-modal-avatar" style={{ background: c.avatarColor }}>{c.avatar}</div>
          <div className="profile-modal-name">
            {c.name}
            <span style={{ color: "var(--verified)" }}>✓</span>
            <span className={`contractor-type-badge ${c.type === "GC" ? "badge-gc" : "badge-sub"}`}>{c.type}</span>
          </div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{c.trade} · {c.location}</div>
        </div>
        <div className="profile-modal-body">
          <div className="profile-stat-row">
            <div className="profile-stat">
              <div className="profile-stat-val">⭐ {c.rating}</div>
              <div className="profile-stat-label">Rating</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-val">{c.reviews}</div>
              <div className="profile-stat-label">Reviews</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-val">{c.yearsOp}</div>
              <div className="profile-stat-label">Yrs Operating</div>
            </div>
          </div>

          <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7, marginBottom: 20 }}>{c.bio}</p>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {c.licensed && <span className="trust-badge green" style={{ fontSize: 12, padding: "4px 12px" }}>✓ Licensed</span>}
            {c.insured && <span className="trust-badge green" style={{ fontSize: 12, padding: "4px 12px" }}>✓ Insured</span>}
            <span className="trust-badge" style={{ fontSize: 12, padding: "4px 12px" }}>TradeFeed Verified</span>
          </div>

          <div style={{ background: "#f8f7f2", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: 1, marginBottom: 8 }}>CONTACT</div>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>📧 {c.email}</div>
            <div style={{ fontSize: 13, color: "#555" }}>📞 {c.phone}</div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-primary" onClick={() => { showToast("Message sent! ✓"); onClose(); }}>Send Message</button>
            <button className="btn-secondary" onClick={() => { showToast("Contact copied!"); }}>Copy Contact</button>
          </div>
        </div>
      </div>
    </div>
  );
}
