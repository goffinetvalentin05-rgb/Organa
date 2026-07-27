"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CalendarRange,
  FileText,
  Handshake,
  Megaphone,
  Receipt,
  Search,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";
import { easePremium } from "@/components/landing/landing-motion";

type ArcFeature = {
  id: string;
  label: string;
  searchTerms: string[];
  description: string;
};

const featureIcons: Record<string, LucideIcon> = {
  membres: Users,
  cotisations: Wallet,
  evenements: CalendarDays,
  sponsors: Handshake,
  factures: Receipt,
  procesVerbaux: FileText,
  planning: CalendarRange,
  manifestations: Megaphone,
  comite: UsersRound,
};

const featureOrder = [
  "membres",
  "cotisations",
  "evenements",
  "sponsors",
  "factures",
  "procesVerbaux",
  "planning",
  "manifestations",
  "comite",
] as const;

const DEMO_SEQUENCE = ["cotisations", "planning", "procesVerbaux", "sponsors"] as const;

const TYPING_MS = 70;
const HOLD_MS = 3200;
const PAUSE_MS = 900;

function getArcLayout(index: number, total: number, activeIndex: number | null) {
  const center = (total - 1) / 2;
  const offset = index - center;
  const isActive = activeIndex === index;
  const activeOffset = activeIndex !== null ? index - activeIndex : offset;

  if (isActive) {
    return {
      x: 0,
      y: -18,
      rotateY: 0,
      rotateZ: 0,
      scale: 1.14,
      zIndex: 30,
      opacity: 1,
    };
  }

  const spread = activeIndex !== null ? activeOffset : offset;

  return {
    x: spread * (total > 7 ? 58 : 64),
    y: Math.abs(spread) * 14 + (activeIndex !== null ? 10 : 0),
    rotateY: spread * -11,
    rotateZ: spread * 2.5,
    scale: Math.max(0.72, 1 - Math.abs(spread) * 0.085),
    zIndex: 20 - Math.abs(spread),
    opacity: Math.max(0.38, 1 - Math.abs(spread) * 0.14),
  };
}

export default function FeaturesArcShowcase() {
  const { locale, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [demoIndex, setDemoIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "typing" | "hold" | "clear">("idle");

  const raw = getTranslationValue(locale, "marketing.modules.arcFeatures");
  const featuresFromI18n = (Array.isArray(raw) ? raw : []) as ArcFeature[];

  const features = useMemo(
    () =>
      featureOrder.map((id) => {
        const found = featuresFromI18n.find((feature) => feature.id === id);
        return {
          id,
          label: found?.label ?? id,
          searchTerms: found?.searchTerms ?? [id],
          description: found?.description ?? "",
        };
      }),
    [featuresFromI18n]
  );

  const demoFeatureIds = useMemo(() => [...DEMO_SEQUENCE], []);

  const activeFeature = features.find((feature) => feature.id === activeId) ?? null;
  const activeIndex = activeFeature ? features.indexOf(activeFeature) : null;

  const resolveFeature = useCallback(
    (text: string) => {
      const normalized = text.trim().toLowerCase();
      if (!normalized) return null;
      return (
        features.find((feature) =>
          feature.searchTerms.some((term) => term.toLowerCase().startsWith(normalized))
        ) ?? null
      );
    },
    [features]
  );

  useEffect(() => {
    if (reduceMotion) {
      const first = features.find((feature) => feature.id === DEMO_SEQUENCE[0]);
      if (first) {
        setActiveId(first.id);
        setQuery(first.searchTerms[0] ?? "");
      }
      return;
    }

    let cancelled = false;
    let typingTimer: ReturnType<typeof setTimeout> | undefined;
    let phaseTimer: ReturnType<typeof setTimeout> | undefined;

    const runDemo = () => {
      if (cancelled) return;

      const demoId = demoFeatureIds[demoIndex % demoFeatureIds.length];
      const feature = features.find((item) => item.id === demoId);
      if (!feature) return;

      const targetText = feature.searchTerms[0] ?? feature.label.toLowerCase();
      setPhase("typing");
      setActiveId(null);
      setQuery("");

      let charIndex = 0;

      const typeNext = () => {
        if (cancelled) return;
        charIndex += 1;
        const partial = targetText.slice(0, charIndex);
        setQuery(partial);

        const match = resolveFeature(partial);
        if (match && partial.length >= 3) {
          setActiveId(match.id);
        }

        if (charIndex < targetText.length) {
          typingTimer = setTimeout(typeNext, TYPING_MS);
          return;
        }

        setActiveId(feature.id);
        setPhase("hold");
        phaseTimer = setTimeout(() => {
          if (cancelled) return;
          setPhase("clear");
          setActiveId(null);
          setQuery("");
          phaseTimer = setTimeout(() => {
            if (cancelled) return;
            setDemoIndex((current) => current + 1);
            runDemo();
          }, PAUSE_MS);
        }, HOLD_MS);
      };

      typingTimer = setTimeout(typeNext, 1200);
    };

    runDemo();

    return () => {
      cancelled = true;
      if (typingTimer) clearTimeout(typingTimer);
      if (phaseTimer) clearTimeout(phaseTimer);
    };
  }, [demoFeatureIds, demoIndex, features, reduceMotion, resolveFeature]);

  return (
    <div className="features-arc-showcase relative mx-auto w-full max-w-[1100px]">
      <div
        className="pointer-events-none absolute inset-x-[5%] top-[8%] h-[min(420px,55vw)] rounded-full bg-[radial-gradient(ellipse,rgba(37,99,235,0.14),rgba(56,189,248,0.06)_48%,transparent_72%)] blur-3xl"
        aria-hidden
      />

      <div
        className="features-arc-stage relative mx-auto h-[280px] max-w-[980px] sm:h-[340px] md:h-[390px]"
        style={{ perspective: "1200px" }}
      >
        {features.map((feature, index) => {
          const Icon = featureIcons[feature.id] ?? FileText;
          const layout = getArcLayout(index, features.length, activeIndex);
          const isActive = activeId === feature.id;

          return (
            <motion.div
              key={feature.id}
              className="features-arc-card absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{
                x: layout.x,
                y: layout.y,
                rotateY: layout.rotateY,
                rotateZ: layout.rotateZ,
                scale: layout.scale,
                opacity: layout.opacity,
                zIndex: layout.zIndex,
              }}
              transition={{ duration: 0.65, ease: easePremium }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className={`features-arc-card__inner ${isActive ? "features-arc-card__inner--active" : ""}`}
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-[1.15rem] bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.22),transparent_62%)]"
                  aria-hidden
                />
                <span className="features-arc-card__icon-wrap">
                  <Icon className="features-arc-card__icon" strokeWidth={1.65} aria-hidden />
                </span>
                <span className="features-arc-card__label">{feature.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="relative mx-auto mt-2 max-w-[640px] text-center sm:mt-4">
        <p className="text-sm font-medium text-slate-600 sm:text-[0.9375rem]">
          {t("marketing.modules.searchHint")}
        </p>

        <div className="features-arc-search relative mx-auto mt-4 flex items-center gap-3 rounded-full border border-slate-200/90 bg-white px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.95)] sm:mt-5 sm:px-5 sm:py-3.5">
          <Search className="h-4 w-4 shrink-0 text-[#2563EB]" strokeWidth={2} aria-hidden />
          <div className="min-h-[1.25rem] flex-1 text-left text-sm text-slate-800 sm:text-[0.9375rem]">
            {query ? (
              <span>{query}</span>
            ) : (
              <span className="text-slate-400">{t("marketing.modules.searchPlaceholder")}</span>
            )}
            {phase === "typing" && !reduceMotion ? (
              <motion.span
                className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] bg-[#2563EB]"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
                aria-hidden
              />
            ) : null}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeFeature ? (
            <motion.div
              key={activeFeature.id}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.45, ease: easePremium }}
              className="features-arc-detail mx-auto mt-5 max-w-[560px] rounded-[1.25rem] border border-blue-100/80 bg-gradient-to-b from-white to-blue-50/40 px-5 py-4 text-left shadow-[0_16px_48px_rgba(37,99,235,0.08)] sm:mt-6 sm:px-6 sm:py-5"
            >
              <h3 className="text-base font-bold tracking-tight text-[#0f172a] sm:text-lg">
                {activeFeature.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-[0.9375rem]">
                {activeFeature.description}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={false}
              animate={{ opacity: 1 }}
              className="mt-5 h-[92px] sm:mt-6 sm:h-[96px]"
              aria-hidden
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
