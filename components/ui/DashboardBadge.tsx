"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

const variants = {
  default: "border border-white/12 bg-white/[0.08] text-white/70",
  info: "border border-blue-400/25 bg-blue-500/12 text-blue-200",
  success: "border border-emerald-400/25 bg-emerald-500/12 text-emerald-200",
  warning: "border border-amber-400/25 bg-amber-500/12 text-amber-200",
  danger: "border border-red-400/25 bg-red-500/12 text-red-200",
  neutral: "border border-white/15 bg-white/[0.06] text-white/75",
} as const;

export type DashboardBadgeProps = {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
};

export default function DashboardBadge({ children, variant = "default", className }: DashboardBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
