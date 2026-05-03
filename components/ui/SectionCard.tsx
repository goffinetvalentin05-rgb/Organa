"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";
import { glassCardClass, glassCardHeaderClass, iconBadgeClass } from "./styles";

type IconProps = { className?: string };

export type SectionCardProps = {
  title: string;
  description?: string;
  icon?: ComponentType<IconProps>;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function SectionCard({
  title,
  description,
  icon: Icon,
  headerRight,
  children,
  className,
}: SectionCardProps) {
  return (
    <section className={cn(glassCardClass, "flex flex-col", className)}>
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
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
              ) : null}
            </div>
          </div>
          {headerRight ? <div className="shrink-0 sm:pt-1">{headerRight}</div> : null}
        </div>
      </header>
      <div className="space-y-4 px-4 py-5 sm:px-5">{children}</div>
    </section>
  );
}
