"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";
import ButtonSpinner from "./ButtonSpinner";

const variants = {
  surface:
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[rgba(15,23,42,0.1)] bg-white px-4 py-2.5 text-sm font-semibold text-[#334155] shadow-sm transition-all hover:border-[rgba(26,35,255,0.2)] hover:bg-[#F8FAFC] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(26,35,255,0.22)] focus-visible:ring-offset-2",
  ghost:
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(26,35,255,0.22)]",
  ghostLight:
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#334155] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(26,35,255,0.22)]",
  dangerSoft:
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300",
  premiumInline:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] via-[#1A23FF] to-[#6366f1] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(26,35,255,0.22)] transition hover:opacity-95 hover:shadow-[0_6px_18px_rgba(26,35,255,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(26,35,255,0.35)]",
  solidDark:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[rgba(15,23,42,0.1)] bg-white px-5 py-3 text-sm font-semibold text-[#334155] shadow-sm transition hover:bg-[#F8FAFC] hover:border-[rgba(26,35,255,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(26,35,255,0.22)]",
} as const;

type Base = {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
  loading?: boolean;
  loadingLabel?: string;
};

type ActionButtonProps = Base &
  (
    | ({ href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">)
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
  );

export default function ActionButton(props: ActionButtonProps) {
  const { children, variant = "surface", className, loading = false, loadingLabel } = props;
  const label = loading ? loadingLabel ?? "Chargement..." : children;
  const content = (
    <>
      {loading ? <ButtonSpinner /> : null}
      {label}
    </>
  );
  const cls = cn(variants[variant], "touch-manipulation", className, loading && "cursor-wait opacity-80");

  if ("href" in props && typeof props.href === "string") {
    const {
      href,
      children: _c,
      variant: _v,
      className: _cl,
      loading: _l,
      loadingLabel: _ll,
      ...linkRest
    } = props;
    return (
      <Link
        href={href}
        className={cn(cls, loading && "pointer-events-none")}
        aria-disabled={loading}
        aria-busy={loading || undefined}
        tabIndex={loading ? -1 : undefined}
        {...linkRest}
      >
        {content}
      </Link>
    );
  }

  const {
    children: _c2,
    variant: _v2,
    className: _cl2,
    loading: _l2,
    loadingLabel: _ll2,
    type = "button",
    disabled,
    ...btnRest
  } = props as Extract<ActionButtonProps, { href?: undefined }>;

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...btnRest}
    >
      {content}
    </button>
  );
}
