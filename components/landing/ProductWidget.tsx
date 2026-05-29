"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export type ProductWidgetData = {
  id: string;
  label: string;
  title: string;
  value: string;
  hint?: string;
  status?: "success" | "pending" | "info";
  icon?: LucideIcon;
  floatClass?: string;
};

export function ProductWidgetCard({
  label,
  title,
  value,
  hint,
  status = "info",
  icon: Icon,
  compact,
  className = "",
}: Omit<ProductWidgetData, "id" | "floatClass"> & {
  compact?: boolean;
  className?: string;
}) {
  const statusColors = {
    success: "text-[#1A23FF]",
    pending: "text-slate-600",
    info: "text-[#1A23FF]",
  };

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.22 } }}
      className={`group relative overflow-hidden rounded-2xl border border-white/60 bg-white/98 text-slate-900 shadow-[0_20px_44px_rgba(15,23,42,0.16)] backdrop-blur-md transition-[box-shadow,border-color] duration-300 hover:border-[#1A23FF]/25 hover:shadow-[0_24px_52px_rgba(26,35,255,0.18)] ${compact ? "p-3" : "p-3.5 md:p-4"} ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1A23FF]/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2">
        <p
          className={`font-semibold uppercase tracking-[0.1em] text-slate-500 ${compact ? "text-[0.65rem]" : "text-[10px] md:text-xs"}`}
        >
          {label}
        </p>
        {Icon ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1A23FF]/10 text-[#1A23FF] ring-1 ring-[#1A23FF]/10 transition group-hover:bg-[#1A23FF]/15">
            <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </span>
        ) : status === "success" ? (
          <CheckCircle2 className={`h-4 w-4 shrink-0 ${statusColors.success}`} aria-hidden />
        ) : null}
      </div>
      <p
        className={`font-black leading-tight text-[#1A23FF] ${compact ? "mt-1.5 text-xs" : "mt-2 text-sm"}`}
      >
        {title}
      </p>
      <p className={`font-bold text-slate-800 ${compact ? "mt-0.5 text-xs" : "mt-1 text-sm"}`}>{value}</p>
      {hint ? (
        <p className={`text-slate-500 ${compact ? "mt-1.5 text-[0.65rem] leading-snug" : "mt-2 text-xs"}`}>
          {hint}
        </p>
      ) : null}
    </motion.div>
  );
}

export function HeroFloatingWidget({ widget }: { widget: ProductWidgetData }) {
  if (!widget.floatClass) return null;
  return (
    <div
      className={`pointer-events-none absolute z-[2] hidden max-w-[min(200px,38vw)] md:block md:scale-[0.92] lg:max-w-[220px] lg:scale-100 ${widget.floatClass}`}
    >
      <ProductWidgetCard {...widget} icon={widget.icon} />
    </div>
  );
}
