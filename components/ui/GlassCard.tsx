"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { glassCardClass, innerContentClass } from "./styles";

const paddings = {
  none: "",
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-6 md:p-8",
  lg: "p-6 sm:p-8 md:p-10",
} as const;

export type GlassCardProps = {
  children: ReactNode;
  padding?: keyof typeof paddings;
  /** Faux : une seule couche glass (ex. `padding="none"` plein écran). Par défaut : vrai sauf si `padding="none"`. */
  useInnerContent?: boolean;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

export default function GlassCard({
  children,
  padding = "md",
  useInnerContent,
  className,
  ...rest
}: GlassCardProps) {
  const inner =
    useInnerContent !== undefined ? useInnerContent : padding !== "none";

  if (!inner) {
    return (
      <div className={cn(glassCardClass, paddings[padding], className)} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn(glassCardClass, "p-2", className)} {...rest}>
      <div className={cn(innerContentClass, paddings[padding])}>{children}</div>
    </div>
  );
}
