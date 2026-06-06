"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";
import {
  glassCardClass,
  dashboardCardLabelClass,
  dashboardCardValueClass,
} from "./styles";

type IconProps = { className?: string };

const interactive =
  "transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/35 hover:shadow-[0_0_0_1px_rgba(147,197,253,0.2),0_12px_40px_rgba(0,0,0,0.5),0_0_80px_rgba(26,35,255,0.2)]";

export type StatCardProps = {
  label: string;
  value: ReactNode;
  icon: ComponentType<IconProps>;
  footer?: ReactNode;
  href?: string;
  className?: string;
};

export default function StatCard({ label, value, icon: Icon, footer, href, className }: StatCardProps) {
  const inner = () => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className={dashboardCardLabelClass}>{label}</span>
        <Icon className="h-4 w-4 shrink-0 text-blue-300/50" aria-hidden />
      </div>
      <div className={dashboardCardValueClass}>{value}</div>
      {footer ? (
        <div className="mt-auto border-t border-white/10 pt-3 text-sm text-white/60 [&_.font-medium]:text-white/80 [&_span]:text-inherit">
          {footer}
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(glassCardClass, "group flex h-full min-h-0 flex-col p-6", interactive, className)}
      >
        {inner()}
      </Link>
    );
  }

  return (
    <div className={cn(glassCardClass, "flex h-full min-h-0 flex-col p-6", className)}>
      {inner()}
    </div>
  );
}
