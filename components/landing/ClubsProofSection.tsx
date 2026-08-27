"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import { CLUB_LOGOS } from "@/lib/landing/club-logos";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";

export default function ClubsProofSection() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  if (CLUB_LOGOS.length === 0) return null;

  return (
    <section
      className="lp-clubs-proof"
      aria-label={t("marketing.trustStats.clubsAriaLabel")}
    >
      <motion.div
        className="lp-clubs-proof__inner"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 0.5, ease: easePremium }}
      >
        <p className="lp-clubs-proof__label">{t("marketing.trustStats.clubsTitle")}</p>
        <ul className="lp-clubs-proof__static">
          {CLUB_LOGOS.map((club) => (
            <li key={club.id} className="lp-clubs-proof__item">
              <Image
                src={club.src}
                alt={club.name}
                width={220}
                height={88}
                className="lp-clubs-proof__img"
              />
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
