"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import { useI18n } from "@/components/I18nProvider";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";
import { obillzLandingHomeClass } from "@/components/ui/styles";

/**
 * Blocs chronologiques prévus — contenus à compléter plus tard.
 * Ne pas inventer d’histoire détaillée ici.
 */
const TIMELINE_PLACEHOLDER_KEYS = [
  "constat",
  "idee",
  "creation",
  "premiersClubs",
  "suite",
] as const;

export default function OurStoryPage() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <main className={`${obillzLandingHomeClass} our-story-page`}>
      <div className="relative z-10">
        <LandingNav />

        <section className="our-story-hero">
          <div className="landing-container our-story-hero__inner">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: easePremium }}
            >
              <p className="landing-section-label">{t("marketing.ourStory.label")}</p>
              <h1 className="our-story-hero__title">{t("marketing.ourStory.title")}</h1>
              <p className="our-story-hero__subtitle">{t("marketing.ourStory.subtitle")}</p>

              <Link href="/" className="our-story-back">
                <ArrowLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                <span>{t("marketing.ourStory.backToLanding")}</span>
              </Link>
            </motion.div>
          </div>
        </section>

        <div className="landing-light-zone our-story-light">
          <section className="landing-section our-story-timeline-section">
            <div className="landing-container">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.6, ease: easePremium }}
              >
                <p className="landing-section-label">{t("marketing.ourStory.timelineLabel")}</p>
                <h2 className="landing-section-title display-title">{t("marketing.ourStory.timelineTitle")}</h2>
                <p className="landing-section-desc">
                  {/* TODO contenu : intro chronologie à rédiger */}
                  {t("marketing.ourStory.timelineIntro")}
                </p>
              </motion.div>

              <ol className="our-story-timeline">
                {TIMELINE_PLACEHOLDER_KEYS.map((key, index) => (
                  <li key={key} className="our-story-timeline__item">
                    <span className="our-story-timeline__index" aria-hidden>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="our-story-timeline__body">
                      <h3 className="our-story-timeline__title">
                        {/* TODO contenu : titre définitif de l’étape « {key} » */}
                        {t(`marketing.ourStory.milestones.${key}.title`)}
                      </h3>
                      <p className="our-story-timeline__text">
                        {/* TODO contenu : récit détaillé de l’étape « {key} » à rédiger */}
                        {t(`marketing.ourStory.milestones.${key}.placeholder`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="our-story-cta-wrap">
                <Link href="/" className="our-story-back our-story-back--primary">
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                  <span>{t("marketing.ourStory.backToLanding")}</span>
                </Link>
              </div>
            </div>
          </section>
        </div>

        <LandingFooter />
      </div>
    </main>
  );
}
