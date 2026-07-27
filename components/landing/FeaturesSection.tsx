"use client";

import { motion } from "framer-motion";
import FeaturesArcShowcase from "@/components/landing/FeaturesArcShowcase";
import LandingSectionIntro, { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";
import { useI18n } from "@/components/I18nProvider";
import { scrollReveal, viewportOnce } from "@/components/landing/landing-motion";

export default function FeaturesSection() {
  const { t } = useI18n();

  return (
    <section id="modules" className={`${landingSectionShellClass(true)} scroll-mt-32 md:scroll-mt-36`}>
      <div className="landing-container relative">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <LandingSectionIntro
            layout="centered"
            label={t("marketing.modules.label")}
            title={t("marketing.modules.title")}
            description={t("marketing.modules.subtitle")}
          />
        </motion.div>

        <div className="landing-section-content features-arc-section-content">
          <FeaturesArcShowcase />
        </div>
      </div>
    </section>
  );
}
