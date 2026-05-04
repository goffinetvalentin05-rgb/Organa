"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";
import { unifiedSectionShellClass, unifiedSectionHeaderClass } from "./styles";

const defaultBodyPadding = "px-4 py-4 sm:px-6 sm:py-5";

export type TableCardProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  toolbar?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

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
    <div className={cn(unifiedSectionShellClass, "flex flex-col", className)}>
      {hasHeader ? (
        <header
          className={cn(
            unifiedSectionHeaderClass,
            "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4"
          )}
        >
          <div className="min-w-0">
            {title ? <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm font-medium text-slate-600">{description}</p> : null}
          </div>
          {toolbar ? <div className="flex shrink-0 flex-wrap items-center gap-2">{toolbar}</div> : null}
        </header>
      ) : null}

      <div
        className={cn(
          "min-h-0 min-w-0 flex-1 overflow-x-auto",
          bodyClassName === undefined ? defaultBodyPadding : bodyClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
