import ComposeBox from "../components/ComposeBox.jsx";

export default function ForumPage({ user, isVerifiedUser, openSignup, showToast, posts, onLike }) {
  const forumPosts = posts.filter(p => p.verified);

  return (
    <div className="page">
      <div className="accent-bar" />
      <div className="section-label">Verified Contractors Only</div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800, marginBottom: 6 }}>Trade Forum</h2>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
        Real talk between verified contractors. No spectators, no noise — only people with skin in the game.
      </p>

      <div className="forum-verified-banner">
        <span style={{ fontSize: 22 }}>✓</span>
        <p>
          <strong style={{ color: "var(--blue)" }}>Verified contractors only</strong> can post and reply in this forum.
          Every participant has been license-verified, insured, and manually reviewed by our team.
          {!isVerifiedUser && " Apply for verification — it's free and takes 24 hours."}
        </p>
        {!isVerifiedUser && (
          <button className="btn-primary" style={{ width: "auto", padding: "8px 18px", flexShrink: 0 }} onClick={openSignup}>
            Apply Now
          </button>
        )}
      </div>

      {user && (
        <ComposeBox user={user} onPost={() => showToast("Posted to forum ✓")} placeholder="Start a discussion, ask a question, or share what's working..." />
      )}

      <div className={!isVerifiedUser ? "forum-lock-overlay" : ""}>
        {!isVerifiedUser && (
          <div className="forum-lock-msg">🔒 You can read the forum — only verified contractors can post or reply</div>
        )}
        {forumPosts.map(post => (
          <div key={post.id} className={`forum-post ${!isVerifiedUser ? "forum-post-locked" : ""}`}>
            <div className="post-header">
              <div className="post-avatar" style={{ background: post.avatarColor, color: post.avatarColor === "#FFD600" ? "#111" : "white" }}>{post.avatar}</div>
              <div className="post-meta">
                <div className="post-name-row">
                  <span className="post-name">{post.author}</span>
                  <span className="verified-badge" style={{ color: "var(--verified)" }}>✓</span>
                  <span className="post-handle">{post.handle}</span>
                  <span style={{ color: "#ddd", fontSize: 12 }}>·</span>
                  <span className="post-time">{post.time}</span>
                </div>
              </div>
            </div>
            <div className="post-content">{post.content}</div>
            {post.tags.length > 0 && (
              <div className="post-tags">{post.tags.map(t => <span key={t} className="post-tag">{t}</span>)}</div>
            )}
            <div className="post-actions">
              <button className="post-action" onClick={() => onLike(post.id)}>
                {post.liked ? "❤️" : "🤍"} <span className="post-action-count">{post.likes}</span>
              </button>
              <button className="post-action">💬 <span className="post-action-count">{post.replies}</span></button>
              <button className="post-action">↗️ Share</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
