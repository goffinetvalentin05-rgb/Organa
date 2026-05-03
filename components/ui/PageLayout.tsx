"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";

const maxMap = {
  full: "max-w-full",
  "7xl": "max-w-7xl",
  "6xl": "max-w-6xl",
  "5xl": "max-w-5xl",
  "4xl": "max-w-4xl",
  "3xl": "max-w-3xl",
} as const;

export type PageLayoutProps = {
  children: ReactNode;
  /** Largeur max du contenu (défaut : 7xl). */
  maxWidth?: keyof typeof maxMap;
  className?: string;
};

export default function PageLayout({ children, maxWidth = "7xl", className }: PageLayoutProps) {
  return (
    <div className={cn("mx-auto w-full space-y-6 pb-12", maxMap[maxWidth], className)}>{children}</div>
  );
}
