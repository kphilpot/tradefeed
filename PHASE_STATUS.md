# TradeFeed — Phase Status

> **Last updated:** Phase 2 complete — Phase 3 up next
> **Branch:** `claude/resume-tradefeed-phase1-6VlMz`

---

## Phase 1 — UI Foundation ✅ COMPLETE

Everything listed below is built, tested (`npm run build` passes), and pushed.

| Area | File(s) | Status |
|------|---------|--------|
| Root app + state | `src/App.jsx` | ✅ |
| CSS (extracted from inline) | `src/styles/globals.css` | ✅ |
| Dummy data + constants | `src/data/index.js` | ✅ |
| Supabase client stub | `src/lib/supabase.js` | ✅ |
| Auth modal (login/signup/tiers) | `src/components/AuthModal.jsx` | ✅ |
| Compose box (image/GIF/emoji/poll) | `src/components/ComposeBox.jsx` | ✅ |
| Post card (like/repost/reply/ghost) | `src/components/PostCard.jsx` | ✅ |
| Contractor profile modal | `src/components/ContractorProfileModal.jsx` | ✅ |
| Home feed + gate + sidebar | `src/pages/HomePage.jsx` | ✅ |
| Newsletter archive + search | `src/pages/NewsletterPage.jsx` | ✅ |
| Jobs board + consent + post form | `src/pages/JobsPage.jsx` | ✅ |
| Contractor directory + email gate | `src/pages/DirectoryPage.jsx` | ✅ |
| Verified-only forum | `src/pages/ForumPage.jsx` | ✅ |
| Locked intel/pro page | `src/pages/IntelPage.jsx` | ✅ |
| Admin dashboard (7 tabs) | `src/pages/AdminDashboard.jsx` | ✅ |
| Environment config | `.env.example` | ✅ |
| Gitignore | `.gitignore` | ✅ |

**Bug fixed in Phase 1:** `.admin-publish-btn` CSS class was referenced in AdminDashboard but never defined — now present in `globals.css`.

---

## Phase 2 — Supabase Backend Integration 🔄 IN PROGRESS

### What Phase 2 adds

| Area | File(s) | Status |
|------|---------|--------|
| Database schema (SQL) | `supabase/migrations/001_initial.sql` | ✅ |
| `useAuth` hook | `src/hooks/useAuth.js` | ✅ |
| `usePosts` hook | `src/hooks/usePosts.js` | ✅ |
| App.jsx — real auth wiring | `src/App.jsx` | ✅ |
| AuthModal — real signIn/signUp | `src/components/AuthModal.jsx` | ✅ |
| Lead capture → Supabase | `src/pages/DirectoryPage.jsx`, `JobsPage.jsx` | ✅ |
| Newsletter subscription form | `src/components/NewsletterSignup.jsx` | ✅ |
| Edge fn: Reddit seed (cron 6AM) | `supabase/functions/seed-questions/index.ts` | ✅ |
| Edge fn: Ghost replies (Anthropic batch) | `supabase/functions/ghost-reply/index.ts` | ✅ |

### Architecture decisions for Phase 2

- **Hooks are Supabase-gated**: when `VITE_SUPABASE_URL` env var is set, hooks use real Supabase. Without it, they return mock data. Zero code changes needed to switch.
- **Auth**: Supabase Auth with email/password. After signup, a row is inserted into `profiles` table via `on auth.users insert` trigger.
- **Posts**: Fetched from `posts` table. Realtime subscription via `supabase.channel()` keeps the feed live.
- **Leads**: Directory unlock and jobs consent checkbox both write to `leads` table with `consent_given = true`.
- **Edge Functions**: Two Supabase Edge Functions, both triggered by cron + manually from Admin dashboard.

### To connect a real Supabase project

```bash
cp .env.example .env
# edit .env and fill in:
#   VITE_SUPABASE_URL=https://your-project.supabase.co
#   VITE_SUPABASE_ANON_KEY=your-anon-key

# run migrations
npx supabase db push  # or paste SQL from supabase/migrations/ into SQL editor

# deploy edge functions
npx supabase functions deploy seed-questions
npx supabase functions deploy ghost-reply
```

---

## Phase 3 — Revenue & Growth 📋 PLANNED

| Feature | Notes |
|---------|-------|
| Stripe payments ($20/mo Pro tier) | Stripe Checkout + webhook → update `profiles.role` |
| Featured directory listings | Paid `profiles.featured = true` badge + sort priority |
| Newsletter email delivery | Resend API — send to `newsletter_subscribers` table |
| Push/email notifications | Supabase + Resend for lead match alerts |
| Mobile responsive nav | Hamburger menu, bottom tab bar |
| SEO / Open Graph | Per-page meta tags, post share cards |
| Job application tracking | `applications` table, contractor inbox |
| Contractor review system | `reviews` table, rating aggregation |

---

## File Tree (Phase 2 complete)

```
tradefeed/
├── PHASE_STATUS.md            ← This file
├── .env.example               ← Copy → .env and fill in Supabase keys
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── supabase/
│   ├── migrations/
│   │   └── 001_initial.sql    ← Run this in Supabase SQL editor
│   └── functions/
│       ├── seed-questions/
│       │   └── index.ts       ← Reddit API cron (daily at 6AM)
│       └── ghost-reply/
│           └── index.ts       ← Anthropic batch API (daily at 7AM)
└── src/
    ├── main.jsx               ← Entry point, imports globals.css
    ├── App.jsx                ← Root state, nav, page routing
    ├── data/
    │   └── index.js           ← All dummy data (fallback when no Supabase)
    ├── hooks/
    │   ├── useAuth.js         ← Auth state (Supabase or mock)
    │   └── usePosts.js        ← Post feed (Supabase realtime or mock)
    ├── lib/
    │   └── supabase.js        ← Supabase client + helpers
    ├── styles/
    │   └── globals.css        ← All app CSS
    ├── components/
    │   ├── AuthModal.jsx
    │   ├── ComposeBox.jsx
    │   ├── ContractorProfileModal.jsx
    │   ├── NewsletterSignup.jsx  ← NEW in Phase 2
    │   └── PostCard.jsx
    └── pages/
        ├── AdminDashboard.jsx
        ├── DirectoryPage.jsx
        ├── ForumPage.jsx
        ├── HomePage.jsx
        ├── IntelPage.jsx
        ├── JobsPage.jsx
        └── NewsletterPage.jsx
```
