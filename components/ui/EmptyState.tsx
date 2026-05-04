"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";
import { glassFrameClass, innerContentClass, iconBadgeClass } from "./styles";

type IconProps = { className?: string };

export type EmptyStateProps = {
  icon?: ComponentType<IconProps>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Sur panneau déjà clair (ex. corps d’un `TableCard`), style intégré. */
  embedded?: boolean;
};

export default function EmptyState({ icon: Icon, title, description, action, className, embedded }: EmptyStateProps) {
  if (embedded) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50/95 to-indigo-50/40 px-6 py-12 text-center sm:py-14",
          className
        )}
      >
        {Icon ? (
          <div className={cn(iconBadgeClass, "mb-4 h-16 w-16 rounded-2xl")}>
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
    <div className={cn(glassFrameClass, "p-2", className)}>
      <div
        className={cn(
          innerContentClass,
          "flex flex-col items-center justify-center px-6 py-12 text-center sm:py-14"
        )}
      >
        {Icon ? (
          <div className={cn(iconBadgeClass, "mb-4 h-16 w-16 rounded-2xl")}>
            <Icon className="h-8 w-8" />
          </div>
        ) : null}
        <p className="text-base font-semibold text-slate-900">{title}</p>
        {description ? (
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{description}</p>
        ) : null}
        {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
      </div>
    </div>
  );
}
