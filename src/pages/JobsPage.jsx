import { useState } from "react";
import { DUMMY_JOBS } from "../data/index.js";
import { captureLead, isSupabaseConnected, supabase } from "../lib/supabase.js";

export default function JobsPage({ user, openLogin, openSignup, showToast, isVerifiedUser }) {
  const [showPostJob, setShowPostJob] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [applyingJob, setApplyingJob] = useState(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [applied, setApplied] = useState(new Set());

  async function handleApply(job) {
    if (!user) { openLogin(); return; }

    if (isSupabaseConnected) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("applications").insert({
          job_id:          String(job.id),
          applicant_id:    user.id,
          applicant_email: user.email || "",
          applicant_name:  user.name,
          message:         applyMessage,
        });
      }
    }

    setApplied(prev => new Set([...prev, job.id]));
    setApplyingJob(null);
    setApplyMessage("");
    showToast("Application sent! ✓");
  }

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

      <div className="job-consent-box">
        <h4>🔗 Get Connected to Hiring Contractors</h4>
        <p>
          Check the box below and verified contractors actively hiring in your trade will be able to reach out to you directly. We match you to relevant opportunities — you won't get spammed, and you can opt out any time.
        </p>
        <label className="consent-checkbox-row">
          <input type="checkbox" checked={consentChecked} onChange={async e => {
            setConsentChecked(e.target.checked);
            if (e.target.checked && user) {
              await captureLead({
                email: user.email || "",
                name: user.name,
                type: "job_seeker",
                consent_given: true,
                source_page: "jobs",
              });
            }
          }} />
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
            <button
              className={`btn-apply ${applied.has(job.id) ? "applied" : ""}`}
              disabled={applied.has(job.id)}
              onClick={() => {
                if (!user) { openLogin(); return; }
                if (!applied.has(job.id)) setApplyingJob(job);
              }}
            >
              {applied.has(job.id) ? "Applied ✓" : "Apply Now"}
            </button>
          </div>
        </div>
      ))}

      {/* APPLY MODAL */}
      {applyingJob && (
        <div className="modal-overlay" onClick={() => setApplyingJob(null)}>
          <div className="apply-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setApplyingJob(null)}>✕</button>
            <h3>Apply for Position</h3>
            <div className="apply-modal-sub">{applyingJob.title} · {applyingJob.company} · {applyingJob.location}</div>

            <div className="apply-user-card">
              <div className="apply-user-label">Applying as</div>
              <div className="apply-user-name">{user?.name}</div>
              <div className="apply-user-email">{user?.email}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Message to Employer (Optional)</label>
              <textarea
                className="form-input"
                style={{ minHeight: 90, resize: "vertical" }}
                placeholder="Briefly introduce yourself, your experience, or ask a question..."
                value={applyMessage}
                onChange={e => setApplyMessage(e.target.value)}
              />
            </div>

            <button className="btn-primary" onClick={() => handleApply(applyingJob)}>
              Submit Application →
            </button>
            <div style={{ textAlign: "center", fontSize: 11, color: "#aaa", marginTop: 8 }}>
              Your profile and contact info will be shared with this employer.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
