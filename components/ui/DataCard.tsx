"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import GlassCard from "./GlassCard";

export type DataCardProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

export default function DataCard({
  title,
  description,
  children,
  className,
  padding = "md",
  ...rest
}: DataCardProps) {
  const hasHead = Boolean(title || description);

  return (
    <GlassCard padding={padding} className={cn(className)} {...rest}>
      {hasHead ? (
        <div className="mb-4 border-b border-white/15 pb-4">
          {title ? <h3 className="text-base font-bold tracking-tight text-white drop-shadow-sm">{title}</h3> : null}
          {description ? (
            <p className="mt-1 text-sm font-medium leading-relaxed text-white/75">{description}</p>
          ) : null}
        </div>
      ) : null}
      <div className="rounded-2xl border border-slate-100/90 bg-white/95 p-4 text-slate-900 shadow-inner shadow-slate-900/[0.04] sm:p-5">
        {children}
      </div>
    </GlassCard>
  );
}
