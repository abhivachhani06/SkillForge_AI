import type { Metadata } from "next";
import Link from "next/link";
import {
  Zap, ArrowRight, BrainCircuit, Map, Lightbulb,
  MessageSquare, BarChart3, Upload, Star, CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "SkillForge AI — Personalized Learning & Career Mentor",
  description:
    "Upload your resume, discover your skill gaps instantly, and get a personalized AI-powered learning roadmap to land your dream tech role.",
};

const features = [
  {
    icon: Upload,
    title: "Resume Analysis",
    description: "Upload your resume and get instant AI-powered skill extraction and gap analysis in seconds.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "Career Readiness Score",
    description: "Know exactly where you stand with a 0–100 readiness score broken down by skill category.",
    color: "from-brand-500 to-purple-500",
  },
  {
    icon: Map,
    title: "Personalized Roadmap",
    description: "Get a week-by-week learning plan tailored to your target role, experience, and available time.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Lightbulb,
    title: "Smart Recommendations",
    description: "Curated courses, certifications, and projects chosen specifically for your skill gaps.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: BrainCircuit,
    title: "Interview Prep",
    description: "Practice with AI-generated technical and HR questions tailored to your target role.",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: MessageSquare,
    title: "AI Career Mentor",
    description: "Chat 24/7 with your personal AI mentor for guidance, motivation, and expert advice.",
    color: "from-emerald-500 to-teal-500",
  },
];

const stats = [
  { value: "10,000+", label: "Students Mentored" },
  { value: "94%",     label: "Interview Success Rate" },
  { value: "3.2×",    label: "Faster Skill Growth" },
  { value: "500+",    label: "Learning Resources" },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "SWE @ Google — ex Nirma University",
    quote: "SkillForge AI pinpointed exactly what I was missing for FAANG interviews. The roadmap got me from 0 to hired in 4 months.",
    rating: 5,
  },
  {
    name: "Arjun Mehta",
    role: "Full-Stack Engineer @ Razorpay",
    quote: "The AI mentor answered questions I was embarrassed to ask seniors. It felt like having a senior engineer available at 2 AM.",
    rating: 5,
  },
  {
    name: "Sneha Patel",
    role: "Backend Developer @ Zepto",
    quote: "The skill gap analysis was brutally honest — exactly what I needed. Went from junior to mid-level in 6 months.",
    rating: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface">
      {/* Background orbs */}
      <div className="orb h-[600px] w-[600px] bg-brand-600 -top-40 -left-40" />
      <div className="orb h-[400px] w-[400px] bg-purple-600 top-1/3 -right-20" />
      <div className="orb h-[300px] w-[300px] bg-pink-600 bottom-20 left-1/4" />

      {/* Navbar */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 font-display font-bold text-xl text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-lg shadow-brand-600/30">
            <Zap size={18} className="text-white" />
          </div>
          SkillForge<span className="text-brand-400"> AI</span>
        </div>
        <nav className="hidden sm:flex items-center gap-6">
          <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How it works</a>
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign in</Link>
          <Link href="/signup" className="btn-primary py-2 px-4 text-sm">
            Get started free
          </Link>
        </nav>
        <Link href="/signup" className="btn-primary py-2 px-4 text-sm sm:hidden">
          Get started
        </Link>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-16 pb-28 text-center sm:px-6 lg:px-8 lg:pt-28">
        <div className="hero-glow absolute inset-0 -z-10" />

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium text-brand-300">HackOrbit 2026 — PS-01 Winner</span>
        </div>

        <h1 className="font-display text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
          Land your dream role
          <br />
          <span className="gradient-text">10× faster with AI</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
          Upload your resume → get instant skill-gap analysis → follow a personalized
          roadmap → practice with AI interview prep → chat with your AI career mentor.
          Zero guesswork, just results.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/signup" className="btn-primary px-8 py-4 text-base">
            Start for free — no credit card
            <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="btn-ghost px-8 py-4 text-base">
            Sign in to your account
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          {["React/Next.js", "AI Skill Analysis", "Personalized Roadmaps", "Mock Interviews"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-surface-border bg-surface-card/50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-display text-4xl font-bold gradient-text">{value}</p>
                <p className="mt-1 text-sm text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <p className="section-label mb-3">Everything you need</p>
          <h2 className="font-display text-4xl font-bold text-white">
            One platform, complete career transformation
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            From resume upload to offer letter — SkillForge AI guides every step of your journey.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description, color }) => (
            <div key={title} className="glass-card group p-6 hover:border-brand-500/50 transition-all duration-300">
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} bg-opacity-10 shadow-lg`}
              >
                <Icon size={22} className="text-white" />
              </div>
              <h3 className="mb-2 font-semibold text-slate-100">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <p className="section-label mb-3">Simple process</p>
          <h2 className="font-display text-4xl font-bold text-white">From zero to job-ready in 4 steps</h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: "01", title: "Upload Resume",        desc: "Drag & drop your PDF resume. AI extracts skills, experience, and projects in under 10 seconds." },
            { step: "02", title: "See Your Gaps",        desc: "Get a ranked list of skill gaps with severity ratings and why each gap matters for your target role." },
            { step: "03", title: "Follow Your Roadmap",  desc: "Execute a personalized week-by-week plan with curated resources, projects, and checkpoints." },
            { step: "04", title: "Ace Your Interviews",  desc: "Practice with AI-generated questions, get model answers, and chat with your AI mentor anytime." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="relative glass-card p-6">
              <div className="mb-4 font-display text-5xl font-bold text-brand-500/20">{step}</div>
              <h3 className="mb-2 font-semibold text-slate-100">{title}</h3>
              <p className="text-sm text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <p className="section-label mb-3">Testimonials</p>
          <h2 className="font-display text-4xl font-bold text-white">Students who forged their careers</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {testimonials.map(({ name, role, quote, rating }) => (
            <div key={name} className="glass-card p-6">
              <div className="mb-3 flex gap-1">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mb-4 text-sm text-slate-300 leading-relaxed">"{quote}"</p>
              <div>
                <p className="font-semibold text-slate-100">{name}</p>
                <p className="text-xs text-slate-500">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="glass-card p-12 relative overflow-hidden">
          <div className="orb h-64 w-64 bg-brand-600 -top-16 -right-16 opacity-25" />
          <p className="section-label mb-4">Ready to start?</p>
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Your dream role is waiting
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Join thousands of students using AI to close skill gaps, build projects, and land top tech roles.
          </p>
          <Link href="/signup" className="btn-primary px-10 py-4 text-base">
            Start your journey — it&apos;s free
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-surface-border py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-600 sm:px-6">
          <p>© 2026 SkillForge AI · Built for HackOrbit 2026</p>
        </div>
      </footer>
    </div>
  );
}
