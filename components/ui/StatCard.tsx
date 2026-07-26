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
  "transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_16px_48px_rgba(0,0,0,0.32)]";

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
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className={dashboardCardLabelClass}>{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] ring-1 ring-white/[0.08]">
          <Icon className="h-3.5 w-3.5 text-blue-200/55" aria-hidden />
        </span>
      </div>
      <div className={dashboardCardValueClass}>{value}</div>
      {footer ? (
        <div className="mt-auto pt-3 text-sm leading-relaxed text-white/50 [&_.font-medium]:text-white/75 [&_span]:text-inherit">
          {footer}
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(glassCardClass, "group flex h-full min-h-0 flex-col p-5 sm:p-6", interactive, className)}
      >
        {inner()}
      </Link>
    );
  }

  return (
    <div className={cn(glassCardClass, "flex h-full min-h-0 flex-col p-5 sm:p-6", className)}>
      {inner()}
    </div>
  );
}
