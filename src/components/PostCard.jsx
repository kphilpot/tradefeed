import { useState } from "react";

export default function PostCard({ post, onLike, onRepost, activeReply, setActiveReply, openLogin, isGated, user }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  return (
    <div className={`post-card ${post.trending ? "trending" : ""}`}>
      {post.trending && <div className="trending-tag">🔥 Trending</div>}
      <div className="post-header">
        <div className="post-avatar" style={{ background: post.avatarColor, color: post.avatarColor === "#FFD600" ? "#111" : "white" }}>{post.avatar}</div>
        <div className="post-meta">
          <div className="post-name-row">
            <span className="post-name">{post.author}</span>
            {post.verified && (
              <span className="verified-wrap">
                <span className="verified-badge">✓</span>
                <span className="verified-tooltip">Verified Contractor</span>
              </span>
            )}
            <span className="post-handle">{post.handle}</span>
            <span style={{ color: "#ddd", fontSize: 12 }}>·</span>
            <span className="post-time">{post.time}</span>
          </div>
        </div>
      </div>
      <div className="post-content">{post.content}</div>

      {post.imageUrl && (
        <div style={{ marginBottom: 12, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
          <img src={post.imageUrl} alt="post media" style={{ width: "100%", maxHeight: 300, objectFit: "cover", display: "block" }} />
        </div>
      )}

      {post.pollOptions && post.pollOptions.length > 0 && (
        <div style={{ background: "#f8f7f2", borderRadius: 10, padding: "12px 14px", marginBottom: 12, border: "1px solid var(--border)" }}>
          {post.pollOptions.map((opt, i) => (
            <div key={i} style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 20, padding: "8px 16px", marginBottom: 6, fontSize: 13, cursor: "pointer", transition: "border-color 0.15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--blue)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>{opt}</div>
          ))}
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Poll · 24h remaining</div>
        </div>
      )}

      {post.tags.length > 0 && (
        <div className="post-tags">{post.tags.map(t => <span key={t} className="post-tag">{t}</span>)}</div>
      )}

      <div className="post-actions">
        <button className={`post-action ${post.liked ? "liked" : ""}`} onClick={() => onLike(post.id)}>
          {post.liked ? "❤️" : "🤍"} <span className="post-action-count">{post.likes}</span>
        </button>
        <button className={`post-action ${post.reposted ? "reposted" : ""}`} onClick={() => onRepost(post.id)}>
          🔁 <span className="post-action-count">{post.reposts}</span>
        </button>
        <button className="post-action" onClick={() => { if (isGated) { openLogin?.(); return; } setActiveReply?.(activeReply === post.id ? null : post.id); }}>
          💬 <span className="post-action-count">{post.replies + (post.ghostReplies?.length || 0)}</span>
        </button>
        <button className="post-action" onClick={() => navigator.clipboard?.writeText(`tradefeed.com/post/${post.id}`)}>
          ↗️ Share
        </button>
      </div>

      {!isGated && post.ghostReplies?.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button style={{ background: "none", border: "none", fontSize: 12, color: "var(--blue)", cursor: "pointer", fontFamily: "var(--font-body)", marginBottom: 6 }} onClick={() => setShowReplies(!showReplies)}>
            {showReplies ? "Hide replies" : `Show ${post.ghostReplies.length} replies`}
          </button>
          {showReplies && post.ghostReplies.map((r, i) => (
            <div key={i} className="ghost-reply">
              <div className="ghost-reply-meta">
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: r.avatarColor, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "white", fontWeight: 700 }}>{r.avatar}</span>
                <strong>{r.author}</strong> · {r.handle} · <span style={{ color: "var(--verified)" }}>✓</span> {r.trade}
              </div>
              {r.content}
            </div>
          ))}
        </div>
      )}

      {activeReply === post.id && (
        <div className="reply-box">
          <textarea className="reply-input" placeholder={`Reply to ${post.author}...`} rows={2} value={replyContent} onChange={e => setReplyContent(e.target.value)} autoFocus />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer" }} title="Add GIF">GIF</button>
              <button style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer" }}>😄</button>
            </div>
            <button className="reply-submit" onClick={() => { setReplyContent(""); setActiveReply?.(null); }} disabled={!replyContent.trim()}>Reply</button>
          </div>
        </div>
      )}
    </div>
  );
}
