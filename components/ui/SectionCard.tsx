"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";
import {
  unifiedSectionShellClass,
  unifiedSectionHeaderClass,
  unifiedSectionBodyClass,
  dashboardIconBadgeSubtleClass,
  dashboardCardTitleClass,
  dashboardCardDescriptionClass,
} from "./styles";

type IconProps = { className?: string };

export type SectionCardProps = {
  title: string;
  description?: string;
  icon?: ComponentType<IconProps>;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Zone sous le corps (ex. lien « Voir tout »). */
  footer?: ReactNode;
  bodyClassName?: string;
};

export default function SectionCard({
  title,
  description,
  icon: Icon,
  headerRight,
  children,
  className,
  footer,
  bodyClassName,
}: SectionCardProps) {
  return (
    <section className={cn(unifiedSectionShellClass, "flex flex-col", className)}>
      <header className={cn(unifiedSectionHeaderClass, "px-4 py-4 sm:px-6 sm:py-4")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {Icon ? (
              <div className={dashboardIconBadgeSubtleClass}>
                <Icon className="h-4 w-4" />
              </div>
            ) : null}
            <div className="min-w-0 pt-0.5">
              <h2 className={dashboardCardTitleClass}>{title}</h2>
              {description ? (
                <p className={dashboardCardDescriptionClass}>{description}</p>
              ) : null}
            </div>
          </div>
          {headerRight ? (
            <div className="shrink-0 sm:pt-1 [&_a]:font-semibold [&_a]:text-blue-300 [&_a]:hover:text-blue-200 [&_button]:text-white/80">
              {headerRight}
            </div>
          ) : null}
        </div>
      </header>

      <div className={cn(unifiedSectionBodyClass, "min-w-0 flex-1 space-y-4 sm:space-y-5", bodyClassName)}>
        {children}
      </div>

      {footer ? (
        <footer className="border-t border-white/10 px-4 py-3 sm:px-6 sm:py-3.5">{footer}</footer>
      ) : null}
    </section>
  );
}
