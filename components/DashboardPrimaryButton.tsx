"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Plus } from "@/lib/icons";

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white font-semibold text-[var(--obillz-hero-blue)] shadow-[0_4px_14px_rgba(15,23,42,0.08)] transition-all duration-200 hover:border-[var(--obillz-blue-border)] hover:shadow-[0_8px_22px_rgba(26,35,255,0.12)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--obillz-hero-blue)]/35 disabled:pointer-events-none disabled:opacity-50";

const sizeClass = {
  default: "px-4 py-2.5 text-sm",
  sm: "px-3 py-2 text-xs",
} as const;

export type DashboardPrimaryButtonProps = {
  children: ReactNode;
  className?: string;
  /** Icône + à gauche (par défaut pour les CTA « créer / ajouter »). */
  icon?: "plus" | "none";
  size?: keyof typeof sizeClass;
  fullWidth?: boolean;
} & (
  | ({ href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">)
  | ({ href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">)
);

function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export default function DashboardPrimaryButton(props: DashboardPrimaryButtonProps) {
  const { children, className, icon = "plus", size = "default", fullWidth } = props;

  const classes = cn(
    baseClass,
    sizeClass[size],
    fullWidth && "w-full",
    className
  );

  const content = (
    <>
      {icon === "plus" ? <Plus className="h-5 w-5 shrink-0" /> : null}
      {children}
    </>
  );

  if ("href" in props && typeof props.href === "string") {
    const {
      href,
      children: _lc,
      className: _lcl,
      icon: _li,
      size: _ls,
      fullWidth: _lf,
      ...linkRest
    } = props;
    return (
      <Link href={href} className={classes} {...linkRest}>
        {content}
      </Link>
    );
  }

  const {
    children: _c,
    className: _cl,
    icon: _i,
    size: _s,
    fullWidth: _f,
    ...btnProps
  } = props as Extract<DashboardPrimaryButtonProps, { href?: undefined }>;

  return (
    <button type={btnProps.type ?? "button"} className={classes} {...btnProps}>
      {content}
    </button>
  );
}
