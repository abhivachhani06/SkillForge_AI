"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail, Target, Zap, GraduationCap, Briefcase,
  FolderGit2, ArrowLeft, Upload, CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Card from "@/components/Card";
import SkillBadge from "@/components/SkillBadge";
import { getStudentProfile, getCareerProfile, getProgressSummary } from "@/lib/api";
import type { StudentProfile, CareerProfile, ProgressSummary } from "@/lib/types";

export default function ProfilePage() {
  const [student,  setStudent]  = useState<StudentProfile | null>(null);
  const [profile,  setProfile]  = useState<CareerProfile | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getStudentProfile(),
      getCareerProfile(),
      getProgressSummary(),
    ]).then(([s, p, pr]) => {
      if (s.status === "fulfilled") setStudent(s.value);
      if (p.status === "fulfilled") setProfile(p.value);
      if (pr.status === "fulfilled") setProgress(pr.value);
      setLoading(false);
    });
  }, []);

  const initials = student?.name
    ? student.name.split(" ").map((n) => n[0]).slice(0, 2).join("")
    : "?";

  const levelColor: Record<string, string> = {
    beginner:     "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    intermediate: "bg-yellow-500/15  text-yellow-300  border-yellow-500/25",
    advanced:     "bg-purple-500/15  text-purple-300  border-purple-500/25",
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-surface-card animate-pulse" />
          ))}
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">

        {/* Back */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={15} />
          Back to Dashboard
        </Link>

        {/* ── Hero card ── */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar */}
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/30 to-purple-600/30 border border-brand-500/30 text-brand-300 text-2xl font-bold">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white">{student?.name ?? "—"}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><Mail size={13} />{student?.email}</span>
                <span className="flex items-center gap-1.5"><Target size={13} />{student?.target_role}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium capitalize ${levelColor[student?.experience_level ?? "beginner"]}`}>
                  {student?.experience_level}
                </span>
                {student?.onboarding_complete && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-300">
                    <CheckCircle2 size={11} /> Onboarding complete
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex sm:flex-col gap-4 sm:gap-2 sm:text-right">
              <div>
                <p className="text-2xl font-bold text-brand-300">{progress?.readiness_score ?? 0}%</p>
                <p className="text-xs text-slate-500">Career Readiness</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-300">{progress?.roadmap_progress_pct ?? 0}%</p>
                <p className="text-xs text-slate-500">Roadmap Done</p>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Skills ── */}
        {profile?.skills && profile.skills.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Zap size={16} className="text-brand-400" />
              <h2 className="font-semibold text-slate-100">Skills</h2>
              <span className="ml-auto text-xs text-slate-500">{profile.skills.length} skills</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => <SkillBadge key={s} label={s} />)}
            </div>
          </Card>
        )}

        {/* ── Education ── */}
        {profile?.education && profile.education.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={16} className="text-brand-400" />
              <h2 className="font-semibold text-slate-100">Education</h2>
            </div>
            <div className="space-y-4">
              {profile.education.map((e, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500/10 border border-brand-500/20">
                    <GraduationCap size={15} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">{e.degree}</p>
                    <p className="text-sm text-slate-400">{e.institution}</p>
                    {e.year && <p className="text-xs text-slate-500 mt-0.5">{e.year}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Experience ── */}
        {profile?.experience && profile.experience.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={16} className="text-brand-400" />
              <h2 className="font-semibold text-slate-100">Experience</h2>
            </div>
            <div className="space-y-5">
              {profile.experience.map((e, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Briefcase size={15} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-100">{e.role}</p>
                      {e.duration && <span className="text-xs text-slate-500 flex-shrink-0">{e.duration}</span>}
                    </div>
                    <p className="text-sm text-slate-400">{e.company}</p>
                    {e.description && <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{e.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Projects ── */}
        {profile?.projects && profile.projects.length > 0 && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <FolderGit2 size={16} className="text-brand-400" />
              <h2 className="font-semibold text-slate-100">Projects</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.projects.map((p, i) => (
                <div key={i} className="rounded-xl border border-surface-border bg-surface-muted/40 p-4">
                  <p className="font-medium text-slate-100">{p.title}</p>
                  {p.description && <p className="mt-1 text-sm text-slate-400 leading-relaxed">{p.description}</p>}
                  {p.tech_used?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.tech_used.map((t) => (
                        <span key={t} className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400 border border-slate-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Update resume CTA ── */}
        <Card className="border-brand-500/20 bg-brand-500/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-slate-100">Want to update your profile?</p>
              <p className="text-sm text-slate-400 mt-0.5">Re-upload your resume to refresh skills, experience and projects.</p>
            </div>
            <Link href="/resume-upload" className="btn-primary flex items-center gap-2 flex-shrink-0 text-sm">
              <Upload size={14} />
              Update Resume
            </Link>
          </div>
        </Card>

      </main>
    </>
  );
}
