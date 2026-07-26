"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";
import { unifiedSectionShellClass, dashboardIconBadgeSubtleClass } from "./styles";

type IconProps = { className?: string };

export type EmptyStateProps = {
  icon?: ComponentType<IconProps>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** À l'intérieur d'un corps de tableau / liste déjà uni. */
  embedded?: boolean;
};

export default function EmptyState({ icon: Icon, title, description, action, className, embedded }: EmptyStateProps) {
  if (embedded) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(26,35,255,0.16)] bg-[#F5F7FF]/70 px-6 py-12 text-center sm:py-14",
          className
        )}
      >
        {Icon ? (
          <div className={cn(dashboardIconBadgeSubtleClass, "mb-4 h-14 w-14 rounded-2xl")}>
            <Icon className="h-6 w-6" />
          </div>
        ) : null}
        <p className="text-base font-semibold text-[#0B1220]">{title}</p>
        {description ? (
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[#4A5B78]">{description}</p>
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
        <div className={cn(dashboardIconBadgeSubtleClass, "mb-4 h-14 w-14 rounded-2xl")}>
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <p className="text-base font-semibold text-[#0B1220]">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[#4A5B78]">{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
