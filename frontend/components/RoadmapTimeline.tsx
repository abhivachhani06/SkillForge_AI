"use client";

import { clsx } from "clsx";
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { RoadmapTask } from "@/lib/types";

interface RoadmapTimelineProps {
  tasks: RoadmapTask[];
  onStatusChange?: (id: string, status: RoadmapTask["status"]) => void;
}

const statusConfig = {
  done:        { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-500/30" },
  in_progress: { icon: Clock,        color: "text-brand-400",   bg: "bg-brand-400/10 border-brand-500/30" },
  pending:     { icon: Circle,       color: "text-slate-500",   bg: "bg-surface-muted border-surface-border" },
};

const priorityColor = {
  high:   "bg-rose-500/15 text-rose-300 border-rose-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  low:    "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

function nextStatus(current: RoadmapTask["status"]): RoadmapTask["status"] {
  if (current === "pending")     return "in_progress";
  if (current === "in_progress") return "done";
  return "pending";
}

function TaskCard({
  task,
  onStatusChange,
}: {
  task: RoadmapTask;
  onStatusChange?: (id: string, status: RoadmapTask["status"]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[task.status];
  const Icon = cfg.icon;

  return (
    <div
      className={clsx(
        "glass-card border transition-all duration-200 hover:border-brand-500/40",
        task.status === "done" && "opacity-70"
      )}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Status toggle button */}
        <button
          onClick={() => onStatusChange?.(task.id, nextStatus(task.status))}
          title={`Mark as ${nextStatus(task.status)}`}
          className={clsx(
            "mt-0.5 flex-shrink-0 rounded-full p-1 transition-colors",
            cfg.color,
            "hover:bg-white/10"
          )}
        >
          <Icon size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={clsx(
                "text-sm font-medium line-through-if-done",
                task.status === "done" ? "line-through text-slate-500" : "text-slate-100"
              )}
            >
              {task.title}
            </span>
            <span
              className={clsx(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                priorityColor[task.priority as keyof typeof priorityColor] ??
                  "bg-slate-500/15 text-slate-300 border-slate-500/30"
              )}
            >
              {task.priority} priority
            </span>
            <span className="inline-flex items-center rounded-full border border-surface-border bg-surface-muted px-2 py-0.5 text-xs text-slate-400">
              ~{task.estimated_hours}h
            </span>
          </div>

          {expanded && (
            <div className="mt-3 space-y-2 text-sm text-slate-400">
              <p>{task.description}</p>
              {task.prerequisites.length > 0 && (
                <p className="text-xs text-slate-500">
                  Prerequisites: {task.prerequisites.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex-shrink-0 rounded-lg p-1 text-slate-500 hover:bg-surface-muted hover:text-slate-300 transition-colors"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function RoadmapTimeline({ tasks, onStatusChange }: RoadmapTimelineProps) {
  // Group tasks by week_number
  const weeks = tasks.reduce<Record<number, RoadmapTask[]>>((acc, t) => {
    (acc[t.week_number] ??= []).push(t);
    return acc;
  }, {});

  const weekNumbers = Object.keys(weeks)
    .map(Number)
    .sort((a, b) => a - b);

  if (tasks.length === 0) {
    return (
      <p className="text-center text-slate-500 py-12">
        No roadmap tasks yet. Generate your roadmap first!
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {weekNumbers.map((week) => {
        const weekTasks = weeks[week];
        const done = weekTasks.filter((t) => t.status === "done").length;
        return (
          <div key={week}>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-600/20 border border-brand-500/40 text-sm font-bold text-brand-400">
                W{week}
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Week {week}</h3>
                <p className="text-xs text-slate-500">
                  {done}/{weekTasks.length} tasks complete
                </p>
              </div>
              <div className="ml-auto h-1.5 w-32 overflow-hidden rounded-full bg-surface-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${(done / weekTasks.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="ml-4 space-y-3 border-l-2 border-surface-border pl-6">
              {weekTasks.map((task) => (
                <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
