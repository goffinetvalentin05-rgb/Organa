"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

const variants = {
  default: "border border-white/15 bg-white/10 text-white/75",
  info: "border border-blue-400/30 bg-blue-500/15 text-blue-200",
  success: "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  warning: "border border-amber-400/30 bg-amber-500/15 text-amber-200",
  danger: "border border-red-400/30 bg-red-500/15 text-red-200",
  neutral: "border border-white/20 bg-white/[0.08] text-white/80",
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
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
