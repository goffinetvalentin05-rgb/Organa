"use client";

import { motion } from "framer-motion";
import { CalendarRange, FileText, Mail } from "lucide-react";
import FeaturesArcShowcase from "@/components/landing/FeaturesArcShowcase";
import LandingSectionIntro, { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";
import { useI18n } from "@/components/I18nProvider";
import { scrollReveal, viewportOnce } from "@/components/landing/landing-motion";

export default function FeaturesSection() {
  const { t } = useI18n();
  const benefitItems = [
    {
      key: "cotisations",
      icon: Mail,
      text: t("marketing.modules.benefits.cotisations"),
    },
    {
      key: "plannings",
      icon: CalendarRange,
      text: t("marketing.modules.benefits.plannings"),
    },
    {
      key: "recapitulatifs",
      icon: FileText,
      text: t("marketing.modules.benefits.recapitulatifs"),
    },
  ];

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

        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3"
        >
          {benefitItems.map(({ key, icon: Icon, text }) => (
            <div
              key={key}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-[0_10px_28px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:text-sm"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb]">
                <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
              </span>
              <span>{text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
