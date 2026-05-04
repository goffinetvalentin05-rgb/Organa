"use client";

import type { ReactNode } from "react";
import PageLayout, { type PageLayoutProps } from "./PageLayout";
import { cn } from "./cn";

export type DashboardPageShellProps = Omit<PageLayoutProps, "children"> & {
  children: ReactNode;
};

/** Conteneur standard des pages dashboard : largeur max + espacement vertical homogène. */
export default function DashboardPageShell({
  children,
  className,
  maxWidth = "7xl",
  ...rest
}: DashboardPageShellProps) {
  return (
    <PageLayout maxWidth={maxWidth} className={cn("space-y-8", className)} {...rest}>
      {children}
    </PageLayout>
  );
}
