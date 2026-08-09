"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { landingSectionShellClass } from "@/components/landing/LandingSectionIntro";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";
import { CLUB_LOGOS } from "@/lib/landing/club-logos";

const AUTO_MS = 4000;

function TitleBlock({ title }: { title: string }) {
  const trimmed = title.trim();
  const endsWithPeriod = trimmed.endsWith(".");
  const base = endsWithPeriod ? trimmed.slice(0, -1) : trimmed;
  const lastSpace = base.lastIndexOf(" ");
  const head = lastSpace > 0 ? base.slice(0, lastSpace) : base;
  const accent = lastSpace > 0 ? base.slice(lastSpace + 1) : "";

  return (
    <h2 className="display-title mt-4 text-balance text-[clamp(1.65rem,7.2vw,3.35rem)] leading-[0.98] tracking-[-0.045em] text-white sm:mt-5">
      {head}
      {accent ? (
        <>
          {" "}
          <span className="text-[#7dd3fc]">{accent}</span>
        </>
      ) : null}
      {endsWithPeriod ? "." : null}
    </h2>
  );
}

function LogoStage({ reduceMotion }: { reduceMotion: boolean }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const club = CLUB_LOGOS[active]!;

  useEffect(() => {
    if (reduceMotion || paused || CLUB_LOGOS.length < 2) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % CLUB_LOGOS.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, paused]);

  return (
    <div
      className="relative flex min-h-[220px] w-full flex-col items-center justify-center sm:min-h-[300px] md:min-h-[340px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Halo */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[42%] h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(125,211,252,0.22) 0%, rgba(37,99,235,0.12) 45%, transparent 72%)",
        }}
        animate={
          reduceMotion
            ? undefined
            : { opacity: [0.5, 0.9, 0.5], scale: [0.96, 1.05, 0.96] }
        }
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />

      {/* Logo actif */}
      <motion.div
        className="relative z-10 flex h-[9.5rem] w-[9.5rem] items-center justify-center sm:h-[13rem] sm:w-[13rem] md:h-[14.5rem] md:w-[14.5rem]"
        animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={club.id}
            initial={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 0, x: 28, scale: 0.94, filter: "blur(6px)" }
            }
            animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: -22, scale: 0.96, filter: "blur(4px)" }
            }
            transition={{ duration: 0.5, ease: easePremium }}
            className="relative h-full w-full"
          >
            <Image
              src={club.src}
              alt={club.name}
              fill
              sizes="(max-width: 640px) 176px, 232px"
              className="object-contain drop-shadow-[0_28px_50px_rgba(0,0,0,0.35)]"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Indicateurs égaux — plusieurs clubs visibles */}
      <div
        className="relative z-20 mt-8 flex items-center gap-3 sm:mt-10"
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
              onClick={() => setActive(index)}
              className={`relative h-12 w-12 overflow-visible rounded-full outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-sky-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071a3e] sm:h-14 sm:w-14 ${
                isActive ? "scale-110 opacity-100" : "opacity-45 hover:opacity-80"
              }`}
            >
              {isActive ? (
                <span
                  className="pointer-events-none absolute inset-[-6px] rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.35),transparent_70%)]"
                  aria-hidden
                />
              ) : null}
              <span className="relative block h-full w-full">
                <Image
                  src={item.src}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-contain"
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SocialProofSection() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="ils-utilisent-obillz"
      className={`${landingSectionShellClass()} scroll-mt-32 overflow-x-hidden md:scroll-mt-36`}
    >
      <div className="landing-container relative">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.8, ease: easePremium }}
          className="social-proof-panel relative overflow-hidden rounded-[1.5rem] shadow-[0_48px_100px_-36px_rgba(2,10,32,0.55)] sm:rounded-[2.25rem] md:rounded-[2.75rem]"
        >
          {/* Même dégradé que hero / footer */}
          <div className="social-proof-panel__bg" aria-hidden />
          <div className="social-proof-panel__grid" aria-hidden />

          <div className="relative z-10 grid items-center gap-8 px-5 py-10 sm:gap-14 sm:px-12 sm:py-14 md:px-14 md:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10 lg:px-16 lg:py-[4.5rem] xl:px-20">
            {/* Colonne gauche — tout dans le bloc */}
            <div className="min-w-0 max-w-xl lg:max-w-[34rem]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200/70 sm:text-xs">
                {t("marketing.socialProof.label")}
              </p>
              <TitleBlock title={t("marketing.socialProof.title")} />
              <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-blue-100/75 sm:mt-6 sm:text-[1.0625rem] sm:leading-[1.7]">
                {t("marketing.socialProof.subtitle")}
              </p>
            </div>

            {/* Colonne droite — logos */}
            <LogoStage reduceMotion={!!reduceMotion} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
