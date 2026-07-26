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
        "relative flex w-full min-w-0 flex-col gap-4 sm:gap-5 md:flex-row md:items-end md:justify-between md:gap-8",
        className
      )}
    >
      <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.22),transparent_70%)] blur-2xl" />
      <div className="relative min-w-0 flex-1 space-y-1.5 md:pr-4">
        <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-[#F8FAFC] md:text-[2rem]">
          {title}
        </h1>
        {subtitle ? (
          <div className="max-w-xl space-y-1 text-sm leading-relaxed text-[#A8B8D0] md:text-[0.95rem] [&>p]:m-0">
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
