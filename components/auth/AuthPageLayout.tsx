"use client";

import type { ReactNode } from "react";
import LandingBackground from "@/components/landing/LandingBackground";
import {
  obillzLandingGridOverlayClass,
  obillzLandingRootClass,
} from "@/components/ui/styles";

type AuthPageLayoutProps = {
  children: ReactNode;
};

export default function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <main className={obillzLandingRootClass}>
      <LandingBackground />
      <div className={obillzLandingGridOverlayClass} aria-hidden />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
        <div className="pointer-events-none absolute inset-x-[10%] top-[18%] h-64 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.22),transparent_70%)] blur-3xl" />
        {children}
      </section>
    </main>
  );
}
