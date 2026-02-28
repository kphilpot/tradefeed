// ═══════════════════════════════════════════════════════════════════
// OnboardingModal — welcome wizard for new sign-ups
// Shown once after registration; dismissed state persisted to
// localStorage so it only appears once per device.
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";

const STEPS = [
  {
    icon: "🏗️",
    title: "Welcome to TradeFeed",
    body: "The platform built for construction professionals — not recruiters. Real bid intel, verified contractors, and a jobs board where subs talk directly to GCs.",
    cta: "Get Started",
  },
  {
    icon: "📡",
    title: "Your Feed, Your Trade",
    body: "The home Feed shows posts, alerts, and job openings from your industry. Like, repost, and comment — or post your own update for the community to see.",
    cta: "Next",
  },
  {
    icon: "👷",
    title: "Verified Contractor Directory",
    body: "Every contractor is manually verified by the TradeFeed team. Browse by trade, location, and rating. Send a direct message or copy contact info instantly.",
    cta: "Next",
  },
  {
    icon: "🔒",
    title: "Intel — For Verified Members",
    body: "Salary benchmarks, bid-rigging warnings, owner scorecards, and M&A deal flow live in Intel. Upgrade to Pro for full access.",
    cta: "Next",
  },
  {
    icon: "✅",
    title: "You're all set!",
    body: "Complete your profile to unlock the verified contractor badge. The more info you add, the more leads you get through the directory.",
    cta: "Go to My Profile",
  },
];

export default function OnboardingModal({ onClose, onGoToProfile }) {
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  function handleCta() {
    if (isLast) {
      onGoToProfile();
      onClose();
    } else {
      setStep(s => s + 1);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="onboarding-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="onboarding-progress-bg">
          <div className="onboarding-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        {/* Close button */}
        <button className="onboarding-skip" onClick={onClose} title="Skip tour">
          Skip
        </button>

        {/* Step content */}
        <div className="onboarding-icon">{current.icon}</div>
        <h2 className="onboarding-title">{current.title}</h2>
        <p className="onboarding-body">{current.body}</p>

        {/* Step dots */}
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`onboarding-dot ${i === step ? "active" : ""}`}
              onClick={() => setStep(i)}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        <button className="btn-primary" onClick={handleCta} style={{ marginTop: 8 }}>
          {current.cta}
        </button>
      </div>
    </div>
  );
}
