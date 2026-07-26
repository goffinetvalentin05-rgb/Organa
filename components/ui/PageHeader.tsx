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
        "flex w-full min-w-0 flex-col gap-4 sm:gap-5 md:flex-row md:items-end md:justify-between md:gap-8",
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-2 md:pr-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[#10172A] md:text-3xl">{title}</h1>
        {subtitle ? (
          <div className="max-w-xl space-y-1 text-sm leading-relaxed text-[#667085] md:text-[0.9375rem] [&>p]:m-0">
            {subtitle}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-3 md:w-auto md:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
