"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const tap = { scale: 0.97 };
const hoverLift = { y: -2, transition: { duration: 0.2 } };

type LandingPrimaryButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
  showArrow?: boolean;
};

export function LandingPrimaryButton({
  href,
  children,
  className = "",
  showArrow = true,
}: LandingPrimaryButtonProps) {
  return (
    <motion.div whileHover={hoverLift} whileTap={tap} className="inline-flex">
      <Link
        href={href}
        className={`landing-cta-primary group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-7 py-3.5 text-base font-bold text-[#1A23FF] shadow-[0_16px_40px_rgba(2,6,23,0.32),0_0_0_1px_rgba(255,255,255,0.5)_inset] transition-[box-shadow] hover:shadow-[0_20px_48px_rgba(2,6,23,0.38),0_0_32px_rgba(255,255,255,0.25)] sm:w-auto md:px-8 md:py-4 ${className}`}
      >
        <span
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 landing-cta-shimmer"
          aria-hidden
        />
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
    <motion.div whileHover={hoverLift} whileTap={tap} className="inline-flex">
      <a
        href={href}
        className={`inline-flex w-full items-center justify-center rounded-full border border-white/50 bg-white/[0.08] px-7 py-3.5 text-base font-bold text-white shadow-[0_8px_24px_rgba(2,6,23,0.15)] backdrop-blur-md transition hover:border-white/70 hover:bg-white/[0.14] sm:w-auto md:px-8 md:py-4 ${className}`}
      >
        {children}
      </a>
    </motion.div>
  );
}
