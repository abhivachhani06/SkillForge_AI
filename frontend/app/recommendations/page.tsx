"use client";

import { useEffect, useState } from "react";
import {
  Lightbulb, BookOpen, Award, FolderGit2,
  BrainCircuit, Clock, ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import Navbar from "@/components/Navbar";
import { CardSkeleton } from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import { getRecommendations } from "@/lib/api";
import type { Recommendation } from "@/lib/types";

type FilterType = "all" | Recommendation["type"];

const typeConfig: Record<Recommendation["type"], { icon: typeof BookOpen; label: string; color: string; bg: string }> = {
  course:            { icon: BookOpen,    label: "Course",           color: "text-brand-300",   bg: "bg-brand-500/10 border-brand-500/30" },
  certification:     { icon: Award,       label: "Certification",    color: "text-amber-300",   bg: "bg-amber-500/10 border-amber-500/30" },
  project:           { icon: FolderGit2,  label: "Project",          color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/30" },
  interview_resource:{ icon: BrainCircuit,label: "Interview Prep",   color: "text-purple-300",  bg: "bg-purple-500/10 border-purple-500/30" },
};

const difficultyColor: Record<string, string> = {
  Beginner:     "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Intermediate: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Advanced:     "bg-rose-500/15 text-rose-300 border-rose-500/30",
  Mixed:        "bg-purple-500/15 text-purple-300 border-purple-500/30",
};

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const cfg = typeConfig[rec.type];
  const Icon = cfg.icon;

  return (
    <div className="glass-card p-6 hover:border-brand-500/40 transition-all duration-200 flex flex-col h-full">
      <div className="mb-4 flex items-start gap-3">
        <div className={clsx("flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border", cfg.bg)}>
          <Icon size={20} className={cfg.color} />
        </div>
        <div className="min-w-0">
          <span className={clsx("text-xs font-medium", cfg.color)}>{cfg.label}</span>
          <h3 className="mt-0.5 font-semibold text-slate-100 leading-tight">{rec.title}</h3>
        </div>
      </div>

      <p className="text-sm text-slate-400 mb-4 flex-1 leading-relaxed">{rec.description}</p>

      {/* Reason highlight */}
      <div className="mb-4 rounded-xl border border-brand-500/20 bg-brand-500/5 px-3 py-2.5">
        <p className="text-xs text-brand-400 font-medium mb-0.5">Why this matters for you</p>
        <p className="text-xs text-slate-300 leading-relaxed">{rec.reason}</p>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2">
        {rec.difficulty && (
          <span className={clsx("rounded-full border px-2 py-0.5 text-xs font-medium", difficultyColor[rec.difficulty] ?? "bg-slate-500/15 text-slate-300 border-slate-500/30")}>
            {rec.difficulty}
          </span>
        )}
        {rec.estimated_duration && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock size={11} />
            {rec.estimated_duration}
          </span>
        )}
        {rec.expected_outcome && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <ChevronRight size={11} />
            {rec.expected_outcome}
          </span>
        )}
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const [recs,    setRecs]    = useState<Recommendation[]>([]);
  const [filter,  setFilter]  = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRecs(await getRecommendations());
    } catch (e: any) {
      setError(e.message ?? "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? recs : recs.filter((r) => r.type === filter);

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all",             label: `All (${recs.length})` },
    { value: "course",          label: `Courses (${recs.filter((r) => r.type === "course").length})` },
    { value: "certification",   label: `Certifications (${recs.filter((r) => r.type === "certification").length})` },
    { value: "project",         label: `Projects (${recs.filter((r) => r.type === "project").length})` },
    { value: "interview_resource", label: `Interview (${recs.filter((r) => r.type === "interview_resource").length})` },
  ];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb size={22} className="text-brand-400" />
            <h1 className="font-display text-3xl font-bold text-white">Recommendations</h1>
          </div>
          <p className="text-slate-400">AI-curated resources tailored to your skill gaps and target role</p>
        </div>

        {/* Filter tabs */}
        {!loading && !error && recs.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter recommendations">
            {filterOptions.map(({ value, label }) => (
              <button
                key={value}
                role="tab"
                aria-selected={filter === value}
                onClick={() => setFilter(value)}
                className={clsx(
                  "rounded-full px-4 py-1.5 text-sm font-medium border transition-all",
                  filter === value
                    ? "bg-brand-500/15 border-brand-500/50 text-brand-300"
                    : "border-surface-border bg-surface-muted text-slate-400 hover:border-brand-500/40 hover:text-slate-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : recs.length === 0 ? (
          <EmptyState
            icon="book"
            title="No recommendations yet"
            description="Upload your resume and generate a roadmap to get personalized course and project recommendations."
            cta={{ label: "Upload Resume", href: "/resume-upload" }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="question"
            title={`No ${filter} recommendations`}
            description="Try a different filter or check back after uploading your resume."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((rec, i) => (
              <RecommendationCard key={`${rec.title}-${i}`} rec={rec} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
