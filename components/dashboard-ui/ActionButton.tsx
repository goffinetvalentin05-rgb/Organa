"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";

const variants = {
  surface:
    "rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:border-blue-200 hover:bg-white hover:shadow-md",
  ghost:
    "rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white/60 hover:text-slate-900",
  dangerSoft:
    "rounded-xl border border-red-100 bg-red-50/90 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100",
  premiumInline:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:opacity-95",
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
