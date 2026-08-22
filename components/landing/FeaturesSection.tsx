"use client";

import FeaturesOrbitShowcase from "@/components/landing/FeaturesOrbitShowcase";

export default function FeaturesSection() {
  return (
    <section id="modules" className="lp-section features-modules-section scroll-mt-32 md:scroll-mt-36">
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
