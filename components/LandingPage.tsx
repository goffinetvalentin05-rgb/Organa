"use client";

import { useEffect } from "react";
import Hero from "@/components/Hero";
import ComparisonSection from "@/components/ComparisonSection";
import ShowcaseSliderSection from "@/components/ShowcaseSliderSection";
import GetStartedStepsSection from "@/components/GetStartedStepsSection";
import PricingSection from "@/components/PricingSection";
import FaqSection from "@/components/FaqSection";
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
    <main className="relative isolate min-h-screen bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[url('/landingpage-background.png')] bg-[length:190px_auto] bg-repeat opacity-[0.14]" />

      <div className="relative z-10" data-reveal>
        <Hero />
      </div>

      <div className="relative z-10 bg-white pt-10">
        <div className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
          <div data-reveal>
            <ComparisonSection />
          </div>
          <div data-reveal>
            <ShowcaseSliderSection />
          </div>
          <div data-reveal>
            <GetStartedStepsSection />
          </div>
          <div data-reveal>
            <PricingSection />
          </div>
          <div data-reveal>
            <FaqSection />
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
