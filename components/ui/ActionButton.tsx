"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";

const variants = {
  surface:
    "rounded-lg border border-[#DDE3EE] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] shadow-sm transition-all hover:border-[#C7D0E0] hover:bg-[#F6F8FC]",
  ghost:
    "rounded-lg px-3 py-2 text-sm font-medium text-[#667085] transition-colors hover:bg-[#F6F8FC] hover:text-[#10172A]",
  /** Liens discrets (sidebar, topbar). */
  ghostLight:
    "rounded-lg px-3 py-2 text-sm font-medium text-[#344054] transition-colors hover:bg-[#F6F8FC] hover:text-[#10172A]",
  dangerSoft:
    "rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100",
  premiumInline:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition hover:opacity-95 hover:shadow-[0_6px_18px_rgba(37,99,235,0.3)]",
  /** CTA secondaire sur bandeau. */
  solidDark:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-[#DDE3EE] bg-white px-5 py-3 text-sm font-semibold text-[#344054] shadow-sm transition hover:bg-[#F6F8FC] hover:border-[#C7D0E0]",
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
