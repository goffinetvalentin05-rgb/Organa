"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";
import { glassCardClass } from "./glassStyles";

type IconProps = { className?: string };

const interactive =
  "transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300/90 hover:shadow-md hover:shadow-blue-900/10";

export type StatCardProps = {
  label: string;
  value: ReactNode;
  icon: ComponentType<IconProps>;
  footer?: ReactNode;
  href?: string;
  className?: string;
};

export default function StatCard({ label, value, icon: Icon, footer, href, className }: StatCardProps) {
  const iconWrap = (interactive: boolean) => (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100/90 transition-colors",
        interactive && "group-hover:bg-blue-50"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 text-slate-600 transition-colors",
          interactive && "group-hover:text-[#2563EB]"
        )}
      />
    </div>
  );

  const inner = (interactive: boolean) => (
    <>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {iconWrap(interactive)}
      </div>
      <div className="text-4xl font-bold tracking-tight text-slate-900">{value}</div>
      {footer ? <div className="mt-2">{footer}</div> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(glassCardClass, "group block p-6", interactive, className)}>
        {inner(true)}
      </Link>
    );
  }

  return <div className={cn(glassCardClass, "p-6", className)}>{inner(false)}</div>;
}
