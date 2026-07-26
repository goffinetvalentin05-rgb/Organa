"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

const variants = {
  default:
    "border border-[rgba(147,197,253,0.2)] bg-[rgba(255,255,255,0.06)] text-[#CBD5E1]",
  info: "border border-blue-400/30 bg-blue-500/15 text-blue-200 shadow-[0_0_16px_rgba(37,99,235,0.15)]",
  success:
    "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.15)]",
  warning:
    "border border-amber-400/30 bg-amber-500/15 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.15)]",
  danger:
    "border border-rose-400/30 bg-rose-500/15 text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.15)]",
  neutral: "border border-[rgba(147,197,253,0.16)] bg-[rgba(255,255,255,0.05)] text-[#E2E8F0]",
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
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
