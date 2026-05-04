"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Plus } from "@/lib/icons";

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] font-semibold text-white shadow-lg shadow-blue-900/25 transition-all duration-200 hover:opacity-95 hover:shadow-xl hover:shadow-blue-900/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40 disabled:pointer-events-none disabled:opacity-50";

const sizeClass = {
  default: "px-5 py-2.5 text-sm",
  sm: "px-4 py-2 text-xs",
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

  const classes = cn(baseClass, sizeClass[size], fullWidth && "w-full", className);

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
