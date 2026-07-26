"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

const variants = {
  default: "border border-[#E7EBF3] bg-[#F6F8FC] text-[#667085]",
  info: "border border-blue-200 bg-blue-50 text-blue-700",
  success: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border border-amber-200 bg-amber-50 text-amber-700",
  danger: "border border-red-200 bg-red-50 text-red-700",
  neutral: "border border-[#E7EBF3] bg-white text-[#344054]",
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
