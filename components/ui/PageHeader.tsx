"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import FinanceSectionNav, { isFinancePath } from "@/components/dashboard/FinanceSectionNav";
import { cn } from "./cn";

export type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  const pathname = usePathname();
  const showFinanceNav = isFinancePath(pathname);

  return (
    <div
      className={cn(
        "relative flex w-full min-w-0 flex-col",
        showFinanceNav ? "gap-5 sm:gap-6" : undefined,
        className
      )}
    >
      <div className="relative flex w-full min-w-0 flex-col gap-4 sm:gap-5 md:flex-row md:items-end md:justify-between md:gap-8">
        <div className="relative min-w-0 flex-1 space-y-1.5 md:pr-4">
          <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-[#0F172A] md:text-[2rem]">
            {title}
          </h1>
          {subtitle ? (
            <div className="max-w-xl space-y-1 text-sm leading-relaxed text-[#64748B] md:text-[0.95rem] [&>p]:m-0">
              {subtitle}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="relative flex w-full shrink-0 flex-wrap items-center gap-3 md:w-auto md:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
      {showFinanceNav ? <FinanceSectionNav /> : null}
    </div>
  );
}
