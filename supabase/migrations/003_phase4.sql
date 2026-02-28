-- =============================================================
-- Phase 4 Schema: Messages, Notifications, Profile Views
-- =============================================================

-- ─── Direct Messages ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid references auth.users(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  body         text not null,
  read         boolean default false,
  created_at   timestamptz not null default now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own messages"
  ON messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients mark read"
  ON messages FOR UPDATE
  USING (recipient_id = auth.uid());

CREATE INDEX IF NOT EXISTS messages_sender_idx    ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_idx ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS messages_created_idx   ON messages(created_at DESC);

-- Realtime for instant delivery
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ─── Notifications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  type       text not null,
                 -- 'message' | 'application' | 'lead_match' | 'review' | 'verification'
  title      text not null,
  body       text,
  link_page  text,   -- page name to navigate to (e.g. 'messages', 'jobs')
  link_id    text,   -- optional id within that page
  read       boolean default false,
  created_at timestamptz not null default now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users mark own read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Service-role inserts (from edge functions + triggers)
CREATE POLICY "Service role insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS notifications_user_idx    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_unread_idx  ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS notifications_created_idx ON notifications(created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ─── Notification helper function ─────────────────────────
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id   uuid,
  p_type      text,
  p_title     text,
  p_body      text      DEFAULT NULL,
  p_link_page text      DEFAULT NULL,
  p_link_id   text      DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO notifications(user_id, type, title, body, link_page, link_id)
  VALUES (p_user_id, p_type, p_title, p_body, p_link_page, p_link_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ─── Auto-notify recipient on new message ─────────────────
CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_sender_name text;
BEGIN
  SELECT name INTO v_sender_name FROM profiles WHERE id = NEW.sender_id;
  PERFORM create_notification(
    NEW.recipient_id,
    'message',
    'New message from ' || COALESCE(v_sender_name, 'a TradeFeed member'),
    LEFT(NEW.body, 80),
    'messages',
    NEW.sender_id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_insert ON messages;
CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_message();

-- ─── Auto-notify contractor on new application ────────────
CREATE OR REPLACE FUNCTION notify_on_application()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_job_owner uuid;
  v_job_title text;
BEGIN
  -- Try to find the job owner via the jobs table
  SELECT author_id, title INTO v_job_owner, v_job_title
  FROM jobs WHERE id::text = NEW.job_id
  LIMIT 1;

  IF v_job_owner IS NOT NULL THEN
    PERFORM create_notification(
      v_job_owner,
      'application',
      'New application: ' || COALESCE(v_job_title, 'your job posting'),
      COALESCE(NEW.applicant_name, 'Someone') || ' applied',
      'dashboard',
      NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_application_insert ON applications;
CREATE TRIGGER on_application_insert
  AFTER INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION notify_on_application();

-- ─── Profile Views (contractor analytics) ─────────────────
CREATE TABLE IF NOT EXISTS profile_views (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  viewer_id  uuid references auth.users(id) on delete set null,
  viewed_at  timestamptz not null default now()
);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile owners see their own views"
  ON profile_views FOR SELECT
  USING (profile_id = (SELECT id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Anyone can record a view"
  ON profile_views FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS profile_views_profile_idx ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS profile_views_recent_idx  ON profile_views(profile_id, viewed_at DESC);

-- ─── Aggregate view count on profiles ─────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS view_count integer default 0;

CREATE OR REPLACE FUNCTION increment_profile_views()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET view_count = view_count + 1 WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_view ON profile_views;
CREATE TRIGGER on_profile_view
  AFTER INSERT ON profile_views
  FOR EACH ROW EXECUTE FUNCTION increment_profile_views();
