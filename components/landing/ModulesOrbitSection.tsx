"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
import { useI18n } from "@/components/I18nProvider";
import {
  easePremium,
  scrollReveal,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/components/landing/landing-motion";
import { LANDING_MODULE_IDS, type LandingModuleId } from "@/lib/landing/landing-modules";
import { useLandingModules, type LandingModuleView } from "@/lib/landing/use-landing-modules";
import {
  landingFeaturedCardClass,
  landingIconBadgeActiveClass,
  landingInnerPanelClass,
  landingSectionGlowClass,
} from "@/components/ui/styles";

const CYCLE_MS = 3750;

export default function ModulesOrbitSection() {
  const { t } = useI18n();
  const modules = useLandingModules();
  const reduceMotion = useReducedMotion();
  const zoneRef = useRef<HTMLDivElement>(null);
  const inView = useInView(zoneRef, { once: true, amount: 0.12 });

  const [activeId, setActiveId] = useState<LandingModuleId>("membres");
  const [paused, setPaused] = useState(false);

  const activeModule = modules.find((m) => m.id === activeId) ?? modules[0];

  const activate = useCallback((id: LandingModuleId) => {
    setActiveId(id);
  }, []);

  useEffect(() => {
    if (reduceMotion || paused || !inView) return;
    const id = window.setInterval(() => {
      setActiveId((current) => {
        const idx = LANDING_MODULE_IDS.indexOf(current);
        return LANDING_MODULE_IDS[(idx + 1) % LANDING_MODULE_IDS.length]!;
      });
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion, inView]);

  return (
    <section id="modules" className="relative scroll-mt-24 py-16 md:py-28">
      <div className={landingSectionGlowClass} aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-[5%] top-[18%] h-[min(560px,65vh)] rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.22),rgba(99,102,241,0.08)_50%,transparent_72%)] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-[94%] max-w-[1200px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80">
            {t("marketing.modules.label")}
          </p>
          <h2 className="mt-3 text-balance text-2xl font-black text-white md:text-4xl lg:text-[2.75rem]">
            {t("marketing.modules.title")}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-blue-100/70 md:text-base">
            {t("marketing.modules.subtitle")}
          </p>
        </motion.div>

        <div
          ref={zoneRef}
          className="mt-12 md:mt-14"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6 xl:gap-8">
            <FocusCard
              module={activeModule}
              reduceMotion={!!reduceMotion}
              paused={paused}
              cycleMs={CYCLE_MS}
            />

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-3.5"
            >
              {modules.map((mod) => (
                <motion.div key={mod.id} variants={staggerItem}>
                  <ModuleTile
                    module={mod}
                    isActive={mod.id === activeId}
                    reduceMotion={!!reduceMotion}
                    paused={paused}
                    cycleMs={CYCLE_MS}
                    onActivate={() => activate(mod.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-14 flex flex-col items-center text-center md:mt-16"
        >
          <p className="max-w-xl text-base font-semibold text-white md:text-lg">
            {t("marketing.modules.closing")}
          </p>
          <div className="mt-7">
            <LandingPrimaryButton href="/inscription">{t("marketing.modules.cta")}</LandingPrimaryButton>
          </div>
          <p className="mt-4 text-xs text-blue-200/60 md:text-sm">{t("marketing.modules.ctaNote")}</p>
        </motion.div>
      </div>
    </section>
  );
}

function FocusCard({
  module,
  reduceMotion,
  paused,
  cycleMs,
}: {
  module: LandingModuleView | undefined;
  reduceMotion: boolean;
  paused: boolean;
  cycleMs: number;
}) {
  const { t } = useI18n();
  if (!module) return null;
  const Icon = module.icon;

  return (
    <div className="relative min-h-[380px] lg:min-h-[520px]">
      <AnimatePresence mode="wait">
        <motion.article
          key={module.id}
          initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -12, scale: 0.99 }}
          transition={{ duration: 0.45, ease: easePremium }}
          className={`${landingFeaturedCardClass} flex h-full min-h-[inherit] flex-col p-6 md:p-7 lg:p-8`}
        >
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.35),transparent_70%)] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_20%_0%,rgba(26,35,255,0.3),transparent_60%)]"
            aria-hidden
          />

          <div className="relative flex flex-1 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-300/35 bg-[#1A23FF]/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-100">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-300 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-200" />
                </span>
                {t("marketing.modules.activeBadge")}
              </span>
            </div>

            <div className="mt-5 flex items-start gap-4">
              <span className={landingIconBadgeActiveClass}>
                <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-xl font-black text-white md:text-2xl lg:text-[1.65rem]">{module.title}</h3>
                <p className="mt-1.5 text-sm font-semibold text-blue-200/90 md:text-base">{module.tagline}</p>
              </div>
            </div>

            <p className="mt-4 max-w-lg text-sm leading-relaxed text-blue-100/75 md:text-[0.9375rem]">
              {module.description}
            </p>

            <ul className="mt-5 space-y-2.5">
              {module.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5 text-sm text-blue-50/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1A23FF]/30 text-[#93c5fd] ring-1 ring-[#1A23FF]/35">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>

            <div className={`${landingInnerPanelClass} relative mt-6 flex-1 p-4 md:mt-8 md:p-5`}>
              <ModuleVisual module={module} />
            </div>
          </div>

          <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-white/10">
            {!reduceMotion && !paused ? (
              <motion.span
                key={`focus-progress-${module.id}`}
                className="block h-full origin-left rounded-full bg-gradient-to-r from-[#1A23FF] via-[#6366f1] to-[#93c5fd]"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: cycleMs / 1000, ease: "linear" }}
              />
            ) : (
              <span className="block h-full w-full rounded-full bg-gradient-to-r from-[#1A23FF] to-[#93c5fd] opacity-80" />
            )}
          </div>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}

function ModuleVisual({ module }: { module: LandingModuleView }) {
  const { t } = useI18n();

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,rgba(96,165,250,0.9)_1px,transparent_1px),linear-gradient(to_bottom,rgba(96,165,250,0.9)_1px,transparent_1px)] [background-size:20px_20px]"
        aria-hidden
      />
      <p className="relative text-[10px] font-bold uppercase tracking-wider text-blue-300/70">
        {t("marketing.modules.previewLabel")}
      </p>
      <p className="relative mt-2 text-2xl font-black tabular-nums text-white md:text-3xl">
        {module.preview.headline}
      </p>
      <p className="relative mt-1 text-sm text-blue-100/65">{module.preview.sub}</p>
      <div className="relative mt-4 flex flex-wrap gap-2">
        {module.preview.chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-[#1A23FF]/35 bg-[#1A23FF]/12 px-2.5 py-1 text-[10px] font-semibold text-blue-100"
          >
            {chip}
          </span>
        ))}
      </div>
      <div className="relative mt-5 space-y-2">
        {[0.85, 0.62, 0.74].map((w, i) => (
          <div
            key={i}
            className="h-2 rounded-full bg-white/[0.08]"
            style={{ width: `${w * 100}%` }}
            aria-hidden
          />
        ))}
      </div>
    </>
  );
}

function ModuleTile({
  module,
  isActive,
  reduceMotion,
  paused,
  cycleMs,
  onActivate,
}: {
  module: LandingModuleView;
  isActive: boolean;
  reduceMotion: boolean;
  paused: boolean;
  cycleMs: number;
  onActivate: () => void;
}) {
  const { t } = useI18n();
  const Icon = module.icon;

  return (
    <button
      type="button"
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      aria-pressed={isActive}
      aria-label={t("marketing.modules.showModule", { name: module.title })}
      className={`group relative w-full overflow-hidden rounded-xl border text-left backdrop-blur-xl transition-all duration-300 ${
        isActive
          ? "scale-[1.02] border-blue-300/55 bg-gradient-to-br from-[#1A23FF]/35 to-[#6366f1]/18 shadow-[0_0_48px_rgba(26,35,255,0.45),0_0_24px_rgba(96,165,250,0.25),inset_0_1px_0_rgba(255,255,255,0.18)]"
          : "border-blue-400/20 bg-white/[0.06] hover:-translate-y-0.5 hover:border-blue-300/40 hover:bg-[#1A23FF]/[0.1] hover:shadow-[0_0_32px_rgba(26,35,255,0.22)]"
      }`}
    >
      {isActive ? (
        <span
          className="pointer-events-none absolute -inset-px -z-10 rounded-xl bg-[radial-gradient(circle_at_50%_0%,rgba(26,35,255,0.4),transparent_70%)] opacity-80"
          aria-hidden
        />
      ) : null}

      <div className="flex items-start gap-3 px-3.5 py-3.5 md:px-4 md:py-4">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
            isActive
              ? "bg-gradient-to-br from-[#1A23FF] to-[#4338ca] text-white shadow-[0_0_24px_rgba(26,35,255,0.55)]"
              : "bg-[#1A23FF]/15 text-blue-300 ring-1 ring-[#1A23FF]/30 group-hover:bg-[#1A23FF]/25"
          }`}
        >
          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold leading-tight text-white">{module.title}</span>
          <span className="mt-1 block text-[11px] leading-snug text-blue-100/60 sm:text-xs">{module.tagline}</span>
        </span>
      </div>

      <div className="h-0.5 overflow-hidden bg-white/[0.06]">
        {isActive && !reduceMotion && !paused ? (
          <motion.span
            key={`tile-progress-${module.id}`}
            className="block h-full origin-left rounded-full bg-gradient-to-r from-[#1A23FF] to-[#93c5fd]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: cycleMs / 1000, ease: "linear" }}
          />
        ) : isActive ? (
          <span className="block h-full w-full bg-[#1A23FF]/80" />
        ) : null}
      </div>
    </button>
  );
}
