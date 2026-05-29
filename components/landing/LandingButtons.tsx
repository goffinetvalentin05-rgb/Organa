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
};

export function LandingPrimaryButton({
  href,
  children,
  className = "",
  showArrow = true,
}: LandingPrimaryButtonProps) {
  return (
    <motion.div whileHover={hoverLift} whileTap={tap} className="group relative inline-flex">
      <span
        className="pointer-events-none absolute -inset-1 rounded-full bg-[#1A23FF]/50 opacity-70 blur-xl transition duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <Link
        href={href}
        className={`landing-cta-primary relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-7 py-3.5 text-base font-bold text-[#1A23FF] shadow-[0_0_36px_rgba(26,35,255,0.55),0_0_80px_rgba(255,255,255,0.12),0_8px_28px_rgba(2,6,23,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] transition-[box-shadow,transform] duration-300 hover:shadow-[0_0_48px_rgba(26,35,255,0.7),0_0_100px_rgba(96,165,250,0.25),0_12px_36px_rgba(2,6,23,0.4)] sm:w-auto md:px-8 md:py-4 ${className}`}
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white via-white to-blue-50/90"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 landing-cta-shimmer"
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
    <motion.div whileHover={hoverLift} whileTap={tap} className="group relative inline-flex">
      <span
        className="pointer-events-none absolute -inset-0.5 rounded-full bg-[#1A23FF]/30 opacity-0 blur-lg transition duration-300 group-hover:opacity-80"
        aria-hidden
      />
      <a
        href={href}
        className={`relative inline-flex w-full items-center justify-center rounded-full border border-blue-300/35 bg-[#1A23FF]/[0.12] px-7 py-3.5 text-base font-bold text-white shadow-[0_0_28px_rgba(26,35,255,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md transition-[border-color,box-shadow,background] duration-300 hover:border-blue-200/50 hover:bg-[#1A23FF]/20 hover:shadow-[0_0_40px_rgba(26,35,255,0.35),inset_0_1px_0_rgba(255,255,255,0.18)] sm:w-auto md:px-8 md:py-4 ${className}`}
      >
        {children}
      </a>
    </motion.div>
  );
}
