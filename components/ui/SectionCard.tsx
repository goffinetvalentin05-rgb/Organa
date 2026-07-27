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
      <header className={cn(unifiedSectionHeaderClass, "relative px-5 py-4 sm:px-6 sm:py-5")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            {Icon ? (
              <div className={cn(dashboardIconBadgeSubtleClass, "h-10 w-10 rounded-xl")}>
                <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
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
            <div className="shrink-0 text-xs font-medium uppercase tracking-[0.16em] text-[#94A3B8] [&_a]:font-semibold [&_a]:normal-case [&_a]:tracking-normal [&_a]:text-[#1A23FF] [&_a]:hover:text-[#151dd9] [&_button]:text-[#334155]">
              {headerRight}
            </div>
          ) : null}
        </div>
      </header>

      <div className={cn(unifiedSectionBodyClass, "relative min-w-0 flex-1", bodyClassName)}>
        {children}
      </div>

      {footer ? (
        <footer className="relative border-t border-[rgba(15,23,42,0.06)] px-5 py-3 sm:px-6 sm:py-3.5">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
