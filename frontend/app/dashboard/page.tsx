"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp, Target, Zap, BookOpen, ArrowRight,
  BrainCircuit, Award,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Card from "@/components/Card";
import SkillBadge from "@/components/SkillBadge";
import ProgressBar from "@/components/ProgressBar";
import { GaugeChart, ProgressLineChart, SkillBarChart } from "@/components/ChartWrappers";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import {
  getStudentProfile, getCareerProfile, getSkillGaps,
  getProgressSummary, getRecommendations,
} from "@/lib/api";
import type { StudentProfile, CareerProfile, SkillGap, ProgressSummary, Recommendation } from "@/lib/types";

// Mock weekly progress data for the line chart
const weeklyProgress = [
  { week: "W1", score: 42 },
  { week: "W2", score: 48 },
  { week: "W3", score: 54 },
  { week: "W4", score: 58 },
  { week: "W5", score: 62 },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const [student,  setStudent]  = useState<StudentProfile | null>(null);
  const [profile,  setProfile]  = useState<CareerProfile | null>(null);
  const [gaps,     setGaps]     = useState<SkillGap[]>([]);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [recs,     setRecs]     = useState<Recommendation[]>([]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [s, p, g, pr, r] = await Promise.allSettled([
        getStudentProfile(),
        getCareerProfile(),
        getSkillGaps(),
        getProgressSummary(),
        getRecommendations(),
      ]);
      if (s.status === "rejected") throw new Error(s.reason?.message ?? "Failed to load profile");
      setStudent(s.value);
      if (p.status === "fulfilled") setProfile(p.value);
      if (g.status === "fulfilled") setGaps(g.value);
      if (pr.status === "fulfilled") setProgress(pr.value);
      if (r.status === "fulfilled") setRecs(r.value);
    } catch (e: any) {
      setError(e.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <DashboardSkeleton />
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <ErrorState message={error} onRetry={load} />
        </main>
      </>
    );
  }

  if (!student || !profile) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <EmptyState
            icon="upload"
            title="No profile found"
            description="Upload your resume to generate a career profile and see your personalized dashboard."
            cta={{ label: "Upload Resume", href: "/resume-upload" }}
          />
        </main>
      </>
    );
  }

  const barData = Object.entries(progress?.breakdown ?? {}).map(([skill, score]) => ({ skill, score }));
  const highGaps = gaps.filter((g) => g.severity === "high");
  const nextRec  = recs[0];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">

        {/* ── Greeting ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">
              Welcome back, {student.name.split(" ")[0]} 👋
            </h1>
            <p className="mt-1 text-slate-400">
              Target: <span className="text-brand-300 font-medium">{student.target_role}</span>
            </p>
          </div>
          <Link href="/resume-upload" className="btn-ghost gap-2 text-sm self-start sm:self-auto">
            <Zap size={14} />
            Update Resume
          </Link>
        </div>

        {/* ── Top stats ── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Readiness Gauge */}
          <Card className="flex flex-col items-center gap-3 sm:col-span-1">
            <p className="section-label">Career Readiness</p>
            <GaugeChart value={progress?.readiness_score ?? 0} size={180} />
            <p className="text-sm text-slate-400 text-center">
              {progress && progress.readiness_score >= 75
                ? "Interview-ready! 🎉"
                : progress && progress.readiness_score >= 50
                ? "Making good progress"
                : "Keep building skills"}
            </p>
          </Card>

          {/* Roadmap Progress */}
          <Card className="flex flex-col justify-between">
            <div>
              <p className="section-label mb-3">Roadmap Progress</p>
              <ProgressBar
                value={progress?.roadmap_progress_pct ?? 0}
                label="Tasks completed"
                color="brand"
                size="lg"
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-400">Keep it up!</span>
              <Link href="/roadmap" className="flex items-center gap-1 text-brand-400 hover:text-brand-300">
                View roadmap <ArrowRight size={14} />
              </Link>
            </div>
          </Card>

          {/* High Priority Gaps */}
          <Card>
            <p className="section-label mb-3">Critical Gaps</p>
            {highGaps.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <Award size={16} />
                No critical gaps — great work!
              </div>
            ) : (
              <div className="space-y-2">
                {highGaps.slice(0, 4).map((g) => (
                  <div key={g.skill} className="flex items-center justify-between">
                    <SkillBadge label={g.skill} variant="high" size="sm" />
                    <span className="text-xs text-slate-500">{g.readiness_component_score}%</span>
                  </div>
                ))}
                {highGaps.length > 4 && (
                  <p className="text-xs text-slate-600">+{highGaps.length - 4} more</p>
                )}
              </div>
            )}
            <Link href="/recommendations" className="mt-4 flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300">
              View all recommendations <ArrowRight size={14} />
            </Link>
          </Card>
        </div>

        {/* ── Current Skills ── */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Your Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s) => <SkillBadge key={s} label={s} />)}
          </div>
        </Card>

        {/* ── Charts row ── */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-400" />
              <h2 className="font-semibold text-slate-100">Readiness Over Time</h2>
            </div>
            <ProgressLineChart data={weeklyProgress} />
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Target size={18} className="text-purple-400" />
              <h2 className="font-semibold text-slate-100">Skill Breakdown</h2>
            </div>
            <SkillBarChart data={barData} />
          </Card>
        </div>

        {/* ── Recommended Next Action ── */}
        {nextRec && (
          <Card className="border-brand-500/30 bg-brand-500/5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500/15 border border-brand-500/30">
                <Zap size={22} className="text-brand-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="section-label mb-1">Recommended Next Action</p>
                <h3 className="font-semibold text-slate-100">{nextRec.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{nextRec.reason}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {nextRec.difficulty && <span>Difficulty: {nextRec.difficulty}</span>}
                  {nextRec.estimated_duration && <span>· {nextRec.estimated_duration}</span>}
                  {nextRec.expected_outcome && <span>· {nextRec.expected_outcome}</span>}
                </div>
              </div>
              <Link href="/recommendations" className="btn-ghost text-sm flex-shrink-0">
                See all
              </Link>
            </div>
          </Card>
        )}

        {/* ── Quick links ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { href: "/roadmap",          icon: BookOpen,     label: "My Roadmap",    desc: "8 tasks" },
            { href: "/recommendations",  icon: Zap,          label: "Resources",     desc: `${recs.length} items` },
            { href: "/interview-prep",   icon: BrainCircuit, label: "Interview Prep", desc: "6 questions" },
            { href: "/mentor",           icon: Target,       label: "AI Mentor",     desc: "Chat now" },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href}>
              <Card hover className="h-full">
                <Icon size={22} className="text-brand-400 mb-3" />
                <p className="font-medium text-slate-100 text-sm">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
