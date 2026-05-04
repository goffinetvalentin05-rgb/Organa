"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

const variants = {
  default: "border border-slate-200/80 bg-slate-100/90 text-slate-700",
  info: "border border-blue-200/80 bg-blue-100/90 text-blue-800",
  success: "border border-emerald-200/80 bg-emerald-100/90 text-emerald-800",
  warning: "border border-amber-200/80 bg-amber-100/90 text-amber-900",
  danger: "border border-red-200/80 bg-red-100/90 text-red-800",
  neutral: "border border-white/50 bg-white/70 text-slate-800",
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
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
