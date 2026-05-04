"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";
import { glassFrameClass, glassCardHeaderClass, innerContentClass } from "./styles";

const tableCardBodyPaddingClass = "p-1.5 sm:p-2";

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
    <div className={cn(glassFrameClass, "flex flex-col overflow-hidden", className)}>
      {hasHeader ? (
        <header
          className={cn(
            glassCardHeaderClass,
            "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          )}
        >
          <div className="min-w-0">
            {title ? <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm font-medium text-slate-600">{description}</p> : null}
          </div>
          {toolbar ? <div className="flex shrink-0 flex-wrap items-center gap-2">{toolbar}</div> : null}
        </header>
      ) : null}

      <div className={cn(hasHeader ? `${tableCardBodyPaddingClass} pt-0` : tableCardBodyPaddingClass, "min-h-0 flex-1")}>
        <div
          className={cn(
            innerContentClass,
            hasHeader && "rounded-t-none border-t-0",
            !hasHeader && "min-h-0 overflow-hidden",
            bodyClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
