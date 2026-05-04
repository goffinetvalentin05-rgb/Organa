"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";
import { glassFrameClass, glassCardHeaderClass, iconBadgeClass, innerContentClass } from "./styles";

type IconProps = { className?: string };

export type SectionCardProps = {
  title: string;
  description?: string;
  icon?: ComponentType<IconProps>;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
};

const sectionBodyClass = cn(innerContentClass, "space-y-4 p-4 sm:p-5");

export default function SectionCard({
  title,
  description,
  icon: Icon,
  headerRight,
  children,
  className,
}: SectionCardProps) {
  return (
    <section className={cn(glassFrameClass, "flex flex-col overflow-hidden", className)}>
      <header className={cn(glassCardHeaderClass, "px-4 py-4 sm:px-5")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
      <div className="p-2 pt-0">
        <div className={sectionBodyClass}>{children}</div>
      </div>
    </section>
  );
}
