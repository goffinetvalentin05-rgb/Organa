"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";
import {
  unifiedSectionShellClass,
  unifiedSectionHeaderClass,
  unifiedSectionBodyClass,
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
    <section
      className={cn(
        unifiedSectionShellClass,
        "flex flex-col transition-[box-shadow,border-color,transform] duration-300 ease-out",
        "hover:border-[rgba(26,35,255,0.12)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.06),0_12px_32px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      <header className={cn(unifiedSectionHeaderClass, "relative px-5 py-5 sm:px-6 sm:py-6")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <div className="flex min-w-0 items-start gap-4 sm:items-center">
            {Icon ? (
              <span
                className="dashboard-stat-icon dashboard-section-icon shrink-0"
                style={{
                  background: "linear-gradient(135deg, #4F57FF 0%, #1A23FF 50%, #151dd9 100%)",
                }}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className={dashboardCardTitleClass}>{title}</h2>
              {description ? (
                <p className={cn(dashboardCardDescriptionClass, "mt-1.5 max-w-2xl text-[0.9375rem] leading-relaxed")}>
                  {description}
                </p>
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
        <footer className="relative border-t border-[rgba(15,23,42,0.06)] px-5 py-3.5 sm:px-6 sm:py-4">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
