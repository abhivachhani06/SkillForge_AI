"use client";

import { useEffect, useState } from "react";
import { Map, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import RoadmapTimeline from "@/components/RoadmapTimeline";
import { RoadmapSkeleton } from "@/components/LoadingSkeleton";
import ProgressBar from "@/components/ProgressBar";
import { getRoadmap, updateRoadmapTask } from "@/lib/api";
import type { RoadmapTask } from "@/lib/types";

export default function RoadmapPage() {
  const [tasks,   setTasks]   = useState<RoadmapTask[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setTasks(await getRoadmap());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (id: string, status: RoadmapTask["status"]) => {
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await updateRoadmapTask(id, status);
    } catch {
      // Revert on failure
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t } : t)));
    }
  };

  const done       = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const total      = tasks.length;
  const pct        = total > 0 ? (done / total) * 100 : 0;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Map size={22} className="text-brand-400" />
              <h1 className="font-display text-3xl font-bold text-white">My Roadmap</h1>
            </div>
            <p className="text-slate-400">Click the status icon on any task to update progress</p>
          </div>
          <button onClick={load} className="btn-ghost gap-2 self-start sm:self-auto text-sm" aria-label="Refresh roadmap">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Progress summary */}
        {!loading && tasks.length > 0 && (
          <div className="mb-8 glass-card p-5">
            <div className="flex flex-wrap items-center gap-6 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-100">{done}</p>
                <p className="text-xs text-slate-500">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-300">{inProgress}</p>
                <p className="text-xs text-slate-500">In Progress</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-400">{total - done - inProgress}</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
            </div>
            <ProgressBar
              value={pct}
              label="Overall completion"
              color="brand"
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <RoadmapSkeleton />
        ) : (
          <RoadmapTimeline tasks={tasks} onStatusChange={handleStatusChange} />
        )}
      </main>
    </>
  );
}
