"use client";

/**
 * OnboardingModal.tsx
 *
 * Shows once after first login / after upload if the user hasn't completed
 * their onboarding profile yet (backend returns 204 on GET /api/onboarding/profile).
 *
 * Usage in DashboardPage:
 *   <OnboardingModal />
 *
 * It queries the profile itself — renders nothing while loading or if already done.
 */

import { useState } from "react";
import {
  useGetOnboardingProfileQuery,
  useSaveOnboardingProfileMutation,
  useSkipOnboardingProfileMutation,
  type OnboardingRequest,
} from "../redux/api/onBoardingapi";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3 | 4;

interface StepConfig {
  field:    keyof OnboardingRequest;
  label:    string;
  question: string;
  options:  { value: string; label: string; emoji: string }[];
}

const STEPS: StepConfig[] = [
  {
    field: "primaryGoal",
    label: "Your Goal",
    question: "What's your main financial goal?",
    options: [
      { value: "SAVE_FOR_GOAL",        label: "Save for a goal",       emoji: "🎯" },
      { value: "PAY_OFF_DEBT",         label: "Pay off debt",           emoji: "💳" },
      { value: "BUILD_EMERGENCY_FUND", label: "Build emergency fund",   emoji: "🛡️" },
      { value: "TRACK_SPENDING",       label: "Track my spending",      emoji: "📊" },
      { value: "GROW_WEALTH",          label: "Grow my wealth",         emoji: "📈" },
    ],
  },
  {
    field: "employmentType",
    label: "Work Situation",
    question: "How do you earn your income?",
    options: [
      { value: "SALARIED",       label: "Salaried",         emoji: "🏢" },
      { value: "FREELANCE",      label: "Freelance",        emoji: "💻" },
      { value: "BUSINESS_OWNER", label: "Business owner",   emoji: "🏪" },
      { value: "STUDENT",        label: "Student",          emoji: "🎓" },
      { value: "OTHER",          label: "Other",            emoji: "✦" },
    ],
  },
  {
    field: "dependents",
    label: "Dependents",
    question: "Who are you financially responsible for?",
    options: [
      { value: "JUST_ME",          label: "Just me",             emoji: "🙋" },
      { value: "SUPPORTING_FAMILY", label: "Supporting family",  emoji: "👨‍👩‍👦" },
      { value: "HAVE_KIDS",        label: "Have kids",           emoji: "👶" },
      { value: "BOTH",             label: "Family + kids",       emoji: "🏠" },
    ],
  },
  {
    field: "cityTier",
    label: "Location",
    question: "Where do you live?",
    options: [
      { value: "METRO",   label: "Metro city",   emoji: "🌆" },
      { value: "TIER_2",  label: "Tier 2 city",  emoji: "🏙️" },
      { value: "TIER_3",  label: "Tier 3 / town", emoji: "🏘️" },
    ],
  },
  {
    field: "incomeRange",
    label: "Income",
    question: "What's your approximate monthly income?",
    options: [
      { value: "BELOW_30K",      label: "Below ₹30K",      emoji: "💵" },
      { value: "RANGE_30K_60K",  label: "₹30K – ₹60K",    emoji: "💵" },
      { value: "RANGE_60K_1L",   label: "₹60K – ₹1L",     emoji: "💵" },
      { value: "RANGE_1L_2L",    label: "₹1L – ₹2L",      emoji: "💰" },
      { value: "ABOVE_2L",       label: "Above ₹2L",       emoji: "💰" },
    ],
  },
];

const TOTAL_STEPS = STEPS.length;

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingModal() {
  const { data: profile, isLoading, isError } = useGetOnboardingProfileQuery();
  const [saveProfile, { isLoading: isSaving }] = useSaveOnboardingProfileMutation();
  const [skipProfile, { isLoading: isSkipping }] = useSkipOnboardingProfileMutation();

  const [step, setStep]       = useState<Step>(0);
  const [answers, setAnswers] = useState<Partial<OnboardingRequest>>({});

  // Don't show: still loading, profile already exists (200), or error
  if (isLoading) return null;
  if (isError)   return null;
  if (profile !== null) return null; // 200 means already done / skipped

  const currentStep = STEPS[step];
  const selected    = answers[currentStep.field];
  const isLast      = step === TOTAL_STEPS - 1;

  const choose = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentStep.field]: value as any }));
  };

  const goNext = () => {
    if (!selected) return;
    if (isLast) {
      saveProfile(answers as OnboardingRequest);
    } else {
      setStep(s => (s + 1) as Step);
    }
  };

  const goBack = () => {
    if (step > 0) setStep(s => (s - 1) as Step);
  };

  const handleSkip = () => {
    skipProfile();
  };

  const progressPct = ((step) / TOTAL_STEPS) * 100;

  return (
    <>
      <style>{`
        .ob-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(8, 11, 20, 0.82);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: ob-fadein 0.25s ease;
        }
        @keyframes ob-fadein { from { opacity: 0; } to { opacity: 1; } }

        .ob-modal {
          background: #0f1524;
          border: 0.5px solid rgba(255,255,255,0.1);
          border-radius: 28px;
          width: 100%; max-width: 480px;
          padding: 36px 32px 32px;
          position: relative;
          animation: ob-slideup 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes ob-slideup {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ob-progress-track {
          height: 3px; background: rgba(255,255,255,0.07);
          border-radius: 99px; overflow: hidden; margin-bottom: 32px;
        }
        .ob-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6EE7B7, #22d3ee);
          border-radius: 99px;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .ob-step-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: #6EE7B7; margin-bottom: 8px;
        }
        .ob-question {
          font-size: 22px; font-weight: 800; color: #fff;
          letter-spacing: -0.03em; line-height: 1.2; margin-bottom: 28px;
          font-family: 'Bricolage Grotesque', 'DM Sans', sans-serif;
        }

        .ob-options {
          display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px;
        }
        .ob-option {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 18px; border-radius: 16px; cursor: pointer;
          border: 0.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          transition: all 0.15s; font-family: 'DM Sans', sans-serif;
          text-align: left; width: 100%;
        }
        .ob-option:hover {
          background: rgba(110,231,183,0.05);
          border-color: rgba(110,231,183,0.2);
        }
        .ob-option.selected {
          background: rgba(110,231,183,0.08);
          border-color: rgba(110,231,183,0.45);
          box-shadow: 0 0 0 1px rgba(110,231,183,0.15);
        }
        .ob-option-emoji {
          font-size: 20px; width: 32px; text-align: center; flex-shrink: 0;
        }
        .ob-option-label {
          font-size: 14px; font-weight: 600;
          color: rgba(255,255,255,0.8);
        }
        .ob-option.selected .ob-option-label { color: #6EE7B7; }
        .ob-option-check {
          margin-left: auto; width: 20px; height: 20px; border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.15s;
        }
        .ob-option.selected .ob-option-check {
          background: #6EE7B7; border-color: #6EE7B7;
        }
        .ob-option-check-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #080B14;
        }

        .ob-actions {
          display: flex; align-items: center; gap: 10px;
        }
        .ob-btn-back {
          width: 44px; height: 44px; border-radius: 14px; border: none;
          background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5);
          font-size: 18px; cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          transition: all 0.15s; font-family: 'DM Sans', sans-serif;
          flex-shrink: 0;
        }
        .ob-btn-back:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .ob-btn-back:disabled { opacity: 0.25; cursor: not-allowed; }

        .ob-btn-next {
          flex: 1; height: 44px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, #6EE7B7, #22d3ee);
          color: #080B14; font-size: 13px; font-weight: 700; cursor: pointer;
          transition: all 0.2s; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 6px 20px rgba(110,231,183,0.2);
        }
        .ob-btn-next:hover:not(:disabled) { opacity: 0.9; }
        .ob-btn-next:disabled {
          background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.22);
          box-shadow: none; cursor: not-allowed;
        }

        .ob-skip {
          width: 100%; text-align: center; margin-top: 16px;
          font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.22);
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: color 0.15s;
          padding: 4px 0;
        }
        .ob-skip:hover { color: rgba(255,255,255,0.4); }
        .ob-skip:disabled { cursor: not-allowed; }

        .ob-counter {
          position: absolute; top: 32px; right: 32px;
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.22);
        }
      `}</style>

      <div className="ob-overlay">
        <div className="ob-modal">
          <span className="ob-counter">{step + 1}/{TOTAL_STEPS}</span>

          {/* Progress */}
          <div className="ob-progress-track">
            <div
              className="ob-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Question */}
          <p className="ob-step-label">{currentStep.label}</p>
          <p className="ob-question">{currentStep.question}</p>

          {/* Options */}
          <div className="ob-options">
            {currentStep.options.map(opt => {
              const isSelected = selected === opt.value;
              return (
                <button
                  key={opt.value}
                  className={`ob-option ${isSelected ? "selected" : ""}`}
                  onClick={() => choose(opt.value)}
                >
                  <span className="ob-option-emoji">{opt.emoji}</span>
                  <span className="ob-option-label">{opt.label}</span>
                  <span className="ob-option-check">
                    {isSelected && <span className="ob-option-check-dot" />}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="ob-actions">
            <button
              className="ob-btn-back"
              onClick={goBack}
              disabled={step === 0}
              aria-label="Go back"
            >
              ←
            </button>
            <button
              className="ob-btn-next"
              onClick={goNext}
              disabled={!selected || isSaving}
            >
              {isSaving
                ? "Saving…"
                : isLast
                ? "Finish setup ✓"
                : "Continue →"}
            </button>
          </div>

          <button
            className="ob-skip"
            onClick={handleSkip}
            disabled={isSkipping}
          >
            {isSkipping ? "Skipping…" : "Skip for now — I'll do this later"}
          </button>
        </div>
      </div>
    </>
  );
}