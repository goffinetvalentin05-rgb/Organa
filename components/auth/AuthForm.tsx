"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { easePremium } from "@/components/landing/landing-motion";

const inputClassName =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-white placeholder:text-blue-100/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[border-color,box-shadow] duration-200 focus:border-blue-400/45 focus:outline-none focus:ring-2 focus:ring-[#1A23FF]/35 disabled:opacity-50";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-blue-400/25 bg-gradient-to-b from-[#1A23FF]/15 via-white/[0.06] to-transparent p-7 shadow-[0_0_80px_rgba(26,35,255,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-9">
      <div
        className="pointer-events-none absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl"
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function AuthField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-blue-100/85">
        {label}
      </label>
      {children}
    </div>
  );
}

export function AuthInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputClassName} {...props} />;
}

export function AuthError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {message}
    </div>
  );
}

export function AuthSubmitButton({
  children,
  loading,
  loadingLabel,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      className="group relative w-full overflow-hidden rounded-full bg-white py-3.5 text-base font-bold text-[#1A23FF] shadow-[0_0_36px_rgba(26,35,255,0.55),0_8px_28px_rgba(2,6,23,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] transition-[box-shadow,transform] duration-300 hover:shadow-[0_0_48px_rgba(26,35,255,0.7),0_12px_36px_rgba(2,6,23,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    >
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <span className="relative flex items-center justify-center gap-2">
        {loading ? (
          <>
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden>
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingLabel ?? "Chargement..."}
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
}

export function AuthFooterLink({
  prompt,
  linkHref,
  linkLabel,
}: {
  prompt: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <div className="mt-8 border-t border-white/[0.08] pt-6">
      <p className="text-center text-sm text-blue-100/65">
        {prompt}{" "}
        <Link
          href={linkHref}
          className="font-semibold text-white underline-offset-2 transition hover:text-blue-100 hover:underline"
        >
          {linkLabel}
        </Link>
      </p>
    </div>
  );
}

export function AuthTrustPills({ items }: { items: { label: string; icon: ReactNode }[] }) {
  return (
    <div className="mt-8 grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-2 py-3 text-center backdrop-blur-sm"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A23FF]/25 text-blue-200 ring-1 ring-blue-400/20">
            {item.icon}
          </span>
          <span className="mt-2 text-[11px] leading-tight text-blue-100/70">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function AuthPageMotion({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: easePremium }}
      className="w-full max-w-md"
    >
      {children}
    </motion.div>
  );
}
