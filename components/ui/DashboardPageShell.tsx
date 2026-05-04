"use client";

import type { ReactNode } from "react";
import PageLayout, { type PageLayoutProps } from "./PageLayout";
import { cn } from "./cn";

export type DashboardPageShellProps = Omit<PageLayoutProps, "children"> & {
  children: ReactNode;
};

/** Conteneur standard dashboard : largeur max + stack vertical homogène. */
export default function DashboardPageShell({
  children,
  className,
  maxWidth = "7xl",
  stack = "comfortable",
  ...rest
}: DashboardPageShellProps) {
  return (
    <PageLayout maxWidth={maxWidth} stack={stack} className={cn(className)} {...rest}>
      {children}
    </PageLayout>
  );
}
