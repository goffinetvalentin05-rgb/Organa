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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const TYPING_MS = 68;
const HOLD_MS = 3400;
const PAUSE_MS = 1000;

function useViewportWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return width;
}

function getArcLayout(
  index: number,
  total: number,
  activeIndex: number | null,
  viewportWidth: number
) {
  const isCompact = viewportWidth < 768;
  const isNarrow = viewportWidth < 430;
  const isTiny = viewportWidth < 360;

  const defaultCenter = (total - 1) / 2;
  const focusIndex = activeIndex ?? defaultCenter;
  const offset = index - focusIndex;
  const isActive = activeIndex === index;

  if (isActive) {
    return {
      x: 0,
      y: isCompact ? -6 : -10,
      rotateY: 0,
      rotateZ: 0,
      scale: isTiny ? 1.04 : isCompact ? 1.08 : 1.16,
      zIndex: 40,
      opacity: 1,
    };
  }

  const angleStep = isTiny ? 17 : isNarrow ? 14.5 : isCompact ? 13.5 : 12.5;
  const angleDeg = offset * angleStep;
  const angleRad = (angleDeg * Math.PI) / 180;
  const radius =
    activeIndex !== null
      ? 0
      : isTiny
        ? 120
        : isNarrow
          ? 152
          : isCompact
            ? 210
            : 420;
  const focusSpacing = isTiny ? 52 : isNarrow ? 64 : isCompact ? 78 : 92;

  if (activeIndex !== null) {
    return {
      x: offset * focusSpacing,
      y: Math.abs(offset) * (isCompact ? 9 : 14) + (isCompact ? 2 : 4),
      rotateY: offset * (isCompact ? -10 : -18),
      rotateZ: offset * (isCompact ? 2 : 3.5),
      scale: Math.max(isCompact ? 0.58 : 0.62, 1 - Math.abs(offset) * (isCompact ? 0.11 : 0.1)),
      zIndex: 24 - Math.abs(offset),
      opacity: Math.max(isCompact ? 0.18 : 0.28, 1 - Math.abs(offset) * (isCompact ? 0.22 : 0.18)),
    };
  }

  const arcDepth = isCompact ? 36 : 52;
  const x = Math.sin(angleRad) * radius;
  const y = (1 - Math.cos(angleRad)) * arcDepth + Math.abs(offset) * (isCompact ? 2 : 4);

  return {
    x,
    y,
    rotateY: offset * (isCompact ? -9 : -16),
    rotateZ: offset * (isCompact ? 1.8 : 3),
    scale: Math.max(isCompact ? 0.62 : 0.68, 1 - Math.abs(offset) * (isCompact ? 0.09 : 0.088)),
    zIndex: 22 - Math.abs(offset),
    opacity: Math.max(isCompact ? 0.42 : 0.5, 1 - Math.abs(offset) * 0.11),
  };
}

export default function FeaturesArcShowcase() {
  const { locale, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const viewportWidth = useViewportWidth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [demoIndex, setDemoIndex] = useState(0);
  const [userInteracting, setUserInteracting] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
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

  const activeFeature = features.find((feature) => feature.id === activeId) ?? null;
  const activeIndex = activeFeature ? features.indexOf(activeFeature) : null;
  const ActiveIcon = activeFeature
    ? (featureIcons[activeFeature.id] ?? FileText)
    : FileText;

  const resolveFeature = useCallback(
    (text: string) => {
      const normalized = text.trim().toLowerCase();
      if (!normalized) return null;

      return (
        features.find((feature) => {
          const label = feature.label.toLowerCase();
          if (label.startsWith(normalized) || label.includes(normalized)) return true;
          return feature.searchTerms.some((term) => {
            const value = term.toLowerCase();
            return value.startsWith(normalized) || value.includes(normalized);
          });
        }) ?? null
      );
    },
    [features]
  );

  const applyQuery = useCallback(
    (value: string) => {
      setQuery(value);
      const match = resolveFeature(value);
      setActiveId(match?.id ?? null);
    },
    [resolveFeature]
  );

  const selectFeature = useCallback(
    (feature: (typeof features)[number]) => {
      setUserInteracting(true);
      setPhase("idle");
      setActiveId(feature.id);
      setQuery(feature.searchTerms[0] ?? feature.label.toLowerCase());
      inputRef.current?.focus();
    },
    []
  );

  useEffect(() => {
    if (reduceMotion || userInteracting) return;

    let cancelled = false;
    let typingTimer: ReturnType<typeof setTimeout> | undefined;
    let phaseTimer: ReturnType<typeof setTimeout> | undefined;

    const runDemo = () => {
      if (cancelled || userInteracting) return;

      const demoId = DEMO_SEQUENCE[demoIndex % DEMO_SEQUENCE.length];
      const feature = features.find((item) => item.id === demoId);
      if (!feature) return;

      const targetText = feature.searchTerms[0] ?? feature.label.toLowerCase();
      setPhase("typing");
      setActiveId(null);
      setQuery("");

      let charIndex = 0;

      const typeNext = () => {
        if (cancelled || userInteracting) return;
        charIndex += 1;
        const partial = targetText.slice(0, charIndex);
        applyQuery(partial);

        if (charIndex < targetText.length) {
          typingTimer = setTimeout(typeNext, TYPING_MS);
          return;
        }

        setActiveId(feature.id);
        setPhase("hold");
        phaseTimer = setTimeout(() => {
          if (cancelled || userInteracting) return;
          setPhase("clear");
          setActiveId(null);
          setQuery("");
          phaseTimer = setTimeout(() => {
            if (cancelled || userInteracting) return;
            setDemoIndex((current) => current + 1);
            runDemo();
          }, PAUSE_MS);
        }, HOLD_MS);
      };

      typingTimer = setTimeout(typeNext, 1600);
    };

    runDemo();

    return () => {
      cancelled = true;
      if (typingTimer) clearTimeout(typingTimer);
      if (phaseTimer) clearTimeout(phaseTimer);
    };
  }, [applyQuery, demoIndex, features, reduceMotion, userInteracting]);

  return (
    <div className="features-arc-showcase relative mx-auto w-full">
      <div className="features-arc-panel">
        <div className="features-arc-showcase__backdrop" aria-hidden />
        <div className="features-arc-panel__bridge" aria-hidden />

        <div
          className={`features-arc-stage ${activeIndex !== null ? "features-arc-stage--focused" : ""}`}
          style={{ perspective: "1400px" }}
        >
          <div className="features-arc-stage__floor" aria-hidden />

          {features.map((feature, index) => {
            const Icon = featureIcons[feature.id] ?? FileText;
            const layout = getArcLayout(index, features.length, activeIndex, viewportWidth);
            const isActive = activeId === feature.id;

            return (
              <motion.button
                key={feature.id}
                type="button"
                onClick={() => selectFeature(feature)}
                className="features-arc-card absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2"
                animate={{
                  x: layout.x,
                  y: layout.y,
                  rotateY: layout.rotateY,
                  rotateZ: layout.rotateZ,
                  scale: layout.scale,
                  opacity: layout.opacity,
                  zIndex: layout.zIndex,
                }}
                transition={{ duration: 0.72, ease: easePremium }}
                style={{ transformStyle: "preserve-3d" }}
                aria-label={feature.label}
                aria-pressed={isActive}
              >
                <div
                  className={`features-arc-card__inner ${isActive ? "features-arc-card__inner--active" : ""}`}
                >
                  <div className="features-arc-card__shine" aria-hidden />
                  <div className="features-arc-card__ambient" aria-hidden />
                  <div className="features-arc-card__content">
                    <span className="features-arc-card__icon-badge">
                      <span className="features-arc-card__icon-ring" aria-hidden />
                      <Icon className="features-arc-card__icon" strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="features-arc-card__label">{feature.label}</span>
                  </div>
                  <div className="features-arc-card__footer-glow" aria-hidden />
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="features-arc-search-block">
          <p className="features-arc-search-block__hint">{t("marketing.modules.searchHint")}</p>

          <div
            className={`features-arc-search-wrap ${searchFocused ? "features-arc-search-wrap--focused" : ""} ${activeFeature ? "features-arc-search-wrap--matched" : ""}`}
          >
            <div className="features-arc-search-wrap__ring" aria-hidden />
            <div className="features-arc-search-wrap__glow" aria-hidden />
            <label className="features-arc-search" htmlFor="features-arc-search-input">
              <span className="features-arc-search__icon-badge">
                <Search className="features-arc-search__icon" strokeWidth={2.2} aria-hidden />
              </span>
              <input
                ref={inputRef}
                id="features-arc-search-input"
                type="search"
                value={query}
                onChange={(event) => {
                  setUserInteracting(true);
                  setPhase("idle");
                  applyQuery(event.target.value);
                }}
                onFocus={() => {
                  setUserInteracting(true);
                  setSearchFocused(true);
                }}
                onBlur={() => setSearchFocused(false)}
                placeholder={t("marketing.modules.searchPlaceholder")}
                className="features-arc-search__input"
                autoComplete="off"
                spellCheck={false}
              />
              {phase === "typing" && !userInteracting && !reduceMotion ? (
                <motion.span
                  className="features-arc-search__cursor"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
                  aria-hidden
                />
              ) : null}
            </label>
          </div>

          <AnimatePresence mode="wait">
            {activeFeature ? (
              <motion.div
                key={activeFeature.id}
                initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.99 }}
                transition={{ duration: 0.48, ease: easePremium }}
                className="features-arc-detail"
              >
                <div className="features-arc-detail__glow" aria-hidden />
                <div className="features-arc-detail__shine" aria-hidden />
                <div className="features-arc-detail__grid" aria-hidden />
                <div className="features-arc-detail__body">
                  <span className="features-arc-detail__badge" aria-hidden>
                    <ActiveIcon className="features-arc-detail__badge-icon" strokeWidth={1.85} />
                  </span>
                  <div className="features-arc-detail__copy">
                    <h3 className="features-arc-detail__title">{activeFeature.label}</h3>
                    <p className="features-arc-detail__text">{activeFeature.description}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={false}
                animate={{ opacity: 1 }}
                className="features-arc-detail features-arc-detail--placeholder"
                aria-hidden
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
