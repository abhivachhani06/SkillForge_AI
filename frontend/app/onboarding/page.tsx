"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ChevronRight, ChevronLeft, Plus, X } from "lucide-react";
import { submitOnboarding } from "@/lib/api";
import type { OnboardingPayload } from "@/lib/types";

// ─── Step definitions ────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Education",   title: "Your educational background" },
  { id: 2, label: "Skills",      title: "What skills do you already have?" },
  { id: 3, label: "Target",      title: "Where do you want to go?" },
  { id: 4, label: "Experience",  title: "Your experience level" },
  { id: 5, label: "Schedule",    title: "How much time can you commit?" },
];

const SKILL_SUGGESTIONS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python",
  "Java", "Docker", "PostgreSQL", "MongoDB", "AWS", "Git", "REST APIs",
  "GraphQL", "Vue.js", "Angular", "CSS/Tailwind", "System Design",
];

const INTEREST_OPTIONS = [
  "Web Development", "Mobile Development", "DevOps / Cloud", "Machine Learning",
  "Blockchain", "Cybersecurity", "Data Engineering", "Product Management",
];

const TARGET_ROLES = [
  "Full-Stack Software Engineer", "Frontend Developer", "Backend Developer",
  "DevOps / SRE Engineer", "Data Engineer", "Machine Learning Engineer",
  "Mobile Developer (iOS/Android)", "Cloud Solutions Architect",
  "Product Manager", "Cybersecurity Analyst",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  // Form state
  const [education, setEducation]     = useState("");
  const [skills, setSkills]           = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [interests, setInterests]     = useState<string[]>([]);
  const [targetRole, setTargetRole]   = useState("");
  const [expLevel, setExpLevel]       = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState(10);

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  const toggleItem = (arr: string[], item: string, setArr: (v: string[]) => void) => {
    setArr(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  const addCustomSkill = () => {
    const s = customSkill.trim();
    if (s && !skills.includes(s)) { setSkills([...skills, s]); }
    setCustomSkill("");
  };

  const canNext = () => {
    if (step === 1) return education.trim().length > 0;
    if (step === 2) return skills.length > 0;
    if (step === 3) return targetRole.length > 0;
    if (step === 4) return expLevel.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const payload: OnboardingPayload = {
      education,
      current_skills: skills,
      interests,
      target_role: targetRole,
      experience_level: expLevel,
      preferred_learning_hours_per_week: hoursPerWeek,
    };
    try {
      await submitOnboarding(payload);
    } catch {
      // silently ignore — navigate anyway, resume upload will complete the profile
    }
    router.push("/resume-upload");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <div className="orb h-64 w-64 bg-brand-600 -top-10 left-0 opacity-20" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2 font-display font-bold text-xl text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-600">
              <Zap size={15} className="text-white" />
            </div>
            SkillForge AI
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Let&apos;s set up your profile</h1>
          <p className="mt-2 text-slate-400">This takes about 2 minutes and personalizes everything</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-3 flex justify-between">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center">
                <div
                  className={`mb-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    s.id < step
                      ? "bg-brand-500 text-white"
                      : s.id === step
                      ? "border-2 border-brand-500 bg-brand-500/20 text-brand-300"
                      : "border border-surface-border bg-surface-muted text-slate-600"
                  }`}
                >
                  {s.id < step ? "✓" : s.id}
                </div>
                <span className={`hidden text-xs sm:block ${s.id === step ? "text-brand-300" : "text-slate-600"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-border">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step card */}
        <div className="glass-card p-8 min-h-[340px]">
          <h2 className="mb-6 text-xl font-semibold text-slate-100">
            {STEPS[step - 1].title}
          </h2>

          {/* Step 1: Education */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="edu-degree" className="mb-1.5 block text-sm text-slate-400">Highest degree</label>
                <select
                  id="edu-degree"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select your degree…</option>
                  <option>High School / 12th</option>
                  <option>Diploma</option>
                  <option>B.Tech / B.E.</option>
                  <option>BCA / B.Sc CS</option>
                  <option>M.Tech / M.E.</option>
                  <option>MBA</option>
                  <option>MCA / M.Sc CS</option>
                  <option>Self-taught / Bootcamp</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Skills */}
          {step === 2 && (
            <div>
              <p className="mb-3 text-sm text-slate-400">Select all that apply, or type a custom skill.</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {SKILL_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleItem(skills, s, setSkills)}
                    className={`rounded-full border px-3 py-1 text-sm font-medium transition-all ${
                      skills.includes(s)
                        ? "border-brand-500/60 bg-brand-500/15 text-brand-300"
                        : "border-surface-border bg-surface-muted text-slate-400 hover:border-brand-500/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
                  className="input-field"
                  placeholder="Add a custom skill…"
                />
                <button onClick={addCustomSkill} className="btn-ghost px-3">
                  <Plus size={18} />
                </button>
              </div>
              {skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span key={s} className="flex items-center gap-1 rounded-full bg-brand-500/15 border border-brand-500/30 px-2.5 py-0.5 text-xs text-brand-300">
                      {s}
                      <button onClick={() => setSkills(skills.filter((x) => x !== s))} aria-label={`Remove ${s}`}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Target */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">Select your target role — this shapes your entire roadmap.</p>
              {TARGET_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setTargetRole(r)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                    targetRole === r
                      ? "border-brand-500/60 bg-brand-500/15 text-brand-300"
                      : "border-surface-border bg-surface-muted text-slate-400 hover:border-brand-500/40"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Experience level */}
          {step === 4 && (
            <div className="space-y-3">
              {[
                { value: "beginner",     label: "Beginner",     desc: "< 1 year of coding experience" },
                { value: "intermediate", label: "Intermediate", desc: "1–3 years, some projects/internships" },
                { value: "advanced",     label: "Advanced",     desc: "3+ years, professional experience" },
              ].map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setExpLevel(value)}
                  className={`w-full rounded-xl border px-4 py-4 text-left transition-all ${
                    expLevel === value
                      ? "border-brand-500/60 bg-brand-500/15"
                      : "border-surface-border bg-surface-muted hover:border-brand-500/40"
                  }`}
                >
                  <span className={`font-medium ${expLevel === value ? "text-brand-300" : "text-slate-200"}`}>{label}</span>
                  <span className="ml-2 text-sm text-slate-500">{desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 5: Schedule */}
          {step === 5 && (
            <div>
              <p className="mb-6 text-sm text-slate-400">
                How many hours per week can you dedicate to learning?
              </p>
              <div className="flex items-center gap-4">
                <input
                  id="hours-slider"
                  type="range"
                  min={2}
                  max={40}
                  step={2}
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  className="h-2 flex-1 appearance-none rounded-full bg-surface-border accent-brand-500 cursor-pointer"
                  aria-label="Learning hours per week"
                />
                <div className="flex h-14 w-20 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-brand-500/15 border border-brand-500/30">
                  <span className="text-xl font-bold text-brand-300">{hoursPerWeek}</span>
                  <span className="text-xs text-slate-500">hrs/week</span>
                </div>
              </div>
              <div className="mt-6 rounded-xl border border-surface-border bg-surface-muted p-4 text-sm text-slate-400">
                At <strong className="text-slate-200">{hoursPerWeek} hours/week</strong>, you&apos;re on track to close your skill gaps in approximately{" "}
                <strong className="text-brand-300">
                  {Math.round(120 / hoursPerWeek)} weeks
                </strong>.
              </div>

              {error && (
                <p className="mt-4 text-sm text-rose-400">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="btn-ghost gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          {step < STEPS.length ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="btn-primary gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>Continue to Resume Upload <ChevronRight size={18} /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
