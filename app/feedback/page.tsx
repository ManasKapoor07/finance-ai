"use client";

import { useState } from "react";
import {
  useSubmitFeedbackMutation,
  type FeedbackRequest,
  type PersonalizationValue,
} from "../redux/api/feedbackApi";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import PageLayout from "../components/PageLayout";
import FeedbackAnalyticsPage from "./FeedbackAnalyticsPage";

// ─── Constants ────────────────────────────────────────────────────────────────

const PERSONALIZATION_OPTIONS: { value: PersonalizationValue; label: string }[] = [
  { value: "EXTREMELY_PERSONALIZED", label: "Extremely personalized" },
  { value: "MOSTLY_PERSONALIZED",    label: "Mostly personalized"    },
  { value: "SOMEWHAT_GENERIC",       label: "Somewhat generic"       },
  { value: "VERY_GENERIC",           label: "Very generic"           },
];

const INSIGHT_OPTIONS = [
  "Lifestyle creep",
  "Emotional spending",
  "Subscription leaks",
  "Salary vs spending drift",
  "Weekend / late-night spending",
  "Financial forecasting",
  "Savings behavior",
  "Investment behavior",
];

// ─── Initial state ────────────────────────────────────────────────────────────

const EMPTY: FeedbackRequest = {
  firstImpression:  "",
  accurateInsight:  "",
  personalization:  "" as PersonalizationValue,
  wantedInsights:   [],
  describeToFriend: "",
  holyShitInsight:  "",
  contactEmail:     "",
  contactOk:        false,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  const [form, setForm] = useState<FeedbackRequest>(EMPTY);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const [submitFeedback, { isLoading, error }] = useSubmitFeedbackMutation();

  // ── field helpers ───────────────────────────────────────────────────────────
  const setField =
    (key: keyof FeedbackRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleInsight = (tag: string) =>
    setForm((f) => ({
      ...f,
      wantedInsights: f.wantedInsights.includes(tag)
        ? f.wantedInsights.filter((t) => t !== tag)
        : [...f.wantedInsights, tag],
    }));

  // ── submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.personalization) {
      setValidationError("Please answer question 3 before submitting.");
      return;
    }
    setValidationError(null);
    try {
      await submitFeedback(form).unwrap();
      setSubmitted(true);
    } catch {
      // RTK error surfaced via `error` from the hook
    }
  };

  // ── thank-you screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#080B14] px-6">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-5">🙏</div>
          <h1 className="text-2xl font-black text-white mb-3">
            Thanks — that means a lot.
          </h1>
          <p className="text-white/40 text-sm leading-relaxed">
            Your feedback shapes what MoneyLens becomes. We read every single
            response.
          </p>
        </div>
      </main>
    );
  }

  const serverError =
    error && "status" in error
      ? `Server error ${error.status}. Please try again.`
      : null;

  // ── form ────────────────────────────────────────────────────────────────────
  return (
    <PageLayout>
    <main className="min-h-screen bg-[#080B14] p-6">
      <div className=" mx-auto">
        {/* <button
          onClick={() => router.back()}
          className="group mb-8 inline-flex items-center gap-2 rounded-2xl
                    border border-white/[0.08] bg-white/[0.03]
                    px-4 py-2.5 text-sm font-medium text-white/60
                    transition-all hover:border-white/15 hover:bg-white/[0.05]
                    hover:text-white"
        >

                <ArrowLeft
                  size={16}
                  className="transition-transform group-hover:-translate-x-0.5"
                />

                Back

        </button> */}
        {/* Header */}
        <p className="text-[11px] uppercase tracking-widest text-white/25 mb-2">
          Beta feedback
        </p>
        <h1 className="text-3xl font-black text-white mb-1">Tell us the truth.</h1>
        <p className="text-white/40 text-sm mb-12">
          6 quick questions. No fluff — just what actually helps us build better.
        </p>
      {/* <FeedbackAnalyticsPage /> */}


        {/* Q1 */}
        <Question num="01" label="What was your first impression of MoneyLens?">
          <MLTextarea
            value={form.firstImpression}
            onChange={setField("firstImpression")}
            placeholder="It felt like…"
          />
        </Question>

        {/* Q2 */}
        <Question num="02" label="Did any insight feel surprisingly accurate?">
          <MLTextarea
            value={form.accurateInsight}
            onChange={setField("accurateInsight")}
            placeholder="The insight about… felt eerily accurate because…"
          />
        </Question>

        {/* Q3 */}
        <Question
          num="03"
          label="Did the insights feel genuinely personalized — or generic?"
          required
        >
          <div className="flex flex-col gap-2">
            {PERSONALIZATION_OPTIONS.map((opt) => (
              <RadioOption
                key={opt.value}
                name="personalization"
                value={opt.value}
                label={opt.label}
                checked={form.personalization === opt.value}
                onChange={() =>
                  setForm((f) => ({ ...f, personalization: opt.value }))
                }
              />
            ))}
          </div>
        </Question>

        {/* Q4 */}
        <Question
          num="04"
          label="What kind of insights would you want more of?"
        >
          <div className="grid grid-cols-2 gap-2">
            {INSIGHT_OPTIONS.map((tag) => (
              <CheckboxOption
                key={tag}
                label={tag}
                checked={form.wantedInsights.includes(tag)}
                onChange={() => toggleInsight(tag)}
              />
            ))}
          </div>
        </Question>

        {/* Q5 */}
        <Question
          num="05"
          label="How would you describe MoneyLens to a friend?"
        >
          <MLTextarea
            value={form.describeToFriend}
            onChange={setField("describeToFriend")}
            placeholder="I'd say it's like…"
          />
        </Question>

        {/* Q6 */}
        <Question
          num="06"
          label="What insight would make you say: 'holy sh*t this app understands me'?"
        >
          <MLTextarea
            value={form.holyShitInsight}
            onChange={setField("holyShitInsight")}
            placeholder="If it told me…"
          />
        </Question>

        {/* Contact opt-in */}
        <div className="mb-10 p-5 rounded-2xl border border-white/[0.07] bg-white/[0.03]">
          <CheckboxOption
            label="You can reach out to me for follow-up feedback"
            checked={form.contactOk}
            onChange={() => setForm((f) => ({ ...f, contactOk: !f.contactOk }))}
          />
          {form.contactOk && (
            <input
              type="email"
              value={form.contactEmail}
              onChange={setField("contactEmail")}
              placeholder="your@email.com"
              className="mt-3 w-full bg-transparent border border-white/10 rounded-xl
                         px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20
                         focus:outline-none focus:border-white/25"
            />
          )}
        </div>

        {/* Errors */}
        {(validationError || serverError) && (
          <p className="text-red-400 text-sm mb-4">
            {validationError ?? serverError}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl font-bold text-base tracking-tight
                     text-[#080B14] disabled:opacity-50 transition-all
                     hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: "linear-gradient(135deg, #6EE7B7, #67E8F9)",
          }}
        >
          {isLoading ? "Sending…" : "Submit feedback"}
        </button>

        <p className="text-center text-xs text-white/20 mt-4">
          Anonymous unless you opt in · Takes about 3 minutes
        </p>
      </div>
    </main>
    </PageLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Question({
  num,
  label,
  required = false,
  children,
}: {
  num: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <p className="text-[11px] text-white/25 font-mono mb-1">{num}</p>
      <p className="text-[15px] font-semibold text-white mb-3 leading-snug">
        {label}
        {required && <span className="text-emerald-400 ml-1">*</span>}
      </p>
      {children}
    </div>
  );
}

function MLTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      rows={3}
      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl
                 px-4 py-3 text-sm text-white/80 placeholder:text-white/20
                 resize-none focus:outline-none focus:border-white/20 leading-relaxed"
    />
  );
}

function RadioOption({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer
        text-sm transition-all ${
          checked
            ? "border-white/25 bg-white/[0.07] text-white"
            : "border-white/[0.07] bg-white/[0.03] text-white/50 hover:border-white/15"
        }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="accent-emerald-400"
      />
      {label}
    </label>
  );
}

function CheckboxOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer
        text-sm transition-all ${
          checked
            ? "border-white/25 bg-white/[0.07] text-white"
            : "border-white/[0.07] bg-white/[0.03] text-white/50 hover:border-white/15"
        }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-emerald-400 w-4 h-4 flex-shrink-0"
      />
      {label}
    </label>
  );
}