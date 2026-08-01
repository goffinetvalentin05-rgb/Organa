"use client";

import FeaturesOrbitShowcase from "@/components/landing/FeaturesOrbitShowcase";
import { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";

export default function FeaturesSection() {
  return (
    <section
      id="modules"
      className={`${landingSectionShellClass(true)} features-modules-section scroll-mt-32 md:scroll-mt-36`}
    >
      {/* Halos peints sur la section entière — pas de boîte interne */}
      <div className="features-modules-ambiance" aria-hidden="true">
        <span className="features-modules-ambiance__glow features-modules-ambiance__glow--a" />
        <span className="features-modules-ambiance__glow features-modules-ambiance__glow--b" />
        <span className="features-modules-ambiance__glow features-modules-ambiance__glow--c" />
      </div>

      <div className="features-modules-canvas">
        <FeaturesOrbitShowcase />
      </div>
    </section>
  );
}
