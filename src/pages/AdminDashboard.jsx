import { useState } from "react";
import { ADMIN_STATS, DUMMY_SEEDED_QUESTIONS, DUMMY_NEWSLETTERS, GHOST_ACCOUNTS } from "../data/index.js";

export default function AdminDashboard({ onBack, onLogout, posts }) {
  const [tab, setTab] = useState("overview");
  const [pendingUsers, setPendingUsers] = useState(ADMIN_STATS.recentSignups.filter(u => u.status === "pending"));
  const [seededQuestions, setSeededQuestions] = useState(DUMMY_SEEDED_QUESTIONS);
  const [ghostRunning, setGhostRunning] = useState(false);
  const [ghostLastRun, setGhostLastRun] = useState(ADMIN_STATS.ghostLastRun);

  function approveUser(name) { setPendingUsers(prev => prev.filter(u => u.name !== name)); }
  function markUsed(id) { setSeededQuestions(prev => prev.map(q => q.id === id ? { ...q, used: true } : q)); }
  function runGhostAccounts() {
    setGhostRunning(true);
    setTimeout(() => { setGhostRunning(false); setGhostLastRun("Just now"); }, 2200);
  }

  const maxViews = Math.max(...ADMIN_STATS.weeklyEngagement.map(d => d.views));

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>⚙ TradeFeed Admin</h1>
          <p style={{ fontSize: 12, color: "#666", marginTop: 2 }}>Welcome back, Korey · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="back-btn" onClick={onBack}>← Back to Site</button>
          <button className="back-btn" onClick={onLogout} style={{ background: "#300", color: "#f88" }}>Log Out</button>
        </div>
      </div>

      <div style={{ background: "#141414", borderBottom: "1px solid #222", padding: "0 28px" }}>
        {["overview", "seed", "ghosts", "users", "leads", "newsletter", "revenue"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", color: tab === t ? "#FFD600" : "#555", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: tab === t ? 700 : 400, padding: "14px 16px", cursor: "pointer", borderBottom: tab === t ? "2px solid #FFD600" : "2px solid transparent", textTransform: "capitalize" }}>
            {t === "seed" ? "Post Ideas" : t === "ghosts" ? "Ghost Accounts" : t}
          </button>
        ))}
      </div>

      <div className="admin-body">

        {/* ─── OVERVIEW ─── */}
        {tab === "overview" && (
          <>
            <div className="admin-stats-grid">
              <div className="admin-stat-card highlight">
                <div className="admin-stat-label">Total Members</div>
                <div className="admin-stat-value yellow">{ADMIN_STATS.totalUsers.toLocaleString()}</div>
                <div className="admin-stat-delta" style={{ color: "var(--teal)" }}>+{ADMIN_STATS.newUsers7d} this week</div>
                <div className="admin-stat-sub">+{ADMIN_STATS.newUsersToday} today</div>
              </div>
              <div className="admin-stat-card highlight">
                <div className="admin-stat-label">MRR</div>
                <div className="admin-stat-value green">${ADMIN_STATS.mrr.toLocaleString()}</div>
                <div className="admin-stat-delta" style={{ color: "var(--teal)" }}>{ADMIN_STATS.mrrGrowth} MoM</div>
                <div className="admin-stat-sub">Churn: {ADMIN_STATS.churnRate}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Verified Contractors</div>
                <div className="admin-stat-value">{ADMIN_STATS.verifiedContractors}</div>
                <div className="admin-stat-sub" style={{ color: "var(--yellow)" }}>{ADMIN_STATS.pendingVerification} pending</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Email Leads Captured</div>
                <div className="admin-stat-value yellow">{ADMIN_STATS.emailLeads}</div>
                <div className="admin-stat-sub">From directory + jobs</div>
              </div>
            </div>

            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-label">Ghost Replies Today</div>
                <div className="admin-stat-value green">{ADMIN_STATS.ghostRepliesToday}</div>
                <div className="admin-stat-sub">Last run: {ghostLastRun}</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Post Ideas Ready</div>
                <div className="admin-stat-value">{seededQuestions.filter(q => !q.used).length}</div>
                <div className="admin-stat-sub">From Reddit API</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Newsletter Open Rate</div>
                <div className="admin-stat-value green">{ADMIN_STATS.newsletterOpenRate}</div>
                <div className="admin-stat-sub">{ADMIN_STATS.newsletterSubscribers} subs</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-label">Active Jobs</div>
                <div className="admin-stat-value">{ADMIN_STATS.jobPostings}</div>
                <div className="admin-stat-sub">{ADMIN_STATS.jobApplications} applications</div>
              </div>
            </div>

            <div className="admin-two-col">
              <div className="admin-card">
                <div className="admin-card-title">Weekly Pageviews</div>
                <div className="admin-bar-chart">
                  {ADMIN_STATS.weeklyEngagement.map(d => (
                    <div key={d.day} className="admin-bar-col">
                      <div className="admin-bar" style={{ height: `${(d.views / maxViews) * 68}px` }} />
                      <div className="admin-bar-label">{d.day}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="admin-card">
                <div className="admin-card-title">Pending Verification</div>
                {pendingUsers.length === 0 ? (
                  <div style={{ color: "#555", fontSize: 13 }}>✅ All caught up</div>
                ) : (
                  pendingUsers.map(u => (
                    <div key={u.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #222" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>{u.role} · {u.time}</div>
                      </div>
                      <button className="admin-approve-btn" onClick={() => approveUser(u.name)}>Approve ✓</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* ─── POST IDEAS (REDDIT SEED) ─── */}
        {tab === "seed" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div className="admin-section-title">Daily Post Ideas</div>
                <p style={{ fontSize: 13, color: "#555", marginTop: -8, marginBottom: 0 }}>
                  Sourced from r/Construction, r/Homebuilding via Reddit API — 1 call/day, free tier.
                  20 ideas seeded daily based on top engagement scores.
                </p>
              </div>
              <div>
                <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "10px 16px", fontSize: 12, color: "#555", marginBottom: 8, fontFamily: "monospace" }}>
                  GET reddit.com/r/Construction+Homebuilding/hot.json?limit=20
                </div>
                <button className="admin-publish-btn">
                  🔄 Refresh Ideas Now
                </button>
              </div>
            </div>

            {seededQuestions.map(q => (
              <div key={q.id} className={`seed-card ${q.used ? "used" : ""}`}>
                <div style={{ flex: 1 }}>
                  <div className="seed-source">{q.source}</div>
                  <div className="seed-content">{q.content}</div>
                  <div className="seed-score">🔥 Engagement score: {q.engagementScore.toLocaleString()} · {q.used ? "✓ Posted" : "Ready to post"}</div>
                </div>
                <button className="seed-post-btn" disabled={q.used} onClick={() => markUsed(q.id)}>
                  {q.used ? "Posted ✓" : "Post Now"}
                </button>
              </div>
            ))}

            <div style={{ background: "#111", border: "1px solid #222", borderRadius: 10, padding: "16px 20px", marginTop: 20 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, color: "#555", letterSpacing: 1, marginBottom: 10 }}>SUPABASE EDGE FUNCTION — /functions/v1/seed-questions</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#0f0", lineHeight: 1.8 }}>
                // Runs once daily at 6 AM via cron<br />
                const r = await fetch('https://reddit.com/r/Construction+Homebuilding/hot.json?limit=20')<br />
                const data = await r.json()<br />
                const questions = data.data.children<br />
                &nbsp;&nbsp;.map(p =&gt; (&#123; content: p.data.title, score: p.data.score + p.data.num_comments * 3, source: 'r/' + p.data.subreddit &#125;))<br />
                &nbsp;&nbsp;.sort((a,b) =&gt; b.score - a.score).slice(0,20)<br />
                await supabase.from('seeded_questions').insert(questions)
              </div>
            </div>
          </>
        )}

        {/* ─── GHOST ACCOUNTS ─── */}
        {tab === "ghosts" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div className="admin-section-title">Ghost Account Engine</div>
                <p style={{ fontSize: 13, color: "#555", marginTop: -8 }}>
                  10 accounts · 5 replies each · 50 total replies daily · Single Anthropic batch API call.
                  Last run: <strong style={{ color: "var(--teal)" }}>{ghostLastRun}</strong>
                </p>
              </div>
              <button className="ghost-run-btn" style={{ padding: "10px 22px", fontSize: 13, opacity: ghostRunning ? 0.6 : 1 }} onClick={runGhostAccounts} disabled={ghostRunning}>
                {ghostRunning ? "⏳ Running batch..." : "▶ Run All 50 Replies Now"}
              </button>
            </div>

            <div style={{ background: "#111", border: "1px solid #222", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, color: "#555", letterSpacing: 1, marginBottom: 10 }}>BATCH API CALL — Anthropic Messages Batches · ~$0.003/day</div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#0f0", lineHeight: 1.8 }}>
                POST https://api.anthropic.com/v1/messages/batches<br />
                &#123; "requests": [<br />
                &nbsp;&nbsp;// 10 accounts × 5 posts each = 50 requests<br />
                &nbsp;&nbsp;&#123; "custom_id": "ghost1_post1", "params": &#123; "model": "claude-haiku-4-5-20251001",<br />
                &nbsp;&nbsp;&nbsp;&nbsp;"messages": [&#123;"role":"user","content":"You are Jake Moreno, a framing contractor. Reply naturally to: [post content]"&#125;] &#125; &#125;,<br />
                &nbsp;&nbsp;// ...49 more requests<br />
                ] &#125;
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Accounts Active", val: "10 / 10" },
                { label: "Replies Today", val: ghostRunning ? "Running..." : "50" },
                { label: "Avg per post", val: "5 replies" },
                { label: "API Cost Today", val: "~$0.003" },
              ].map(s => (
                <div key={s.label} className="admin-stat-card">
                  <div className="admin-stat-label">{s.label}</div>
                  <div className="admin-stat-value" style={{ fontSize: 20 }}>{s.val}</div>
                </div>
              ))}
            </div>

            {GHOST_ACCOUNTS.map(g => (
              <div key={g.id} className="ghost-card">
                <div className="ghost-avatar" style={{ background: g.avatarColor }}>{g.avatar}</div>
                <div className="ghost-info">
                  <div className="ghost-name">{g.name} <span style={{ color: "var(--verified)", fontSize: 12 }}>✓</span></div>
                  <div className="ghost-handle">{g.handle} · {g.trade}</div>
                  <div className="ghost-status">{ghostRunning ? "⏳ Posting..." : "✓ Active · 5 replies scheduled"}</div>
                </div>
                <div style={{ fontSize: 11, color: "#555", textAlign: "right" }}>
                  <div>Last post: {ghostLastRun}</div>
                  <div style={{ color: "var(--teal)", marginTop: 2 }}>5 replies/day</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ─── USERS ─── */}
        {tab === "users" && (
          <div className="admin-card">
            <div className="admin-section-title">User Management</div>
            <div className="admin-tr admin-tr-head">
              <span>Name</span><span>Role</span><span>Status</span><span>Action</span>
            </div>
            {ADMIN_STATS.recentSignups.map(u => (
              <div key={u.name} className="admin-tr">
                <span style={{ color: "#ccc" }}>{u.name}</span>
                <span style={{ color: "#777", fontSize: 12 }}>{u.role}</span>
                <span className={`status-badge ${u.status === "pending" ? "status-pending" : "status-approved"}`}>{u.status}</span>
                <button className="admin-approve-btn">View</button>
              </div>
            ))}
          </div>
        )}

        {/* ─── LEADS ─── */}
        {tab === "leads" && (
          <>
            <div className="admin-section-title">Email Lead Pipeline</div>
            <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
              {[
                { label: "Total Leads Captured", val: ADMIN_STATS.emailLeads, sub: "Directory + Jobs + Signup" },
                { label: "Consent Given", val: "387", sub: "Can be shared with contractors" },
                { label: "Job Seeker Leads", val: "241", sub: "Opted in to contractor outreach" },
                { label: "Directory Unlocks", val: "171", sub: "Email + name captured" },
              ].map(s => (
                <div key={s.label} className="admin-stat-card">
                  <div className="admin-stat-label">{s.label}</div>
                  <div className="admin-stat-value yellow">{s.val}</div>
                  <div className="admin-stat-sub">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="admin-card">
              <div className="admin-card-title">How the Pipeline Works</div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.8 }}>
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: "#ccc" }}>1. Lead captured</strong> — User unlocks directory or checks "connect me" on jobs/signup.
                  Email + name stored in <code style={{ color: "var(--yellow)" }}>leads</code> table with consent_given = true.
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: "#ccc" }}>2. Matching</strong> — Supabase function matches lead trade + location to verified contractors actively looking.
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: "#ccc" }}>3. Notification</strong> — Contractor gets in-platform inbox notification with lead info.
                  Outreach goes through TradeFeed relay — user's raw email is never directly exposed until they respond.
                </div>
                <div>
                  <strong style={{ color: "#ccc" }}>4. Response</strong> — User receives forwarded message from TradeFeed, not direct spam.
                  One contractor per lead at a time to prevent spam. User controls opt-out.
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── NEWSLETTER ─── */}
        {tab === "newsletter" && (
          <div>
            <div className="admin-card">
              <div className="admin-section-title">API Integration Status</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {[
                  { label: "Pipeline Status", val: "🟢 Active", sub: "AI Pipeline v1.2" },
                  { label: "Last Published", val: "Today, 6:00 AM", sub: "Auto-scheduled" },
                  { label: "Open Rate", val: ADMIN_STATS.newsletterOpenRate, sub: `${ADMIN_STATS.newsletterSubscribers} subscribers` },
                ].map(m => (
                  <div key={m.label} className="admin-stat-card">
                    <div className="admin-stat-label">{m.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "white", margin: "6px 0 2px" }}>{m.val}</div>
                    <div className="admin-stat-sub">{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-card">
              <div className="admin-section-title">Published Issues</div>
              {DUMMY_NEWSLETTERS.map(nl => (
                <div key={nl.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1f1f1f", fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#ccc" }}>{nl.title}</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{nl.date}</div>
                  </div>
                  <span className="status-badge status-approved">Published</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── REVENUE ─── */}
        {tab === "revenue" && (
          <div>
            <div className="admin-stats-grid">
              {[
                { label: "MRR", val: `$${ADMIN_STATS.mrr.toLocaleString()}`, sub: ADMIN_STATS.mrrGrowth + " MoM", highlight: true },
                { label: "ARR (projected)", val: `$${(ADMIN_STATS.mrr * 12).toLocaleString()}`, sub: "Based on current MRR" },
                { label: "Paid Members", val: ADMIN_STATS.paidMembers, sub: "@ $20/mo" },
                { label: "Churn Rate", val: ADMIN_STATS.churnRate, sub: "Monthly" },
              ].map(m => (
                <div key={m.label} className={`admin-stat-card ${m.highlight ? "highlight" : ""}`}>
                  <div className="admin-stat-label">{m.label}</div>
                  <div className={`admin-stat-value ${m.highlight ? "green" : ""}`}>{m.val}</div>
                  <div className="admin-stat-sub">{m.sub}</div>
                </div>
              ))}
            </div>
            <div className="admin-card">
              <div className="admin-section-title">Revenue Breakdown</div>
              {[
                { source: "Paid Memberships ($20/mo)", amount: `$${ADMIN_STATS.mrr.toLocaleString()}`, pct: "100%" },
                { source: "Lead Sales to Contractors (coming soon)", amount: "$0", pct: "—" },
                { source: "Featured Directory Listings (coming soon)", amount: "$0", pct: "—" },
                { source: "Sponsored Intel Posts (coming soon)", amount: "$0", pct: "—" },
              ].map(r => (
                <div key={r.source} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1f1f1f", fontSize: 13, color: "#ccc", alignItems: "center" }}>
                  <span>{r.source}</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "white" }}>{r.amount}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>{r.pct}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
