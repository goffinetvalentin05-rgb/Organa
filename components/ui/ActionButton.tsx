"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";

const variants = {
  surface:
    "rounded-xl border border-[rgba(147,197,253,0.22)] bg-[rgba(255,255,255,0.06)] px-4 py-2.5 text-sm font-semibold text-[#E2E8F0] shadow-sm transition-all hover:border-[rgba(96,165,250,0.4)] hover:bg-[rgba(255,255,255,0.1)]",
  ghost:
    "rounded-xl px-3 py-2 text-sm font-medium text-[#A8B8D0] transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-[#F8FAFC]",
  ghostLight:
    "rounded-xl px-3 py-2 text-sm font-medium text-[#E2E8F0] transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-white",
  dangerSoft:
    "rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/25",
  premiumInline:
    "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] via-[#1A23FF] to-[#6366f1] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_18px_rgba(26,35,255,0.4)] transition hover:opacity-95 hover:shadow-[0_8px_28px_rgba(26,35,255,0.5)]",
  solidDark:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(147,197,253,0.22)] bg-[rgba(255,255,255,0.06)] px-5 py-3 text-sm font-semibold text-[#E2E8F0] shadow-sm transition hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(96,165,250,0.4)]",
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
