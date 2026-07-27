"use client";

import { motion } from "framer-motion";
import LandingSectionIntro, { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";
import PlatformDrawerVisual from "@/components/landing/PlatformDrawerVisual";
import { useI18n } from "@/components/I18nProvider";
import { scrollReveal, viewportOnce } from "@/components/landing/landing-motion";

export default function FeaturesSection() {
  const { t } = useI18n();

  return (
    <section id="modules" className={landingSectionShellClass(true)}>
      <div className="relative mx-auto w-[94%] max-w-[1240px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <LandingSectionIntro
            layout="centered"
            label={t("marketing.modules.label")}
            title={
              <>
                <span className="block">{t("marketing.modules.titleLine1")}</span>
                <span className="block">{t("marketing.modules.titleLine2")}</span>
              </>
            }
            description={t("marketing.modules.subtitle")}
          />
        </motion.div>

        <div className="landing-section-content">
          <PlatformDrawerVisual />
        </div>
      </div>
    </section>
  );
}
