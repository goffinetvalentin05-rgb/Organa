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
    <GlassCard padding={padding} useInnerContent={false} className={cn(className)} {...rest}>
      {hasHead ? (
        <div className="mb-4 border-b border-slate-200/70 pb-4">
          {title ? <h3 className="text-base font-bold tracking-tight text-slate-900">{title}</h3> : null}
          {description ? (
            <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">{description}</p>
          ) : null}
        </div>
      ) : null}
      <div className="rounded-xl border border-slate-200/55 bg-white/55 p-4 shadow-inner shadow-blue-950/[0.04] backdrop-blur-sm sm:p-5">
        {children}
      </div>
    </GlassCard>
  );
}
