"use client";

import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { easePremium, scrollReveal, viewportOnce } from "@/components/landing/landing-motion";
import {
  LANDING_MODULE_IDS,
  MODULE_ORBIT_LAYOUT,
  type LandingModuleId,
} from "@/lib/landing/landing-modules";
import { buildOrbitNodes, buildOrbitPaths, type OrbitNode, type OrbitPath } from "@/lib/landing/landing-orbit-paths";
import { useLandingModules, type LandingModuleView } from "@/lib/landing/use-landing-modules";
import { landingFeaturedCardClass, landingSectionGlowClass } from "@/components/ui/styles";

const CYCLE_MS = 4000;

export default function ModulesOrbitSection() {
  const { t } = useI18n();
  const modules = useLandingModules();
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.15 });
  const uid = useId().replace(/:/g, "");

  const nodes = useMemo(
    () => buildOrbitNodes(MODULE_ORBIT_LAYOUT, [...LANDING_MODULE_IDS]),
    []
  );
  const paths = useMemo(() => buildOrbitPaths(nodes), [nodes]);

  const [activeId, setActiveId] = useState<LandingModuleId>("membres");
  const [paused, setPaused] = useState(false);

  const activeIndex = LANDING_MODULE_IDS.indexOf(activeId);
  const activeModule = modules.find((m) => m.id === activeId) ?? modules[0];

  const goTo = useCallback((id: LandingModuleId) => {
    setActiveId(id);
    setPaused(true);
    window.setTimeout(() => setPaused(false), 14000);
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
        className="pointer-events-none absolute inset-x-[5%] top-[20%] h-[min(600px,70vh)] rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.28),rgba(99,102,241,0.1)_50%,transparent_72%)] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-[94%] max-w-[1200px]">
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
          <h2 className="mt-3 text-balance text-2xl font-black text-white md:text-4xl lg:text-[2.75rem]">
            {t("marketing.modules.title")}
          </h2>
          <p className="mt-4 text-sm text-blue-100/70 md:text-base">
            {t("marketing.modules.subtitle")}
          </p>
        </motion.div>

        {/* Orbit — desktop / tablette */}
        <div
          ref={containerRef}
          className="relative mx-auto mt-12 hidden md:block"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative mx-auto h-[min(68vw,620px)] max-h-[620px] w-full max-w-[920px]">
            <OrbitBackdrop inView={inView} reduceMotion={!!reduceMotion} />

            <svg
              viewBox="0 0 100 100"
              className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-visible"
              aria-hidden
            >
              <defs>
                <filter id={`orbit-glow-${uid}`}>
                  <feGaussianBlur stdDeviation="1.2" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {paths.map((path) => (
                <OrbitConnector
                  key={path.id}
                  path={path}
                  uid={uid}
                  inView={inView}
                  isActive={activeId === path.id}
                  reduceMotion={!!reduceMotion}
                />
              ))}
            </svg>

            {/* Anneaux décoratifs */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/8"
              aria-hidden
            />

            {/* Hub central */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, ease: easePremium }}
              className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            >
              <CentralCore reduceMotion={!!reduceMotion} activeModule={activeModule} />
            </motion.div>

            {/* Nodes orbitaux */}
            {nodes.map((node, index) => {
              const mod = modules.find((m) => m.id === node.id);
              if (!mod) return null;
              return (
                <OrbitNodeCard
                  key={node.id}
                  node={node}
                  module={mod}
                  index={index}
                  inView={inView}
                  isActive={activeId === node.id}
                  reduceMotion={!!reduceMotion}
                  onActivate={() => goTo(node.id)}
                />
              );
            })}
          </div>

          {/* Panneau détail */}
          <div className="relative mx-auto mt-6 max-w-[820px]">
            <ModuleDetailPanel module={activeModule} reduceMotion={!!reduceMotion} />
          </div>

          {/* Indicateurs */}
          <div className="mt-5 flex justify-center gap-1.5">
            {LANDING_MODULE_IDS.map((id, i) => (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                className="group flex h-2 w-6 items-center overflow-hidden rounded-full bg-white/10 transition hover:bg-white/20"
                aria-label={t("marketing.modules.showModule", {
                  name: modules.find((m) => m.id === id)?.title ?? id,
                })}
              >
                <span
                  className={`block h-full rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? "w-full bg-gradient-to-r from-[#1A23FF] to-[#93c5fd]"
                      : "w-0 bg-[#1A23FF]"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Mobile — grille + détail */}
        <div className="mt-10 md:hidden">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {modules.map((mod) => {
              const Icon = mod.icon;
              const isActive = mod.id === activeId;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => goTo(mod.id)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-300 ${
                    isActive
                      ? "border-blue-300/50 bg-gradient-to-br from-[#1A23FF]/30 to-[#6366f1]/15 shadow-[0_0_32px_rgba(26,35,255,0.35)]"
                      : "border-blue-400/20 bg-white/[0.06] hover:border-blue-300/35"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isActive
                        ? "bg-[#1A23FF] text-white shadow-[0_0_16px_rgba(26,35,255,0.5)]"
                        : "bg-[#1A23FF]/20 text-blue-300 ring-1 ring-[#1A23FF]/30"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0 text-xs font-bold leading-tight text-white">{mod.title}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <ModuleDetailPanel module={activeModule} reduceMotion={!!reduceMotion} />
          </div>
        </div>
      </div>
    </section>
  );
}

function OrbitBackdrop({ inView, reduceMotion }: { inView: boolean; reduceMotion: boolean }) {
  return (
    <>
      <motion.div
        className="pointer-events-none absolute inset-[0%] rounded-[3rem] bg-[radial-gradient(ellipse_at_center,rgba(26,35,255,0.35),rgba(99,102,241,0.1)_45%,transparent_72%)] blur-3xl"
        animate={inView && !reduceMotion ? { opacity: [0.4, 0.85, 0.4], scale: [1, 1.04, 1] } : undefined}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-[8%] rounded-[2.5rem] border border-blue-400/12 bg-[radial-gradient(ellipse_at_center,rgba(26,35,255,0.06),transparent_70%)]"
        aria-hidden
      />
    </>
  );
}

function CentralCore({
  activeModule,
  reduceMotion,
}: {
  activeModule: LandingModuleView | undefined;
  reduceMotion: boolean;
}) {
  const Icon = activeModule?.icon;
  return (
    <div className="relative">
      {!reduceMotion ? (
        <>
          <motion.div
            className="pointer-events-none absolute -inset-10 rounded-full border border-blue-400/25"
            animate={{ scale: [1, 1.14, 1], opacity: [0.3, 0.65, 0.3] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute -inset-6 rounded-full border border-indigo-300/15"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            aria-hidden
          />
        </>
      ) : null}
      <motion.div
        animate={
          !reduceMotion
            ? {
                boxShadow: [
                  "0 24px 80px rgba(26,35,255,0.45), 0 0 100px rgba(26,35,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                  "0 32px 100px rgba(26,35,255,0.6), 0 0 130px rgba(96,165,250,0.35), inset 0 1px 0 rgba(255,255,255,0.28)",
                  "0 24px 80px rgba(26,35,255,0.45), 0 0 100px rgba(26,35,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                ],
              }
            : undefined
        }
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-2xl border border-blue-300/35 bg-gradient-to-br from-[#1e2870]/95 via-[#121a52]/97 to-[#0a0f28]/98 px-6 py-5 text-center shadow-[0_24px_70px_rgba(26,35,255,0.4)] backdrop-blur-2xl sm:min-w-[240px]"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent"
          aria-hidden
        />
        <Image
          src="/logo-obillz.png"
          alt="Obillz"
          width={150}
          height={40}
          className="relative mx-auto h-auto w-[100px] brightness-110 sm:w-[112px]"
        />
        {Icon && activeModule ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: easePremium }}
              className="relative mt-3 flex items-center justify-center gap-2"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A23FF] text-white shadow-[0_0_20px_rgba(26,35,255,0.6)]">
                <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <span className="text-sm font-bold text-white">{activeModule.title}</span>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </motion.div>
    </div>
  );
}

function OrbitConnector({
  path,
  uid,
  inView,
  isActive,
  reduceMotion,
}: {
  path: OrbitPath;
  uid: string;
  inView: boolean;
  isActive: boolean;
  reduceMotion: boolean;
}) {
  const gradId = `orbit-line-${path.id}-${uid}`;
  return (
    <g>
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={path.x1} y1={path.y1} x2={path.x2} y2={path.y2}>
          <stop offset="0%" stopColor="#1A23FF" stopOpacity={isActive ? 1 : 0.45} />
          <stop offset="50%" stopColor={isActive ? "#ffffff" : "#93c5fd"} stopOpacity="1" />
          <stop offset="100%" stopColor="#a5b4fc" stopOpacity={isActive ? 0.95 : 0.5} />
        </linearGradient>
      </defs>
      <motion.path
        d={path.d}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={isActive ? 0.55 : 0.35}
        strokeLinecap="round"
        filter={`url(#orbit-glow-${uid})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: inView ? 1 : 0,
          opacity: inView ? (isActive ? 1 : reduceMotion ? 0.6 : [0.3, 0.85, 0.35]) : 0,
        }}
        transition={{
          pathLength: { duration: 0.85, delay: path.delay, ease: easePremium },
          opacity: isActive
            ? { duration: 0.2 }
            : reduceMotion
              ? { duration: 0.4 }
              : { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: path.pulseDelay },
        }}
      />
      {!reduceMotion && isActive ? (
        <motion.path
          d={path.d}
          fill="none"
          stroke="#ffffff"
          strokeWidth={0.28}
          strokeLinecap="round"
          strokeDasharray={`${path.length * 0.08} ${path.length * 0.92}`}
          animate={{ strokeDashoffset: [path.length, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          style={{ opacity: 0.7 }}
        />
      ) : null}
    </g>
  );
}

function OrbitNodeCard({
  node,
  module,
  index,
  inView,
  isActive,
  reduceMotion,
  onActivate,
}: {
  node: OrbitNode;
  module: LandingModuleView;
  index: number;
  inView: boolean;
  isActive: boolean;
  reduceMotion: boolean;
  onActivate: () => void;
}) {
  const Icon = module.icon;
  const floatY = reduceMotion ? 0 : [-node.floatY * 0.35, node.floatY * 0.5, -node.floatY * 0.35];

  return (
    <motion.div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
    >
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.45, filter: "blur(8px)" }}
        animate={{
          opacity: inView ? 1 : 0,
          scale: inView ? 1 : 0.45,
          filter: inView ? "blur(0px)" : "blur(8px)",
          y: floatY,
        }}
        whileHover={reduceMotion ? undefined : { scale: 1.08, y: -node.floatY * 0.8 }}
        transition={{
          opacity: { duration: 0.5, delay: node.delay, ease: easePremium },
          scale: { duration: 0.5, delay: node.delay, ease: easePremium },
          filter: { duration: 0.5, delay: node.delay },
          y: reduceMotion
            ? { duration: 0.2 }
            : { duration: node.floatDuration, repeat: Infinity, ease: "easeInOut", delay: node.floatDelay },
        }}
        onClick={onActivate}
        className="relative cursor-pointer touch-manipulation outline-none"
        aria-label={module.title}
        aria-pressed={isActive}
      >
        {isActive && !reduceMotion ? (
          <motion.span
            className="pointer-events-none absolute -inset-5 -z-10 rounded-2xl bg-[radial-gradient(circle,rgba(26,35,255,0.55),transparent_70%)] blur-xl"
            animate={{ opacity: [0.5, 0.95, 0.5], scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        ) : null}
        <div
          className={`flex w-[min(36vw,130px)] items-center gap-2 rounded-xl border px-2.5 py-2 backdrop-blur-xl sm:w-[138px] sm:px-3 sm:py-2.5 ${
            isActive
              ? "border-blue-300/55 bg-[#161f48]/96 shadow-[0_16px_48px_rgba(26,35,255,0.5),0_0_40px_rgba(96,165,250,0.35)]"
              : "border-white/18 bg-[#0b1026]/90 shadow-[0_10px_28px_rgba(0,0,0,0.5),0_0_20px_rgba(26,35,255,0.12)]"
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 sm:h-8 sm:w-8 ${
              isActive
                ? "bg-[#1A23FF] text-white ring-blue-300/55 shadow-[0_0_14px_rgba(96,165,250,0.55)]"
                : "bg-[#1A23FF]/22 text-blue-300 ring-[#1A23FF]/32"
            }`}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} aria-hidden />
          </span>
          <span className="min-w-0 text-[10px] font-bold leading-tight text-white sm:text-[11px]">
            {module.title}
          </span>
        </div>
      </motion.button>
    </motion.div>
  );
}

function ModuleDetailPanel({
  module,
  reduceMotion,
}: {
  module: LandingModuleView | undefined;
  reduceMotion: boolean;
}) {
  const { t } = useI18n();
  if (!module) return null;
  const Icon = module.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={module.id}
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
        transition={{ duration: 0.4, ease: easePremium }}
        className={`${landingFeaturedCardClass} grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-start md:p-8`}
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#1A23FF] to-[#6366f1] text-white shadow-[0_0_28px_rgba(26,35,255,0.55)]">
              <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <h3 className="text-xl font-black text-white md:text-2xl">{module.title}</h3>
              <p className="text-sm font-semibold text-blue-200/90">{module.tagline}</p>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-blue-100/75 md:text-[0.9375rem]">
            {module.description}
          </p>
          <ul className="mt-5 space-y-2">
            {module.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2.5 text-sm text-blue-50/90">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1A23FF]/30 text-[#93c5fd] ring-1 ring-[#1A23FF]/35">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative min-w-[200px] overflow-hidden rounded-xl border border-blue-400/25 bg-gradient-to-br from-white/[0.12] to-[#1A23FF]/[0.08] p-5 shadow-[0_0_40px_rgba(26,35,255,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] md:min-w-[220px]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300/70">
            {t("marketing.modules.previewLabel")}
          </p>
          <p className="mt-2 text-2xl font-black tabular-nums text-white">{module.preview.headline}</p>
          <p className="mt-1 text-sm text-blue-100/65">{module.preview.sub}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {module.preview.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-[#1A23FF]/35 bg-[#1A23FF]/12 px-2.5 py-0.5 text-[10px] font-semibold text-blue-100"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
