"use client";

import Image from "next/image";
import { useI18n } from "@/components/I18nProvider";
import { CLUB_LOGOS } from "@/lib/landing/club-logos";

/** Preuve sociale minimale sous la vidéo — 2 logos clubs, composition assumée. */
export default function HeroClubProof() {
  const { t } = useI18n();

  return (
    <section
      className="hero-club-proof"
      aria-label={t("marketing.trustStats.clubsAriaLabel")}
    >
      <p className="hero-club-proof__label">{t("marketing.trustStats.clubsTitle")}</p>
      <ul className="hero-club-proof__logos">
        {CLUB_LOGOS.map((club) => (
          <li key={club.id} className="hero-club-proof__logo">
            <Image
              src={club.src}
              alt={club.name}
              width={220}
              height={88}
              className="hero-club-proof__img"
              sizes="(max-width: 640px) 140px, 200px"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
