"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";
import {
  unifiedSectionShellClass,
  unifiedSectionHeaderClass,
  unifiedSectionBodyClass,
  iconBadgeClass,
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
              <div className={iconBadgeClass}>
                <Icon className="h-5 w-5" />
              </div>
            ) : null}
            <div className="min-w-0 pt-0.5">
              <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
              {description ? (
                <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">{description}</p>
              ) : null}
            </div>
          </div>
          {headerRight ? (
            <div className="shrink-0 sm:pt-1 [&_a]:font-semibold [&_a]:text-[#2563EB] [&_button]:text-slate-700">
              {headerRight}
            </div>
          ) : null}
        </div>
      </header>

      <div className={cn(unifiedSectionBodyClass, "min-w-0 flex-1 space-y-4 sm:space-y-5", bodyClassName)}>
        {children}
      </div>

      {footer ? (
        <footer className="border-t border-white/25 px-4 py-3 sm:px-6 sm:py-3.5">{footer}</footer>
      ) : null}
    </section>
  );
}
