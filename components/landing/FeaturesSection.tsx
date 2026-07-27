"use client";

import PlatformDrawerVisual, { usePlatformScrollProgress } from "@/components/landing/PlatformDrawerVisual";
import { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";
import { useI18n } from "@/components/I18nProvider";

export default function FeaturesSection() {
  const { t } = useI18n();
  const { containerRef, scrollYProgress } = usePlatformScrollProgress();

  return (
    <section
      id="modules"
      ref={containerRef}
      className={`${landingSectionShellClass(true)} platform-scroll-section scroll-mt-28`}
    >
      <div className="relative mx-auto w-[94%] max-w-[1240px]">
        <p className="landing-section-label mb-8 text-center md:mb-10">{t("marketing.modules.label")}</p>

        <div className="platform-scroll-sticky">
          <PlatformDrawerVisual scrollProgress={scrollYProgress} />
        </div>
      </div>
    </section>
  );
}
