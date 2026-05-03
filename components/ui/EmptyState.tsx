"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";
import { glassCardClass } from "./styles";

type IconProps = { className?: string };

export type EmptyStateProps = {
  icon?: ComponentType<IconProps>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Sur fond blanc (ex. corps d’un `TableCard`), typographie sombre. */
  embedded?: boolean;
};

export default function EmptyState({ icon: Icon, title, description, action, className, embedded }: EmptyStateProps) {
  if (embedded) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-slate-50/90 px-6 py-12 text-center sm:py-14",
          className
        )}
      >
        {Icon ? (
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200/80 text-slate-500">
            <Icon className="h-8 w-8" />
          </div>
        ) : null}
        <p className="text-base font-semibold text-slate-900">{title}</p>
        {description ? (
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{description}</p>
        ) : null}
        {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        glassCardClass,
        "flex flex-col items-center justify-center px-6 py-12 text-center sm:py-14",
        className
      )}
    >
      {Icon ? (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white/90 shadow-inner backdrop-blur-sm">
          <Icon className="h-8 w-8" />
        </div>
      ) : null}
      <p className="text-base font-semibold text-white drop-shadow-sm">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-white/75">{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
