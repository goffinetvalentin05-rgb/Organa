"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

export type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative flex w-full min-w-0 flex-col gap-5 sm:gap-6 md:flex-row md:items-end md:justify-between md:gap-10",
        className
      )}
    >
      <div className="pointer-events-none absolute -left-8 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.18),transparent_70%)] blur-2xl" />
      <div className="relative min-w-0 flex-1 space-y-3 md:pr-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(26,35,255,0.14)] bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1A23FF] shadow-[0_0_20px_rgba(26,35,255,0.08)] backdrop-blur-sm">
          <span className="dashboard-live-dot" />
          Obillz
        </div>
        <h1 className="text-[1.85rem] font-semibold tracking-[-0.03em] text-[#0B1220] md:text-[2.15rem]">
          {title}
        </h1>
        {subtitle ? (
          <div className="max-w-xl space-y-1 text-sm leading-relaxed text-[#4A5B78] md:text-[0.95rem] [&>p]:m-0">
            {subtitle}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="relative flex w-full shrink-0 flex-wrap items-center gap-3 md:w-auto md:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
