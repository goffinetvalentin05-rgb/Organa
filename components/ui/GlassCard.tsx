"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { glassCardClass } from "./styles";

const paddings = {
  none: "",
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-6 md:p-8",
  lg: "p-6 sm:p-8 md:p-10",
} as const;

export type GlassCardProps = {
  children: ReactNode;
  padding?: keyof typeof paddings;
  /**
   * @deprecated Sans effet : une seule surface glass est toujours utilisée (plus de double cadre).
   */
  useInnerContent?: boolean;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

export default function GlassCard({
  children,
  padding = "md",
  className,
  ...rest
}: GlassCardProps) {
  return (
    <div className={cn(glassCardClass, paddings[padding], className)} {...rest}>
      {children}
    </div>
  );
}
