import { useState } from "react";
import { isSupabaseConnected, supabase } from "../lib/supabase.js";

const MOCK_REVIEWS = [
  { reviewer: "Marcus T.", rating: 5, text: "Absolute pro. Showed up on time, quality was top notch, and he kept us updated throughout. Would hire again in a heartbeat.", date: "3 weeks ago" },
  { reviewer: "Lisa R.", rating: 4, text: "Good work overall. Finished the project on schedule and stayed in budget. Minor communication hiccup mid-project but resolved quickly.", date: "2 months ago" },
  { reviewer: "Bryan K.", rating: 5, text: "Best sub I've worked with in Charlotte. Clean job site, no punch list, crew was professional the whole way through.", date: "3 months ago" },
];

export default function ContractorProfileModal({ contractor: c, onClose, showToast, user, onMessage }) {
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  async function submitReview() {
    if (reviewRating === 0) { showToast("Please select a star rating."); return; }

    const newReview = {
      reviewer: user?.name || "Anonymous",
      rating: reviewRating,
      text: reviewText || "No additional comment.",
      date: "Just now",
    };

    if (isSupabaseConnected) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("reviews").insert({
          contractor_id: c.id,
          reviewer_id:   user?.id,
          reviewer_name: user?.name,
          rating:        reviewRating,
          body:          reviewText,
        });
      }
    }

    setReviews(prev => [newReview, ...prev]);
    setReviewSubmitted(true);
    setShowReviewForm(false);
    setReviewRating(0);
    setReviewText("");
    showToast("Review submitted! ✓");
  }

  const activeRating = hoverRating || reviewRating;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <button
          className="modal-close"
          style={{ top: 12, right: 12, background: "rgba(255,255,255,0.1)", color: "white" }}
          onClick={onClose}
        >✕</button>

        <div className="profile-modal-header">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div className="profile-modal-avatar" style={{ background: c.avatarColor }}>{c.avatar}</div>
            {c.featured && <span className="featured-badge">⭐ Featured</span>}
          </div>
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
              <div className="profile-stat-val">{reviews.length + c.reviews}</div>
              <div className="profile-stat-label">Reviews</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-val">{c.yearsOp}</div>
              <div className="profile-stat-label">Yrs Operating</div>
            </div>
          </div>

          <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7, marginBottom: 16 }}>{c.bio}</p>

          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {c.licensed && <span className="trust-badge green" style={{ fontSize: 12, padding: "4px 12px" }}>✓ Licensed</span>}
            {c.insured && <span className="trust-badge green" style={{ fontSize: 12, padding: "4px 12px" }}>✓ Insured</span>}
            <span className="trust-badge" style={{ fontSize: 12, padding: "4px 12px" }}>TradeFeed Verified</span>
          </div>

          <div style={{ background: "#f8f7f2", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: 1, marginBottom: 8 }}>CONTACT</div>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>📧 {c.email}</div>
            <div style={{ fontSize: 13, color: "#555" }}>📞 {c.phone}</div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button
              className="btn-primary"
              onClick={() => {
                if (user && onMessage) {
                  onMessage(c);
                } else if (!user) {
                  showToast("Log in to send messages.");
                } else {
                  showToast("Message sent! ✓");
                  onClose();
                }
              }}
            >
              Send Message
            </button>
            <button className="btn-secondary" onClick={() => { navigator.clipboard?.writeText(`${c.email} | ${c.phone}`); showToast("Contact copied!"); }}>Copy Contact</button>
          </div>

          {/* ─── Reviews Section ─── */}
          <div className="review-section">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div className="review-section-title">Reviews ({reviews.length + c.reviews})</div>
              {user && !reviewSubmitted && (
                <button
                  style={{ background: "none", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#555", padding: "5px 12px", cursor: "pointer" }}
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  {showReviewForm ? "Cancel" : "+ Write Review"}
                </button>
              )}
            </div>

            {/* Review form */}
            {showReviewForm && user && (
              <div className="review-form">
                <label className="review-form-label">YOUR RATING</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      className={`star-btn ${s <= activeRating ? "active" : ""}`}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setReviewRating(s)}
                    >⭐</button>
                  ))}
                  {reviewRating > 0 && (
                    <span style={{ fontSize: 12, color: "#888", marginLeft: 6, lineHeight: "32px" }}>
                      {["", "Poor", "Fair", "Good", "Great", "Excellent"][reviewRating]}
                    </span>
                  )}
                </div>
                <textarea
                  className="form-input"
                  style={{ minHeight: 72, resize: "vertical", fontSize: 13 }}
                  placeholder="Share your experience working with this contractor..."
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                />
                <button
                  className="btn-primary"
                  style={{ marginTop: 10, padding: "9px 20px", width: "auto" }}
                  onClick={submitReview}
                >
                  Submit Review
                </button>
              </div>
            )}

            {/* Review list */}
            <div className="review-list">
              {reviews.slice(0, 3).map((r, i) => (
                <div key={i} className="review-item">
                  <div className="review-stars">{"⭐".repeat(r.rating)}</div>
                  <div className="review-reviewer">{r.reviewer}</div>
                  <div className="review-text">{r.text}</div>
                  <div className="review-date">{r.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
