"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

const variants = {
  default:
    "border border-[rgba(15,23,42,0.08)] bg-[#F1F5F9] text-[#475569]",
  info: "border border-blue-200 bg-blue-50 text-blue-700",
  success:
    "border border-emerald-200 bg-emerald-50 text-emerald-700",
  warning:
    "border border-amber-200 bg-amber-50 text-amber-700",
  danger:
    "border border-rose-200 bg-rose-50 text-rose-700",
  neutral: "border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] text-[#334155]",
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
