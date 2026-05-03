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
  /**
   * `glass` : corps translucide (paramètres sur dégradé bleu).
   * `panel` : îlot blanc lisible (overview, fiches membre).
   */
  bodySurface?: "glass" | "panel";
};

const panelBodyClass =
  "space-y-4 rounded-2xl border border-slate-100/90 bg-white p-4 text-slate-900 shadow-inner shadow-slate-900/[0.04] sm:p-5";

const glassBodyClass =
  "space-y-4 rounded-2xl border border-white/[0.2] bg-white/[0.09] p-4 shadow-sm backdrop-blur-[14px] sm:p-5 [&_label]:text-white/88 [&_.text-primary]:text-white/90 [&_p]:text-white/70 [&_.text-slate-600]:text-white/70 [&_.text-slate-500]:text-white/62 [&_.text-slate-700]:text-white/88 [&_.text-slate-900]:text-white [&_h3]:text-white [&_.text-tertiary]:text-white/55 [&_input]:bg-white/[0.94] [&_input]:text-slate-900 [&_textarea]:bg-white/[0.94] [&_textarea]:text-slate-900 [&_select]:bg-white/[0.94] [&_select]:text-slate-900 [&_option]:text-slate-900";

export default function SectionCard({
  title,
  description,
  icon: Icon,
  headerRight,
  children,
  className,
  bodySurface = "panel",
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
              <h2 className="text-lg font-bold tracking-tight text-white drop-shadow-sm">{title}</h2>
              {description ? (
                <p className="mt-1 text-sm font-medium leading-relaxed text-white/70">{description}</p>
              ) : null}
            </div>
          </div>
          {headerRight ? (
            <div className="shrink-0 sm:pt-1 [&_a]:text-white [&_button]:text-white">{headerRight}</div>
          ) : null}
        </div>
      </header>
      <div className="px-4 pb-5 pt-2 sm:px-5 sm:pb-6">
        <div className={bodySurface === "glass" ? glassBodyClass : panelBodyClass}>{children}</div>
      </div>
    </section>
  );
}
