"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useI18n } from "@/components/I18nProvider";
import { easePremium } from "@/components/landing/landing-motion";
import { getTranslationValue } from "@/lib/i18n";
import {
  getSportFeatureById,
  SPORT_FEATURE_ORDER,
  sportFeatureIcons,
  type SportFeatureId,
} from "@/lib/sport-features";

export type OrbitFeatureId = SportFeatureId;

type OrbitFeatureContent = {
  id: OrbitFeatureId;
  label: string;
  description: string;
};

type FloatLayout = {
  x: number;
  y: number;
  rot: number;
  duration: number;
  delay: number;
};

/** Même rayon, même pas angulaire — répartition parfaitement homogène. */
function buildUniformFloatLayout(count: number): FloatLayout[] {
  const rx = 42;
  const ry = 38.5;
  return Array.from({ length: count }, (_, i) => {
    const angleDeg = -90 + (i * 360) / count;
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: 50 + rx * Math.cos(rad),
      y: 50 + ry * Math.sin(rad),
      rot: ((i % 5) - 2) * 1.4,
      duration: 5.8 + (i % 5) * 0.32,
      delay: -((i * 0.27) % 4.2),
    };
  });
}

const FEATURE_FLOAT_LAYOUT = buildUniformFloatLayout(SPORT_FEATURE_ORDER.length);

function highlightPhrase(full: string, hours: string, minutes: string): ReactNode {
  const hIdx = full.indexOf(hours);
  const mIdx = full.indexOf(minutes);

  if (hIdx === -1 || mIdx === -1 || mIdx < hIdx) {
    return full;
  }

  return (
    <>
      {full.slice(0, hIdx)}
      <span className="features-orbit-em">{hours}</span>
      {full.slice(hIdx + hours.length, mIdx)}
      <span className="features-orbit-em">{minutes}</span>
      {full.slice(mIdx + minutes.length)}
    </>
  );
}

function highlightTemplate(
  template: string,
  hours: string,
  minutes: string
): ReactNode {
  const parts = template.split(/\{hours\}|\{minutes\}/);
  if (parts.length < 3) {
    return highlightPhrase(template, hours, minutes);
  }
  return (
    <>
      {parts[0]}
      <span className="features-orbit-em">{hours}</span>
      {parts[1]}
      <span className="features-orbit-em">{minutes}</span>
      {parts[2]}
    </>
  );
}

type FeatureCardProps = {
  feature: OrbitFeatureContent;
  Icon: LucideIcon;
  isActive: boolean;
  dimmed: boolean;
  index: number;
  inView: boolean;
  reduceMotion: boolean | null;
  onSelect: () => void;
  layout?: FloatLayout;
  variant: "float" | "grid";
};

function FeatureCard({
  feature,
  Icon,
  isActive,
  dimmed,
  index,
  inView,
  reduceMotion,
  onSelect,
  layout,
  variant,
}: FeatureCardProps) {
  const isFloat = variant === "float";

  const card = (
    <motion.button
      type="button"
      className={`features-constellation-card ${
        isFloat ? "" : "features-constellation-card--grid"
      } ${isActive ? "features-constellation-card--active" : ""} ${
        dimmed ? "features-constellation-card--dimmed" : ""
      }`}
      initial={reduceMotion ? false : { opacity: 0, y: isFloat ? 22 : 14, scale: 0.92 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{
        duration: 0.55,
        delay: reduceMotion ? 0 : 0.12 + index * 0.03,
        ease: easePremium,
      }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: isFloat ? -9 : -4,
              scale: isFloat ? 1.06 : 1.03,
              transition: { duration: 0.32, ease: easePremium },
            }
      }
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      aria-pressed={isActive}
      aria-label={feature.label}
    >
      <motion.span
        className="features-constellation-card__float"
        animate={
          reduceMotion || !inView || !isFloat
            ? undefined
            : {
                y: [0, -7 - (index % 4) * 1.5, 0],
                x: [0, index % 2 === 0 ? 3 : -2.5, 0],
                rotate: [0, index % 2 === 0 ? 0.6 : -0.6, 0],
              }
        }
        transition={{
          duration: (layout?.duration ?? 6) + (index % 4) * 0.25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: Math.abs(layout?.delay ?? 0),
        }}
      >
        <span className="features-constellation-card__glass">
          <span className="features-constellation-card__halo" aria-hidden />
          <span className="features-constellation-card__icon">
            <Icon strokeWidth={1.85} aria-hidden />
          </span>
          <span className="features-constellation-card__label">{feature.label}</span>
          {isFloat ? (
            <span className="features-constellation-card__indicator" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          ) : null}
        </span>
      </motion.span>
    </motion.button>
  );

  if (!isFloat || !layout) return card;

  return (
    <div
      className="features-constellation-card--float"
      style={
        {
          "--card-x": `${layout.x}%`,
          "--card-y": `${layout.y}%`,
          "--card-rot": `${layout.rot}deg`,
          "--float-duration": `${layout.duration}s`,
          "--float-delay": `${layout.delay}s`,
        } as CSSProperties
      }
    >
      {card}
    </div>
  );
}

function SelectedFeatureBubble({
  feature,
  Icon,
  accent,
  href,
  learnMoreLabel,
  closeLabel,
  reduceMotion,
  onClose,
}: {
  feature: OrbitFeatureContent;
  Icon: LucideIcon;
  accent: string;
  href: string;
  learnMoreLabel: string;
  closeLabel: string;
  reduceMotion: boolean | null;
  onClose: () => void;
}) {
  return (
    <motion.div
      role="dialog"
      aria-label={feature.label}
      className="features-orbit-selected-card"
      style={{ "--selected-accent": accent } as CSSProperties}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
      transition={{
        duration: reduceMotion ? 0 : 0.32,
        ease: easePremium,
      }}
    >
      <div className="features-orbit-selected-card__top">
        <span
          className="features-orbit-selected-card__icon"
          style={{ color: accent, backgroundColor: `${accent}18` }}
        >
          <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden />
        </span>
        <div className="features-orbit-selected-card__copy">
          <h3 className="features-orbit-selected-card__title">{feature.label}</h3>
          <p className="features-orbit-selected-card__text">{feature.description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="features-orbit-selected-card__close"
          aria-label={closeLabel}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <Link href={href} className="features-orbit-selected-card__link">
        {learnMoreLabel}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </motion.div>
  );
}

export default function FeaturesOrbitShowcase() {
  const { locale, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const stageInView = useInView(stageRef, { once: true, amount: 0.18 });
  const mobileInView = useInView(mobileRef, { once: true, amount: 0.12 });
  const [activeId, setActiveId] = useState<OrbitFeatureId | null>(null);
  const [hoveredId, setHoveredId] = useState<OrbitFeatureId | null>(null);

  const features = useMemo(() => {
    const raw = getTranslationValue(locale, "marketing.modules.orbitFeatures");
    const fromI18n = (Array.isArray(raw) ? raw : []) as OrbitFeatureContent[];

    return SPORT_FEATURE_ORDER.map((id) => {
      const found = fromI18n.find((f) => f.id === id);
      const catalog = getSportFeatureById(id);
      return {
        id,
        label: found?.label ?? catalog?.title ?? id,
        description: found?.description ?? catalog?.description ?? "",
      } satisfies OrbitFeatureContent;
    });
  }, [locale]);

  const active = features.find((f) => f.id === activeId) ?? null;
  const activeCatalog = activeId ? getSportFeatureById(activeId) : null;
  const ActiveIcon = active ? sportFeatureIcons[active.id] : null;
  const focusId = hoveredId ?? activeId;

  const titleAccent = t("marketing.modules.titleAccent");
  const accentHours = t("marketing.modules.titleAccentHours");
  const accentMinutes = t("marketing.modules.titleAccentMinutes");
  const subtitleTemplate = t("marketing.modules.subtitle");
  const hoursWord = t("marketing.modules.subtitleHours");
  const minutesWord = t("marketing.modules.subtitleMinutes");
  const learnMoreLabel = t("marketing.modules.learnMore");
  const closeLabel = t("marketing.modules.closeFeature");
  const clickHint = t("marketing.modules.orbitHint");

  const handleSelect = (id: OrbitFeatureId) => {
    setActiveId((current) => (current === id ? null : id));
  };

  const renderSelectedBubble = (keyPrefix: string) =>
    active && ActiveIcon && activeCatalog ? (
      <SelectedFeatureBubble
        key={`${keyPrefix}-${active.id}`}
        feature={active}
        Icon={ActiveIcon}
        accent={activeCatalog.accent}
        href={`/fonctionnalites/${activeCatalog.slug}`}
        learnMoreLabel={learnMoreLabel}
        closeLabel={closeLabel}
        reduceMotion={reduceMotion}
        onClose={() => setActiveId(null)}
      />
    ) : null;

  const centerCopy = (
    <>
      <p className="landing-section-label">{t("marketing.modules.label")}</p>
      <h2 className="features-orbit-center__title display-title">
        <span className="features-orbit-center__title-block">
          <span className="block">{t("marketing.modules.titleLine1")}</span>
          <span className="block">{t("marketing.modules.titleLine2")}</span>
        </span>
        <span className="features-orbit-center__title-accent block">
          {highlightPhrase(titleAccent, accentHours, accentMinutes)}
        </span>
      </h2>
      <p className="features-orbit-center__desc">
        {highlightTemplate(subtitleTemplate, hoursWord, minutesWord)}
      </p>
    </>
  );

  return (
    <div className="features-orbit">
      {/* Desktop — constellation flottante */}
      <div ref={stageRef} className="features-constellation features-constellation--desktop">
        <div className="features-constellation__stage">
          <div className="features-constellation__core">
            <motion.div
              className="features-constellation__core-inner"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={stageInView ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.75, ease: easePremium }}
            >
              {centerCopy}
              <div className="features-orbit-card-slot" aria-live="polite">
                <AnimatePresence mode="wait">
                  {renderSelectedBubble("desktop") ?? (
                    <motion.p
                      key="hint"
                      className="features-orbit-hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {clickHint}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          <div
            className="features-constellation__nodes"
            role="list"
            onMouseLeave={() => setHoveredId(null)}
          >
            {features.map((feature, index) => {
              const layout = FEATURE_FLOAT_LAYOUT[index]!;
              const Icon = sportFeatureIcons[feature.id];
              const isActive = activeId === feature.id;
              const dimmed = focusId !== null && focusId !== feature.id;

              return (
                <div
                  key={feature.id}
                  role="listitem"
                  className="features-constellation__node"
                  onMouseEnter={() => setHoveredId(feature.id)}
                >
                  <FeatureCard
                    feature={feature}
                    Icon={Icon}
                    isActive={isActive}
                    dimmed={dimmed}
                    index={index}
                    inView={stageInView}
                    reduceMotion={reduceMotion}
                    onSelect={() => handleSelect(feature.id)}
                    layout={layout}
                    variant="float"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile — grille + carte compacte */}
      <div ref={mobileRef} className="features-constellation-mobile">
        <div className="features-constellation-mobile__glow" aria-hidden />
        <motion.div
          className="features-constellation-mobile__intro"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={mobileInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.65, ease: easePremium }}
        >
          {centerCopy}
          <div className="features-orbit-card-slot features-orbit-card-slot--mobile" aria-live="polite">
            <AnimatePresence mode="wait">
              {renderSelectedBubble("mobile") ?? (
                <motion.p
                  key="hint-mobile"
                  className="features-orbit-hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {clickHint}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="features-constellation-mobile__grid" role="list">
          {features.map((feature, index) => {
            const Icon = sportFeatureIcons[feature.id];
            const isActive = activeId === feature.id;
            const dimmed = focusId !== null && focusId !== feature.id;
            return (
              <div key={feature.id} className="features-constellation-mobile__item" role="listitem">
                <FeatureCard
                  feature={feature}
                  Icon={Icon}
                  isActive={isActive}
                  dimmed={dimmed}
                  index={index}
                  inView={mobileInView}
                  reduceMotion={reduceMotion}
                  onSelect={() => handleSelect(feature.id)}
                  variant="grid"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
