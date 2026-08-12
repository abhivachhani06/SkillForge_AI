"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this data. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
        <AlertTriangle size={36} className="text-rose-400" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-slate-100">{title}</h3>
      <p className="mb-8 max-w-sm text-slate-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary gap-2"
          aria-label="Retry loading data"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
}
