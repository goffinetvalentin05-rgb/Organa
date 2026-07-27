"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";

const variants = {
  surface:
    "rounded-xl border border-[rgba(15,23,42,0.1)] bg-white px-4 py-2.5 text-sm font-semibold text-[#334155] shadow-sm transition-all hover:border-[rgba(26,35,255,0.2)] hover:bg-[#F8FAFC] hover:text-[#0F172A]",
  ghost:
    "rounded-xl px-3 py-2 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]",
  ghostLight:
    "rounded-xl px-3 py-2 text-sm font-medium text-[#334155] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]",
  dangerSoft:
    "rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100",
  premiumInline:
    "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] via-[#1A23FF] to-[#6366f1] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(26,35,255,0.22)] transition hover:opacity-95 hover:shadow-[0_6px_18px_rgba(26,35,255,0.28)]",
  solidDark:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(15,23,42,0.1)] bg-white px-5 py-3 text-sm font-semibold text-[#334155] shadow-sm transition hover:bg-[#F8FAFC] hover:border-[rgba(26,35,255,0.2)]",
} as const;

type Base = {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
};

type ActionButtonProps = Base &
  (
    | ({ href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">)
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
  );

export default function ActionButton(props: ActionButtonProps) {
  const { children, variant = "surface", className } = props;
  const cls = cn(variants[variant], className);

  if ("href" in props && typeof props.href === "string") {
    const { href, children: _c, variant: _v, className: _cl, ...linkRest } = props;
    return (
      <Link href={href} className={cls} {...linkRest}>
        {children}
      </Link>
    );
  }

  const { children: _c2, variant: _v2, className: _cl2, type = "button", ...btnRest } = props as Extract<
    ActionButtonProps,
    { href?: undefined }
  >;

  return (
    <button type={type} className={cls} {...btnRest}>
      {children}
    </button>
  );
}
