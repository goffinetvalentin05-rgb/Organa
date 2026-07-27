"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import LandingSectionIntro, { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";
import { easePremium, scrollReveal, viewportOnce } from "@/components/landing/landing-motion";

type ClubLogo = {
  id: string;
  name: string;
  src: string;
};

const CLUB_LOGOS: ClubLogo[] = [
  {
    id: "fontenais",
    name: "Fontenais Football Club",
    src: "/images/clubs/fontenais-fc.png",
  },
  {
    id: "porrentruy",
    name: "FC Porrentruy",
    src: "/images/clubs/fc-porrentruy.png",
  },
];

function ClubLogoCard({ club, delay }: { club: ClubLogo; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.55, delay, ease: easePremium }}
      className="flex flex-col items-center gap-4"
    >
      <div className="flex h-[7.5rem] w-[7.5rem] items-center justify-center overflow-hidden rounded-[1.35rem] border border-slate-200/90 bg-white shadow-[0_12px_32px_-16px_rgba(15,23,42,0.18)] sm:h-36 sm:w-36 md:h-40 md:w-40 md:rounded-[1.5rem]">
        <Image
          src={club.src}
          alt={club.name}
          width={160}
          height={160}
          className="h-full w-full object-cover"
        />
      </div>
      <p className="max-w-[10rem] text-center text-sm font-semibold tracking-tight text-slate-700 sm:max-w-[11rem]">
        {club.name}
      </p>
    </motion.div>
  );
}

export default function SocialProofSection() {
  const { t } = useI18n();

  // Slot prêt pour un vrai témoignage (actuellement vide — ne rien inventer).
  const testimonialQuote = t("marketing.socialProof.testimonial.quote");
  const hasTestimonial =
    Boolean(testimonialQuote) &&
    testimonialQuote !== "marketing.socialProof.testimonial.quote" &&
    testimonialQuote.trim().length > 0;

  return (
    <section
      id="ils-utilisent-obillz"
      className={`${landingSectionShellClass()} scroll-mt-32 md:scroll-mt-36`}
    >
      <div className="relative mx-auto w-[94%] max-w-[1040px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <LandingSectionIntro
            layout="centered"
            label={t("marketing.socialProof.label")}
            title={t("marketing.socialProof.title")}
            description={t("marketing.socialProof.subtitle")}
          />
        </motion.div>

        <div className="landing-section-content">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.6, delay: 0.06, ease: easePremium }}
            className="mx-auto max-w-3xl rounded-[1.75rem] border border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white px-6 py-10 shadow-[0_24px_48px_-28px_rgba(15,23,42,0.12)] sm:px-10 sm:py-12 md:rounded-[2rem] md:px-14 md:py-14"
          >
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2563eb] sm:text-xs">
              {t("marketing.socialProof.adoptedBy")}
            </p>

            <ul className="mt-8 flex flex-wrap items-start justify-center gap-10 sm:mt-10 sm:gap-14 md:gap-16">
              {CLUB_LOGOS.map((club, index) => (
                <li key={club.id}>
                  <ClubLogoCard club={club} delay={0.1 + index * 0.08} />
                </li>
              ))}
            </ul>
          </motion.div>

          {hasTestimonial ? (
            <motion.blockquote
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.55, delay: 0.12, ease: easePremium }}
              className="mx-auto mt-10 max-w-2xl text-center md:mt-12"
            >
              <p className="text-lg font-medium leading-relaxed tracking-tight text-slate-800 sm:text-xl">
                “{testimonialQuote}”
              </p>
              <footer className="mt-4 text-sm text-slate-500">
                <cite className="not-italic font-semibold text-slate-700">
                  {t("marketing.socialProof.testimonial.author")}
                </cite>
                {t("marketing.socialProof.testimonial.role") ? (
                  <span className="before:mx-2 before:content-['·']">
                    {t("marketing.socialProof.testimonial.role")}
                  </span>
                ) : null}
              </footer>
            </motion.blockquote>
          ) : null}
        </div>
      </div>
    </section>
  );
}
