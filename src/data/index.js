// ═══════════════════════════════════════════════════════════════════
// TRADEFEED — Shared Data Constants
// ═══════════════════════════════════════════════════════════════════

export const GHOST_ACCOUNTS = [
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

export const DUMMY_POSTS = [
  { id: 1, author: "Mike Reyes", handle: "@miker_concrete", avatar: "M", avatarColor: "#FF6B2B", time: "2h", content: "Just wrapped a 3-month job in Charlotte. Scheduling automation saved us 4 hours/week on dispatching alone. Anyone else using AI tools for crew coordination? Game changer for operations.", likes: 47, reposts: 8, replies: 12, tags: ["#automation", "#concrete"], verified: true, liked: false, reposted: false, trending: true, ghostReplies: [] },
  { id: 2, author: "D. Hollis Electric", handle: "@dhollis_electric", avatar: "D", avatarColor: "#0057FF", time: "4h", content: "Permit office in Mecklenburg finally went digital. Change requests that took 2 weeks now take 2 days. Massive for cash flow timing. If you're still doing paper submittals you're losing money.", likes: 83, reposts: 24, replies: 21, tags: ["#permits", "#electrical"], verified: true, liked: false, reposted: false, trending: true, ghostReplies: [] },
  { id: 3, author: "TradeCrew NC", handle: "@tradecrewnc", avatar: "T", avatarColor: "#00C9A7", time: "6h", content: "Hiring 2 experienced framers for a commercial project in Raleigh starting March. $36/hr, benefits, consistent work. DM or drop your contact below. Need people who show up.", likes: 29, reposts: 41, replies: 18, tags: ["#hiring", "#framing"], verified: false, liked: false, reposted: false, trending: false, ghostReplies: [] },
  { id: 4, author: "Sam Vasquez", handle: "@samv_plumbing", avatar: "S", avatarColor: "#9B59B6", time: "8h", content: "Material costs up 18% YOY on copper. Anyone finding better regional suppliers in the Carolinas? Looking to cut overhead without cutting corners. Happy to share what I've found too.", likes: 61, reposts: 15, replies: 34, tags: ["#materials", "#plumbing"], verified: true, liked: false, reposted: false, trending: false, ghostReplies: [] },
  { id: 5, author: "BuildOps Daily", handle: "@buildops", avatar: "B", avatarColor: "#FFD600", time: "10h", content: "New OSHA update for residential contractors in the Southeast goes into effect April 1. Falls protection requirements are changing significantly — make sure your team is briefed before the deadline.", likes: 112, reposts: 67, replies: 45, tags: ["#OSHA", "#compliance"], verified: true, liked: false, reposted: false, trending: true, ghostReplies: [] },
  { id: 6, author: "Apex Structures", handle: "@apexstructures", avatar: "A", avatarColor: "#E74C3C", time: "12h", content: "Just landed a $4.2M commercial project in Durham. Actively looking for reliable subs across framing, MEP, and concrete. If you're licensed and bonded in NC reach out. Timeline is Q2 start.", likes: 198, reposts: 93, replies: 61, tags: ["#subcontracting", "#bidding"], verified: true, liked: false, reposted: false, trending: true, ghostReplies: [] },
];

export const DUMMY_VERIFIED_CONTRACTORS = [
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

export const DUMMY_JOBS = [
  { id: 1, title: "Commercial Framing Lead", company: "Apex Structures", location: "Charlotte, NC", type: "Full-time", pay: "$32–$40/hr", posted: "1d ago", tags: ["Framing", "Commercial"], verified: true },
  { id: 2, title: "Electrical Foreman", company: "Volt Forward Inc.", location: "Raleigh, NC", type: "Contract", pay: "$45–$55/hr", posted: "2d ago", tags: ["Electrical", "Foreman"], verified: true },
  { id: 3, title: "Concrete Finisher", company: "SolidBase Co.", location: "Durham, NC", type: "Full-time", pay: "$28–$35/hr", posted: "3d ago", tags: ["Concrete", "Finishing"], verified: false },
  { id: 4, title: "Plumbing Estimator", company: "FlowRight Systems", location: "Greensboro, NC", type: "Full-time", pay: "$55k–$70k/yr", posted: "4d ago", tags: ["Plumbing", "Estimating"], verified: true },
  { id: 5, title: "HVAC Install Tech", company: "AirPro Mechanical", location: "Wilmington, NC", type: "Seasonal", pay: "$30–$38/hr", posted: "5d ago", tags: ["HVAC", "Installation"], verified: false },
  { id: 6, title: "Project Manager – Multi-family", company: "Meridian Build Group", location: "Charlotte, NC", type: "Full-time", pay: "$75k–$95k/yr", posted: "5d ago", tags: ["PM", "Multi-family"], verified: true },
  { id: 7, title: "Roofing Supervisor", company: "Summit Roofing Co.", location: "Fayetteville, NC", type: "Full-time", pay: "$38–$48/hr", posted: "6d ago", tags: ["Roofing", "Supervisor"], verified: true },
];

export const DUMMY_NEWSLETTERS = [
  {
    id: 1,
    date: "Feb 24, 2026",
    title: "Southeast Construction Market: Week in Review",
    summary: "Commercial starts +7%, NC lien law update, Skanska $340M award, rebar stabilizes.",
    preview: "Commercial construction starts in the Southeast rose 7% this week driven by data center demand...",
    full: `Commercial construction starts in the Southeast rose 7% this week, driven by data center demand in the Research Triangle.\n\nKEY LEGISLATIVE UPDATE\nNorth Carolina's updated lien law goes into effect June 1st. Subcontractors should review their billing processes now.\n\nMATERIAL WATCH\nRebar prices stabilized this week. Lumber futures trending down — potential relief for framers heading into spring.\n\nMAJOR CONTRACT AWARD\nSkanska won a $340M hospital expansion in Charlotte. Subcontractor bids open in April across framing, MEP, concrete.\n\nGLOBAL ANGLE\nSaudi Arabia's NEOM project continues to absorb global steel supply through Q3.`,
    published: true,
  },
  {
    id: 2,
    date: "Feb 23, 2026",
    title: "Labor Market Tightens as Spring Season Approaches",
    summary: "Trade labor demand +23% YOY, electricians and HVAC techs in shortest supply.",
    preview: "Skilled trade labor demand is up 23% YOY, with electricians and HVAC techs seeing the highest shortage...",
    full: `Skilled trade labor demand is up 23% YOY. Electricians and HVAC techs in highest shortage nationally.\n\nOUTLOOK\nSpring construction season accelerates hiring pressure. Firms that haven't locked crews by March face 15-20% higher labor costs.\n\nWAGE TRENDS\nAverage field wages in the Southeast up 8.4% YOY. Foreman and supervisor roles seeing largest increases.`,
    published: true,
  },
];

export const DUMMY_SEEDED_QUESTIONS = [
  { id: 1, source: "r/Construction", content: "What's your biggest bottleneck on commercial jobs right now — labor, materials, or permits?", engagementScore: 2840, used: false },
  { id: 2, source: "r/Homebuilding", content: "How are you handling the copper price spike — passing it on to GCs or absorbing it?", engagementScore: 1920, used: false },
  { id: 3, source: "r/Construction", content: "Any subcontractors successfully negotiating payment terms shorter than net-30? What worked?", engagementScore: 1750, used: true },
  { id: 4, source: "r/DIY", content: "Framing crews: wood vs metal stud on commercial builds in the Southeast — cost difference this year?", engagementScore: 1680, used: false },
  { id: 5, source: "r/Construction", content: "OSHA update hits April 1 — is your team actually ready or is this going to be a scramble?", engagementScore: 3100, used: false },
  { id: 6, source: "r/Homebuilding", content: "What AI or scheduling software actually saved you real time in 2025?", engagementScore: 2200, used: false },
  { id: 7, source: "r/Construction", content: "Best strategy for getting paid faster by GCs without destroying the relationship?", engagementScore: 2950, used: false },
  { id: 8, source: "r/Construction", content: "Anyone else seeing GCs try to push more liability onto subs in new contracts this year?", engagementScore: 2410, used: false },
];

export const ADMIN_STATS = {
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

export const TICKER_ITEMS = [
  "🏗️ Commercial starts +7% Southeast", "⚡ Electrical trade demand +23% YOY",
  "📋 NC Lien Law update June 1", "🔩 Rebar prices stabilize at $890/ton",
  "💼 Skanska $340M Charlotte project — subs wanted", "🏠 Mecklenburg permits -12% YOY",
  "🌍 Global steel tight through Q3", "📈 TradeFeed now 1,800+ members",
];

export const NC_LOCATIONS = [
  "All Locations", "Charlotte, NC", "Raleigh, NC", "Durham, NC",
  "Greensboro, NC", "Wilmington, NC", "Fayetteville, NC", "Asheville, NC", "Winston-Salem, NC",
];

export const TRADES_LIST = [
  "All Trades", "General Contractor", "Electrical", "Plumbing", "Framing",
  "Concrete", "HVAC", "Roofing", "Structural Steel", "MEP", "Finishing",
];

export const DEMO_GIFS = [
  { id: 1, url: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif", title: "construction work" },
  { id: 2, url: "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif", title: "hard hat nod" },
  { id: 3, url: "https://media.giphy.com/media/xT9IgHO3BEWMNqKL7y/giphy.gif", title: "lets go" },
  { id: 4, url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", title: "money" },
];

export const EMOJI_QUICK = ["😂", "🔥", "💪", "🏗️", "⚡", "🙌", "👀", "💰", "🤝", "😤", "✅", "❌", "🎯", "🛠️", "📐", "🧱"];
