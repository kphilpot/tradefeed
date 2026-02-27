import { useState } from "react";
import PostCard from "../components/PostCard.jsx";
import ComposeBox from "../components/ComposeBox.jsx";
import { DUMMY_JOBS, DUMMY_NEWSLETTERS } from "../data/index.js";

export default function HomePage({ user, posts, openLogin, openSignup, onLike, onRepost, onPost, isVerifiedUser }) {
  const [activeReply, setActiveReply] = useState(null);
  const VISIBLE_FREE = 6;
  const isGated = !user;
  const visiblePosts = isGated ? posts.slice(0, VISIBLE_FREE) : posts;
  const gatedPosts = isGated ? posts.slice(VISIBLE_FREE) : [];

  return (
    <div className="page">
      <div className="hero-strip">
        <div>
          <h1>The feed for<br /><span>trade contractors</span></h1>
          <p>News, jobs, and real talk from the people who build the Southeast. No fluff, no agencies.</p>
          <div className="hero-badges">
            <span className="badge yellow">Construction</span>
            <span className="badge">Southeast Focus</span>
            <span className="badge">Verified Trades</span>
            <span className="badge">Daily Intel</span>
          </div>
        </div>
        <div className="hero-emoji">🏗️</div>
      </div>

      <div className="two-col">
        <div>
          {user ? (
            <ComposeBox user={user} onPost={onPost} />
          ) : (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "var(--shadow)" }}>
              <span style={{ fontSize: 14, color: "#777" }}>Join the conversation with 1,800+ contractors</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-secondary" style={{ width: "auto", padding: "8px 16px" }} onClick={openLogin}>Log In</button>
                <button className="btn-primary" style={{ width: "auto", padding: "8px 16px" }} onClick={openSignup}>Join Free</button>
              </div>
            </div>
          )}

          <div className="section-label">Latest from the Community</div>

          {visiblePosts.map(post => (
            <PostCard key={post.id} post={post} onLike={onLike} onRepost={onRepost} activeReply={activeReply} setActiveReply={setActiveReply} openLogin={openLogin} isGated={isGated} user={user} />
          ))}

          {isGated && gatedPosts.length > 0 && (
            <div className="gate-wrapper">
              <div className="gate-blur">
                {gatedPosts.slice(0, 2).map(post => <PostCard key={post.id} post={post} onLike={() => {}} onRepost={() => {}} isGated={true} />)}
              </div>
              <div className="gate-overlay">
                <div className="gate-box">
                  <div className="gate-icon">🔒</div>
                  <h3>You're seeing 6 of {posts.length} posts</h3>
                  <p>Join free to see the full feed, like, comment, and connect with verified contractors.</p>
                  <div className="gate-btns">
                    <button className="btn-primary" onClick={openSignup}>Join Free</button>
                    <button className="btn-secondary" onClick={openLogin}>Log In</button>
                  </div>
                  <div className="gate-note">✅ Free to join · Verified subs get full posting access</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div>
          <div className="widget">
            <div className="widget-title">📊 Market Pulse</div>
            {[
              { label: "Commercial Starts", val: "+7%", delta: "↑ vs last wk", cls: "delta-up" },
              { label: "Trade Labor Demand", val: "+23%", delta: "↑ YOY", cls: "delta-up" },
              { label: "Rebar $/ton", val: "$890", delta: "↔ stable", cls: "delta-flat" },
              { label: "Copper $/lb", val: "$4.21", delta: "↑ 2%", cls: "delta-up" },
              { label: "Lumber Futures", val: "$412", delta: "↓ slight", cls: "delta-down" },
            ].map(s => (
              <div key={s.label} className="widget-row">
                <span className="widget-label">{s.label}</span>
                <div style={{ textAlign: "right" }}>
                  <div className="widget-val">{s.val}</div>
                  <div className={`widget-delta ${s.cls}`}>{s.delta}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="widget">
            <div className="widget-title">💼 Hot Jobs</div>
            {DUMMY_JOBS.slice(0, 3).map(job => (
              <div key={job.id} className="widget-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{job.title} {job.verified && <span style={{ color: "var(--verified)" }}>✓</span>}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{job.company} · {job.location}</div>
                <div style={{ fontSize: 12, color: "var(--teal)", fontWeight: 700 }}>{job.pay}</div>
              </div>
            ))}
          </div>

          <div className="widget" style={{ background: "var(--dark)", border: "1px solid #2a2a2a" }}>
            <div className="widget-title" style={{ color: "var(--yellow)" }}>📬 Today's Brief</div>
            <p style={{ fontSize: 12, color: "#666", marginBottom: 4, fontWeight: 700 }}>{DUMMY_NEWSLETTERS[0].date}</p>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 14, lineHeight: 1.6 }}>{DUMMY_NEWSLETTERS[0].summary}</p>
            <button className="btn-primary">Read Now →</button>
          </div>

          <div className="widget">
            <div className="widget-title">🔥 Trending Tags</div>
            {["#concrete", "#electrical", "#hiring", "#OSHA", "#automation", "#permits", "#framing"].map(tag => (
              <span key={tag} style={{ display: "inline-block", background: "#F0EDE6", color: "var(--blue)", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, margin: "3px 3px 3px 0", cursor: "pointer" }}>{tag}</span>
            ))}
          </div>

          <div className="widget" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0a1a0a 100%)", border: "1px solid #333" }}>
            <div className="widget-title" style={{ color: "#FFD600" }}>🔒 Pro Intel</div>
            <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6, marginBottom: 12 }}>Private deal flow, bid intel, and contractor-only discussions. Verified members only.</p>
            <div style={{ fontSize: 11, color: "var(--teal)", fontWeight: 700 }}>→ Apply for verification to unlock</div>
          </div>
        </div>
      </div>
    </div>
  );
}
