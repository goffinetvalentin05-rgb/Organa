"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";

const variants = {
  surface:
    "rounded-xl border border-[rgba(26,35,255,0.12)] bg-white/90 px-4 py-2.5 text-sm font-semibold text-[#344054] shadow-[0_1px_2px_rgba(26,35,255,0.04)] transition-all hover:border-[rgba(26,35,255,0.28)] hover:bg-[#F0F4FF]",
  ghost:
    "rounded-xl px-3 py-2 text-sm font-medium text-[#4A5B78] transition-colors hover:bg-[#F0F4FF] hover:text-[#0B1220]",
  /** Liens discrets (sidebar, topbar). */
  ghostLight:
    "rounded-xl px-3 py-2 text-sm font-medium text-[#344054] transition-colors hover:bg-[#F0F4FF] hover:text-[#1A23FF]",
  dangerSoft:
    "rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100",
  premiumInline:
    "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] via-[#1A23FF] to-[#6366f1] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_18px_rgba(26,35,255,0.3)] transition hover:opacity-95 hover:shadow-[0_8px_28px_rgba(26,35,255,0.4)]",
  /** CTA secondaire sur bandeau. */
  solidDark:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(26,35,255,0.12)] bg-white px-5 py-3 text-sm font-semibold text-[#344054] shadow-sm transition hover:bg-[#F0F4FF] hover:border-[rgba(26,35,255,0.25)]",
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
