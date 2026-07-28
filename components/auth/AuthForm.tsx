"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { easePremium } from "@/components/landing/landing-motion";

const inputClassName =
  "w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3.5 text-[15px] text-white placeholder:text-blue-100/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-[border-color,box-shadow,background-color] duration-200 hover:border-white/18 hover:bg-white/[0.07] focus:border-blue-400/50 focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#1A23FF]/40 disabled:opacity-50";

export function AuthPageMotion({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: easePremium }}
      className="w-full max-w-[960px]"
    >
      {children}
    </motion.div>
  );
}

/** Grand conteneur premium : branding + formulaire */
export function AuthSplitFrame({
  brand,
  children,
}: {
  brand: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-blue-400/20 bg-[#060b1f]/75 shadow-[0_0_80px_rgba(26,35,255,0.22),0_24px_64px_rgba(2,6,23,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl sm:rounded-[2rem]">
      <div
        className="pointer-events-none absolute inset-x-[12%] top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 top-1/3 h-56 w-56 rounded-full bg-[#1A23FF]/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl"
        aria-hidden
      />

      <div className="relative grid lg:grid-cols-[1.05fr_1fr]">
        <div className="relative overflow-hidden border-b border-white/[0.08] px-6 py-8 sm:px-8 sm:py-10 lg:border-b-0 lg:border-r lg:border-white/[0.08] lg:px-10 lg:py-12">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1A23FF]/35 via-[#0a1a5e]/40 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12), transparent 45%), radial-gradient(circle at 80% 80%, rgba(56,189,248,0.12), transparent 40%)",
            }}
            aria-hidden
          />
          <div className="relative">{brand}</div>
        </div>

        <div className="relative px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">{children}</div>
      </div>
    </div>
  );
}

export function AuthBrandPanel({
  visual,
  badge,
  title,
  subtitle,
  children,
}: {
  visual?: ReactNode;
  badge: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {visual ? <div className="mb-6">{visual}</div> : null}
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-200/90">{badge}</p>
      <h1 className="mt-3 text-balance text-[1.65rem] font-black leading-[1.15] tracking-tight text-white sm:mt-4 sm:text-3xl lg:text-[2.05rem]">
        {title}
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-blue-100/70 sm:text-[15px]">
        {subtitle}
      </p>
      {children ? <div className="mt-7 sm:mt-8 lg:mt-10">{children}</div> : null}
    </div>
  );
}

export function AuthSteps({
  steps,
  activeIndex = 0,
}: {
  steps: string[];
  activeIndex?: number;
}) {
  return (
    <ol className="space-y-2.5">
      {steps.map((label, index) => {
        const active = index === activeIndex;
        return (
          <li
            key={label}
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition ${
              active
                ? "bg-white text-[#0B1220] shadow-[0_8px_28px_rgba(2,6,23,0.25)]"
                : "border border-white/10 bg-white/[0.06] text-blue-50/85"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                active ? "bg-[#1A23FF] text-white" : "bg-white/10 text-blue-100/80"
              }`}
            >
              {index + 1}
            </span>
            <span className={`font-medium ${active ? "text-[#0B1220]" : ""}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function AuthTrustList({
  items,
}: {
  items: { label: string; icon: ReactNode }[];
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-3.5 py-3 text-sm text-blue-50/85"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1A23FF]/30 text-blue-100 ring-1 ring-blue-400/25">
            {item.icon}
          </span>
          <span className="font-medium">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

/** @deprecated Conservé pour compat — préférer AuthSplitFrame */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-blue-400/25 bg-gradient-to-b from-[#1A23FF]/15 via-white/[0.06] to-transparent p-7 shadow-[0_0_80px_rgba(26,35,255,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl md:p-9">
      <div
        className="pointer-events-none absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
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
      className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-[#1A23FF] via-[#2563EB] to-[#1A23FF] bg-[length:160%_100%] py-3.5 text-base font-bold text-white shadow-[0_0_36px_rgba(26,35,255,0.45),0_8px_28px_rgba(2,6,23,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] transition-[box-shadow,transform,background-position] duration-300 hover:bg-[position:100%_0] hover:shadow-[0_0_48px_rgba(26,35,255,0.65),0_12px_36px_rgba(2,6,23,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    >
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
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
    <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-2 py-3 text-center backdrop-blur-sm"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A23FF]/25 text-blue-200 ring-1 ring-blue-400/20 sm:h-9 sm:w-9">
            {item.icon}
          </span>
          <span className="mt-2 text-[10px] leading-tight text-blue-100/70 sm:text-[11px]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AuthFormHeader({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
}) {
  return (
    <div className="mb-7">
      {badge ? <div className="mb-4">{badge}</div> : null}
      <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
      {subtitle ? (
        <p className="mt-2 text-sm leading-relaxed text-blue-100/65">{subtitle}</p>
      ) : null}
    </div>
  );
}
