"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const tap = { scale: 0.97 };
const hoverLift = { y: -3, transition: { duration: 0.22 } };

type LandingPrimaryButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
  showArrow?: boolean;
  /** light = sections blanches ; dark = fond navy (tarifs, etc.) */
  variant?: "light" | "dark";
};

export function LandingPrimaryButton({
  href,
  children,
  className = "",
  showArrow = true,
  variant = "light",
}: LandingPrimaryButtonProps) {
  const isLight = variant === "light";

  return (
    <motion.div whileHover={hoverLift} whileTap={tap} className="group relative inline-flex">
      {isLight ? (
        <span
          className="pointer-events-none absolute -inset-1 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.1),transparent_70%)] opacity-0 blur-lg transition duration-300 group-hover:opacity-100"
          aria-hidden
        />
      ) : (
        <span
          className="pointer-events-none absolute -inset-1.5 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.45),rgba(56,189,248,0.15)_60%,transparent_70%)] opacity-75 blur-xl transition duration-300 group-hover:opacity-100"
          aria-hidden
        />
      )}
      <Link
        href={href}
        className={
          isLight
            ? `landing-cta-primary relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-[rgba(37,99,235,0.14)] bg-white px-7 py-3.5 text-base font-bold text-[#1D4ED8] shadow-[0_10px_30px_rgba(37,99,235,0.10)] transition-[box-shadow,transform,background-color,border-color] duration-300 hover:border-[rgba(37,99,235,0.22)] hover:bg-[#EFF6FF] hover:shadow-[0_12px_36px_rgba(37,99,235,0.14)] sm:w-auto md:px-8 md:py-4 ${className}`
            : `landing-cta-primary relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-7 py-3.5 text-base font-bold text-[#1D4ED8] shadow-[0_0_32px_rgba(37,99,235,0.35),0_8px_28px_rgba(2,6,23,0.38),inset_0_1px_0_rgba(255,255,255,0.95)] transition-[box-shadow,transform] duration-300 hover:shadow-[0_0_48px_rgba(37,99,235,0.5),0_12px_36px_rgba(2,6,23,0.42)] sm:w-auto md:px-8 md:py-4 ${className}`
        }
      >
        {!isLight ? (
          <>
            <span
              className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white via-white to-[#EFF6FF]"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 landing-cta-shimmer"
              aria-hidden
            />
          </>
        ) : null}
        <span className="relative">{children}</span>
        {showArrow ? (
          <ArrowRight
            className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            strokeWidth={2.5}
            aria-hidden
          />
        ) : null}
      </Link>
    </motion.div>
  );
}

type LandingSecondaryButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function LandingSecondaryButton({ href, children, className = "" }: LandingSecondaryButtonProps) {
  return (
    <motion.div whileHover={hoverLift} whileTap={tap} className="group relative inline-flex">
      <a
        href={href}
        className={`relative inline-flex w-full items-center justify-center rounded-full border border-[rgba(37,99,235,0.18)] bg-white/80 px-7 py-3.5 text-base font-semibold text-[#1D4ED8] shadow-[0_4px_16px_rgba(37,99,235,0.06)] backdrop-blur-sm transition-[border-color,box-shadow,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[rgba(37,99,235,0.28)] hover:bg-[#F8FBFF] hover:shadow-[0_8px_24px_rgba(37,99,235,0.1)] sm:w-auto md:px-8 md:py-4 ${className}`}
      >
        {children}
      </a>
    </motion.div>
  );
}
