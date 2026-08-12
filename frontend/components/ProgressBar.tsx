"use client";
import { clsx } from "clsx";

interface ProgressBarProps {
  value: number;        // 0–100
  max?: number;
  label?: string;
  showPercent?: boolean;
  color?: "brand" | "emerald" | "amber" | "rose";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

const colorMap = {
  brand:   "from-brand-500 to-purple-500",
  emerald: "from-emerald-500 to-teal-500",
  amber:   "from-amber-500 to-orange-500",
  rose:    "from-rose-500 to-pink-500",
};

const heightMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = true,
  color = "brand",
  size = "md",
  animated = true,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && <span className="text-sm text-slate-400">{label}</span>}
          {showPercent && (
            <span className="text-sm font-semibold text-slate-200">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={clsx("w-full overflow-hidden rounded-full bg-surface-border", heightMap[size])}
      >
        <div
          className={clsx(
            "h-full rounded-full bg-gradient-to-r transition-all duration-700",
            colorMap[color],
            animated && "ease-out"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
