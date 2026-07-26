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
      <header className={cn(unifiedSectionHeaderClass, "px-5 py-4 sm:px-6 sm:py-4")}>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {Icon ? (
              <div className={dashboardIconBadgeSubtleClass}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            ) : null}
            <div className="min-w-0">
              <h2 className={dashboardCardTitleClass}>{title}</h2>
              {description ? (
                <p className={dashboardCardDescriptionClass}>{description}</p>
              ) : null}
            </div>
          </div>
          {headerRight ? (
            <div className="shrink-0 text-xs font-medium uppercase tracking-[0.16em] text-[#98A2B3] [&_a]:font-semibold [&_a]:normal-case [&_a]:tracking-normal [&_a]:text-[#2563EB] [&_a]:hover:text-[#1D4ED8] [&_button]:text-[#344054]">
              {headerRight}
            </div>
          ) : null}
        </div>
      </header>

      <div className={cn(unifiedSectionBodyClass, "min-w-0 flex-1", bodyClassName)}>
        {children}
      </div>

      {footer ? (
        <footer className="border-t border-[#EEF2F7] px-5 py-3 sm:px-6 sm:py-3.5">{footer}</footer>
      ) : null}
    </section>
  );
}
