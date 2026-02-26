import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// SEO META
// ═══════════════════════════════════════════════════════════════════
// <title>TradeFeed – Construction News, Jobs & Contractor Community</title>
// <meta name="description" content="TradeFeed is the #1 intelligence platform for construction subcontractors." />
// <meta property="og:title" content="TradeFeed – Construction News & Jobs" />
// <meta name="robots" content="index, follow" />

// ═══════════════════════════════════════════════════════════════════
// SUPABASE CONFIG (production)
// ═══════════════════════════════════════════════════════════════════
// import { createClient } from '@supabase/supabase-js'
// const supabase = createClient('YOUR_URL', 'YOUR_ANON_KEY')
// Tables: profiles, posts, newsletters, jobs, ghost_accounts, seeded_questions, leads
// profiles: id, email, name, handle, role (superadmin|verified_gc|verified_sub|free),
//           verified, approved, trade, location, license_number, bio, avatar_color,
//           consent_lead_sharing boolean, created_at
// ghost_accounts: id, name, handle, avatar_color, trade, is_active, last_posted_at
// seeded_questions: id, source, content, engagement_score, used boolean, created_at
// leads: id, email, name, trade, location, type (job_seeker|contact_request), created_at

// ═══════════════════════════════════════════════════════════════════
// REDDIT API — SINGLE CALL, FREE
// ═══════════════════════════════════════════════════════════════════
// Endpoint: GET https://www.reddit.com/r/Construction+Homebuilding+DIY/hot.json?limit=20
// No auth required for read-only. Returns top 20 posts by engagement.
// Call once daily via Supabase Edge Function cron:
//   POST /functions/v1/seed-questions
//   → Fetches Reddit, scores by upvotes+comments, converts to TradeFeed post ideas
//   → Inserts 20 rows into seeded_questions table
//   → Marks old ones as used
// Dashboard fetches: SELECT * FROM seeded_questions WHERE used = false ORDER BY engagement_score DESC LIMIT 20

// ═══════════════════════════════════════════════════════════════════
// GHOST ACCOUNT ENGINE
// ═══════════════════════════════════════════════════════════════════
// 10 fake accounts stored in ghost_accounts table
// Once daily cron: POST /functions/v1/ghost-reply
//   → Fetches top 10 posts by engagement from today
//   → For each of 10 ghost accounts, picks 5 posts, calls Claude API
//     with prompt: "You are {name}, a {trade} contractor. Reply to this post naturally: {content}"
//   → Inserts 5 replies per account = 50 total replies
//   → Updates ghost_accounts.last_posted_at
// SINGLE API CALL structure: batch all 50 requests in one Anthropic batch API call
//   POST https://api.anthropic.com/v1/messages/batches
//   Body: { requests: [ ...50 requests ] }
//   Cost: ~$0.003 per day at haiku pricing

// ═══════════════════════════════════════════════════════════════════
// DUMMY DATA
// ═══════════════════════════════════════════════════════════════════
const GHOST_ACCOUNTS = [
  { id: "g1", name: "Jake Moreno", handle: "@jake_frames", trade: "Framing", avatarColor: "#E74C3C", avatar: "J", verified: true },
  { id: "g2", name: "T. Briggs Electric", handle: "@tbriggs_elec", trade: "Electrical", avatarColor: "#0057FF", avatar: "T", verified: true },
  { id: "g3", name: "Ray Castillo", handle: "@raycast_concrete", trade: "Concrete", avatarColor: "#FF6B2B", avatar: "R", verified: true },
  { id: "g4", name: "Dana Holloway", handle: "@dana_hvac", trade: "HVAC", avatarColor: "#00C9A7", avatar: "D", verified: true },
  { id: "g5", name: "Marcus Webb", handle: "@webb_plumbing", trade: "Plumbing", avatarColor: "#9B59B6", avatar: "M", verified: true },
  { id: "g6", name: "Chris Lawson", handle: "@lawson_roofing", trade: "Roofing", avatarColor: "#F39C12", avatar: "C", verified: true },
  { id: "g7", name: "Apex MEP", handle: "@apex_mep", trade: "MEP", avatarColor: "#2ECC71", avatar: "A", verified: true },
  { id: "g8", name: "Sal Ferreira", handle: "@sal_finishing", trade: "Finishing", avatarColor: "#E67E22", avatar: "S", verified: true },
  { id: "g9", name: "NorthState Subs", handle: "@northstate_nc", trade: "General", avatarColor: "#1ABC9C", avatar: "N", verified: true },
  { id: "g10", name: "Pat Okafor", handle: "@pat_steel", trade: "Steel", avatarColor: "#C0392B", avatar: "P", verified: true },
];

const DUMMY_POSTS = [
  { id: 1, author: "Mike Reyes", handle: "@miker_concrete", avatar: "M", avatarColor: "#FF6B2B", time: "2h", content: "Just wrapped a 3-month job in Charlotte. Scheduling automation saved us 4 hours/week on dispatching alone. Anyone else using AI tools for crew coordination? Game changer for operations.", likes: 47, reposts: 8, replies: 12, tags: ["#automation", "#concrete"], verified: true, liked: false, reposted: false, trending: true, ghostReplies: [] },
  { id: 2, author: "D. Hollis Electric", handle: "@dhollis_electric", avatar: "D", avatarColor: "#0057FF", time: "4h", content: "Permit office in Mecklenburg finally went digital. Change requests that took 2 weeks now take 2 days. Massive for cash flow timing. If you're still doing paper submittals you're losing money.", likes: 83, reposts: 24, replies: 21, tags: ["#permits", "#electrical"], verified: true, liked: false, reposted: false, trending: true, ghostReplies: [] },
  { id: 3, author: "TradeCrew NC", handle: "@tradecrewnc", avatar: "T", avatarColor: "#00C9A7", time: "6h", content: "Hiring 2 experienced framers for a commercial project in Raleigh starting March. $36/hr, benefits, consistent work. DM or drop your contact below. Need people who show up.", likes: 29, reposts: 41, replies: 18, tags: ["#hiring", "#framing"], verified: false, liked: false, reposted: false, trending: false, ghostReplies: [] },
  { id: 4, author: "Sam Vasquez", handle: "@samv_plumbing", avatar: "S", avatarColor: "#9B59B6", time: "8h", content: "Material costs up 18% YOY on copper. Anyone finding better regional suppliers in the Carolinas? Looking to cut overhead without cutting corners. Happy to share what I've found too.", likes: 61, reposts: 15, replies: 34, tags: ["#materials", "#plumbing"], verified: true, liked: false, reposted: false, trending: false, ghostReplies: [] },
  { id: 5, author: "BuildOps Daily", handle: "@buildops", avatar: "B", avatarColor: "#FFD600", time: "10h", content: "New OSHA update for residential contractors in the Southeast goes into effect April 1. Falls protection requirements are changing significantly — make sure your team is briefed before the deadline.", likes: 112, reposts: 67, replies: 45, tags: ["#OSHA", "#compliance"], verified: true, liked: false, reposted: false, trending: true, ghostReplies: [] },
  { id: 6, author: "Apex Structures", handle: "@apexstructures", avatar: "A", avatarColor: "#E74C3C", time: "12h", content: "Just landed a $4.2M commercial project in Durham. Actively looking for reliable subs across framing, MEP, and concrete. If you're licensed and bonded in NC reach out. Timeline is Q2 start.", likes: 198, reposts: 93, replies: 61, tags: ["#subcontracting", "#bidding"], verified: true, liked: false, reposted: false, trending: true, ghostReplies: [] },
];

const DUMMY_VERIFIED_CONTRACTORS = [
  { id: 1, name: "Apex Structures LLC", type: "GC", trade: "General Contractor", location: "Charlotte, NC", rating: 4.9, reviews: 47, licensed: true, insured: true, yearsOp: 12, bio: "Commercial and multi-family GC serving the Carolinas.", avatar: "A", avatarColor: "#E74C3C", email: "contact@apexstructures.com", phone: "(704) 555-0182" },
  { id: 2, name: "D. Hollis Electric", type: "Sub", trade: "Electrical", location: "Raleigh, NC", rating: 5.0, reviews: 31, licensed: true, insured: true, yearsOp: 8, bio: "Commercial electrical work, panel upgrades, new construction.", avatar: "D", avatarColor: "#0057FF", email: "dhollis@electric.com", phone: "(919) 555-0147" },
  { id: 3, name: "Carolina Concrete Co.", type: "Sub", trade: "Concrete", location: "Durham, NC", rating: 4.8, reviews: 22, licensed: true, insured: true, yearsOp: 15, bio: "Foundations, flatwork, tilt-wall. Southeast specialists.", avatar: "C", avatarColor: "#2ECC71", email: "info@carolinaconcrete.com", phone: "(984) 555-0209" },
  { id: 4, name: "FlowRight Plumbing Systems", type: "Sub", trade: "Plumbing", location: "Greensboro, NC", rating: 4.7, reviews: 18, licensed: true, insured: true, yearsOp: 6, bio: "Commercial plumbing, rough-in, and service work.", avatar: "F", avatarColor: "#9B59B6", email: "flowright@plumbing.com", phone: "(336) 555-0093" },
  { id: 5, name: "Summit Roofing Co.", type: "Sub", trade: "Roofing", location: "Fayetteville, NC", rating: 4.9, reviews: 39, licensed: true, insured: true, yearsOp: 11, bio: "Commercial and industrial roofing, TPO/EPDM specialists.", avatar: "S", avatarColor: "#F39C12", email: "summit@roofing.com", phone: "(910) 555-0317" },
  { id: 6, name: "Meridian Build Group", type: "GC", trade: "General Contractor", location: "Charlotte, NC", rating: 4.6, reviews: 28, licensed: true, insured: true, yearsOp: 9, bio: "Multi-family and mixed-use development across the Southeast.", avatar: "M", avatarColor: "#00C9A7", email: "info@meridianbuild.com", phone: "(704) 555-0441" },
  { id: 7, name: "AirPro Mechanical", type: "Sub", trade: "HVAC", location: "Wilmington, NC", rating: 4.8, reviews: 15, licensed: true, insured: true, yearsOp: 7, bio: "Commercial HVAC install and service, all equipment types.", avatar: "A", avatarColor: "#E67E22", email: "airpro@mechanical.com", phone: "(910) 555-0528" },
  { id: 8, name: "Volt Forward Inc.", type: "Sub", trade: "Electrical", location: "Raleigh, NC", rating: 4.7, reviews: 21, licensed: true, insured: true, yearsOp: 5, bio: "New construction electrical, data centers, commercial builds.", avatar: "V", avatarColor: "#C0392B", email: "volt@forward.com", phone: "(919) 555-0663" },
  { id: 9, name: "TriState Steel Erectors", type: "Sub", trade: "Structural Steel", location: "Charlotte, NC", rating: 5.0, reviews: 12, licensed: true, insured: true, yearsOp: 20, bio: "Structural steel fab and erection, bridges to buildings.", avatar: "T", avatarColor: "#1ABC9C", email: "tristate@steel.com", phone: "(704) 555-0774" },
  { id: 10, name: "Blue Ridge Framing", type: "Sub", trade: "Framing", location: "Asheville, NC", rating: 4.9, reviews: 34, licensed: true, insured: true, yearsOp: 14, bio: "Wood and metal framing, commercial and residential.", avatar: "B", avatarColor: "#8E44AD", email: "blueridge@framing.com", phone: "(828) 555-0885" },
];

const DUMMY_JOBS = [
  { id: 1, title: "Commercial Framing Lead", company: "Apex Structures", location: "Charlotte, NC", type: "Full-time", pay: "$32–$40/hr", posted: "1d ago", tags: ["Framing", "Commercial"], verified: true },
  { id: 2, title: "Electrical Foreman", company: "Volt Forward Inc.", location: "Raleigh, NC", type: "Contract", pay: "$45–$55/hr", posted: "2d ago", tags: ["Electrical", "Foreman"], verified: true },
  { id: 3, title: "Concrete Finisher", company: "SolidBase Co.", location: "Durham, NC", type: "Full-time", pay: "$28–$35/hr", posted: "3d ago", tags: ["Concrete", "Finishing"], verified: false },
  { id: 4, title: "Plumbing Estimator", company: "FlowRight Systems", location: "Greensboro, NC", type: "Full-time", pay: "$55k–$70k/yr", posted: "4d ago", tags: ["Plumbing", "Estimating"], verified: true },
  { id: 5, title: "HVAC Install Tech", company: "AirPro Mechanical", location: "Wilmington, NC", type: "Seasonal", pay: "$30–$38/hr", posted: "5d ago", tags: ["HVAC", "Installation"], verified: false },
  { id: 6, title: "Project Manager – Multi-family", company: "Meridian Build Group", location: "Charlotte, NC", type: "Full-time", pay: "$75k–$95k/yr", posted: "5d ago", tags: ["PM", "Multi-family"], verified: true },
  { id: 7, title: "Roofing Supervisor", company: "Summit Roofing Co.", location: "Fayetteville, NC", type: "Full-time", pay: "$38–$48/hr", posted: "6d ago", tags: ["Roofing", "Supervisor"], verified: true },
];

const DUMMY_NEWSLETTERS = [
  { id: 1, date: "Feb 24, 2026", title: "Southeast Construction Market: Week in Review", summary: "Commercial starts +7%, NC lien law update, Skanska $340M award, rebar stabilizes.", preview: "Commercial construction starts in the Southeast rose 7% this week driven by data center demand...", full: `Commercial construction starts in the Southeast rose 7% this week, driven by data center demand in the Research Triangle.\n\nKEY LEGISLATIVE UPDATE\nNorth Carolina's updated lien law goes into effect June 1st. Subcontractors should review their billing processes now.\n\nMATERIAL WATCH\nRebar prices stabilized this week. Lumber futures trending down — potential relief for framers heading into spring.\n\nMAJOR CONTRACT AWARD\nSkanska won a $340M hospital expansion in Charlotte. Subcontractor bids open in April across framing, MEP, concrete.\n\nGLOBAL ANGLE\nSaudi Arabia's NEOM project continues to absorb global steel supply through Q3.`, published: true },
  { id: 2, date: "Feb 23, 2026", title: "Labor Market Tightens as Spring Season Approaches", summary: "Trade labor demand +23% YOY, electricians and HVAC techs in shortest supply.", preview: "Skilled trade labor demand is up 23% YOY, with electricians and HVAC techs seeing the highest shortage...", full: `Skilled trade labor demand is up 23% YOY. Electricians and HVAC techs in highest shortage nationally.\n\nOUTLOOK\nSpring construction season accelerates hiring pressure. Firms that haven't locked crews by March face 15-20% higher labor costs.\n\nWAGE TRENDS\nAverage field wages in the Southeast up 8.4% YOY. Foreman and supervisor roles seeing largest increases.`, published: true },
];

// Seeded post ideas from Reddit API (shown in admin dashboard)
const DUMMY_SEEDED_QUESTIONS = [
  { id: 1, source: "r/Construction", content: "What's your biggest bottleneck on commercial jobs right now — labor, materials, or permits?", engagementScore: 2840, used: false },
  { id: 2, source: "r/Homebuilding", content: "How are you handling the copper price spike — passing it on to GCs or absorbing it?", engagementScore: 1920, used: false },
  { id: 3, source: "r/Construction", content: "Any subcontractors successfully negotiating payment terms shorter than net-30? What worked?", engagementScore: 1750, used: true },
  { id: 4, source: "r/DIY", content: "Framing crews: wood vs metal stud on commercial builds in the Southeast — cost difference this year?", engagementScore: 1680, used: false },
  { id: 5, source: "r/Construction", content: "OSHA update hits April 1 — is your team actually ready or is this going to be a scramble?", engagementScore: 3100, used: false },
  { id: 6, source: "r/Homebuilding", content: "What AI or scheduling software actually saved you real time in 2025?", engagementScore: 2200, used: false },
  { id: 7, source: "r/Construction", content: "Best strategy for getting paid faster by GCs without destroying the relationship?", engagementScore: 2950, used: false },
  { id: 8, source: "r/Construction", content: "Anyone else seeing GCs try to push more liability onto subs in new contracts this year?", engagementScore: 2410, used: false },
];

const ADMIN_STATS = {
  totalUsers: 1847, newUsersToday: 23, newUsers7d: 187,
  paidMembers: 312, verifiedContractors: 891, pendingVerification: 14,
  mrr: 6240, mrrGrowth: "+18%", churnRate: "2.1%",
  totalPosts: 4821, postsToday: 67, avgEngagementRate: "8.4%",
  totalPageviews: 28400, pageviews7d: 9200, avgSessionMin: "4:32",
  newsletterOpenRate: "41%", newsletterSubscribers: 1204,
  jobPostings: 89, jobApplications: 347, emailLeads: 412,
  topTrades: ["Electrical", "Framing", "Concrete", "Plumbing", "HVAC"],
  ghostAccountsActive: 10, ghostRepliesToday: 50, ghostLastRun: "Today, 7:00 AM",
  recentSignups: [
    { name: "James T.", role: "verified", time: "10m ago", status: "pending" },
    { name: "Carolina Roofing LLC", role: "verified", time: "34m ago", status: "pending" },
    { name: "Rachel M.", role: "free", time: "1h ago", status: "approved" },
    { name: "TriState Concrete", role: "verified", time: "2h ago", status: "approved" },
    { name: "Brett H.", role: "free", time: "3h ago", status: "approved" },
  ],
  weeklyEngagement: [
    { day: "Mon", posts: 45, views: 1200 }, { day: "Tue", posts: 62, views: 1850 },
    { day: "Wed", posts: 58, views: 1600 }, { day: "Thu", posts: 71, views: 2100 },
    { day: "Fri", posts: 83, views: 2400 }, { day: "Sat", posts: 34, views: 890 },
    { day: "Sun", posts: 28, views: 760 },
  ],
};

const TICKER_ITEMS = [
  "🏗️ Commercial starts +7% Southeast", "⚡ Electrical trade demand +23% YOY",
  "📋 NC Lien Law update June 1", "🔩 Rebar prices stabilize at $890/ton",
  "💼 Skanska $340M Charlotte project — subs wanted", "🏠 Mecklenburg permits -12% YOY",
  "🌍 Global steel tight through Q3", "📈 TradeFeed now 1,800+ members",
];

const NC_LOCATIONS = ["All Locations", "Charlotte, NC", "Raleigh, NC", "Durham, NC", "Greensboro, NC", "Wilmington, NC", "Fayetteville, NC", "Asheville, NC", "Winston-Salem, NC"];
const TRADES_LIST = ["All Trades", "General Contractor", "Electrical", "Plumbing", "Framing", "Concrete", "HVAC", "Roofing", "Structural Steel", "MEP", "Finishing"];

// ══════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --yellow: #FFD600; --orange: #FF6B2B; --blue: #0057FF; --teal: #00C9A7;
    --dark: #111111; --mid: #444; --light: #F5F4EF; --white: #ffffff;
    --border: #E2DFD8; --card: #ffffff; --verified: #0057FF; --green: #00C9A7;
    --font-display: 'Syne', sans-serif; --font-body: 'DM Sans', sans-serif;
    --radius: 14px; --shadow: 0 2px 16px rgba(0,0,0,0.07);
  }
  html { scroll-behavior: smooth; }
  body { background: var(--light); font-family: var(--font-body); color: var(--dark); -webkit-font-smoothing: antialiased; }

  /* TICKER */
  .ticker-wrap { background: var(--yellow); overflow: hidden; height: 32px; display: flex; align-items: center; }
  .ticker-label { background: var(--dark); color: var(--yellow); font-size: 10px; font-weight: 800; padding: 0 14px; height: 100%; display: flex; align-items: center; letter-spacing: 1.5px; white-space: nowrap; font-family: var(--font-display); flex-shrink: 0; }
  .ticker-track { display: flex; gap: 56px; white-space: nowrap; animation: ticker 32s linear infinite; padding-left: 40px; }
  .ticker-item { font-size: 11px; font-weight: 600; color: var(--dark); }
  @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  /* NAV */
  .nav { position: sticky; top: 0; z-index: 200; background: var(--dark); display: flex; align-items: center; justify-content: space-between; padding: 0 28px; height: 58px; border-bottom: 3px solid var(--yellow); }
  .nav-logo { font-family: var(--font-display); font-weight: 800; font-size: 19px; color: var(--yellow); letter-spacing: -0.5px; cursor: pointer; }
  .nav-logo span { color: var(--white); }
  .nav-links { display: flex; gap: 2px; }
  .nav-link { font-family: var(--font-body); font-size: 13px; font-weight: 500; color: #aaa; padding: 6px 12px; border-radius: 8px; cursor: pointer; transition: all 0.18s; border: none; background: none; }
  .nav-link:hover { color: var(--white); background: rgba(255,255,255,0.08); }
  .nav-link.active { color: var(--yellow); background: rgba(255,214,0,0.1); }
  .nav-right { display: flex; align-items: center; gap: 8px; }
  .nav-user { color: #ccc; font-size: 12px; display: flex; align-items: center; gap: 6px; }
  .nav-cta { background: var(--yellow); color: var(--dark); border: none; padding: 7px 16px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; font-family: var(--font-body); transition: all 0.18s; }
  .nav-cta:hover { background: var(--orange); color: white; }
  .nav-ghost { background: transparent; border: 1.5px solid #444; color: #aaa; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: var(--font-body); transition: all 0.18s; }
  .nav-ghost:hover { border-color: #777; color: white; }
  .admin-badge { background: var(--orange); color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.5px; }

  /* LAYOUT */
  .page { max-width: 1100px; margin: 0 auto; padding: 36px 24px; }
  .page-wide { max-width: 1240px; margin: 0 auto; padding: 36px 24px; }
  .two-col { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
  @media (max-width: 800px) { .two-col { grid-template-columns: 1fr; } .nav-links { display: none; } }

  /* HERO */
  .hero-strip { background: var(--dark); border-radius: var(--radius); padding: 36px 44px; margin-bottom: 32px; display: flex; align-items: center; justify-content: space-between; overflow: hidden; position: relative; }
  .hero-strip::before { content: ''; position: absolute; right: -50px; top: -50px; width: 280px; height: 280px; border-radius: 50%; background: var(--yellow); opacity: 0.07; }
  .hero-strip h1 { font-family: var(--font-display); font-size: 34px; font-weight: 800; color: var(--white); line-height: 1.1; max-width: 460px; }
  .hero-strip h1 span { color: var(--yellow); }
  .hero-strip p { color: #777; font-size: 14px; margin-top: 10px; max-width: 380px; line-height: 1.6; }
  .hero-badges { display: flex; gap: 7px; margin-top: 14px; flex-wrap: wrap; }
  .badge { background: rgba(255,255,255,0.07); color: #ccc; padding: 4px 11px; border-radius: 20px; font-size: 11px; font-weight: 500; }
  .badge.yellow { background: var(--yellow); color: var(--dark); }
  .hero-emoji { font-size: 64px; opacity: 0.6; }

  /* SECTION LABEL */
  .section-label { font-family: var(--font-display); font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: var(--orange); margin-bottom: 14px; }
  .accent-bar { height: 3px; width: 36px; background: var(--yellow); border-radius: 2px; margin-bottom: 14px; }

  /* COMPOSE BOX */
  .compose-box { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); padding: 16px 20px; margin-bottom: 16px; box-shadow: var(--shadow); }
  .compose-inner { display: flex; gap: 12px; }
  .compose-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--yellow); color: var(--dark); display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-display); font-size: 15px; flex-shrink: 0; }
  .compose-textarea { flex: 1; border: none; outline: none; font-family: var(--font-body); font-size: 15px; resize: none; background: transparent; color: var(--dark); min-height: 60px; }
  .compose-textarea::placeholder { color: #bbb; }
  .compose-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
  .compose-actions { display: flex; gap: 6px; }
  .compose-action-btn { background: none; border: none; font-size: 17px; cursor: pointer; padding: 4px 6px; border-radius: 6px; transition: background 0.15s; }
  .compose-action-btn:hover { background: #f0f0f0; }
  .compose-submit { background: var(--dark); color: white; border: none; padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 13px; cursor: pointer; font-family: var(--font-body); transition: all 0.18s; }
  .compose-submit:hover { background: var(--blue); }
  .compose-char { font-size: 11px; color: #bbb; }

  /* POST CARD */
  .post-card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); padding: 18px 20px; margin-bottom: 12px; transition: border-color 0.15s, box-shadow 0.15s; box-shadow: var(--shadow); position: relative; }
  .post-card:hover { border-color: #d0cdc5; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
  .post-card.trending { border-left: 3px solid var(--orange); }
  .trending-tag { position: absolute; top: 12px; right: 14px; background: var(--orange); color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.5px; }
  .post-header { display: flex; align-items: flex-start; gap: 11px; margin-bottom: 11px; }
  .post-avatar { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-display); font-size: 16px; flex-shrink: 0; color: white; }
  .post-avatar.light { color: var(--dark); }
  .post-meta { flex: 1; }
  .post-name-row { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .post-name { font-weight: 700; font-size: 14px; }
  .verified-badge { color: var(--verified); font-size: 14px; }
  .post-handle { color: #999; font-size: 12px; }
  .post-time { color: #bbb; font-size: 12px; }
  .post-content { font-size: 14px; line-height: 1.65; color: #2a2a2a; margin-bottom: 13px; }
  .post-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 13px; }
  .post-tag { color: var(--blue); font-size: 12px; font-weight: 500; cursor: pointer; }
  .post-actions { display: flex; gap: 0; }
  .post-action { color: #aaa; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 6px 14px 6px 0; border: none; background: none; font-family: var(--font-body); transition: color 0.15s; border-radius: 6px; }
  .post-action:hover { color: var(--blue); }
  .post-action.liked { color: #E74C3C; }
  .post-action.reposted { color: var(--teal); }
  .post-action-count { font-size: 12px; }
  .ghost-reply { background: #f8f7f2; border-left: 3px solid var(--teal); border-radius: 8px; padding: 10px 14px; margin-top: 8px; font-size: 13px; line-height: 1.55; color: #333; }
  .ghost-reply-meta { font-size: 11px; color: #999; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }

  /* VERIFIED BADGE TOOLTIP */
  .verified-wrap { position: relative; display: inline-flex; align-items: center; }
  .verified-tooltip { position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); background: var(--dark); color: white; font-size: 11px; padding: 5px 10px; border-radius: 6px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.15s; z-index: 10; }
  .verified-wrap:hover .verified-tooltip { opacity: 1; }

  /* GATE */
  .gate-wrapper { position: relative; }
  .gate-blur { filter: blur(5px); pointer-events: none; user-select: none; }
  .gate-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; background: linear-gradient(to bottom, transparent 0%, rgba(245,244,239,0.97) 35%); border-radius: var(--radius); }
  .gate-box { background: var(--white); border: 2px solid var(--yellow); border-radius: var(--radius); padding: 28px 32px; text-align: center; box-shadow: 0 8px 40px rgba(0,0,0,0.13); max-width: 360px; width: 90%; }
  .gate-icon { font-size: 30px; margin-bottom: 10px; }
  .gate-box h3 { font-family: var(--font-display); font-size: 19px; font-weight: 800; margin-bottom: 8px; }
  .gate-box p { font-size: 13px; color: #666; margin-bottom: 18px; line-height: 1.5; }
  .gate-btns { display: flex; flex-direction: column; gap: 9px; }
  .gate-note { font-size: 11px; color: #aaa; margin-top: 10px; }

  /* LOCKED PAGE */
  .locked-page { position: relative; min-height: 500px; overflow: hidden; border-radius: var(--radius); }
  .locked-content-blur { filter: blur(8px) brightness(0.4); pointer-events: none; user-select: none; border-radius: var(--radius); overflow: hidden; }
  .locked-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 20; }
  .locked-box { background: rgba(10,10,10,0.92); border: 2px solid var(--yellow); border-radius: 18px; padding: 44px 48px; text-align: center; max-width: 480px; box-shadow: 0 20px 80px rgba(0,0,0,0.6); backdrop-filter: blur(10px); }
  .locked-box h2 { font-family: var(--font-display); font-size: 26px; font-weight: 800; color: white; margin-bottom: 12px; }
  .locked-box p { font-size: 14px; color: #888; line-height: 1.6; margin-bottom: 24px; }
  .locked-features { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; text-align: left; }
  .locked-feature { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #ccc; }
  .locked-feature-icon { width: 28px; height: 28px; border-radius: 8px; background: rgba(255,214,0,0.15); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }

  /* FORUM (verified only) */
  .forum-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .forum-verified-banner { background: linear-gradient(135deg, #001a66 0%, #003380 100%); border: 1px solid #0057FF44; border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .forum-verified-banner p { font-size: 13px; color: #99bbff; line-height: 1.5; }
  .forum-post { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); padding: 18px 20px; margin-bottom: 12px; box-shadow: var(--shadow); }
  .forum-post-locked { opacity: 0.35; pointer-events: none; }
  .forum-lock-overlay { position: relative; }
  .forum-lock-msg { background: var(--dark); color: var(--yellow); font-size: 12px; font-weight: 700; padding: 8px 14px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 12px; }

  /* BUTTONS */
  .btn-primary { background: var(--yellow); color: var(--dark); border: none; padding: 12px 22px; border-radius: 10px; font-weight: 700; font-size: 14px; cursor: pointer; font-family: var(--font-body); transition: all 0.18s; width: 100%; }
  .btn-primary:hover { background: var(--orange); color: white; }
  .btn-secondary { background: transparent; color: var(--blue); border: 2px solid var(--blue); padding: 10px 22px; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; font-family: var(--font-body); transition: all 0.18s; width: 100%; }
  .btn-secondary:hover { background: var(--blue); color: white; }
  .btn-dark { background: var(--dark); color: white; border: none; padding: 10px 22px; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; font-family: var(--font-body); transition: all 0.18s; }
  .btn-dark:hover { background: #222; }

  /* SIDEBAR */
  .widget { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); padding: 18px; margin-bottom: 18px; box-shadow: var(--shadow); }
  .widget-title { font-family: var(--font-display); font-weight: 700; font-size: 14px; margin-bottom: 14px; }
  .widget-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--border); }
  .widget-row:last-child { border-bottom: none; }
  .widget-label { font-size: 13px; color: #555; }
  .widget-val { font-weight: 700; font-size: 13px; }
  .widget-delta { font-size: 10px; font-weight: 600; }
  .delta-up { color: var(--teal); } .delta-flat { color: #aaa; } .delta-down { color: var(--orange); }

  /* CONTRACTOR CARD */
  .contractor-card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); padding: 20px; box-shadow: var(--shadow); transition: border-color 0.15s, transform 0.15s; cursor: pointer; }
  .contractor-card:hover { border-color: var(--yellow); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
  .contractor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .contractor-avatar-wrap { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .contractor-avatar { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-display); font-size: 18px; color: white; flex-shrink: 0; }
  .contractor-name { font-family: var(--font-display); font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 5px; }
  .contractor-type-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
  .badge-gc { background: rgba(255,107,43,0.15); color: var(--orange); }
  .badge-sub { background: rgba(0,87,255,0.1); color: var(--blue); }
  .contractor-trade { font-size: 12px; color: #777; margin-bottom: 8px; }
  .contractor-location { font-size: 12px; color: #888; display: flex; align-items: center; gap: 4px; }
  .contractor-rating { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: var(--dark); margin-top: 8px; }
  .contractor-badges { display: flex; gap: 5px; margin-top: 8px; flex-wrap: wrap; }
  .trust-badge { font-size: 10px; background: #f0f0f0; color: #555; padding: 2px 8px; border-radius: 20px; }
  .trust-badge.green { background: rgba(0,201,167,0.12); color: #007a63; }

  /* DIRECTORY GATE */
  .dir-gate { background: var(--dark); border-radius: var(--radius); padding: 28px 32px; margin-top: 20px; text-align: center; border: 2px dashed #333; }
  .dir-gate h3 { font-family: var(--font-display); font-size: 20px; color: white; font-weight: 800; margin-bottom: 8px; }
  .dir-gate p { font-size: 13px; color: #666; margin-bottom: 20px; line-height: 1.6; }
  .dir-gate-form { display: flex; gap: 10px; max-width: 440px; margin: 0 auto; }
  .dir-gate-form input { flex: 1; padding: 11px 14px; border: 1.5px solid #333; border-radius: 10px; font-size: 13px; font-family: var(--font-body); background: #1a1a1a; color: white; outline: none; }
  .dir-gate-form input:focus { border-color: var(--yellow); }
  .dir-consent { font-size: 11px; color: #555; margin-top: 10px; max-width: 440px; margin-left: auto; margin-right: auto; line-height: 1.5; }
  .dir-consent input { margin-right: 5px; }

  /* VERIFICATION HOW IT WORKS */
  .verify-how { background: linear-gradient(135deg, #001833 0%, #00112b 100%); border-radius: var(--radius); padding: 28px 32px; margin-bottom: 28px; border: 1px solid #0057FF33; }
  .verify-how h3 { font-family: var(--font-display); font-weight: 800; font-size: 18px; color: white; margin-bottom: 6px; }
  .verify-how p { font-size: 13px; color: #6688aa; margin-bottom: 20px; }
  .verify-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  @media (max-width: 700px) { .verify-steps { grid-template-columns: 1fr 1fr; } }
  .verify-step { background: rgba(0,87,255,0.08); border: 1px solid #0057FF22; border-radius: 10px; padding: 14px; text-align: center; }
  .verify-step-num { width: 28px; height: 28px; background: var(--blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: white; margin: 0 auto 8px; }
  .verify-step-title { font-size: 12px; font-weight: 700; color: white; margin-bottom: 4px; }
  .verify-step-desc { font-size: 11px; color: #5577aa; line-height: 1.4; }

  /* JOB CARD */
  .job-card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); padding: 18px 22px; margin-bottom: 12px; display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; transition: border-color 0.15s, transform 0.15s; box-shadow: var(--shadow); }
  .job-card:hover { border-color: var(--yellow); transform: translateY(-1px); }
  .job-title { font-family: var(--font-display); font-weight: 700; font-size: 15px; margin-bottom: 3px; display: flex; align-items: center; gap: 6px; }
  .job-company { font-size: 13px; color: #555; margin-bottom: 7px; }
  .job-meta { display: flex; gap: 10px; flex-wrap: wrap; }
  .job-meta-item { font-size: 12px; color: #888; }
  .job-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px; }
  .job-tag { background: #F0EDE6; color: #555; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 500; }
  .job-right { text-align: right; flex-shrink: 0; }
  .job-pay { font-weight: 700; font-size: 14px; color: var(--teal); }
  .job-posted { font-size: 11px; color: #aaa; margin: 3px 0 8px; }
  .btn-apply { background: var(--blue); color: white; border: none; padding: 7px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: all 0.18s; }
  .btn-apply:hover { background: #0040cc; }

  /* JOB SEEKER CONSENT */
  .job-consent-box { background: #F8FCFF; border: 1.5px solid #c8e6ff; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px; }
  .job-consent-box h4 { font-family: var(--font-display); font-size: 14px; font-weight: 700; margin-bottom: 8px; color: var(--blue); }
  .job-consent-box p { font-size: 12px; color: #555; line-height: 1.6; margin-bottom: 12px; }
  .consent-checkbox-row { display: flex; align-items: flex-start; gap: 10px; font-size: 12px; color: #444; line-height: 1.5; cursor: pointer; }
  .consent-checkbox-row input { margin-top: 2px; accent-color: var(--blue); width: 15px; height: 15px; flex-shrink: 0; cursor: pointer; }

  /* NEWSLETTER */
  .nl-card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; margin-bottom: 18px; box-shadow: var(--shadow); }
  .nl-header { background: var(--dark); padding: 18px 22px; display: flex; align-items: flex-start; justify-content: space-between; }
  .nl-date { color: var(--yellow); font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
  .nl-title { font-family: var(--font-display); font-size: 18px; font-weight: 800; color: white; line-height: 1.2; }
  .nl-api-badge { background: rgba(0,201,167,0.2); color: var(--teal); font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; white-space: nowrap; margin-left: 12px; flex-shrink: 0; }
  .nl-body { padding: 22px; }
  .nl-summary { font-size: 12px; color: #888; background: #F8F7F2; padding: 8px 12px; border-radius: 8px; margin-bottom: 14px; font-style: italic; }
  .nl-full { font-size: 14px; line-height: 1.85; color: #2a2a2a; white-space: pre-line; }

  /* MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(3px); }
  .modal { background: white; border-radius: 18px; padding: 36px; width: 100%; max-width: 440px; position: relative; max-height: 90vh; overflow-y: auto; }
  .modal h2 { font-family: var(--font-display); font-size: 22px; font-weight: 800; margin-bottom: 5px; }
  .modal-sub { color: #888; font-size: 13px; margin-bottom: 22px; }
  .modal-close { position: absolute; top: 14px; right: 14px; background: #f5f5f5; border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 14px; color: #777; display: flex; align-items: center; justify-content: center; }
  .form-group { margin-bottom: 14px; }
  .form-label { font-size: 11px; font-weight: 600; color: #555; margin-bottom: 5px; display: block; letter-spacing: 0.3px; }
  .form-input { width: 100%; padding: 11px 13px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 14px; font-family: var(--font-body); transition: border-color 0.18s; outline: none; background: #fafafa; }
  .form-input:focus { border-color: var(--blue); background: white; }
  .form-toggle { text-align: center; font-size: 13px; color: #777; margin-top: 14px; }
  .form-toggle a { color: var(--blue); font-weight: 600; cursor: pointer; }

  /* TIER SELECT */
  .tier-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .tier-opt { border: 2px solid var(--border); border-radius: 10px; padding: 13px; cursor: pointer; text-align: center; transition: all 0.18s; }
  .tier-opt:hover { border-color: #ccc; }
  .tier-opt.active { border-color: var(--yellow); background: #FFFBE6; }
  .tier-opt-title { font-weight: 700; font-size: 13px; }
  .tier-opt-price { font-size: 11px; color: #888; margin-top: 2px; }
  .tier-opt-badge { font-size: 10px; margin-top: 3px; }

  /* VERIFY BOX */
  .verify-section { background: linear-gradient(135deg, #EBF4FF 0%, #F0FFF8 100%); border: 2px solid #c8e6ff; border-radius: 12px; padding: 16px; margin: 14px 0; }
  .verify-section h4 { font-family: var(--font-display); font-size: 14px; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .verify-section p { font-size: 12px; color: #555; line-height: 1.5; margin-bottom: 12px; }
  .verify-fields { display: flex; flex-direction: column; gap: 8px; }

  /* PROFILE MODAL */
  .profile-modal { background: white; border-radius: 18px; padding: 0; width: 100%; max-width: 500px; overflow: hidden; }
  .profile-modal-header { background: var(--dark); padding: 28px 28px 20px; }
  .profile-modal-avatar { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 24px; color: white; font-family: var(--font-display); margin-bottom: 12px; }
  .profile-modal-name { font-family: var(--font-display); font-size: 20px; font-weight: 800; color: white; display: flex; align-items: center; gap: 8px; }
  .profile-modal-body { padding: 24px 28px; }
  .profile-stat-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .profile-stat { text-align: center; background: #f8f7f2; border-radius: 10px; padding: 12px; }
  .profile-stat-val { font-family: var(--font-display); font-size: 20px; font-weight: 800; }
  .profile-stat-label { font-size: 11px; color: #888; margin-top: 2px; }

  /* ADMIN DASHBOARD */
  .admin-page { background: #0F0F0F; min-height: 100vh; color: white; }
  .admin-header { background: #1a1a1a; border-bottom: 2px solid var(--yellow); padding: 18px 32px; display: flex; align-items: center; justify-content: space-between; }
  .admin-header h1 { font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--yellow); }
  .admin-body { max-width: 1300px; margin: 0 auto; padding: 28px; }
  .admin-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  @media (max-width: 900px) { .admin-stats-grid { grid-template-columns: repeat(2,1fr); } }
  .admin-stat-card { background: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a; padding: 18px; }
  .admin-stat-card.highlight { border-color: var(--yellow); }
  .admin-stat-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #666; margin-bottom: 8px; }
  .admin-stat-value { font-family: var(--font-display); font-size: 28px; font-weight: 800; color: white; }
  .admin-stat-value.yellow { color: var(--yellow); }
  .admin-stat-value.green { color: var(--teal); }
  .admin-stat-sub { font-size: 11px; color: #555; margin-top: 4px; }
  .admin-stat-delta { font-size: 12px; font-weight: 700; margin-top: 4px; }
  .admin-two-col { display: grid; grid-template-columns: 1fr 380px; gap: 20px; margin-bottom: 24px; }
  @media (max-width: 900px) { .admin-two-col { grid-template-columns: 1fr; } }
  .admin-card { background: #1a1a1a; border-radius: 12px; border: 1px solid #2a2a2a; padding: 20px; margin-bottom: 20px; }
  .admin-card-title { font-family: var(--font-display); font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #888; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; }
  .admin-table { width: 100%; }
  .admin-tr { display: grid; grid-template-columns: 1fr 80px 90px 70px; gap: 12px; padding: 10px 0; border-bottom: 1px solid #222; align-items: center; font-size: 13px; }
  .admin-tr:last-child { border-bottom: none; }
  .admin-tr-head { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #555; letter-spacing: 1px; padding-bottom: 8px; }
  .status-badge { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px; }
  .status-pending { background: rgba(255,214,0,0.15); color: var(--yellow); }
  .status-approved { background: rgba(0,201,167,0.15); color: var(--teal); }
  .admin-bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 80px; }
  .admin-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .admin-bar { width: 100%; background: var(--yellow); border-radius: 4px 4px 0 0; opacity: 0.85; transition: opacity 0.15s; cursor: pointer; }
  .admin-bar:hover { opacity: 1; }
  .admin-bar-label { font-size: 10px; color: #555; }
  .admin-approve-btn { background: var(--teal); color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; font-family: var(--font-body); }
  .admin-section-title { font-family: var(--font-display); font-size: 16px; font-weight: 800; color: white; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #222; }

  /* SEEDED QUESTIONS */
  .seed-card { background: #111; border: 1px solid #2a2a2a; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
  .seed-card.used { opacity: 0.4; }
  .seed-source { font-size: 10px; font-weight: 700; color: var(--orange); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
  .seed-content { font-size: 13px; color: #ccc; line-height: 1.5; }
  .seed-score { font-size: 10px; color: #555; margin-top: 4px; }
  .seed-post-btn { background: var(--yellow); color: var(--dark); border: none; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: var(--font-body); white-space: nowrap; flex-shrink: 0; }
  .seed-post-btn:disabled { background: #333; color: #555; cursor: default; }

  /* GHOST ACCOUNTS */
  .ghost-card { background: #111; border: 1px solid #2a2a2a; border-radius: 10px; padding: 14px 16px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
  .ghost-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; color: white; flex-shrink: 0; }
  .ghost-info { flex: 1; }
  .ghost-name { font-size: 13px; font-weight: 600; color: #ddd; }
  .ghost-handle { font-size: 11px; color: #555; }
  .ghost-status { font-size: 11px; color: var(--teal); margin-top: 2px; }
  .ghost-run-btn { background: var(--blue); color: white; border: none; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; font-family: var(--font-body); }

  /* BACK/UTIL */
  .back-btn { background: #222; color: #aaa; border: none; padding: 7px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; font-family: var(--font-body); display: flex; align-items: center; gap: 6px; }
  .back-btn:hover { background: #333; color: white; }

  /* TOAST */
  .toast { position: fixed; bottom: 22px; right: 22px; z-index: 2000; background: var(--dark); color: white; padding: 13px 18px; border-radius: 10px; font-size: 13px; border-left: 4px solid var(--yellow); animation: slideIn 0.25s ease; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
  @keyframes slideIn { from { transform: translateX(80px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  /* PAGE TRANSITION */
  .page-enter { animation: fadeUp 0.25s ease; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }

  /* REPLY THREAD */
  .reply-box { background: #fafafa; border-radius: 10px; padding: 12px 16px; margin-top: 10px; border: 1px solid var(--border); }
  .reply-input { width: 100%; border: none; background: transparent; font-family: var(--font-body); font-size: 13px; outline: none; resize: none; color: var(--dark); }
  .reply-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
  .reply-submit { background: var(--dark); color: white; border: none; padding: 6px 16px; border-radius: 16px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: var(--font-body); }

  /* FILTER BAR */
  .filter-bar { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
  .filter-select { padding: 9px 14px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 13px; font-family: var(--font-body); background: var(--card); color: var(--dark); outline: none; cursor: pointer; }
  .filter-select:focus { border-color: var(--blue); }
  .filter-input { flex: 1; min-width: 160px; padding: 9px 14px; border: 1.5px solid var(--border); border-radius: 10px; font-size: 13px; font-family: var(--font-body); background: var(--card); color: var(--dark); outline: none; }
  .filter-input:focus { border-color: var(--blue); }
`;

// ══════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("home");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("login");
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [posts, setPosts] = useState(DUMMY_POSTS);
  const [selectedContractor, setSelectedContractor] = useState(null);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3200); }
  function openLogin() { setModalMode("login"); setShowModal(true); }
  function openSignup() { setModalMode("signup"); setShowModal(true); }

  function handleLogin(e) {
    e.preventDefault();
    const email = e.target.email.value;
    if (email.toLowerCase().includes("korey") || email.toLowerCase() === "admin@tradefeed.com") {
      setUser({ name: "Korey Philpot", handle: "@koreyphilpot", role: "superadmin", verified: true, avatarColor: "#FFD600" });
      setShowModal(false); showToast("Welcome back, Korey 👋"); return;
    }
    setUser({ name: "Mike R.", handle: "@miker_concrete", role: "verified_sub", verified: true, avatarColor: "#FF6B2B" });
    setShowModal(false); showToast("Welcome back! 👋");
  }

  function handleSignup(e) {
    e.preventDefault();
    const tier = e.target.getAttribute("data-tier") || "free";
    const name = e.target.name?.value || "New User";
    const isVerified = tier === "verified_sub" || tier === "verified_gc";
    setUser({ name, handle: "@" + name.toLowerCase().replace(/\s/g, ""), role: tier, verified: isVerified, avatarColor: "#0057FF" });
    setShowModal(false);
    showToast(isVerified ? "Application submitted! We'll verify within 24h. ✅" : "Welcome to TradeFeed! 🎉");
  }

  function handleLogout() {
    setUser(null); showToast("Logged out.");
    if (page === "admin") setPage("home");
  }

  function handlePost(content, media, pollOptions) {
    if (!content?.trim() && !media) return;
    const newPost = {
      id: Date.now(), author: user.name, handle: user.handle,
      avatar: user.name[0], avatarColor: user.avatarColor,
      time: "just now", content: content || "", likes: 0, reposts: 0, replies: 0,
      tags: [], verified: user.verified, liked: false, reposted: false,
      trending: false, ghostReplies: [],
      imageUrl: media?.url || null,
      pollOptions: pollOptions || null,
    };
    setPosts(prev => [newPost, ...prev]);
    showToast("Posted! ✓");
  }

  function handleLike(id) {
    if (!user) { openLogin(); return; }
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  }

  function handleRepost(id) {
    if (!user) { openLogin(); return; }
    setPosts(prev => prev.map(p => p.id === id ? { ...p, reposted: !p.reposted, reposts: p.reposted ? p.reposts - 1 : p.reposts + 1 } : p));
    showToast("Reposted ↗️");
  }

  const isVerifiedUser = user?.role === "verified_sub" || user?.role === "verified_gc" || user?.role === "superadmin";

  if (page === "admin" && user?.role === "superadmin") {
    return <AdminDashboard onBack={() => setPage("home")} onLogout={handleLogout} posts={posts} />;
  }

  return (
    <>
      <style>{styles}</style>
      <div className="ticker-wrap">
        <div className="ticker-label">LIVE</div>
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => <span key={i} className="ticker-item">{t}</span>)}
        </div>
      </div>

      <nav className="nav">
        <div className="nav-logo" onClick={() => setPage("home")}>Trade<span>Feed</span></div>
        <div className="nav-links">
          {["home", "newsletter", "jobs", "directory", "forum", "intel"].map(p => (
            <button key={p} className={`nav-link ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>
              {p === "home" ? "Feed" : p === "intel" ? "🔒 Intel" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          {user?.role === "superadmin" && (
            <button className="nav-link" onClick={() => setPage("admin")} style={{ color: "#FFD600" }}>⚙ Admin</button>
          )}
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <span className="nav-user">
                {user.verified && <span style={{ color: "var(--verified)" }}>✓</span>}
                {user.name}
                {user.role === "superadmin" && <span className="admin-badge">ADMIN</span>}
              </span>
              <button className="nav-ghost" onClick={handleLogout}>Log Out</button>
            </>
          ) : (
            <>
              <button className="nav-ghost" onClick={openLogin}>Log In</button>
              <button className="nav-cta" onClick={openSignup}>Join Free</button>
            </>
          )}
        </div>
      </nav>

      <div className="page-enter" key={page}>
        {page === "home" && <HomePage user={user} posts={posts} openLogin={openLogin} openSignup={openSignup} onLike={handleLike} onRepost={handleRepost} onPost={handlePost} isVerifiedUser={isVerifiedUser} />}
        {page === "newsletter" && <NewsletterPage />}
        {page === "jobs" && <JobsPage user={user} openLogin={openLogin} openSignup={openSignup} showToast={showToast} />}
        {page === "directory" && <DirectoryPage user={user} onSelectContractor={setSelectedContractor} showToast={showToast} />}
        {page === "forum" && <ForumPage user={user} isVerifiedUser={isVerifiedUser} openSignup={openSignup} showToast={showToast} posts={posts} onLike={handleLike} />}
        {page === "intel" && <IntelPage isVerifiedUser={isVerifiedUser} openSignup={openSignup} />}
      </div>

      {showModal && (
        <AuthModal mode={modalMode} setMode={setModalMode} onLogin={handleLogin} onSignup={handleSignup} onClose={() => setShowModal(false)} />
      )}

      {selectedContractor && (
        <ContractorProfileModal contractor={selectedContractor} onClose={() => setSelectedContractor(null)} showToast={showToast} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
// AUTH MODAL
// ══════════════════════════════════════════════════════════════════
function AuthModal({ mode, setMode, onLogin, onSignup, onClose }) {
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
              <div className={`tier-opt`} style={{ opacity: 0.5, cursor: "default" }}>
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
                  <input className="form-input" type="text" placeholder="City, State" />
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

              {/* LEGAL CONSENT */}
              <div style={{ background: "#f8f7f2", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                <label className="consent-checkbox-row" style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, color: "#555", cursor: "pointer", lineHeight: 1.5 }}>
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

// ══════════════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════════════
function HomePage({ user, posts, openLogin, openSignup, onLike, onRepost, onPost, isVerifiedUser }) {
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
          {user && (
            <ComposeBox user={user} onPost={onPost} />
          )}

          {!user && (
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

// ══════════════════════════════════════════════════════════════════
// COMPOSE BOX — Twitter-style, full media support
// ══════════════════════════════════════════════════════════════════
// Production integrations needed:
//   Image upload: Supabase Storage bucket 'post-media' → public URL stored in posts.image_url
//   GIF search: GIPHY API (free tier) GET https://api.giphy.com/v1/gifs/search?api_key=KEY&q=QUERY&limit=12
//   Tenor API (free): GET https://tenor.googleapis.com/v2/search?key=KEY&q=QUERY&limit=12
//   Memes: imgflip API (free) GET https://api.imgflip.com/get_memes — then overlay text via canvas
//   Polls: stored as posts.poll_options jsonb array in Supabase
//   Emoji picker: npm install emoji-picker-react → <EmojiPicker onEmojiClick={...} />

const DEMO_GIFS = [
  { id: 1, url: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif", title: "construction work" },
  { id: 2, url: "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif", title: "hard hat nod" },
  { id: 3, url: "https://media.giphy.com/media/xT9IgHO3BEWMNqKL7y/giphy.gif", title: "lets go" },
  { id: 4, url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", title: "money" },
];

const EMOJI_QUICK = ["😂", "🔥", "💪", "🏗️", "⚡", "🙌", "👀", "💰", "🤝", "😤", "✅", "❌", "🎯", "🛠️", "📐", "🧱"];

function ComposeBox({ user, onPost, placeholder = "What's happening in your trade?" }) {
  const [content, setContent] = useState("");
  const [mediaPreview, setMediaPreview] = useState(null); // { type: 'image'|'gif', url, file? }
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [gifSearch, setGifSearch] = useState("");
  const [charMode, setCharMode] = useState(false); // turns red near limit
  const fileInputRef = useRef(null);
  const MAX = 280;
  const remaining = MAX - content.length;
  const isOver = remaining < 0;
  const isNearLimit = remaining <= 40;

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMediaPreview({ type: "image", url, file });
    setShowGifPicker(false);
  }

  function handleGifSelect(gif) {
    setMediaPreview({ type: "gif", url: gif.url, title: gif.title });
    setShowGifPicker(false);
  }

  function handleEmojiClick(emoji) {
    setContent(prev => (prev + emoji).slice(0, MAX));
    setShowEmojiPicker(false);
  }

  function handleSubmit() {
    if ((!content.trim() && !mediaPreview) || isOver) return;
    onPost(content, mediaPreview, showPollBuilder ? pollOptions.filter(Boolean) : null);
    setContent("");
    setMediaPreview(null);
    setShowPollBuilder(false);
    setPollOptions(["", ""]);
  }

  // Circular progress for char count
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(content.length / MAX, 1);
  const strokeDash = circumference * progress;

  return (
    <div className="compose-box" style={{ marginBottom: 16 }}>
      <div className="compose-inner">
        <div className="compose-avatar" style={{ background: user.avatarColor, color: user.avatarColor === "#FFD600" ? "#111" : "white" }}>
          {user.name[0]}
        </div>
        <div style={{ flex: 1 }}>
          <textarea
            className="compose-textarea"
            placeholder={placeholder}
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{ color: isOver ? "#E74C3C" : undefined }}
          />

          {/* Media preview */}
          {mediaPreview && (
            <div style={{ position: "relative", marginTop: 8, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", display: "inline-block" }}>
              <img src={mediaPreview.url} alt={mediaPreview.title || "media"} style={{ maxWidth: "100%", maxHeight: 220, display: "block", borderRadius: 10 }} />
              <button onClick={() => setMediaPreview(null)} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.7)", border: "none", color: "white", width: 24, height: 24, borderRadius: "50%", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          )}

          {/* Poll builder */}
          {showPollBuilder && (
            <div style={{ background: "#f8f7f2", borderRadius: 10, padding: "12px 14px", marginTop: 10, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8 }}>Poll Options</div>
              {pollOptions.map((opt, i) => (
                <input key={i} className="form-input" style={{ marginBottom: 6, fontSize: 13, padding: "8px 12px" }} placeholder={`Option ${i + 1}`} value={opt} onChange={e => { const next = [...pollOptions]; next[i] = e.target.value; setPollOptions(next); }} />
              ))}
              {pollOptions.length < 4 && (
                <button onClick={() => setPollOptions([...pollOptions, ""])} style={{ background: "none", border: "none", color: "var(--blue)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add option</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* GIF PICKER */}
      {showGifPicker && (
        <div style={{ background: "#f8f7f2", borderRadius: 10, padding: 12, marginTop: 10, border: "1px solid var(--border)" }}>
          <input className="form-input" style={{ marginBottom: 10, fontSize: 13, padding: "8px 12px" }} placeholder="Search GIFs..." value={gifSearch} onChange={e => setGifSearch(e.target.value)} autoFocus />
          {/* Production: replace with GIPHY/Tenor API results */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {DEMO_GIFS.map(gif => (
              <img key={gif.id} src={gif.url} alt={gif.title} onClick={() => handleGifSelect(gif)} style={{ width: "100%", height: 70, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: "2px solid transparent", transition: "border-color 0.15s" }} onMouseEnter={e => e.target.style.borderColor = "var(--yellow)"} onMouseLeave={e => e.target.style.borderColor = "transparent"} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>Production: connect GIPHY API (free tier, 100 searches/day)</div>
        </div>
      )}

      {/* EMOJI PICKER */}
      {showEmojiPicker && (
        <div style={{ background: "#f8f7f2", borderRadius: 10, padding: 10, marginTop: 8, border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {EMOJI_QUICK.map(e => (
              <button key={e} onClick={() => handleEmojiClick(e)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: "4px", borderRadius: 6, transition: "background 0.1s" }} onMouseEnter={el => el.target.style.background = "#e0e0e0"} onMouseLeave={el => el.target.style.background = "none"}>{e}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>Production: npm install emoji-picker-react for full picker</div>
        </div>
      )}

      <div className="compose-footer">
        <div className="compose-actions">
          {/* Image upload */}
          <button className="compose-action-btn" title="Photo / Video" onClick={() => fileInputRef.current?.click()}>📷</button>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileChange} />

          {/* GIF */}
          <button className="compose-action-btn" title="GIF" onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }} style={{ fontWeight: 800, fontSize: 12, color: showGifPicker ? "var(--blue)" : undefined }}>GIF</button>

          {/* Emoji */}
          <button className="compose-action-btn" title="Emoji" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}>😄</button>

          {/* Poll */}
          <button className="compose-action-btn" title="Poll" onClick={() => setShowPollBuilder(!showPollBuilder)} style={{ color: showPollBuilder ? "var(--blue)" : undefined }}>📊</button>

          {/* Tag */}
          <button className="compose-action-btn" title="Tag trade" onClick={() => setContent(prev => prev + " #")}>🏷️</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Circular char counter — Twitter style */}
          <svg width="24" height="24" style={{ transform: "rotate(-90deg)", opacity: content.length === 0 ? 0.2 : 1 }}>
            <circle cx="12" cy="12" r={radius} fill="none" stroke="#e0e0e0" strokeWidth="2" />
            <circle cx="12" cy="12" r={radius} fill="none" stroke={isOver ? "#E74C3C" : isNearLimit ? "var(--orange)" : "var(--blue)"} strokeWidth="2" strokeDasharray={`${strokeDash} ${circumference}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.1s" }} />
          </svg>
          {isNearLimit && <span style={{ fontSize: 12, color: isOver ? "#E74C3C" : "var(--orange)", fontWeight: 700 }}>{remaining}</span>}

          <button className="compose-submit" onClick={handleSubmit} disabled={(!content.trim() && !mediaPreview) || isOver}>Post</button>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, onLike, onRepost, activeReply, setActiveReply, openLogin, isGated, user }) {
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

      {/* Media */}
      {post.imageUrl && (
        <div style={{ marginBottom: 12, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
          <img src={post.imageUrl} alt="post media" style={{ width: "100%", maxHeight: 300, objectFit: "cover", display: "block" }} />
        </div>
      )}

      {/* Poll */}
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
        <button className="post-action" onClick={() => { if (isGated) { openLogin?.(); return; } setActiveReply?.(activeReply === post.id ? null : post.id); }}>          💬 <span className="post-action-count">{post.replies + (post.ghostReplies?.length || 0)}</span>
        </button>
        <button className="post-action" onClick={() => navigator.clipboard?.writeText(`tradefeed.com/post/${post.id}`)}>
          ↗️ Share
        </button>
      </div>

      {/* Ghost replies visible */}
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
          <div className="reply-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
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

// ══════════════════════════════════════════════════════════════════
// DIRECTORY PAGE
// ══════════════════════════════════════════════════════════════════
function DirectoryPage({ user, onSelectContractor, showToast }) {
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

  const visibleContractors = dirUnlocked || user ? filtered : filtered.slice(0, FREE_VISIBLE);
  const hiddenCount = filtered.length - FREE_VISIBLE;

  function handleUnlock(e) {
    e.preventDefault();
    if (!unlockEmail || !unlockName) return;
    // In production: POST to Supabase leads table with type='contact_request'
    // This email becomes a marketable lead for contractors
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

      {/* HOW VERIFICATION WORKS */}
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

      {/* FILTERS */}
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

      {/* CONTRACTOR GRID */}
      <div className="contractor-grid">
        {visibleContractors.map(c => (
          <div key={c.id} className="contractor-card" onClick={() => onSelectContractor(c)}>
            <div className="contractor-avatar-wrap">
              <div className="contractor-avatar" style={{ background: c.avatarColor }}>{c.avatar}</div>
              <div>
                <div className="contractor-name">
                  {c.name}
                  <span style={{ color: "var(--verified)", fontSize: 14 }}>✓</span>
                  <span className={`contractor-type-badge ${c.type === "GC" ? "badge-gc" : "badge-sub"}`}>{c.type}</span>
                </div>
                <div className="contractor-trade">{c.trade}</div>
              </div>
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

      {/* DIRECTORY EMAIL GATE */}
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

                {/* LEGAL CONSENT */}
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

// ══════════════════════════════════════════════════════════════════
// CONTRACTOR PROFILE MODAL
// ══════════════════════════════════════════════════════════════════
function ContractorProfileModal({ contractor: c, onClose, showToast }) {
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

// ══════════════════════════════════════════════════════════════════
// FORUM PAGE — VERIFIED ONLY TO POST
// ══════════════════════════════════════════════════════════════════
function ForumPage({ user, isVerifiedUser, openSignup, showToast, posts, onLike }) {
  const forumPosts = posts.filter(p => p.verified);

  return (
    <div className="page">
      <div className="accent-bar" />
      <div className="section-label">Verified Contractors Only</div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800, marginBottom: 6 }}>Trade Forum</h2>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
        Real talk between verified contractors. No spectators, no noise — only people with skin in the game.
      </p>

      {/* VERIFIED BANNER */}
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

      {/* COMPOSE — everyone can post */}
      {user && (
        <ComposeBox user={user} onPost={(content, media) => { showToast("Posted to forum ✓"); }} placeholder="Start a discussion, ask a question, or share what's working..." />
      )}

      {/* POSTS — non-verified see them blurred */}
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

// ══════════════════════════════════════════════════════════════════
// INTEL PAGE — FULLY LOCKED, VISUALLY TEMPTING
// ══════════════════════════════════════════════════════════════════
function IntelPage({ isVerifiedUser, openSignup }) {
  // Fake content shown blurred behind lock
  const fakeIntel = [
    { title: "Bid Alert: $2.1M MEP package opening in Charlotte Q2", type: "BID", hot: true },
    { title: "Supplier warning: 3 concrete suppliers with delayed payments flagged by members", type: "ALERT", hot: false },
    { title: "Private thread: GC rate negotiation strategies that actually work", type: "DISCUSSION", hot: true },
    { title: "Salary data: What verified foremen are actually making in NC right now", type: "DATA", hot: false },
    { title: "Deal flow: Meridian Build Group opening 4 new projects — subs needed now", type: "DEAL", hot: true },
    { title: "Member poll: Payment terms — who's getting net-15 and how", type: "POLL", hot: false },
  ];

  return (
    <div className="page">
      <div className="locked-page">
        {/* Blurred background content */}
        <div className="locked-content-blur">
          <div style={{ padding: "28px 0" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginBottom: 20 }}>🔒 Pro Intel</div>
            {fakeIntel.map((item, i) => (
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

        {/* Lock overlay */}
        <div className="locked-overlay">
          <div className="locked-box">
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <h2>Pro Intel — Verified Access Only</h2>
            <p>Private bid alerts, deal flow, contractor warnings, salary data, and discussions you won't find anywhere else. Only for verified TradeFeed contractors.</p>

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
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// NEWSLETTER PAGE
// ══════════════════════════════════════════════════════════════════
function NewsletterPage() {
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

      {/* SEARCH */}
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
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// JOBS PAGE
// ══════════════════════════════════════════════════════════════════
function JobsPage({ user, openLogin, openSignup, showToast }) {
  const [showPostJob, setShowPostJob] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const isVerifiedUser = user?.role === "verified_sub" || user?.role === "verified_gc" || user?.role === "superadmin";

  return (
    <div className="page">
      <div className="accent-bar" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <div className="section-label">Opportunities</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800 }}>Trade Jobs Board</h2>
        </div>
        {isVerifiedUser && (
          <button className="btn-primary" style={{ width: "auto", padding: "10px 20px" }} onClick={() => setShowPostJob(!showPostJob)}>
            + Post a Job
          </button>
        )}
      </div>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
        Field positions, foreman roles, estimating, and PM — posted by verified contractors. No middlemen.
      </p>

      {/* JOB SEEKER CONSENT BOX */}
      <div className="job-consent-box">
        <h4>🔗 Get Connected to Hiring Contractors</h4>
        <p>
          Check the box below and verified contractors actively hiring in your trade will be able to reach out to you directly. We match you to relevant opportunities — you won't get spammed, and you can opt out any time.
        </p>
        <label className="consent-checkbox-row">
          <input type="checkbox" checked={consentChecked} onChange={e => setConsentChecked(e.target.checked)} />
          <span>
            <strong>Yes, connect me with verified hiring contractors.</strong> I agree to allow TradeFeed to share my profile and contact information with verified GCs and subcontractors who are actively looking to hire for roles matching my trade and location. I understand this is opt-in and I can withdraw consent at any time by updating my profile settings. TradeFeed will never sell my information to third parties or recruiters outside the platform.
          </span>
        </label>
        {consentChecked && (
          <div style={{ marginTop: 10, background: "#E8F8F4", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#007a63", fontWeight: 600 }}>
            ✓ You're now visible to verified hiring contractors. Expect outreach only from TradeFeed-verified members.
          </div>
        )}
      </div>

      {/* POST JOB FORM */}
      {showPostJob && isVerifiedUser && (
        <div style={{ background: "var(--card)", border: "2px solid var(--yellow)", borderRadius: "var(--radius)", padding: "22px", marginBottom: 20 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Post a Job</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input className="form-input" placeholder="Job title" />
            <input className="form-input" placeholder="Company name" />
            <input className="form-input" placeholder="Location" />
            <input className="form-input" placeholder="Pay range (e.g. $35-$45/hr)" />
            <input className="form-input" placeholder="Type (Full-time, Contract, Seasonal)" />
            <input className="form-input" placeholder="Tags (e.g. Framing, Commercial)" />
          </div>
          <button className="btn-primary" style={{ marginTop: 14, width: "auto", padding: "10px 24px" }} onClick={() => { setShowPostJob(false); showToast("Job posted! ✓"); }}>
            Publish Job
          </button>
        </div>
      )}

      {DUMMY_JOBS.map(job => (
        <div key={job.id} className="job-card">
          <div style={{ flex: 1 }}>
            <div className="job-title">
              {job.title}
              {job.verified && <span style={{ color: "var(--verified)", fontSize: 13 }}>✓</span>}
            </div>
            <div className="job-company">{job.company}</div>
            <div className="job-meta">
              <span className="job-meta-item">📍 {job.location}</span>
              <span className="job-meta-item">⏱ {job.type}</span>
            </div>
            <div className="job-tags">{job.tags.map(t => <span key={t} className="job-tag">{t}</span>)}</div>
          </div>
          <div className="job-right">
            <div className="job-pay">{job.pay}</div>
            <div className="job-posted">{job.posted}</div>
            <button className="btn-apply" onClick={!user ? openLogin : undefined}>Apply Now</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════
function AdminDashboard({ onBack, onLogout, posts }) {
  const [tab, setTab] = useState("overview");
  const [pendingUsers, setPendingUsers] = useState(ADMIN_STATS.recentSignups.filter(u => u.status === "pending"));
  const [seededQuestions, setSeededQuestions] = useState(DUMMY_SEEDED_QUESTIONS);
  const [ghostRunning, setGhostRunning] = useState(false);
  const [ghostLastRun, setGhostLastRun] = useState(ADMIN_STATS.ghostLastRun);

  function approveUser(name) { setPendingUsers(prev => prev.filter(u => u.name !== name)); }
  function markUsed(id) { setSeededQuestions(prev => prev.map(q => q.id === id ? { ...q, used: true } : q)); }
  function runGhostAccounts() {
    setGhostRunning(true);
    setTimeout(() => {
      setGhostRunning(false);
      setGhostLastRun("Just now");
    }, 2200);
  }

  const maxViews = Math.max(...ADMIN_STATS.weeklyEngagement.map(d => d.views));

  return (
    <div className="admin-page">
      <style>{styles}</style>
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

      {/* TABS */}
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
                <button className="admin-publish-btn" style={{ padding: "8px 20px", fontSize: 12 }}>
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
              <button
                className="ghost-run-btn"
                style={{ padding: "10px 22px", fontSize: 13, opacity: ghostRunning ? 0.6 : 1 }}
                onClick={runGhostAccounts}
                disabled={ghostRunning}
              >
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
