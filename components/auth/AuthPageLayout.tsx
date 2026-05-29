"use client";

import type { ReactNode } from "react";
import LandingBackground from "@/components/landing/LandingBackground";
import AuthNav from "@/components/auth/AuthNav";
import {
  obillzLandingGridOverlayClass,
  obillzLandingRootClass,
} from "@/components/ui/styles";

type AuthPageLayoutProps = {
  variant: "login" | "signup";
  children: ReactNode;
};

export default function AuthPageLayout({ variant, children }: AuthPageLayoutProps) {
  return (
    <main className={obillzLandingRootClass}>
      <LandingBackground />
      <div className={obillzLandingGridOverlayClass} aria-hidden />
      <AuthNav variant={variant} />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 pb-16 pt-28 sm:px-6 md:pt-32">
        <div className="pointer-events-none absolute inset-x-[10%] top-[18%] h-64 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.22),transparent_70%)] blur-3xl" />
        {children}
      </section>
    </main>
  );
}
