"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";
import { glassCardClass, glassCardHeaderClass } from "./styles";

export type TableCardProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  toolbar?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

/** Liste / tableau sans bandeau : panneau blanc lisible (pas du contenu sur le bleu à travers le verre). */
const tablePanelSolidClass =
  "overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_60px_-16px_rgba(15,23,42,0.14)]";

export default function TableCard({
  children,
  title,
  description,
  toolbar,
  className,
  bodyClassName,
}: TableCardProps) {
  const hasHeader = Boolean(title || description || toolbar);

  return (
    <div className={cn(hasHeader ? glassCardClass : tablePanelSolidClass, "flex flex-col", className)}>
      {hasHeader ? (
        <header
          className={cn(
            glassCardHeaderClass,
            "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          )}
        >
          <div className="min-w-0">
            {title ? <h2 className="text-lg font-bold tracking-tight text-white drop-shadow-sm">{title}</h2> : null}
            {description ? (
              <p className="mt-1 text-sm font-medium text-white/75">{description}</p>
            ) : null}
          </div>
          {toolbar ? <div className="flex shrink-0 flex-wrap items-center gap-2">{toolbar}</div> : null}
        </header>
      ) : null}
      <div
        className={cn(
          hasHeader ? "rounded-b-3xl border-t border-slate-100 bg-white text-slate-900" : "min-h-0 flex-1 text-slate-900",
          !hasHeader && "overflow-hidden",
          bodyClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
