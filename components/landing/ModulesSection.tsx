"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { useLandingModules } from "@/lib/landing/use-landing-modules";
import { easePremium, scrollReveal, viewportOnce } from "@/components/landing/landing-motion";
import {
  landingIconBadgeActiveClass,
  landingInnerPanelClass,
  landingSectionGlowClass,
  landingSectionShellClass,
} from "@/components/ui/styles";

const AUTO_MS = 5200;

export default function ModulesSection() {
  const { t } = useI18n();
  const modules = useLandingModules();
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setActive(index);
    setPaused(true);
    window.setTimeout(() => setPaused(false), 12000);
  }, []);

  useEffect(() => {
    if (reduceMotion || paused) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % modules.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion, modules.length]);

  const current = modules[active] ?? modules[0];
  if (!current) return null;
  const Icon = current.icon;

  return (
    <section id="modules" className="relative scroll-mt-24 py-16 md:py-24">
      <div className={landingSectionGlowClass} aria-hidden />

      <div className="relative mx-auto w-[94%] max-w-[1160px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80">
            {t("marketing.modules.label")}
          </p>
          <h2 className="mt-3 text-balance text-2xl font-black text-white md:text-4xl">
            {t("marketing.modules.title")}
          </h2>
          <p className="mt-4 text-sm text-blue-100/70 md:text-base">
            {t("marketing.modules.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: easePremium }}
          className={`${landingSectionShellClass} mt-10 p-4 md:mt-14 md:p-6`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-8">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none lg:flex-col lg:overflow-visible lg:pb-0">
              {modules.map((mod, index) => {
                const ModIcon = mod.icon;
                const isActive = index === active;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => goTo(index)}
                    className={`flex min-w-[148px] shrink-0 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-300 lg:min-w-0 lg:w-full lg:px-4 lg:py-3.5 ${
                      isActive
                        ? "border-blue-300/55 bg-gradient-to-br from-[#1A23FF]/35 to-[#6366f1]/15 shadow-[0_0_40px_rgba(26,35,255,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]"
                        : "border-blue-400/20 bg-white/[0.06] hover:-translate-y-0.5 hover:border-blue-300/35 hover:bg-[#1A23FF]/[0.1] hover:shadow-[0_0_32px_rgba(26,35,255,0.2)]"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-shadow duration-300 ${
                        isActive
                          ? "bg-gradient-to-br from-[#1A23FF] to-[#4338ca] text-white shadow-[0_0_24px_rgba(26,35,255,0.55)]"
                          : "bg-[#1A23FF]/15 text-blue-300 ring-1 ring-[#1A23FF]/30"
                      }`}
                    >
                      <ModIcon className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-white">{mod.title}</span>
                      <span className="mt-0.5 hidden text-[11px] leading-snug text-blue-100/55 sm:block">
                        {mod.tagline}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="landing-glass-card relative min-h-[320px] overflow-hidden rounded-2xl border border-blue-400/30 bg-gradient-to-br from-[#060b1c]/95 via-[#0a1028]/85 to-[#1A23FF]/[0.12] shadow-[0_0_0_1px_rgba(147,197,253,0.1),0_8px_40px_rgba(0,0,0,0.45),0_0_60px_rgba(26,35,255,0.25)] md:min-h-[360px]">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,rgba(26,35,255,0.35),transparent)]"
                aria-hidden
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: easePremium }}
                  className="relative flex h-full flex-col p-5 md:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={landingIconBadgeActiveClass}>
                          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                        </span>
                        <h3 className="text-xl font-black text-white md:text-2xl">{current.title}</h3>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-blue-200/90">{current.tagline}</p>
                    </div>
                  </div>

                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-blue-100/75 md:text-[0.9375rem]">
                    {current.description}
                  </p>

                  <ul className="mt-5 space-y-2.5">
                    {current.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5 text-sm text-blue-50/90">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1A23FF]/25 text-[#93c5fd] ring-1 ring-[#1A23FF]/30">
                          <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                        </span>
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  <div className={`${landingInnerPanelClass} mt-6 flex-1 p-4 md:mt-8 md:p-5`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300/70">
                      {t("marketing.modules.previewLabel")}
                    </p>
                    <p className="mt-2 text-2xl font-black tabular-nums text-white md:text-3xl">
                      {current.preview.headline}
                    </p>
                    <p className="mt-1 text-sm text-blue-100/65">{current.preview.sub}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {current.preview.chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-[#1A23FF]/30 bg-[#1A23FF]/10 px-2.5 py-1 text-[11px] font-semibold text-blue-100"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="absolute bottom-4 left-5 right-5 flex items-center gap-2 md:left-7 md:right-7">
                {modules.map((mod, index) => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => goTo(index)}
                    className="group flex flex-1 flex-col gap-1"
                    aria-label={t("marketing.modules.showModule", { name: mod.title })}
                  >
                    <span
                      className={`block h-1 overflow-hidden rounded-full bg-white/10 ${
                        index === active ? "" : "opacity-60"
                      }`}
                    >
                      {index === active && !reduceMotion && !paused ? (
                        <motion.span
                          className="block h-full origin-left rounded-full bg-gradient-to-r from-[#1A23FF] to-[#93c5fd]"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
                          key={`progress-${active}`}
                        />
                      ) : (
                        <span
                          className={`block h-full rounded-full ${
                            index === active ? "w-full bg-[#1A23FF]" : "w-0"
                          }`}
                        />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-blue-200/50 lg:hidden">
            <ChevronRight className="h-3.5 w-3.5 rotate-180" aria-hidden />
            {t("marketing.modules.scrollHint")}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
