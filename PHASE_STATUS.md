# TradeFeed — Phase Status

> **Last updated:** Phase 3 in progress
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

## Phase 2 — Supabase Backend Integration ✅ COMPLETE

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

---

## Phase 3 — Revenue & Growth 🔄 IN PROGRESS

| Feature | File(s) | Status |
|---------|---------|--------|
| DB migration: applications, reviews, Stripe fields | `supabase/migrations/002_phase3.sql` | ✅ |
| Stripe Checkout edge function | `supabase/functions/stripe-checkout/index.ts` | ✅ |
| Stripe Webhook edge function | `supabase/functions/stripe-webhook/index.ts` | ✅ |
| Newsletter email delivery (Resend API) | `supabase/functions/send-newsletter/index.ts` | ✅ |
| Mobile responsive nav (hamburger + slide menu) | `src/App.jsx`, `src/styles/globals.css` | ✅ |
| SEO / Open Graph meta tags | `index.html` | ✅ |
| Pro Intel gate — Stripe upgrade CTA | `src/pages/IntelPage.jsx` | ✅ |
| Job application tracking (Apply modal) | `src/pages/JobsPage.jsx` | ✅ |
| Contractor review form + display | `src/components/ContractorProfileModal.jsx` | ✅ |
| Featured directory listings (sort + badge) | `src/pages/DirectoryPage.jsx` | ✅ |
| Admin: applications tab | `src/pages/AdminDashboard.jsx` | ✅ |
| Admin: newsletter send button | `src/pages/AdminDashboard.jsx` | ✅ |
| Admin: featured toggle | `src/pages/AdminDashboard.jsx` | ✅ |
| Env vars: Stripe + Resend | `.env.example` | ✅ |

### Phase 3 architecture notes

- **Pro tier**: `profiles.role = 'pro'` — set via Stripe webhook after successful payment.
  Stripe Checkout session is created by `supabase/functions/stripe-checkout` (requires user auth JWT).
  Webhook validates signature with HMAC-SHA256 and calls `handle_stripe_payment()` SQL function.
- **Dual Intel gate**: Unverified users → apply for verification. Verified but not pro → Stripe upgrade CTA.
  Pro / superadmin → full content access. No overlay.
- **Reviews**: Written to `reviews` table. Trigger `on_review_change` recalculates `profiles.rating` on every insert/update/delete.
- **Featured listings**: `profiles.featured = true` sorts featured contractors first in directory.
  Admin can toggle per-contractor in Users tab. Badge shown on cards.
- **Newsletter send**: `send-newsletter` edge function batch-sends via Resend API (100 recipients per call),
  then logs the send in the `newsletters` table.

### To deploy Phase 3

```bash
# 1. Apply DB migration
npx supabase db push  # or paste 002_phase3.sql into SQL editor

# 2. Set env vars in Supabase dashboard (Settings > Edge Functions)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
FROM_EMAIL=newsletter@tradefeed.io
SITE_URL=https://tradefeed.io

# 3. Deploy edge functions
npx supabase functions deploy stripe-checkout
npx supabase functions deploy stripe-webhook
npx supabase functions deploy send-newsletter

# 4. Register Stripe webhook
# In Stripe Dashboard → Webhooks → Add endpoint:
# URL: https://your-project.supabase.co/functions/v1/stripe-webhook
# Events: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted

# 5. Add to .env (frontend)
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

---

## File Tree (Phase 3 complete)

```
tradefeed/
├── PHASE_STATUS.md            ← This file
├── .env.example               ← Copy → .env and fill in all keys
├── .gitignore
├── index.html                 ← OG + Twitter meta tags added
├── package.json
├── vite.config.js
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial.sql    ← Phase 2 schema
│   │   └── 002_phase3.sql     ← Phase 3: applications, reviews, stripe fields
│   └── functions/
│       ├── seed-questions/
│       │   └── index.ts       ← Reddit API cron (daily at 6AM)
│       ├── ghost-reply/
│       │   └── index.ts       ← Anthropic batch API (daily at 7AM)
│       ├── stripe-checkout/
│       │   └── index.ts       ← Creates Stripe Checkout session
│       ├── stripe-webhook/
│       │   └── index.ts       ← Handles Stripe payment events
│       └── send-newsletter/
│           └── index.ts       ← Resend API batch send
└── src/
    ├── main.jsx
    ├── App.jsx                ← +mobile hamburger menu, +isProUser, +showToast to AdminDashboard
    ├── data/
    │   └── index.js
    ├── hooks/
    │   ├── useAuth.js
    │   └── usePosts.js
    ├── lib/
    │   └── supabase.js
    ├── styles/
    │   └── globals.css        ← +mobile nav, +featured badge, +review form, +apply modal, +pro upgrade
    ├── components/
    │   ├── AuthModal.jsx
    │   ├── ComposeBox.jsx
    │   ├── ContractorProfileModal.jsx  ← +review form, +featured badge
    │   ├── NewsletterSignup.jsx
    │   └── PostCard.jsx
    └── pages/
        ├── AdminDashboard.jsx   ← +applications tab, +newsletter send, +featured toggle
        ├── DirectoryPage.jsx    ← +featured sort + badge
        ├── ForumPage.jsx
        ├── HomePage.jsx
        ├── IntelPage.jsx        ← +dual gate: verified→Pro CTA, pro→full access
        ├── JobsPage.jsx         ← +apply modal + application tracking
        └── NewsletterPage.jsx
```
