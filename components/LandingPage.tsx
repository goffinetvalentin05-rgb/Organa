"use client";

import { useEffect } from "react";
import Hero from "@/components/Hero";
import ComparisonSection from "@/components/ComparisonSection";
import SolutionSection from "@/components/SolutionSection";
import FeaturesSection from "@/components/FeaturesSection";
import BenefitsSection from "@/components/BenefitsSection";
import FinalLandingCta from "@/components/FinalLandingCta";
import LandingFooter from "@/components/LandingFooter";

export default function LandingPage() {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]")
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="relative isolate min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[url('/landingpage-background.png')] bg-[length:190px_auto] bg-repeat opacity-[0.12]" />

      <div className="relative z-10" data-reveal>
        <Hero />
      </div>

      <div className="relative z-10 bg-[#F8FAFC] pt-14">
        <div className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
          <div data-reveal>
            <ComparisonSection />
          </div>
          <div data-reveal>
            <SolutionSection />
          </div>
          <div data-reveal>
            <FeaturesSection />
          </div>
          <div data-reveal>
            <BenefitsSection />
          </div>
          <div data-reveal>
            <FinalLandingCta />
          </div>
        </div>
        <LandingFooter />
      </div>
    </main>
  );
}
