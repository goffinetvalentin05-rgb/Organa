"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "./cn";
import { glassCardClass } from "./styles";

type IconProps = { className?: string };

export type EmptyStateProps = {
  icon?: ComponentType<IconProps>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        glassCardClass,
        "flex flex-col items-center justify-center px-6 py-12 text-center sm:py-14",
        className
      )}
    >
      {Icon ? (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-blue-50/80 text-slate-400 shadow-inner">
          <Icon className="h-8 w-8" />
        </div>
      ) : null}
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
