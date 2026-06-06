"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";

const variants = {
  surface:
    "rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-sm font-semibold text-white/90 shadow-sm backdrop-blur-sm transition-all hover:border-blue-400/30 hover:bg-white/[0.14] hover:shadow-[0_0_20px_rgba(26,35,255,0.15)]",
  ghost:
    "rounded-xl px-3 py-2 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.08] hover:text-white/90",
  /** Liens discrets sur fond dark (sidebar, topbar). */
  ghostLight:
    "rounded-xl px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white",
  dangerSoft:
    "rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/18",
  premiumInline:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.35)] transition hover:opacity-95 hover:shadow-[0_6px_28px_rgba(37,99,235,0.45)]",
  /** CTA sombre sur bandeau glass. */
  solidDark:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-5 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition hover:bg-white/[0.14] hover:border-blue-400/25",
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
