"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import { useI18n } from "@/components/I18nProvider";
import { easePremium } from "@/components/landing/landing-motion";
import { getTranslationValue } from "@/lib/i18n";
import {
  openPracticeExample,
  practiceHashForFeature,
} from "@/lib/landing/practice-anchors";
import {
  getSportFeatureById,
  SPORT_SHOWCASE_FEATURE_IDS,
  sportFeatureIcons,
  type SportFeatureId,
} from "@/lib/sport-features";

export type OrbitFeatureId = SportFeatureId;

type OrbitFeatureContent = {
  id: OrbitFeatureId;
  label: string;
  focusTitle: string;
  focusDescription: string;
};

type ShowcaseSize = "sm" | "md" | "lg";

type ShowcaseNode = {
  id: OrbitFeatureId;
  x: number;
  y: number;
  size: ShowcaseSize;
  rot: number;
  tone: string;
};

/**
 * Placement à la main — constellation organique, pas un cercle mathématique.
 * Zone centrale (~28–72% × 28–68%) volontairement laissée libre pour le texte.
 * Rotations volontairement faibles.
 */
const SHOWCASE_NODES: ShowcaseNode[] = [
  { id: "membres", x: 11, y: 27, size: "lg", rot: -3.2, tone: "#3B6EFF" },
  { id: "cotisations", x: 32, y: 9, size: "md", rot: 2.4, tone: "#7B6CF0" },
  { id: "factures", x: 60, y: 8, size: "sm", rot: -1.6, tone: "#2563EB" },
  { id: "plannings", x: 86, y: 22, size: "md", rot: -2.6, tone: "#4F7CFF" },
  { id: "communication", x: 91, y: 54, size: "md", rot: 2.2, tone: "#E08A4A" },
  { id: "pagePublique", x: 86, y: 80, size: "sm", rot: 1.8, tone: "#0EA5E9" },
  { id: "evenements", x: 66, y: 91, size: "lg", rot: -3.0, tone: "#2BB38A" },
  { id: "sponsors", x: 42, y: 93, size: "sm", rot: 2.6, tone: "#6366F1" },
  { id: "revenus", x: 18, y: 86, size: "lg", rot: -3.4, tone: "#3BA971" },
  { id: "qrcodes", x: 7, y: 64, size: "sm", rot: 2.0, tone: "#5B8DEF" },
  { id: "buvette", x: 8, y: 42, size: "md", rot: -2.2, tone: "#E07A6A" },
];

const copyFade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.28, ease: easePremium },
} as const;

type FeatureCardProps = {
  feature: OrbitFeatureContent;
  Icon: LucideIcon;
  node: ShowcaseNode;
  index: number;
  inView: boolean;
  selected: boolean;
  reduceMotion: boolean | null;
  variant: "float" | "chip";
  onSelect: (id: OrbitFeatureId) => void;
};

function FeatureCard({
  feature,
  Icon,
  node,
  index,
  inView,
  selected,
  reduceMotion,
  variant,
  onSelect,
}: FeatureCardProps) {
  const isFloat = variant === "float";
  const isChip = variant === "chip";

  const card = (
    <motion.button
      type="button"
      className={[
        isChip ? "sport-constellation-chip" : `sport-constellation-card sport-constellation-card--${node.size}`,
        selected ? (isChip ? "sport-constellation-chip--active" : "sport-constellation-card--active") : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        isChip
          ? ({ "--card-accent": node.tone, "--card-soft": `${node.tone}22` } as CSSProperties)
          : ({
              "--card-accent": node.tone,
              "--card-soft": `${node.tone}22`,
              "--card-rot": `${node.rot}deg`,
            } as CSSProperties)
      }
      initial={reduceMotion ? false : { opacity: 0, y: isFloat ? 12 : 8 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: 0.45,
        delay: reduceMotion ? 0 : 0.08 + index * 0.035,
        ease: easePremium,
      }}
      whileHover={
        reduceMotion
          ? undefined
          : isFloat
            ? { y: -4, transition: { duration: 0.22, ease: easePremium } }
            : undefined
      }
      onClick={() => onSelect(feature.id)}
      aria-pressed={selected}
      aria-label={feature.label}
    >
      {isChip ? (
        <>
          <span className="sport-constellation-chip__icon" aria-hidden>
            <Icon strokeWidth={1.85} />
          </span>
          <span className="sport-constellation-chip__label">{feature.label}</span>
        </>
      ) : (
        <span className="sport-constellation-card__face">
          <span className="sport-constellation-card__icon" aria-hidden>
            <span className="sport-constellation-card__icon-inner">
              <Icon strokeWidth={1.85} />
            </span>
          </span>
          <span className="sport-constellation-card__label">{feature.label}</span>
        </span>
      )}
    </motion.button>
  );

  if (!isFloat) return card;

  return (
    <div
      className="sport-constellation-card__anchor"
      style={
        {
          "--card-x": `${node.x}%`,
          "--card-y": `${node.y}%`,
        } as CSSProperties
      }
    >
      {card}
    </div>
  );
}

function CenterCopy({
  feature,
  t,
}: {
  feature: OrbitFeatureContent | null;
  t: (key: string) => string;
}) {
  const eyebrow = feature ? feature.label : t("marketing.modules.label");
  const title = feature ? (
    feature.focusTitle
  ) : (
    <>
      <span className="block">{t("marketing.modules.titleLine1")}</span>
      <span className="block">{t("marketing.modules.titleLine2")}</span>
    </>
  );
  const description = feature
    ? feature.focusDescription
    : t("marketing.modules.orbitLead");
  const exampleHref = feature ? practiceHashForFeature(feature.id) : null;

  return (
    <div className="sport-constellation__copy">
      <p className="sport-constellation-eyebrow">{eyebrow}</p>
      <h2 className="features-orbit-center__title display-title">{title}</h2>
      <p className="features-orbit-center__desc">{description}</p>
      {feature && exampleHref ? (
        <a
          href={`#${exampleHref}`}
          className="features-orbit-center__link"
          onClick={(event) => {
            event.preventDefault();
            openPracticeExample(feature.id);
          }}
        >
          {t("marketing.modules.seeExample")}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

export default function FeaturesOrbitShowcase() {
  const { locale, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const stageInView = useInView(stageRef, { once: true, amount: 0.18 });
  const mobileInView = useInView(mobileRef, { once: true, amount: 0.12 });
  const [selectedId, setSelectedId] = useState<OrbitFeatureId | null>(null);

  const features = useMemo(() => {
    const raw = getTranslationValue(locale, "marketing.modules.orbitFeatures");
    const fromI18n = (Array.isArray(raw) ? raw : []) as Array<{ id: string; label?: string }>;

    return SPORT_SHOWCASE_FEATURE_IDS.map((id) => {
      const found = fromI18n.find((f) => f.id === id);
      const catalog = getSportFeatureById(id);
      const focusTitle = t(`marketing.modules.orbitFocus.${id}.title`);
      const focusDescription = t(`marketing.modules.orbitFocus.${id}.description`);
      return {
        id,
        label: found?.label ?? catalog?.title ?? id,
        focusTitle:
          focusTitle === `marketing.modules.orbitFocus.${id}.title`
            ? catalog?.title ?? id
            : focusTitle,
        focusDescription:
          focusDescription === `marketing.modules.orbitFocus.${id}.description`
            ? catalog?.description ?? ""
            : focusDescription,
      } satisfies OrbitFeatureContent;
    });
  }, [locale, t]);

  const featureById = useMemo(() => {
    const map = new Map<OrbitFeatureId, OrbitFeatureContent>();
    for (const feature of features) map.set(feature.id, feature);
    return map;
  }, [features]);

  const selected = selectedId ? featureById.get(selectedId) ?? null : null;

  const onSelect = useCallback((id: OrbitFeatureId) => {
    setSelectedId((current) => (current === id ? null : id));
  }, []);

  return (
    <div className="features-orbit">
      <div ref={stageRef} className="sport-constellation sport-constellation--desktop">
        <div className="sport-constellation__glow" aria-hidden />

        <div className="sport-constellation__stage">
          <div className="sport-constellation__core">
            <div className="sport-constellation__core-inner">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={selected?.id ?? "default"}
                  initial={reduceMotion ? false : copyFade.initial}
                  animate={copyFade.animate}
                  exit={reduceMotion ? { opacity: 1 } : copyFade.exit}
                  transition={copyFade.transition}
                >
                  <CenterCopy feature={selected} t={t} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="sport-constellation__nodes" role="list">
            {SHOWCASE_NODES.map((node, index) => {
              const feature = featureById.get(node.id);
              if (!feature) return null;
              const Icon = sportFeatureIcons[feature.id];

              return (
                <div key={feature.id} role="listitem" className="sport-constellation__node">
                  <FeatureCard
                    feature={feature}
                    Icon={Icon}
                    node={node}
                    index={index}
                    inView={stageInView}
                    selected={selectedId === feature.id}
                    reduceMotion={reduceMotion}
                    variant="float"
                    onSelect={onSelect}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div ref={mobileRef} className="sport-constellation-mobile">
        <div className="sport-constellation-mobile__glow" aria-hidden />
        <div className="sport-constellation-mobile__intro">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selected?.id ?? "default"}
              initial={reduceMotion ? false : copyFade.initial}
              animate={mobileInView ? copyFade.animate : undefined}
              exit={reduceMotion ? { opacity: 1 } : copyFade.exit}
              transition={copyFade.transition}
            >
              <CenterCopy feature={selected} t={t} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="sport-constellation-mobile__rail" role="list">
          {SHOWCASE_NODES.map((node, index) => {
            const feature = featureById.get(node.id);
            if (!feature) return null;
            const Icon = sportFeatureIcons[feature.id];

            return (
              <div key={feature.id} role="listitem" className="sport-constellation-mobile__item">
                <FeatureCard
                  feature={feature}
                  Icon={Icon}
                  node={node}
                  index={index}
                  inView={mobileInView}
                  selected={selectedId === feature.id}
                  reduceMotion={reduceMotion}
                  variant="chip"
                  onSelect={onSelect}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
