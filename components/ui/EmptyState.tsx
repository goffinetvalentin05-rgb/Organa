"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";
import { unifiedSectionShellClass, iconBadgeClass } from "./styles";

type IconProps = { className?: string };

export type EmptyStateProps = {
  icon?: ComponentType<IconProps>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** À l’intérieur d’un corps de tableau / liste déjà uni. */
  embedded?: boolean;
};

export default function EmptyState({ icon: Icon, title, description, action, className, embedded }: EmptyStateProps) {
  if (embedded) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/60 bg-slate-50/40 px-6 py-12 text-center sm:py-14",
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
    <div
      className={cn(
        unifiedSectionShellClass,
        "flex flex-col items-center justify-center px-6 py-12 text-center sm:py-14",
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
