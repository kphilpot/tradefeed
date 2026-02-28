-- =============================================================
-- Phase 3 Schema: Pro Tier, Applications, Reviews, Featured
-- =============================================================

-- ─── Extend profiles ───────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id      text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  text,
  ADD COLUMN IF NOT EXISTS subscription_status     text default 'inactive',
  ADD COLUMN IF NOT EXISTS featured                boolean default false,
  ADD COLUMN IF NOT EXISTS rating                  numeric(3,1) default 0;

-- ─── Job Applications ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id               uuid primary key default gen_random_uuid(),
  job_id           text not null,
  applicant_id     uuid references auth.users(id) on delete cascade,
  applicant_email  text,
  applicant_name   text,
  message          text,
  status           text not null default 'new'
                     check (status in ('new','reviewed','accepted','rejected')),
  created_at       timestamptz not null default now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants see own applications"
  ON applications FOR SELECT
  USING (applicant_id = auth.uid());

CREATE POLICY "Insert own application"
  ON applications FOR INSERT
  WITH CHECK (applicant_id = auth.uid());

CREATE INDEX IF NOT EXISTS applications_job_idx       ON applications(job_id);
CREATE INDEX IF NOT EXISTS applications_applicant_idx ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS applications_created_idx   ON applications(created_at DESC);

-- ─── Contractor Reviews ────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id              uuid primary key default gen_random_uuid(),
  contractor_id   uuid references profiles(id) on delete cascade,
  reviewer_id     uuid references auth.users(id) on delete set null,
  reviewer_name   text,
  rating          smallint not null check (rating between 1 and 5),
  body            text,
  created_at      timestamptz not null default now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read reviews"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post review"
  ON reviews FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS reviews_contractor_idx ON reviews(contractor_id);
CREATE INDEX IF NOT EXISTS reviews_created_idx    ON reviews(created_at DESC);

-- ─── Rating aggregation trigger ────────────────────────────
CREATE OR REPLACE FUNCTION update_contractor_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM reviews
    WHERE contractor_id = COALESCE(NEW.contractor_id, OLD.contractor_id)
  )
  WHERE id = COALESCE(NEW.contractor_id, OLD.contractor_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_contractor_rating();

-- ─── Stripe helper: apply payment status ───────────────────
CREATE OR REPLACE FUNCTION handle_stripe_payment(
  p_customer_id      text,
  p_subscription_id  text,
  p_status           text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET
    stripe_subscription_id = p_subscription_id,
    subscription_status    = p_status,
    -- Upgrade role to 'pro' on active payment, revert on cancel
    role = CASE
      WHEN p_status = 'active'
        THEN 'pro'
      WHEN p_status IN ('canceled','unpaid','past_due')
        AND role = 'pro'
        THEN 'verified_sub'
      ELSE role
    END
  WHERE stripe_customer_id = p_customer_id;
END;
$$;

-- ─── newsletter_subscribers: add active flag if missing ────
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS active boolean default true;

-- Mark unsubscribed rows
UPDATE newsletter_subscribers SET active = true WHERE active IS NULL;
