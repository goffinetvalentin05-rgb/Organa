"use client";

import type { LucideIcon } from "lucide-react";
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
    success: "text-emerald-600",
    pending: "text-amber-600",
    info: "text-[#1A23FF]",
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-[0_16px_32px_rgba(15,23,42,0.14)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#1A23FF]/20 hover:shadow-[0_20px_40px_rgba(26,35,255,0.15)] ${compact ? "p-3" : "p-3.5 md:p-4"} ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={`font-semibold uppercase tracking-[0.08em] text-slate-500 ${compact ? "text-[0.65rem]" : "text-[10px] md:text-xs"}`}
        >
          {label}
        </p>
        {Icon ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1A23FF]/10 text-[#1A23FF]">
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
    </div>
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
