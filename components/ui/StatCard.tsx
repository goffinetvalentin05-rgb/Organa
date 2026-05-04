"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";
import { glassCardClass, iconBadgeClass } from "./styles";

type IconProps = { className?: string };

const interactive =
  "transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300/80 hover:shadow-xl hover:shadow-blue-950/15";

export type StatCardProps = {
  label: string;
  value: ReactNode;
  icon: ComponentType<IconProps>;
  footer?: ReactNode;
  href?: string;
  className?: string;
};

export default function StatCard({ label, value, icon: Icon, footer, href, className }: StatCardProps) {
  const inner = (isInteractive: boolean) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-600">{label}</span>
        <div className={cn(iconBadgeClass, isInteractive && "group-hover:shadow-lg")}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight text-slate-900 drop-shadow-sm md:text-4xl">{value}</div>
      {footer ? (
        <div className="mt-auto border-t border-transparent pt-3 text-sm text-slate-600 [&_.font-medium]:text-slate-800 [&_span]:text-inherit">
          {footer}
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          glassCardClass,
          "group flex h-full min-h-0 flex-col p-6 shadow-xl shadow-blue-950/10",
          interactive,
          className
        )}
      >
        {inner(true)}
      </Link>
    );
  }

  return (
    <div className={cn(glassCardClass, "flex h-full min-h-0 flex-col p-6 shadow-xl shadow-blue-950/10", className)}>
      {inner(false)}
    </div>
  );
}
