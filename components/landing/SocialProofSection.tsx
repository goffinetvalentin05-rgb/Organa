"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import LandingSectionIntro, { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";
import { easePremium, floatY, scrollReveal, viewportOnce } from "@/components/landing/landing-motion";

type ClubLogo = {
  id: string;
  name: string;
  src: string;
  /** Décalage vertical dans le showcase */
  offset: "up" | "down";
  floatDelay: number;
};

const CLUB_LOGOS: ClubLogo[] = [
  {
    id: "fontenais",
    name: "Fontenais Football Club",
    src: "/images/clubs/fontenais-fc.png",
    offset: "up",
    floatDelay: 0,
  },
  {
    id: "porrentruy",
    name: "FC Porrentruy",
    src: "/images/clubs/fc-porrentruy.png",
    offset: "down",
    floatDelay: 0.6,
  },
];

function ClubLogoCard({
  club,
  delay,
  badge,
  reduceMotion,
}: {
  club: ClubLogo;
  delay: number;
  badge: string;
  reduceMotion: boolean;
}) {
  const isUp = club.offset === "up";

  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 36, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={viewportOnce}
      transition={{ duration: 0.7, delay, ease: easePremium }}
      className={`relative list-none ${isUp ? "lg:-mt-4" : "lg:mt-8"}`}
    >
      <motion.div
        animate={reduceMotion ? undefined : floatY(club.floatDelay)}
        whileHover={
          reduceMotion
            ? undefined
            : {
                y: -8,
                scale: 1.03,
                transition: { duration: 0.35, ease: easePremium },
              }
        }
        className="group/logo relative"
      >
        {/* Glow ambiant sous la carte */}
        <div
          className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-[radial-gradient(circle_at_50%_70%,rgba(26,35,255,0.18),transparent_68%)] opacity-50 blur-xl transition-opacity duration-500 group-hover/logo:opacity-90 sm:-inset-5"
          aria-hidden
        />

        <div className="relative flex w-[10.5rem] flex-col overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/90 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.28),0_0_0_1px_rgba(15,23,42,0.04)] backdrop-blur-md transition-shadow duration-300 group-hover/logo:shadow-[0_28px_60px_-18px_rgba(26,35,255,0.28),0_0_0_1px_rgba(26,35,255,0.1)] sm:w-[12rem] sm:rounded-[1.65rem] md:w-[13.5rem] md:rounded-[1.75rem]">
          {/* Reflet haut */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/70 to-transparent"
            aria-hidden
          />

          <div className="relative flex aspect-square items-center justify-center p-4 sm:p-5 md:p-6">
            <div className="relative h-full w-full overflow-hidden rounded-[1.1rem] bg-[#05070f] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] sm:rounded-[1.2rem]">
              <Image
                src={club.src}
                alt={club.name}
                width={220}
                height={220}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="relative border-t border-slate-100/90 px-3 pb-3.5 pt-2.5 sm:px-4 sm:pb-4">
            <span className="mx-auto flex w-fit items-center gap-1.5 rounded-full border border-[#1A23FF]/12 bg-[#1A23FF]/[0.06] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#1A23FF] sm:text-[11px]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {badge}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.li>
  );
}

export default function SocialProofSection() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  const testimonialQuote = t("marketing.socialProof.testimonial.quote");
  const hasTestimonial =
    Boolean(testimonialQuote) &&
    testimonialQuote !== "marketing.socialProof.testimonial.quote" &&
    testimonialQuote.trim().length > 0;

  return (
    <section
      id="ils-utilisent-obillz"
      className={`${landingSectionShellClass()} scroll-mt-32 overflow-x-hidden md:scroll-mt-36`}
    >
      <div className="relative mx-auto w-[94%] max-w-[1100px]">
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
            initial={reduceMotion ? false : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7, delay: 0.05, ease: easePremium }}
            className="relative mx-auto max-w-3xl"
          >
            {/* Fond showcase */}
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-gradient-to-br from-[#f4f7ff] via-white to-[#eef4ff] px-5 py-12 shadow-[0_32px_72px_-28px_rgba(15,23,42,0.18)] sm:rounded-[2.25rem] sm:px-10 sm:py-14 md:rounded-[2.5rem] md:px-14 md:py-16">
              {/* Orbes de lumière */}
              <div
                className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#1A23FF]/[0.12] blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-[#38BDF8]/[0.14] blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 blur-2xl"
                aria-hidden
              />

              {/* Grille subtile */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.35]"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(26,35,255,0.07) 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
                aria-hidden
              />

              {/* Ligne / rail décoratif derrière les cartes */}
              <div
                className="pointer-events-none absolute left-[18%] right-[18%] top-[48%] hidden h-px bg-gradient-to-r from-transparent via-[#1A23FF]/25 to-transparent sm:block"
                aria-hidden
              />

              <ul className="relative z-10 flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-10">
                {CLUB_LOGOS.map((club, index) => (
                  <ClubLogoCard
                    key={club.id}
                    club={club}
                    delay={0.12 + index * 0.12}
                    badge={t("marketing.socialProof.badge")}
                    reduceMotion={!!reduceMotion}
                  />
                ))}
              </ul>
            </div>
          </motion.div>

          {hasTestimonial ? (
            <motion.blockquote
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
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
