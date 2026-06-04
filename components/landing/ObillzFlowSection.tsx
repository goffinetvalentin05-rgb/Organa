"use client";

import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Coffee, Globe, UserRound, Wallet } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { easePremium } from "@/components/landing/landing-motion";
import {
  buildFlowStreamPaths,
  FLOW_HUB_MODULES,
  FLOW_SOURCES,
  FLOW_VIEW_HEIGHT,
  flowSourceToneClass,
  MOBILE_FLOW_SOURCE_IDS,
  type FlowSourceDef,
  type FlowSourceId,
  ChevronRight,
} from "@/lib/landing/obillz-flow";

const SCENE_MIN_H = "min-h-[min(88vh,820px)]";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

function SceneGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute left-[12%] top-[32%] h-[min(320px,38vw)] w-[min(320px,38vw)] rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.18),transparent_68%)] blur-3xl" />
      <div className="absolute right-[12%] top-[32%] h-[min(320px,38vw)] w-[min(320px,38vw)] rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.14),transparent_68%)] blur-3xl" />
      <div className="absolute left-1/2 top-[42%] h-[min(520px,55vw)] w-[min(520px,55vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.28),transparent_70%)] blur-3xl" />
      <div className="absolute bottom-[8%] left-[48%] h-32 w-[min(480px,42vw)] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse,rgba(139,92,246,0.35),transparent_72%)] blur-2xl" />
    </div>
  );
}

type SubtlePathProps = {
  d: string;
  delay: number;
  uid: string;
  inView: boolean;
  motionOn: boolean;
};

function SubtleFlowPath({ d, delay, uid, inView, motionOn }: SubtlePathProps) {
  const grad = `path-grad-${uid}-${delay}`;

  return (
    <g opacity={0.9}>
      <defs>
        <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.08" />
          <stop offset="55%" stopColor="#c4b5fd" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <motion.path
        d={d}
        fill="none"
        stroke={`url(#${grad})`}
        strokeWidth="0.35"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        filter={`url(#path-soft-${uid})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: inView ? 1 : 0,
          opacity: inView ? (motionOn ? [0.12, 0.28, 0.12] : 0.2) : 0,
        }}
        transition={{
          pathLength: { duration: 1.4, delay, ease: easePremium },
          opacity: motionOn
            ? { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay }
            : { duration: 0.6, delay },
        }}
      />
      {motionOn ? (
        <circle r="0.35" fill="#e9d5ff" opacity="0.7">
          <animateMotion dur="3.8s" repeatCount="indefinite" path={d} begin={`${delay + 0.6}s`} />
        </circle>
      ) : null}
    </g>
  );
}

type FloatingSourceProps = {
  source: FlowSourceDef;
  title: string;
  subtitle: string;
  inView: boolean;
  motionOn: boolean;
  compact?: boolean;
};

function FloatingSourceCard({
  source,
  title,
  subtitle,
  inView,
  motionOn,
  compact,
}: FloatingSourceProps) {
  const Icon = source.icon;
  const driftPx = compact ? 12 : 20;
  const driftSign = source.side === "right" ? -1 : 1;

  return (
    <motion.div
      className={
        compact
          ? "relative z-[14]"
          : "absolute z-[14] -translate-x-1/2 -translate-y-1/2"
      }
      style={
        compact
          ? undefined
          : {
              left: `${source.x}%`,
              top: `${(source.y / FLOW_VIEW_HEIGHT) * 100}%`,
            }
      }
      initial={{ opacity: 0, scale: 0.88, filter: "blur(6px)" }}
      animate={
        inView
          ? { opacity: 1, scale: 1, filter: "blur(0px)" }
          : { opacity: 0, scale: 0.88, filter: "blur(6px)" }
      }
      transition={{ delay: source.staggerDelay, duration: 0.7, ease: easePremium }}
    >
      <motion.div
        style={{ rotate: source.rotate }}
        animate={
          motionOn
            ? {
                x: [0, driftPx * 0.45 * driftSign, driftPx * 0.7 * driftSign, 0],
                y: [0, -4, -2, 0],
              }
            : { x: 0, y: 0 }
        }
        transition={
          motionOn
            ? {
                duration: source.driftDuration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: source.staggerDelay,
              }
            : undefined
        }
        whileHover={motionOn ? { scale: 1.03 } : undefined}
        className="group will-change-transform"
      >
        <motion.div
          animate={motionOn ? { y: [0, -4, 0] } : undefined}
          transition={
            motionOn
              ? {
                  duration: source.floatDuration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: source.staggerDelay * 0.5,
                }
              : undefined
          }
          className={`flex items-center gap-2 rounded-xl border border-white/[0.14] bg-white/[0.06] px-2 py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-[box-shadow,border-color] duration-300 hover:border-violet-400/30 hover:shadow-[0_16px_48px_rgba(139,92,246,0.22)] sm:gap-2.5 sm:px-2.5 sm:py-2 ${
            compact ? "min-w-[8.5rem]" : "min-w-[9.25rem] max-w-[10.25rem]"
          }`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 sm:h-9 sm:w-9 ${flowSourceToneClass[source.tone]}`}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold text-white sm:text-[11px]">{title}</p>
            <p className="truncate text-[8px] text-white/45 sm:text-[9px]">{subtitle}</p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function PeekCard({
  icon: Icon,
  className,
  rotate,
  motionOn,
}: {
  icon: LucideIcon;
  className: string;
  rotate: number;
  motionOn: boolean;
}) {
  return (
    <motion.div
      className={`absolute flex h-9 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md sm:h-10 sm:w-12 ${className}`}
      style={{ rotate }}
      animate={motionOn ? { y: [0, -3, 0] } : undefined}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <Icon className="h-3.5 w-3.5 text-violet-200/80 sm:h-4 sm:w-4" strokeWidth={1.75} />
    </motion.div>
  );
}

type ObillzFolderProps = {
  inView: boolean;
  motionOn: boolean;
  moduleLabels: Record<string, string>;
  compact?: boolean;
};

function ObillzFolder3D({ inView, motionOn, moduleLabels, compact }: ObillzFolderProps) {
  const tiltY = compact ? -5 : -10;
  const tiltX = compact ? 3 : 5;
  const transformRest = `perspective(1400px) rotateY(${tiltY}deg) rotateX(${tiltX}deg) translateZ(0)`;
  const transformEnter = `perspective(1400px) rotateY(${tiltY - 6}deg) rotateX(${tiltX + 3}deg) translateZ(0)`;

  return (
    <div
      className={`relative z-20 mx-auto w-full ${compact ? "max-w-[19rem]" : "max-w-[min(100%,24rem)] lg:max-w-[min(38vw,400px)]"}`}
      style={{ perspective: "1400px" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, transform: transformEnter }}
        animate={
          inView
            ? { opacity: 1, y: 0, transform: transformRest }
            : { opacity: 0, y: 40, transform: transformEnter }
        }
        transition={{ duration: 1, delay: 0.2, ease: easePremium }}
        style={{
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
        className="relative [transform-style:preserve-3d]"
      >
        {/* Reflet sol */}
        <div
          className="pointer-events-none absolute -bottom-8 left-1/2 h-16 w-[88%] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse,rgba(168,85,247,0.45),transparent_70%)] blur-xl"
          aria-hidden
        />
        {motionOn ? (
          <motion.div
            className="pointer-events-none absolute -inset-10 rounded-[2rem] bg-[radial-gradient(ellipse,rgba(168,85,247,0.4),transparent_65%)] blur-3xl"
            animate={{ opacity: [0.4, 0.75, 0.4], scale: [1, 1.04, 1] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        ) : (
          <div
            className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-[radial-gradient(ellipse,rgba(26,35,255,0.35),transparent_68%)] blur-3xl"
            aria-hidden
          />
        )}

        <motion.div
          animate={
            motionOn
              ? {
                  boxShadow: [
                    "0 40px 120px rgba(26,35,255,0.55), 0 0 80px rgba(168,85,247,0.35), 0 0 0 1px rgba(167,139,250,0.35) inset",
                    "0 50px 140px rgba(26,35,255,0.65), 0 0 100px rgba(168,85,247,0.5), 0 0 0 1px rgba(196,181,253,0.45) inset",
                    "0 40px 120px rgba(26,35,255,0.55), 0 0 80px rgba(168,85,247,0.35), 0 0 0 1px rgba(167,139,250,0.35) inset",
                  ],
                }
              : undefined
          }
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          className="relative overflow-visible rounded-[1.35rem] border border-violet-400/30 bg-gradient-to-br from-[#1e2a6b]/95 via-[#141d52]/98 to-[#0a0f28] backdrop-blur-xl"
        >
          {/* Onglet dossier */}
          <div
            className="absolute -top-3 left-6 z-10 h-6 w-[4.5rem] rounded-t-xl border border-b-0 border-violet-300/25 bg-gradient-to-b from-[#2a3880] to-[#1a2558] shadow-[0_-4px_20px_rgba(139,92,246,0.2)]"
            aria-hidden
          />

          <PeekCard
            icon={UserRound}
            className="-top-5 left-[16%] z-20"
            rotate={-12}
            motionOn={motionOn}
          />
          <PeekCard
            icon={Wallet}
            className="-top-7 left-[42%] z-20"
            rotate={4}
            motionOn={motionOn}
          />
          <PeekCard
            icon={Coffee}
            className="-top-4 right-[22%] z-20"
            rotate={10}
            motionOn={motionOn}
          />
          <PeekCard
            icon={Globe}
            className="-top-6 right-[8%] z-20"
            rotate={-6}
            motionOn={motionOn}
          />

          {motionOn ? (
            <motion.div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.35rem]"
              aria-hidden
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.07] to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 2.5 }}
              />
            </motion.div>
          ) : null}

          <div className="relative px-5 pb-5 pt-7 sm:px-6 sm:pb-6 sm:pt-8">
            <div className="mb-5 flex justify-center border-b border-white/10 pb-4">
              <Image
                src="/obillz-logo.png"
                alt="Obillz"
                width={148}
                height={38}
                className="h-8 w-auto brightness-110 drop-shadow-[0_0_24px_rgba(255,255,255,0.25)] sm:h-9"
                priority
              />
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 sm:gap-x-2.5 sm:gap-y-2">
              {FLOW_HUB_MODULES.map((mod, i) => {
                const Icon = mod.icon;
                const label = moduleLabels[mod.id] ?? mod.id;
                return (
                  <motion.div
                    key={mod.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                    transition={{ delay: 0.45 + i * 0.05, duration: 0.4, ease: easePremium }}
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.04] px-2 py-1.5 transition-colors hover:bg-white/[0.07] sm:gap-2 sm:px-2.5 sm:py-2"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#1A23FF]/25 ring-1 ring-violet-400/35 sm:h-7 sm:w-7">
                      <Icon className="h-3 w-3 text-blue-100/90 sm:h-3.5 sm:w-3.5" strokeWidth={2} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-white/80 sm:text-[11px]">
                      {label}
                    </span>
                    <ChevronRight className="hidden h-3 w-3 shrink-0 text-violet-300/40 sm:block" aria-hidden />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Bord lumineux bas — profondeur */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent"
            aria-hidden
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ObillzFlowSection() {
  const { t } = useI18n();
  const uid = useId().replace(/:/g, "");
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.08 });
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const motionOn = inView && !reduceMotion;

  const visibleSources = useMemo(
    () =>
      isMobile
        ? FLOW_SOURCES.filter((s) => MOBILE_FLOW_SOURCE_IDS.includes(s.id))
        : FLOW_SOURCES,
    [isMobile],
  );

  const streamPaths = useMemo(() => buildFlowStreamPaths(visibleSources), [visibleSources]);

  const sourceCopy = (id: FlowSourceId) => ({
    title: t(`marketing.modules.items.${id}.title`),
    subtitle: t(`marketing.flow.sources.${id}.subtitle`),
  });

  const moduleLabels = useMemo(
    () =>
      Object.fromEntries(
        FLOW_HUB_MODULES.map((m) => [m.id, t(`marketing.modules.items.${m.id}.title`)]),
      ),
    [t],
  );

  return (
    <section
      ref={sectionRef}
      id="centralisation"
      aria-label={t("marketing.flow.ariaLabel")}
      className="relative overflow-x-clip overflow-y-visible py-20 md:py-28 lg:py-32"
    >
      <SceneGlow />

      <div className={`relative mx-auto w-full max-w-[90rem] px-5 sm:px-8 ${SCENE_MIN_H}`}>
        {/* Desktop : boîte à ratio fixe = positions % alignées SVG + cartes */}
        <div className={`relative mx-auto hidden w-full max-w-[1080px] lg:block ${SCENE_MIN_H}`}>
          <div className="relative aspect-[10/6] w-full min-h-[min(72vh,640px)] max-h-[820px]">
          <svg
            viewBox="0 0 100 60"
            className="pointer-events-none absolute inset-0 z-[8] h-full w-full"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <filter id={`path-soft-${uid}`}>
                <feGaussianBlur stdDeviation="0.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {streamPaths.map((path) => (
              <SubtleFlowPath
                key={path.id}
                d={path.d}
                delay={path.delay}
                uid={uid}
                inView={inView}
                motionOn={motionOn}
              />
            ))}
          </svg>

          {visibleSources.map((source) => {
            const copy = sourceCopy(source.id);
            return (
              <FloatingSourceCard
                key={source.id}
                source={source}
                title={copy.title}
                subtitle={copy.subtitle}
                inView={inView}
                motionOn={motionOn}
              />
            );
          })}

          <div className="absolute left-1/2 top-1/2 z-[18] -translate-x-1/2 -translate-y-1/2 [perspective:1600px]">
            <ObillzFolder3D inView={inView} motionOn={motionOn} moduleLabels={moduleLabels} />
          </div>
          </div>
        </div>

        {/* Mobile / tablette — features gauche / dossier / droite */}
        <div className="flex flex-col items-center gap-8 py-8 lg:hidden">
          <div className="grid w-full max-w-lg grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
            <div className="flex flex-col gap-2.5 sm:gap-3">
              {visibleSources
                .filter((s) => s.side === "left")
                .map((source) => {
                  const copy = sourceCopy(source.id);
                  return (
                    <FloatingSourceCard
                      key={source.id}
                      source={source}
                      title={copy.title}
                      subtitle={copy.subtitle}
                      inView={inView}
                      motionOn={motionOn}
                      compact
                    />
                  );
                })}
            </div>

            <ObillzFolder3D
              inView={inView}
              motionOn={motionOn}
              moduleLabels={moduleLabels}
              compact
            />

            <div className="flex flex-col gap-2.5 sm:gap-3">
              {visibleSources
                .filter((s) => s.side === "right")
                .map((source) => {
                  const copy = sourceCopy(source.id);
                  return (
                    <FloatingSourceCard
                      key={source.id}
                      source={source}
                      title={copy.title}
                      subtitle={copy.subtitle}
                      inView={inView}
                      motionOn={motionOn}
                      compact
                    />
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
