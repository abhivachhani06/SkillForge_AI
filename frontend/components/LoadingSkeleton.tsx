"use client";

import { clsx } from "clsx";

interface SkeletonProps { className?: string }

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx("shimmer rounded-lg", className)}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-4/6" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
      </div>
      {/* Chart area */}
      <div className="glass-card p-6">
        <Skeleton className="h-4 w-1/4 mb-6" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

export function RoadmapSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2].map((w) => (
        <div key={w}>
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="ml-4 space-y-3 border-l-2 border-surface-border pl-6">
            {[0, 1].map((i) => (
              <div key={i} className="glass-card p-4 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
