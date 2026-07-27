"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";
import {
  unifiedSectionShellClass,
  dashboardIconBadgeSubtleClass,
  dashboardTextPrimaryClass,
  dashboardTextSecondaryClass,
} from "./styles";

type IconProps = { className?: string };

export type EmptyStateProps = {
  icon?: ComponentType<IconProps>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  embedded?: boolean;
};

export default function EmptyState({ icon: Icon, title, description, action, className, embedded }: EmptyStateProps) {
  if (embedded) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(15,23,42,0.12)] bg-[#F8FAFC] px-6 py-12 text-center sm:py-14",
          className
        )}
      >
        {Icon ? (
          <div className={cn(dashboardIconBadgeSubtleClass, "mb-4 h-14 w-14 rounded-2xl")}>
            <Icon className="h-6 w-6" />
          </div>
        ) : null}
        <p className={cn("text-base font-semibold", dashboardTextPrimaryClass)}>{title}</p>
        {description ? (
          <p className={cn("mt-2 max-w-md text-sm leading-relaxed", dashboardTextSecondaryClass)}>{description}</p>
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
      <p className={cn("text-base font-semibold", dashboardTextPrimaryClass)}>{title}</p>
      {description ? (
        <p className={cn("mt-2 max-w-md text-sm leading-relaxed", dashboardTextSecondaryClass)}>{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
