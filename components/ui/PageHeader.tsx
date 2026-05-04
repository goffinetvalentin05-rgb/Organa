"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between md:gap-6",
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5 md:pr-4">
        <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm md:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-white/80 md:text-base">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-3 md:w-auto md:justify-end [&_label]:text-white/90">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
