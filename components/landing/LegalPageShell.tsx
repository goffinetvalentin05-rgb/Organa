"use client";

import type { ReactNode } from "react";
import LandingBackground from "@/components/landing/LandingBackground";
import LandingFooter from "@/components/landing/LandingFooter";
import LegalLandingNav from "@/components/landing/LegalLandingNav";
import {
  obillzLandingGridOverlayClass,
  obillzLandingRootClass,
} from "@/components/ui/styles";

type LegalPageShellProps = {
  children: ReactNode;
};

export default function LegalPageShell({ children }: LegalPageShellProps) {
  return (
    <main className={obillzLandingRootClass}>
      <LandingBackground />
      <div className={obillzLandingGridOverlayClass} aria-hidden />

      <div className="relative z-10">
        <LegalLandingNav />
        <div className="mx-auto w-[94%] max-w-4xl px-0 pb-4 pt-[5.25rem] sm:pt-[5.5rem] md:pt-[5.75rem]">
          {children}
        </div>
        <LandingFooter />
      </div>
    </main>
  );
}
