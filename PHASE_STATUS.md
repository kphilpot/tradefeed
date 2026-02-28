# TradeFeed — Phase Status

> **Last updated:** Phase 4 in progress
> **Branch:** `claude/resume-tradefeed-phase1-6VlMz`

---

## Phase 1 — UI Foundation ✅ COMPLETE

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

---

## Phase 2 — Supabase Backend ✅ COMPLETE

| Area | File(s) | Status |
|------|---------|--------|
| DB schema | `supabase/migrations/001_initial.sql` | ✅ |
| `useAuth` hook | `src/hooks/useAuth.js` | ✅ |
| `usePosts` hook | `src/hooks/usePosts.js` | ✅ |
| Real auth wiring | `src/App.jsx` | ✅ |
| Lead capture | `DirectoryPage.jsx`, `JobsPage.jsx` | ✅ |
| Newsletter signup | `src/components/NewsletterSignup.jsx` | ✅ |
| Edge fn: Reddit seed (6AM cron) | `supabase/functions/seed-questions/` | ✅ |
| Edge fn: Ghost replies (Anthropic batch) | `supabase/functions/ghost-reply/` | ✅ |

---

## Phase 3 — Revenue & Growth ✅ COMPLETE

| Area | File(s) | Status |
|------|---------|--------|
| DB: applications, reviews, stripe fields | `supabase/migrations/002_phase3.sql` | ✅ |
| Stripe Checkout edge fn | `supabase/functions/stripe-checkout/` | ✅ |
| Stripe Webhook edge fn | `supabase/functions/stripe-webhook/` | ✅ |
| Newsletter send (Resend API) | `supabase/functions/send-newsletter/` | ✅ |
| Mobile hamburger nav | `src/App.jsx`, `globals.css` | ✅ |
| SEO / Open Graph | `index.html` | ✅ |
| Pro Intel dual-gate | `src/pages/IntelPage.jsx` | ✅ |
| Job application tracking | `src/pages/JobsPage.jsx` | ✅ |
| Contractor review form | `src/components/ContractorProfileModal.jsx` | ✅ |
| Featured directory sort + badge | `src/pages/DirectoryPage.jsx` | ✅ |
| Admin: applications + newsletter + featured | `src/pages/AdminDashboard.jsx` | ✅ |

---

## Phase 4 — Profiles, Messaging, Notifications & Deployment 🔄 IN PROGRESS

### What Phase 4 adds

| Feature | File(s) | Status |
|---------|---------|--------|
| DB: messages, notifications, profile_views | `supabase/migrations/003_phase4.sql` | ✅ |
| `updateProfile` in useAuth | `src/hooks/useAuth.js` | ✅ |
| Message + notification helpers | `src/lib/supabase.js` | ✅ |
| `useNotifications` hook | `src/hooks/useNotifications.js` | ✅ |
| Notification bell (nav) | `src/components/NotificationBell.jsx` | ✅ |
| Messages page (2-pane DM) | `src/pages/MessagesPage.jsx` | ✅ |
| Profile page (view/edit profile) | `src/pages/ProfilePage.jsx` | ✅ |
| Settings page (account, notif prefs, sub) | `src/pages/SettingsPage.jsx` | ✅ |
| Contractor dashboard | `src/pages/ContractorDashboard.jsx` | ✅ |
| Phase 4 CSS | `src/styles/globals.css` | ✅ |
| App wiring: pages + bell + profile nav | `src/App.jsx` | ✅ |
| ContractorProfileModal: Send Message works | `src/components/ContractorProfileModal.jsx` | ✅ |
| Vercel SPA routing config | `vercel.json` | ✅ |
| PWA manifest | `public/manifest.json` | ✅ |
| PWA meta tags | `index.html` | ✅ |

### Phase 4 architecture notes

- **Notifications**: real-time via `supabase.channel()` on `notifications` table. On new message insert,
  a DB trigger (`notify_on_message`) auto-creates a notification for the recipient. In demo mode,
  mock notifications are shown so the UI is fully functional.
- **Messages**: 2-pane layout (conversation list + thread). Mock conversations in demo mode.
  Supabase mode: reads/writes `messages` table, realtime subscription on INSERT.
- **Profile page**: shows avatar, name, role tier badge, trade, location. Inline edit form.
  Shows user's own posts and application history. Subscription status card.
- **Contractor Dashboard**: verified users see profile views (7d), open job posts, pending applications,
  average rating, recent reviews, and a "Boost Profile" featured listing CTA.
- **Settings**: account edit (name, bio), change password form, notification preference toggles,
  subscription management (upgrade/cancel), danger zone (delete account confirmation).
- **Vercel**: `vercel.json` with `rewrites` for SPA — all routes serve `index.html`.
- **PWA**: `public/manifest.json` + theme-color + apple-mobile-web-app meta tags.

### To deploy Phase 4

```bash
# 1. Apply migration
npx supabase db push  # paste 003_phase4.sql into Supabase SQL editor

# 2. No new edge functions in Phase 4 — existing ones cover notifications

# 3. Deploy to Vercel (first time)
# - Import repo at vercel.com → New Project
# - Framework: Vite, Build: npm run build, Output: dist
# - Add env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_STRIPE_PUBLIC_KEY
# - Every push to the branch auto-redeploys

# 4. After first deploy, register the Vercel URL as SITE_URL in Supabase edge fn secrets
```

---

## File Tree (Phase 4 complete)

```
tradefeed/
├── PHASE_STATUS.md
├── vercel.json                ← SPA routing (all routes → index.html)
├── .env.example
├── .gitignore
├── index.html                 ← OG + PWA meta tags
├── package.json
├── vite.config.js
├── public/
│   └── manifest.json          ← PWA manifest
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial.sql
│   │   ├── 002_phase3.sql
│   │   └── 003_phase4.sql     ← messages, notifications, profile_views
│   └── functions/
│       ├── seed-questions/
│       ├── ghost-reply/
│       ├── stripe-checkout/
│       ├── stripe-webhook/
│       └── send-newsletter/
└── src/
    ├── main.jsx
    ├── App.jsx                ← +profile/settings/messages/dashboard pages
    │                             +NotificationBell, +profile nav, +message routing
    ├── data/index.js
    ├── hooks/
    │   ├── useAuth.js         ← +updateProfile()
    │   ├── usePosts.js
    │   └── useNotifications.js  ← NEW: real-time notification state
    ├── lib/
    │   └── supabase.js        ← +sendMessage, +fetchNotifications helpers
    ├── styles/
    │   └── globals.css        ← +bell, +messages, +profile, +settings, +dashboard
    ├── components/
    │   ├── AuthModal.jsx
    │   ├── ComposeBox.jsx
    │   ├── ContractorProfileModal.jsx  ← Send Message → openMessages(contractor)
    │   ├── NewsletterSignup.jsx
    │   ├── NotificationBell.jsx        ← NEW
    │   └── PostCard.jsx
    └── pages/
        ├── AdminDashboard.jsx
        ├── ContractorDashboard.jsx     ← NEW: verified user analytics
        ├── DirectoryPage.jsx
        ├── ForumPage.jsx
        ├── HomePage.jsx
        ├── IntelPage.jsx
        ├── JobsPage.jsx
        ├── MessagesPage.jsx            ← NEW: 2-pane DM system
        ├── NewsletterPage.jsx
        ├── ProfilePage.jsx             ← NEW: view + edit own profile
        └── SettingsPage.jsx            ← NEW: account + prefs + subscription
```
