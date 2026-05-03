"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";
import { glassCardClass } from "./styles";

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
  const iconWrap = (isInteractive: boolean) => (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white transition-colors",
        isInteractive && "group-hover:bg-white/25"
      )}
    >
      <Icon className={cn("h-5 w-5 transition-opacity", isInteractive && "group-hover:opacity-95")} />
    </div>
  );

  const inner = (isInteractive: boolean) => (
    <>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-white/80">{label}</span>
        {iconWrap(isInteractive)}
      </div>
      <div className="text-4xl font-bold tracking-tight text-white drop-shadow-sm">{value}</div>
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
