"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { glassCardClass } from "./glassStyles";

const paddings = {
  none: "",
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-6 md:p-8",
  lg: "p-6 sm:p-8 md:p-10",
} as const;

export type GlassCardProps = {
  children: ReactNode;
  padding?: keyof typeof paddings;
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
