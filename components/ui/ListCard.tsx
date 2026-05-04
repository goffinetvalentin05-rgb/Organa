"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";
import { unifiedSectionShellClass, unifiedSectionBodyClass } from "./styles";

export type ListCardProps = {
  children: ReactNode;
  className?: string;
  /** Remplace le padding du corps si besoin (ex. `p-3`). */
  bodyClassName?: string;
};

/** Filtres / résumés — une seule carte, pas de double cadre. */
export default function ListCard({ children, className, bodyClassName }: ListCardProps) {
  return (
    <div className={cn(unifiedSectionShellClass, className)}>
      <div className={cn(unifiedSectionBodyClass, bodyClassName)}>{children}</div>
    </div>
  );
}
