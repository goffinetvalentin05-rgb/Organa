"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import LandingSectionIntro, { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";
import { easePremium, scrollReveal, viewportOnce } from "@/components/landing/landing-motion";
import { getTranslationValue } from "@/lib/i18n";

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

const AUTO_MS = 3800;

function FloatingLogos({ reduceMotion }: { reduceMotion: boolean }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduceMotion || CLUB_LOGOS.length < 2) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % CLUB_LOGOS.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const primary = CLUB_LOGOS[active]!;
  const secondary = CLUB_LOGOS[(active + 1) % CLUB_LOGOS.length]!;

  return (
    <div className="relative mx-auto flex h-[280px] w-full max-w-[420px] items-center justify-center sm:h-[320px] md:h-[360px] lg:mx-0 lg:max-w-none">
      {/* Halo atmosphérique */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.28) 0%, rgba(26,35,255,0.16) 42%, transparent 70%)",
        }}
        animate={
          reduceMotion
            ? undefined
            : { opacity: [0.55, 0.95, 0.55], scale: [0.94, 1.06, 0.94] }
        }
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />

      {/* Logo secondaire — arrière-plan, plus petit */}
      <motion.button
        type="button"
        aria-label={secondary.name}
        onClick={() => setActive((active + 1) % CLUB_LOGOS.length)}
        className="absolute right-[4%] top-[8%] z-10 outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:right-[8%] sm:top-[6%]"
        animate={
          reduceMotion
            ? undefined
            : { y: [0, -8, 0], rotate: [4, 2, 4] }
        }
        transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        whileHover={reduceMotion ? undefined : { scale: 1.06 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`sec-${secondary.id}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.55, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.5, ease: easePremium }}
            className="relative h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28"
          >
            <span
              className="pointer-events-none absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.22),transparent_70%)] blur-md"
              aria-hidden
            />
            <Image
              src={secondary.src}
              alt=""
              fill
              sizes="112px"
              className="object-contain drop-shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
            />
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Logo principal — centre */}
      <motion.div
        className="relative z-20"
        animate={
          reduceMotion
            ? undefined
            : { y: [0, -12, 0] }
        }
        transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`pri-${primary.id}`}
            initial={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 0, scale: 0.88, y: 18, filter: "blur(8px)" }
            }
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 1.04, y: -14, filter: "blur(6px)" }
            }
            transition={{ duration: 0.55, ease: easePremium }}
            className="relative h-[9.5rem] w-[9.5rem] sm:h-[11.5rem] sm:w-[11.5rem] md:h-[13rem] md:w-[13rem]"
          >
            <span
              className="pointer-events-none absolute inset-[-22%] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.35),rgba(26,35,255,0.12)_50%,transparent_72%)] blur-xl"
              aria-hidden
            />
            <Image
              src={primary.src}
              alt={primary.name}
              fill
              sizes="(max-width: 640px) 152px, 208px"
              className="object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.4)]"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Pastilles */}
      <div
        className="absolute bottom-2 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 sm:bottom-4"
        role="tablist"
        aria-label="Clubs"
      >
        {CLUB_LOGOS.map((club, index) => {
          const isActive = index === active;
          return (
            <button
              key={club.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={club.name}
              onClick={() => setActive(index)}
              className={`h-2 rounded-full outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-sky-300/50 ${
                isActive
                  ? "w-7 bg-gradient-to-r from-[#38BDF8] to-[#7dd3fc] shadow-[0_0_14px_rgba(56,189,248,0.55)]"
                  : "w-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function SocialProofSection() {
  const { t, locale } = useI18n();
  const reduceMotion = useReducedMotion();

  const rawChips = getTranslationValue(locale, "marketing.socialProof.panel.chips");
  const chips = (Array.isArray(rawChips) ? rawChips : []) as string[];

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
      <div className="relative mx-auto w-[94%] max-w-[1240px]">
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
            initial={reduceMotion ? false : { opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.75, delay: 0.06, ease: easePremium }}
            className="relative overflow-hidden rounded-[1.75rem] shadow-[0_40px_80px_-28px_rgba(7,18,47,0.55)] sm:rounded-[2rem] md:rounded-[2.5rem]"
          >
            {/* Fond bleu premium */}
            <div
              className="absolute inset-0 bg-[linear-gradient(145deg,#071634_0%,#0a1f5c_38%,#12307a_68%,#175dd4_100%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -left-24 bottom-[-30%] h-[70%] w-[55%] rounded-full bg-[#1A23FF]/35 blur-[100px]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-16 top-[-20%] h-[60%] w-[45%] rounded-full bg-[#38BDF8]/25 blur-[110px]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-72 rounded-full bg-[#60a5fa]/15 blur-[80px]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.28]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.08) 0.7px, transparent 0.7px)",
                backgroundSize: "20px 20px",
              }}
              aria-hidden
            />

            <div className="relative z-10 grid items-center gap-10 px-7 py-10 sm:gap-12 sm:px-10 sm:py-12 md:px-12 md:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8 xl:px-16 xl:py-16">
              {/* Colonne gauche */}
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200/75 sm:text-xs">
                  {t("marketing.socialProof.panel.eyebrow")}
                </p>
                <h3 className="mt-4 text-balance text-[1.75rem] font-bold leading-[1.12] tracking-tight text-white sm:text-3xl md:text-[2.15rem]">
                  {t("marketing.socialProof.panel.title")}
                </h3>
                <p className="mt-4 max-w-md text-base leading-relaxed text-slate-200/85 sm:text-[1.05rem]">
                  {t("marketing.socialProof.panel.body")}
                </p>

                {chips.length > 0 ? (
                  <ul className="mt-8 flex flex-wrap gap-2.5">
                    {chips.map((chip) => (
                      <li
                        key={chip}
                        className="rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-white/80 backdrop-blur-sm sm:text-xs"
                      >
                        {chip}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {/* Colonne droite — logos */}
              <FloatingLogos reduceMotion={!!reduceMotion} />
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
