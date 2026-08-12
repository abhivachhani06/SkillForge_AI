"use client";
import { clsx } from "clsx";

type Severity = "low" | "medium" | "high" | "skill";

interface SkillBadgeProps {
  label: string;
  variant?: Severity;
  size?: "sm" | "md";
  tooltip?: string;
}

const variantMap: Record<Severity, string> = {
  skill:  "bg-brand-500/15 text-brand-300 border-brand-500/30",
  low:    "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  high:   "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const sizeMap = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
};

export default function SkillBadge({
  label,
  variant = "skill",
  size = "md",
  tooltip,
}: SkillBadgeProps) {
  return (
    <span
      title={tooltip}
      className={clsx(
        "inline-flex items-center rounded-full border font-medium",
        variantMap[variant],
        sizeMap[size],
        tooltip && "cursor-help"
      )}
    >
      {variant !== "skill" && (
        <span
          className={clsx("mr-1.5 inline-block h-1.5 w-1.5 rounded-full", {
            "bg-emerald-400": variant === "low",
            "bg-amber-400":   variant === "medium",
            "bg-rose-400":    variant === "high",
          })}
        />
      )}
      {label}
    </span>
  );
}
