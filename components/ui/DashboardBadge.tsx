"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

const variants = {
  default:
    "border border-[rgba(26,35,255,0.12)] bg-gradient-to-r from-[#EEF2FF] to-[#F5F7FF] text-[#1A23FF]",
  info: "border border-blue-200/80 bg-gradient-to-r from-blue-50 to-sky-50/80 text-blue-700 shadow-[0_0_16px_rgba(37,99,235,0.1)]",
  success:
    "border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50/70 text-emerald-700 shadow-[0_0_16px_rgba(16,185,129,0.1)]",
  warning:
    "border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/60 text-amber-700 shadow-[0_0_16px_rgba(245,158,11,0.1)]",
  danger:
    "border border-rose-200/80 bg-gradient-to-r from-rose-50 to-red-50/70 text-rose-700 shadow-[0_0_16px_rgba(244,63,94,0.1)]",
  neutral: "border border-[rgba(26,35,255,0.08)] bg-white/90 text-[#344054]",
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
