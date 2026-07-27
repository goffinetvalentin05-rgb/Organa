"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useCallback, useEffect, useState } from "react";
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

const AUTO_MS = 4200;

function ClubShowcase({
  badge,
  reduceMotion,
}: {
  badge: string;
  reduceMotion: boolean;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const club = CLUB_LOGOS[active]!;

  const goTo = useCallback((index: number) => {
    setActive(index);
  }, []);

  useEffect(() => {
    if (reduceMotion || paused || CLUB_LOGOS.length < 2) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % CLUB_LOGOS.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, paused]);

  return (
    <div
      className="relative mx-auto w-full max-w-[720px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      {/* Scène immersive */}
      <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[2.75rem]">
        {/* Fond atmosphérique Obillz */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,#12205a_0%,#07122f_45%,#040816_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(56,189,248,0.07) 0.8px, transparent 0.8px)",
            backgroundSize: "18px 18px",
          }}
          aria-hidden
        />
        {/* Light leaks */}
        <div
          className="pointer-events-none absolute -left-20 top-[-20%] h-[70%] w-[55%] rounded-full bg-[#1A23FF]/35 blur-[90px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 bottom-[-10%] h-[55%] w-[50%] rounded-full bg-[#38BDF8]/25 blur-[100px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-[40%] h-40 w-40 -translate-x-1/2 rounded-full bg-white/10 blur-[60px]"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center px-6 pb-10 pt-12 sm:px-10 sm:pb-12 sm:pt-14 md:pt-16">
          {/* Badge flottant */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.55, delay: 0.15, ease: easePremium }}
            className="mb-8 sm:mb-10"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1.5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                {!reduceMotion ? (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                ) : null}
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[11px] font-semibold tracking-wide text-white/85 sm:text-xs">
                {badge}
              </span>
            </span>
          </motion.div>

          {/* Capsule glass 3D */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 0.75, delay: 0.08, ease: easePremium }}
            className="relative"
            style={{ perspective: 1200 }}
          >
            {/* Glow animé sous la capsule */}
            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(56,189,248,0.35) 0%, rgba(26,35,255,0.2) 40%, transparent 70%)",
              }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      opacity: [0.45, 0.85, 0.45],
                      scale: [0.92, 1.05, 0.92],
                    }
              }
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            />

            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [0, -10, 0],
                      rotateX: [8, 6, 8],
                      rotateY: [-10, -6, -10],
                    }
              }
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      scale: 1.04,
                      rotateY: 0,
                      rotateX: 4,
                      transition: { duration: 0.4, ease: easePremium },
                    }
              }
              className="relative h-[11.5rem] w-[11.5rem] sm:h-[14rem] sm:w-[14rem] md:h-[15.5rem] md:w-[15.5rem]"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Face glass */}
              <div className="absolute inset-0 overflow-hidden rounded-[1.85rem] border border-white/25 bg-gradient-to-br from-white/20 via-white/[0.07] to-white/[0.02] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65),0_0_60px_-10px_rgba(56,189,248,0.35),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:rounded-[2.1rem] md:rounded-[2.25rem]">
                {/* Specular highlight */}
                <div
                  className="pointer-events-none absolute -left-1/4 -top-1/3 h-[70%] w-[80%] rotate-[-18deg] rounded-full bg-gradient-to-br from-white/40 to-transparent blur-md"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-x-3 top-2 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
                  aria-hidden
                />

                {/* Logo */}
                <div className="relative flex h-full w-full items-center justify-center p-6 sm:p-7 md:p-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={club.id}
                      initial={
                        reduceMotion
                          ? { opacity: 1 }
                          : { opacity: 0, scale: 0.86, y: 14, filter: "blur(6px)" }
                      }
                      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                      exit={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, scale: 1.06, y: -10, filter: "blur(4px)" }
                      }
                      transition={{ duration: 0.45, ease: easePremium }}
                      className="relative h-full w-full"
                    >
                      <Image
                        src={club.src}
                        alt={club.name}
                        fill
                        sizes="(max-width: 640px) 140px, 200px"
                        className="object-contain drop-shadow-[0_12px_28px_rgba(56,189,248,0.25)]"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Edge depth hint */}
              <div
                className="pointer-events-none absolute -inset-[1px] -z-10 rounded-[1.95rem] bg-gradient-to-br from-sky-300/30 via-transparent to-[#1A23FF]/40 opacity-70 blur-[1px] sm:rounded-[2.2rem]"
                aria-hidden
              />
            </motion.div>
          </motion.div>

          {/* Indicateurs / pastilles */}
          <div
            className="mt-10 flex items-center gap-2.5 sm:mt-12"
            role="tablist"
            aria-label="Clubs utilisateurs"
          >
            {CLUB_LOGOS.map((item, index) => {
              const isActive = index === active;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={item.name}
                  onClick={() => goTo(index)}
                  className={`relative h-2.5 rounded-full outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-sky-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07122f] ${
                    isActive
                      ? "w-8 bg-gradient-to-r from-[#38BDF8] to-[#1A23FF] shadow-[0_0_16px_rgba(56,189,248,0.55)]"
                      : "w-2.5 bg-white/25 hover:bg-white/45"
                  }`}
                />
              );
            })}
          </div>

          {/* Mini thumbnails — preuve qu’il y a plusieurs clubs */}
          <div className="mt-6 flex items-center gap-3 sm:mt-7">
            {CLUB_LOGOS.map((item, index) => {
              const isActive = index === active;
              return (
                <button
                  key={`thumb-${item.id}`}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={item.name}
                  aria-pressed={isActive}
                  className={`relative h-11 w-11 overflow-hidden rounded-xl border transition-all duration-300 sm:h-12 sm:w-12 sm:rounded-[0.9rem] ${
                    isActive
                      ? "border-sky-300/50 bg-white/10 shadow-[0_0_24px_rgba(56,189,248,0.35)] scale-105"
                      : "border-white/10 bg-white/[0.04] opacity-55 hover:opacity-90 hover:border-white/25"
                  }`}
                >
                  <Image
                    src={item.src}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-contain p-1.5"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
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
          <ClubShowcase
            badge={t("marketing.socialProof.badge")}
            reduceMotion={!!reduceMotion}
          />

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
