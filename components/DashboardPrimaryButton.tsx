"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { Plus } from "@/lib/icons";

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2563EB] via-[#1A23FF] to-[#6366f1] font-semibold text-white shadow-[0_4px_14px_rgba(26,35,255,0.25)] transition-all duration-200 hover:opacity-95 hover:shadow-[0_6px_20px_rgba(26,35,255,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]/50 disabled:pointer-events-none disabled:opacity-50";

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
  loading?: boolean;
  loadingLabel?: string;
  success?: boolean;
  successLabel?: string;
} & (
  | ({ href: string } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">)
  | ({ href?: undefined } & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">)
);

function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export default function DashboardPrimaryButton(props: DashboardPrimaryButtonProps) {
  const {
    children,
    className,
    icon = "plus",
    size = "default",
    fullWidth,
    loading = false,
    loadingLabel,
    success = false,
    successLabel,
  } = props;

  const isBusy = Boolean(loading || success);

  const classes = cn(
    baseClass,
    sizeClass[size],
    fullWidth && "w-full",
    className,
    isBusy && "cursor-not-allowed"
  );

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [minWidth, setMinWidth] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = btnRef.current;
    if (!el) return;

    if (isBusy) {
      setMinWidth(el.getBoundingClientRect().width);
    } else {
      setMinWidth(undefined);
    }
  }, [isBusy]);

  const showPlus = icon === "plus" && !isBusy;
  const label = success
    ? successLabel ?? "OK ✓"
    : loading
      ? loadingLabel ?? "Chargement..."
      : children;

  const spinner = loading ? (
    <svg
      className="h-5 w-5 animate-spin"
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  ) : null;

  const successMark = success ? (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M9 16.2 4.8 12 3.4 13.4 9 19 21 7 19.6 5.6z"
      />
    </svg>
  ) : null;

  const content = (
    <>
      {showPlus ? <Plus className="h-5 w-5 shrink-0" /> : null}
      {spinner}
      {successMark}
      {label}
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
      loading: _ll,
      loadingLabel: _lll,
      success: _lsucc,
      successLabel: _lsl,
      ...linkRest
    } = props;
    return (
      <Link
        href={href}
        className={cn(classes, isBusy && "pointer-events-none opacity-50")}
        aria-disabled={isBusy}
        tabIndex={isBusy ? -1 : linkRest.tabIndex}
        onClick={(e) => {
          if (isBusy) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          linkRest.onClick?.(e);
        }}
        {...linkRest}
      >
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
    <button
      ref={btnRef}
      type={btnProps.type ?? "button"}
      className={classes}
      disabled={isBusy || btnProps.disabled}
      style={minWidth ? { minWidth } : undefined}
      {...btnProps}
    >
      {content}
    </button>
  );
}
