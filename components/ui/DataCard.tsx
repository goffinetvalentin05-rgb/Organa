"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import GlassCard from "./GlassCard";
import {
  dashboardCardTitleClass,
  dashboardCardDescriptionClass,
} from "./styles";

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
        <div className="mb-4 border-b border-white/10 pb-4">
          {title ? <h3 className={cn(dashboardCardTitleClass, "text-base")}>{title}</h3> : null}
          {description ? (
            <p className={dashboardCardDescriptionClass}>{description}</p>
          ) : null}
        </div>
      ) : null}
      <div className="min-w-0">{children}</div>
    </GlassCard>
  );
}
