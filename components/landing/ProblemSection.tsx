"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BellRing,
  Clock,
  Layers,
  LayoutDashboard,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";
import {
  easePremium,
  scrollReveal,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/components/landing/landing-motion";
import {
  landingGlassCardClass,
  landingInnerPanelClass,
  landingSectionGlowClass,
} from "@/components/ui/styles";

type BenefitCard = { title: string; description: string };

const cardMeta: { icon: LucideIcon; wide?: boolean }[] = [
  { icon: Clock },
  { icon: LayoutDashboard },
  { icon: Users, wide: true },
  { icon: BellRing },
  { icon: Sparkles },
  { icon: Layers, wide: true },
];

export default function ProblemSection() {
  const { t, locale } = useI18n();
  const reduceMotion = useReducedMotion();
  const raw = getTranslationValue(locale, "marketing.problem.cards");
  const cards = (Array.isArray(raw) ? raw : []) as BenefitCard[];

  return (
    <section id="probleme" className="relative scroll-mt-24 py-16 md:py-28">
      <div className={landingSectionGlowClass} aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-[8%] top-[12%] h-[min(420px,50vh)] rounded-full bg-[radial-gradient(ellipse,rgba(99,102,241,0.18),transparent_70%)] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-[94%] max-w-[1200px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12"
        >
          <div className="max-w-2xl lg:max-w-[42rem]">
            <h2 className="text-balance text-[1.75rem] font-black leading-[1.12] tracking-[-0.03em] text-white sm:text-3xl md:text-4xl lg:text-[2.65rem]">
              {t("marketing.problem.title")}
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-blue-100/75 md:mt-5 md:text-base md:leading-[1.7]">
              {t("marketing.problem.subtitle")}
            </p>
          </div>

          <div className="shrink-0 lg:pb-1">
            <LandingPrimaryButton href="/inscription">
              {t("marketing.problem.cta")}
            </LandingPrimaryButton>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-12 grid grid-cols-1 gap-4 sm:gap-5 md:mt-16 md:grid-cols-2 md:gap-5 lg:gap-6"
        >
          {cards.map((card, index) => {
            const meta = cardMeta[index] ?? cardMeta[0]!;
            const Icon = meta.icon;
            const isWide = meta.wide;

            return (
              <motion.div
                key={card.title}
                variants={staggerItem}
                className={isWide ? "md:col-span-2" : undefined}
              >
                <BenefitCardItem
                  card={card}
                  Icon={Icon}
                  index={index}
                  isWide={!!isWide}
                  reduceMotion={!!reduceMotion}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function BenefitCardItem({
  card,
  Icon,
  index,
  isWide,
  reduceMotion,
}: {
  card: BenefitCard;
  Icon: LucideIcon;
  index: number;
  isWide: boolean;
  reduceMotion: boolean;
}) {
  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -6, transition: { duration: 0.28, ease: easePremium } }}
      className={`${landingGlassCardClass} group flex h-full min-h-[300px] flex-col overflow-hidden p-5 sm:min-h-[320px] sm:p-6 md:p-7 ${
        isWide ? "md:min-h-[280px] md:flex-row md:items-stretch md:gap-8" : ""
      }`}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(26,35,255,0.28),transparent_68%)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(26,35,255,0.12),transparent_55%)] opacity-80"
        aria-hidden
      />

      <div className={`relative flex min-w-0 flex-col ${isWide ? "md:flex-1 md:justify-center" : "flex-1"}`}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1A23FF]/55 to-[#6366f1]/35 text-blue-100 shadow-[0_0_24px_rgba(26,35,255,0.35)] ring-1 ring-blue-300/35 transition duration-300 group-hover:shadow-[0_0_32px_rgba(26,35,255,0.5)]">
            <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300/70">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <h3 className="mt-4 text-lg font-bold tracking-tight text-white sm:text-xl md:text-[1.35rem]">
          {card.title}
        </h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-100/68 md:text-[0.9375rem]">
          {card.description}
        </p>
      </div>

      <div
        className={`relative mt-6 min-h-[140px] sm:min-h-[150px] ${
          isWide ? "md:mt-0 md:flex md:flex-1 md:items-center md:justify-end" : "flex-1"
        }`}
      >
        <BenefitVisual index={index} isWide={isWide} />
      </div>
    </motion.article>
  );
}

function BenefitVisual({ index, isWide }: { index: number; isWide: boolean }) {
  const panelClass = `${landingInnerPanelClass} h-full w-full p-4 sm:p-5`;

  switch (index) {
    case 0:
      return <TimeSavedVisual className={panelClass} />;
    case 1:
      return <ClarityVisual className={panelClass} />;
    case 2:
      return <CollaborationVisual className={panelClass} isWide={isWide} />;
    case 3:
      return <RemindersVisual className={panelClass} />;
    case 4:
      return <ModernizeVisual className={panelClass} />;
    case 5:
      return <ProgressiveVisual className={panelClass} isWide={isWide} />;
    default:
      return null;
  }
}

function TimeSavedVisual({ className }: { className: string }) {
  const sources = ["XL", "WA", "PDF"];

  return (
    <div className={className}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(96,165,250,0.9)_1px,transparent_1px),linear-gradient(to_bottom,rgba(96,165,250,0.9)_1px,transparent_1px)] [background-size:18px_18px]"
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          {sources.map((label) => (
            <span
              key={label}
              className="flex h-8 w-10 items-center justify-center rounded-lg border border-white/12 bg-white/[0.05] text-[9px] font-bold text-blue-200/55"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex flex-1 flex-col items-center gap-1 px-1">
          <div className="h-px w-full bg-gradient-to-r from-white/10 via-blue-400/40 to-[#1A23FF]/60" />
          <span className="text-[9px] font-semibold text-blue-300/60">→</span>
          <div className="h-px w-full bg-gradient-to-r from-[#1A23FF]/60 via-blue-400/40 to-white/10" />
        </div>

        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl border border-blue-400/35 bg-[#1A23FF]/25 shadow-[0_0_28px_rgba(26,35,255,0.4)]">
          <Clock className="h-4 w-4 text-blue-100" strokeWidth={2} aria-hidden />
          <span className="mt-1 text-[9px] font-bold text-emerald-200">−3 h</span>
        </div>
      </div>
    </div>
  );
}

function ClarityVisual({ className }: { className: string }) {
  const widgets = [
    { value: "100%", width: "100%" },
    { value: "12", width: "78%" },
    { value: "4", width: "52%" },
  ];

  return (
    <div className={className}>
      <div className="mt-1 space-y-2.5">
        {widgets.map((w, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2">
            <div className="flex items-center justify-end gap-2 text-[10px]">
              <span className="font-bold tabular-nums text-white">{w.value}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1A23FF] to-[#93c5fd]"
                style={{ width: w.width }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollaborationVisual({ className, isWide }: { className: string; isWide: boolean }) {
  const people = [
    { initials: "A", color: "from-[#1A23FF] to-indigo-500" },
    { initials: "B", color: "from-violet-500 to-purple-600" },
    { initials: "C", color: "from-sky-500 to-blue-600" },
    { initials: "D", color: "from-blue-500 to-cyan-500" },
  ];

  return (
    <div className={`${className} ${isWide ? "flex flex-col justify-center" : ""}`}>
      <div className={`flex items-center justify-center gap-3 ${isWide ? "sm:gap-5" : ""}`}>
        {people.map((person, i) => (
          <div key={person.initials} className="relative flex flex-col items-center">
            {i > 0 ? (
              <span
                className="absolute -left-3 top-1/2 hidden h-px w-3 -translate-y-1/2 bg-blue-400/35 sm:block"
                aria-hidden
              />
            ) : null}
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${person.color} text-xs font-bold text-white shadow-[0_0_18px_rgba(26,35,255,0.35)] sm:h-11 sm:w-11`}
            >
              {person.initials}
            </span>
          </div>
        ))}
      </div>

      {isWide ? (
        <div className="mt-4 flex justify-center sm:mt-5">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" aria-hidden />
        </div>
      ) : null}
    </div>
  );
}

function RemindersVisual({ className }: { className: string }) {
  const items = [
    { status: "5 j", tone: "amber" },
    { status: "1 j", tone: "blue" },
    { status: "OK", tone: "emerald" },
  ];

  const toneClass = {
    amber: "border-amber-400/30 bg-amber-500/15 text-amber-200",
    blue: "border-blue-400/30 bg-[#1A23FF]/20 text-blue-100",
    emerald: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  };

  return (
    <div className={className}>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1A23FF]/20 text-blue-200 ring-1 ring-blue-400/25">
              <BellRing className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="h-2 rounded-full bg-white/[0.1]" style={{ width: `${[72, 58, 85][i]}%` }} aria-hidden />
            </div>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold ${toneClass[item.tone as keyof typeof toneClass]}`}
            >
              {item.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ModernizeVisual({ className }: { className: string }) {
  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 opacity-70">
          <div className="space-y-1.5">
            {[0.9, 0.55, 0.7].map((w, i) => (
              <div
                key={i}
                className="h-2 rounded-full bg-white/[0.08]"
                style={{ width: `${w * 100}%` }}
                aria-hidden
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-blue-400/30 bg-gradient-to-br from-[#1A23FF]/20 to-white/[0.06] p-3 shadow-[0_0_24px_rgba(26,35,255,0.25)]">
          <div className="space-y-1.5">
            {[1, 0.88, 0.95].map((w, i) => (
              <div
                key={i}
                className="h-2 rounded-full bg-gradient-to-r from-[#1A23FF]/60 to-[#93c5fd]/50"
                style={{ width: `${w * 100}%` }}
                aria-hidden
              />
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <Sparkles className="h-3.5 w-3.5 text-blue-200/70" strokeWidth={2} aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressiveVisual({ className, isWide }: { className: string; isWide: boolean }) {
  const steps = [
    { active: true },
    { active: true },
    { active: false },
  ];

  return (
    <div className={`${className} ${isWide ? "flex flex-col justify-center" : ""}`}>
      <div className={`grid gap-2.5 ${isWide ? "sm:grid-cols-3" : "grid-cols-1"}`}>
        {steps.map((step, i) => (
          <div
            key={i}
            className={`relative rounded-xl border px-3 py-3 ${
              step.active
                ? "border-blue-400/35 bg-[#1A23FF]/15"
                : "border-white/10 bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                  step.active
                    ? "bg-gradient-to-br from-[#1A23FF] to-indigo-500 text-white"
                    : "bg-white/10 text-blue-200/40"
                }`}
              >
                {i + 1}
              </span>
              <div className="h-2 flex-1 rounded-full bg-white/[0.1]">
                <div
                  className={`h-full rounded-full ${step.active ? "bg-gradient-to-r from-[#1A23FF] to-[#93c5fd]" : ""}`}
                  style={{ width: step.active ? `${[100, 72, 0][i]}%` : "0%" }}
                  aria-hidden
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {isWide ? (
        <div className="mt-3 hidden h-1 overflow-hidden rounded-full bg-white/10 sm:block">
          <div className="h-full w-[66%] rounded-full bg-gradient-to-r from-[#1A23FF] to-[#93c5fd]" />
        </div>
      ) : null}
    </div>
  );
}
