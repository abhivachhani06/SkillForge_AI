"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, ChevronDown, ChevronUp } from "lucide-react";
import { clsx } from "clsx";
import Navbar from "@/components/Navbar";
import { CardSkeleton } from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import { generateInterviewQuestions } from "@/lib/api";
import type { InterviewQuestion } from "@/lib/types";

type DiffFilter = "all" | "easy" | "medium" | "hard";
type TypeFilter = "all" | "technical" | "hr";

const difficultyConfig: Record<string, { color: string; dot: string }> = {
  easy:   { color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  medium: { color: "bg-amber-500/15 text-amber-300 border-amber-500/30",       dot: "bg-amber-400" },
  hard:   { color: "bg-rose-500/15 text-rose-300 border-rose-500/30",          dot: "bg-rose-400" },
};

function QuestionCard({ q }: { q: InterviewQuestion }) {
  const [open, setOpen] = useState(false);
  const cfg = difficultyConfig[q.difficulty] ?? difficultyConfig.medium;

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-4 p-5 text-left hover:bg-surface-muted/30 transition-colors"
        aria-expanded={open}
      >
        <div className="mt-1 flex-shrink-0">
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
              cfg.color
            )}
          >
            <span className={clsx("h-1.5 w-1.5 rounded-full", cfg.dot)} />
            {q.difficulty}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx(
              "text-xs font-medium capitalize",
              q.type === "technical" ? "text-brand-400" : "text-purple-400"
            )}>
              {q.type === "technical" ? "Technical" : "HR / Behavioral"}
            </span>
          </div>
          <p className="font-medium text-slate-100 leading-snug">{q.question}</p>
        </div>
        <div className="flex-shrink-0 text-slate-500">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {open && (
        <div className="border-t border-surface-border px-5 py-4 space-y-4 animate-fade-in">
          <div>
            <p className="section-label mb-2">Model Answer</p>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {q.model_answer}
            </p>
          </div>
          {q.follow_up && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs font-medium text-amber-400 mb-1">Follow-up question:</p>
              <p className="text-sm text-slate-300">{q.follow_up}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InterviewPrepPage() {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [diffFilter, setDiffFilter] = useState<DiffFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setQuestions(await generateInterviewQuestions("Full-Stack Software Engineer"));
    } catch (e: any) {
      setError(e.message ?? "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = questions.filter((q) => {
    if (diffFilter !== "all" && q.difficulty !== diffFilter) return false;
    if (typeFilter !== "all" && q.type !== typeFilter) return false;
    return true;
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <BrainCircuit size={22} className="text-brand-400" />
            <h1 className="font-display text-3xl font-bold text-white">Interview Prep</h1>
          </div>
          <p className="text-slate-400">
            AI-generated questions for your target role. Click to reveal model answers.
          </p>
        </div>

        {/* Filters */}
        {!loading && !error && questions.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-3">
            {/* Type */}
            <div className="flex gap-1.5 rounded-xl border border-surface-border bg-surface-muted p-1" role="group" aria-label="Filter by type">
              {(["all", "technical", "hr"] as TypeFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={clsx(
                    "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    typeFilter === t
                      ? "bg-brand-500/20 text-brand-300"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {t === "hr" ? "HR / Behavioral" : t === "all" ? "All" : "Technical"}
                </button>
              ))}
            </div>

            {/* Difficulty */}
            <div className="flex gap-1.5 rounded-xl border border-surface-border bg-surface-muted p-1" role="group" aria-label="Filter by difficulty">
              {(["all", "easy", "medium", "hard"] as DiffFilter[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDiffFilter(d)}
                  className={clsx(
                    "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    diffFilter === d
                      ? "bg-brand-500/20 text-brand-300"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>

            <span className="ml-auto self-center text-sm text-slate-500">
              {filtered.length} of {questions.length}
            </span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : questions.length === 0 ? (
          <EmptyState
            icon="question"
            title="No questions generated yet"
            description="Complete your profile and resume upload to get interview questions tailored to your target role."
            cta={{ label: "Upload Resume", href: "/resume-upload" }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="question"
            title="No questions match your filters"
            description="Try adjusting the type or difficulty filters."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((q, i) => (
              <QuestionCard key={`${q.question.slice(0, 30)}-${i}`} q={q} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
