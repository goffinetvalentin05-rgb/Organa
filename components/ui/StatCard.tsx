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
  "transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_4px_20px_rgba(37,99,235,0.1)]";

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
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 ring-1 ring-blue-100">
          <Icon className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden />
        </span>
      </div>
      <div className={dashboardCardValueClass}>{value}</div>
      {footer ? (
        <div className="mt-auto pt-3 text-sm leading-relaxed text-[#667085]">
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
