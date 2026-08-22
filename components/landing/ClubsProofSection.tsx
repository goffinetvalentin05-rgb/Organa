"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import { CLUB_LOGOS } from "@/lib/landing/club-logos";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";

export default function ClubsProofSection() {
  const { t } = useI18n();

  if (CLUB_LOGOS.length === 0) return null;

  return (
    <section
      className="lp-section lp-section--muted py-[clamp(3.5rem,7vw,5rem)]"
      aria-label={t("marketing.trustStats.clubsAriaLabel")}
    >
      <div className="lp-wrap">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.55, ease: easePremium }}
        >
          <p className="lp-eyebrow">{t("marketing.trustStats.clubsTitle")}</p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-10 sm:gap-16">
            {CLUB_LOGOS.map((club) => (
              <li key={club.id}>
                <Image
                  src={club.src}
                  alt={club.name}
                  width={220}
                  height={88}
                  className="h-14 w-auto object-contain opacity-80 sm:h-16"
                />
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
