"use client";

import FeaturesOrbitShowcase from "@/components/landing/FeaturesOrbitShowcase";
import { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";

export default function FeaturesSection() {
  return (
    <section id="modules" className={`${landingSectionShellClass(true)} scroll-mt-32 md:scroll-mt-36`}>
      <div className="landing-container relative">
        <div className="landing-section-content features-orbit-section-content">
          <FeaturesOrbitShowcase />
        </div>
      </div>
    </section>
  );
}
