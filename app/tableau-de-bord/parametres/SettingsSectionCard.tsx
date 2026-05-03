"use client";

import type { ComponentType, ReactNode } from "react";

type IconProps = { className?: string };

type SettingsSectionCardProps = {
  icon: ComponentType<IconProps>;
  title: string;
  description?: string;
  children: ReactNode;
};

export default function SettingsSectionCard({
  icon: Icon,
  title,
  description,
  children,
}: SettingsSectionCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/40 to-blue-50/25 shadow-sm shadow-slate-200/30">
      <header className="border-b border-slate-100/90 bg-gradient-to-r from-blue-600/[0.07] via-white to-indigo-600/[0.06] px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] text-white shadow-md shadow-blue-600/25">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-[1.125rem]">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
            ) : null}
          </div>
        </div>
      </header>
      <div className="space-y-3 px-4 py-5 sm:px-5">{children}</div>
    </section>
  );
}
