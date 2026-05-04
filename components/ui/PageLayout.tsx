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

const stackMap = {
  /** Espacement vertical entre blocs (défaut dashboard). */
  comfortable: "space-y-8",
  compact: "space-y-6",
  none: "",
} as const;

export type PageLayoutProps = {
  children: ReactNode;
  /** Largeur max du contenu (défaut : 7xl). */
  maxWidth?: keyof typeof maxMap;
  /** Espacement vertical entre sections enfants. */
  stack?: keyof typeof stackMap;
  className?: string;
};

export default function PageLayout({
  children,
  maxWidth = "7xl",
  stack = "comfortable",
  className,
}: PageLayoutProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 px-0 pb-12 sm:pb-14",
        maxMap[maxWidth],
        stackMap[stack],
        className
      )}
    >
      {children}
    </div>
  );
}
