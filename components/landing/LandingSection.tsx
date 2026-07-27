"use client";

import type { ReactNode } from "react";
import ScrollReveal from "@/components/landing/ScrollReveal";

type LandingSectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Label au-dessus du titre (ex. « La douleur ») */
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  align?: "center" | "left";
  glow?: boolean;
};

export function LandingSectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: Pick<LandingSectionProps, "eyebrow" | "title" | "subtitle" | "align">) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <ScrollReveal className={`landing-section-intro max-w-3xl ${alignClass}`}>
      {eyebrow ? <p className="landing-section-label">{eyebrow}</p> : null}
      {title ? <h2 className="landing-section-title display-title">{title}</h2> : null}
      {subtitle ? <p className="landing-section-desc">{subtitle}</p> : null}
    </ScrollReveal>
  );
}

export default function LandingSection({
  id,
  children,
  className = "",
  eyebrow,
  title,
  subtitle,
  align = "center",
  glow = false,
}: LandingSectionProps) {
  return (
    <section
      id={id}
      className={`relative mx-auto w-[94%] max-w-[1160px] scroll-mt-24 ${className}`}
    >
      {glow ? (
        <div
          className="pointer-events-none absolute inset-x-[-6%] -top-16 -bottom-16 -z-10 rounded-[2.5rem] bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,rgba(255,255,255,0.09),transparent_58%)]"
          aria-hidden
        />
      ) : null}
      {(eyebrow || title || subtitle) && (
        <LandingSectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} align={align} />
      )}
      {children}
    </section>
  );
}
