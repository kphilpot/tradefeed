-- ═══════════════════════════════════════════════════════════════════
-- TradeFeed — Initial Schema
-- Run this in your Supabase project SQL editor, or via:
--   npx supabase db push
-- ═══════════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────────
-- Extends Supabase auth.users. Row created automatically on signup via trigger.
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  email         text unique not null,
  name          text not null default '',
  handle        text unique,
  role          text not null default 'free'
                  check (role in ('superadmin', 'verified_gc', 'verified_sub', 'free')),
  verified      boolean not null default false,
  approved      boolean not null default false,
  trade         text,
  location      text,
  license_number text,
  bio           text,
  avatar_color  text not null default '#0057FF',
  consent_lead_sharing boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Auto-create profile row when user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name, handle, role, avatar_color)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    '@' || lower(regexp_replace(coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), '\s+', '', 'g')),
    coalesce(new.raw_user_meta_data->>'role', 'free'),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#0057FF')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS: users can read all profiles, only update their own
alter table public.profiles enable row level security;
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- ─── POSTS ───────────────────────────────────────────────────────
create table public.posts (
  id            uuid default uuid_generate_v4() primary key,
  author_id     uuid references public.profiles(id) on delete cascade,
  content       text not null default '',
  image_url     text,
  poll_options  jsonb,          -- array of option strings
  tags          text[] default '{}',
  likes         integer not null default 0,
  reposts       integer not null default 0,
  replies       integer not null default 0,
  trending      boolean not null default false,
  is_ghost      boolean not null default false,  -- posted by ghost account
  created_at    timestamptz not null default now()
);

-- RLS: anyone can read, authenticated users can create, owners can delete
alter table public.posts enable row level security;
create policy "posts_select" on public.posts for select using (true);
create policy "posts_insert" on public.posts for insert with check (auth.uid() = author_id or is_ghost = true);
create policy "posts_delete" on public.posts for delete using (auth.uid() = author_id);

-- Realtime: enable for live feed updates
alter publication supabase_realtime add table public.posts;

-- ─── POST LIKES ──────────────────────────────────────────────────
create table public.post_likes (
  post_id   uuid references public.posts(id) on delete cascade,
  user_id   uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;
create policy "likes_select" on public.post_likes for select using (true);
create policy "likes_insert" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "likes_delete" on public.post_likes for delete using (auth.uid() = user_id);

-- Update posts.likes count on insert/delete
create or replace function public.update_post_likes()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set likes = likes + 1 where id = new.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set likes = likes - 1 where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger on_like_changed
  after insert or delete on public.post_likes
  for each row execute procedure public.update_post_likes();

-- ─── GHOST ACCOUNTS ──────────────────────────────────────────────
create table public.ghost_accounts (
  id            uuid default uuid_generate_v4() primary key,
  name          text not null,
  handle        text unique not null,
  avatar_color  text not null,
  avatar_letter text not null,
  trade         text not null,
  is_active     boolean not null default true,
  last_posted_at timestamptz
);

-- Seed the 10 ghost accounts
insert into public.ghost_accounts (name, handle, avatar_color, avatar_letter, trade) values
  ('Jake Moreno',        '@jake_frames',    '#E74C3C', 'J', 'Framing'),
  ('T. Briggs Electric', '@tbriggs_elec',   '#0057FF', 'T', 'Electrical'),
  ('Ray Castillo',       '@raycast_concrete','#FF6B2B', 'R', 'Concrete'),
  ('Dana Holloway',      '@dana_hvac',      '#00C9A7', 'D', 'HVAC'),
  ('Marcus Webb',        '@webb_plumbing',  '#9B59B6', 'M', 'Plumbing'),
  ('Chris Lawson',       '@lawson_roofing', '#F39C12', 'C', 'Roofing'),
  ('Apex MEP',           '@apex_mep',       '#2ECC71', 'A', 'MEP'),
  ('Sal Ferreira',       '@sal_finishing',  '#E67E22', 'S', 'Finishing'),
  ('NorthState Subs',    '@northstate_nc',  '#1ABC9C', 'N', 'General'),
  ('Pat Okafor',         '@pat_steel',      '#C0392B', 'P', 'Steel');

alter table public.ghost_accounts enable row level security;
create policy "ghost_select" on public.ghost_accounts for select using (true);

-- ─── SEEDED QUESTIONS (from Reddit API) ──────────────────────────
create table public.seeded_questions (
  id               uuid default uuid_generate_v4() primary key,
  source           text not null,         -- e.g. 'r/Construction'
  content          text not null,
  engagement_score integer not null default 0,
  used             boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table public.seeded_questions enable row level security;
create policy "seed_select" on public.seeded_questions for select using (true);
create policy "seed_update" on public.seeded_questions for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'superadmin')
);

-- ─── LEADS ───────────────────────────────────────────────────────
create table public.leads (
  id            uuid default uuid_generate_v4() primary key,
  email         text not null,
  name          text,
  trade         text,
  location      text,
  type          text not null check (type in ('job_seeker', 'directory_unlock', 'newsletter')),
  consent_given boolean not null default false,
  source_page   text,    -- 'jobs', 'directory', 'signup', 'newsletter'
  created_at    timestamptz not null default now()
);

-- Leads are write-only from client (insert only, no select by non-admins)
alter table public.leads enable row level security;
create policy "leads_insert" on public.leads for insert with check (consent_given = true);
create policy "leads_admin_select" on public.leads for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'superadmin')
);

-- ─── NEWSLETTER SUBSCRIBERS ──────────────────────────────────────
create table public.newsletter_subscribers (
  id         uuid default uuid_generate_v4() primary key,
  email      text unique not null,
  name       text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;
create policy "nl_sub_insert" on public.newsletter_subscribers for insert with check (true);
create policy "nl_sub_admin" on public.newsletter_subscribers for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'superadmin')
);

-- ─── NEWSLETTERS ─────────────────────────────────────────────────
create table public.newsletters (
  id         uuid default uuid_generate_v4() primary key,
  date       text not null,
  title      text not null,
  summary    text not null,
  preview    text not null,
  full_text  text not null,
  published  boolean not null default false,
  sent_at    timestamptz,
  created_at timestamptz not null default now()
);

alter table public.newsletters enable row level security;
create policy "nl_select" on public.newsletters for select using (published = true);
create policy "nl_admin" on public.newsletters for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'superadmin')
);

-- ─── JOBS ────────────────────────────────────────────────────────
create table public.jobs (
  id         uuid default uuid_generate_v4() primary key,
  poster_id  uuid references public.profiles(id) on delete cascade,
  title      text not null,
  company    text not null,
  location   text not null,
  type       text not null,  -- Full-time, Contract, Seasonal
  pay        text not null,
  tags       text[] default '{}',
  verified   boolean not null default false,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.jobs enable row level security;
create policy "jobs_select" on public.jobs for select using (active = true);
create policy "jobs_insert" on public.jobs for insert with check (
  auth.uid() = poster_id and
  exists (select 1 from public.profiles where id = auth.uid() and role in ('verified_gc','verified_sub','superadmin'))
);
create policy "jobs_update" on public.jobs for update using (auth.uid() = poster_id);

-- ─── INDEXES ─────────────────────────────────────────────────────
create index posts_created_at_idx on public.posts(created_at desc);
create index posts_author_idx on public.posts(author_id);
create index seeded_score_idx on public.seeded_questions(engagement_score desc) where used = false;
create index leads_created_idx on public.leads(created_at desc);
create index jobs_created_idx on public.jobs(created_at desc) where active = true;
