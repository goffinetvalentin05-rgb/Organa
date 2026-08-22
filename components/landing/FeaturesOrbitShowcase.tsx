"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useMemo, useRef, type CSSProperties } from "react";
import { useI18n } from "@/components/I18nProvider";
import { easePremium } from "@/components/landing/landing-motion";
import { getTranslationValue } from "@/lib/i18n";
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
};

type ShowcaseSize = "sm" | "md" | "lg";

type ShowcaseNode = {
  id: OrbitFeatureId;
  x: number;
  y: number;
  size: ShowcaseSize;
  rot: number;
  duration: number;
  delay: number;
  tone: string;
};

/**
 * Placement à la main — constellation organique, pas un cercle mathématique.
 * Zone centrale (~28–72% × 28–68%) volontairement laissée libre pour le texte.
 */
const SHOWCASE_NODES: ShowcaseNode[] = [
  { id: "membres", x: 11, y: 27, size: "lg", rot: -6.5, duration: 6.2, delay: -1.1, tone: "#3B6EFF" },
  { id: "cotisations", x: 32, y: 9, size: "md", rot: 5.2, duration: 6.8, delay: -3.2, tone: "#7B6CF0" },
  { id: "factures", x: 54, y: 5.5, size: "sm", rot: -3.4, duration: 5.9, delay: -1.6, tone: "#2563EB" },
  { id: "encaissements", x: 76, y: 12, size: "lg", rot: 6.1, duration: 7.1, delay: -4.0, tone: "#14B8A6" },
  { id: "plannings", x: 92, y: 34, size: "md", rot: -5.5, duration: 6.4, delay: -2.4, tone: "#4F7CFF" },
  { id: "communication", x: 90, y: 61, size: "md", rot: 4.8, duration: 7.0, delay: -0.9, tone: "#E08A4A" },
  { id: "evenements", x: 76, y: 87, size: "lg", rot: -6.2, duration: 6.6, delay: -3.6, tone: "#2BB38A" },
  { id: "sponsors", x: 50, y: 93, size: "sm", rot: 5.6, duration: 7.3, delay: -2.1, tone: "#6366F1" },
  { id: "revenus", x: 25, y: 89, size: "lg", rot: -7.4, duration: 6.1, delay: -4.4, tone: "#3BA971" },
  { id: "qrcodes", x: 8, y: 69, size: "sm", rot: 4.2, duration: 6.9, delay: -1.8, tone: "#5B8DEF" },
  { id: "buvette", x: 7, y: 47, size: "md", rot: -4.6, duration: 5.8, delay: -3.0, tone: "#E07A6A" },
  { id: "pagePublique", x: 93, y: 80, size: "sm", rot: 3.8, duration: 6.5, delay: -2.7, tone: "#0EA5E9" },
];

type FeatureCardProps = {
  feature: OrbitFeatureContent;
  Icon: LucideIcon;
  node: ShowcaseNode;
  index: number;
  inView: boolean;
  reduceMotion: boolean | null;
  variant: "float" | "cluster";
};

function FeatureCard({
  feature,
  Icon,
  node,
  index,
  inView,
  reduceMotion,
  variant,
}: FeatureCardProps) {
  const isFloat = variant === "float";

  const card = (
    <motion.div
      className={`sport-constellation-card sport-constellation-card--${node.size}`}
      style={
        {
          "--card-accent": node.tone,
          "--card-soft": `${node.tone}22`,
          "--card-rot": `${node.rot}deg`,
        } as CSSProperties
      }
      initial={reduceMotion ? false : { opacity: 0, y: isFloat ? 18 : 12, scale: 0.92 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{
        duration: 0.6,
        delay: reduceMotion ? 0 : 0.1 + index * 0.045,
        ease: easePremium,
      }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: isFloat ? -5 : -3,
              scale: 1.03,
              transition: { duration: 0.32, ease: easePremium },
            }
      }
    >
      <span className="sport-constellation-card__face">
        <span className="sport-constellation-card__icon" aria-hidden>
          <span className="sport-constellation-card__icon-inner">
            <Icon strokeWidth={1.85} />
          </span>
        </span>
        <span className="sport-constellation-card__label">{feature.label}</span>
      </span>
    </motion.div>
  );

  if (!isFloat) return card;

  return (
    <div
      className="sport-constellation-card__anchor"
      style={
        {
          "--card-x": `${node.x}%`,
          "--card-y": `${node.y}%`,
          "--float-duration": `${node.duration}s`,
          "--float-delay": `${node.delay}s`,
        } as CSSProperties
      }
    >
      {card}
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

  const features = useMemo(() => {
    const raw = getTranslationValue(locale, "marketing.modules.orbitFeatures");
    const fromI18n = (Array.isArray(raw) ? raw : []) as Array<{ id: string; label?: string }>;

    return SPORT_SHOWCASE_FEATURE_IDS.map((id) => {
      const found = fromI18n.find((f) => f.id === id);
      const catalog = getSportFeatureById(id);
      return {
        id,
        label: found?.label ?? catalog?.title ?? id,
      } satisfies OrbitFeatureContent;
    });
  }, [locale]);

  const featureById = useMemo(() => {
    const map = new Map<OrbitFeatureId, OrbitFeatureContent>();
    for (const feature of features) map.set(feature.id, feature);
    return map;
  }, [features]);

  const centerCopy = (
    <>
      <p className="sport-constellation-eyebrow">{t("marketing.modules.label")}</p>
      <h2 className="features-orbit-center__title display-title">
        <span className="block">{t("marketing.modules.titleLine1")}</span>
        <span className="block">{t("marketing.modules.titleLine2")}</span>
      </h2>
      <p className="features-orbit-center__desc">{t("marketing.modules.orbitLead")}</p>
    </>
  );

  return (
    <div className="features-orbit">
      <div ref={stageRef} className="sport-constellation sport-constellation--desktop">
        <div className="sport-constellation__glow" aria-hidden />

        <div className="sport-constellation__stage">
          <div className="sport-constellation__core">
            <motion.div
              className="sport-constellation__core-inner"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={stageInView ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.75, ease: easePremium }}
            >
              {centerCopy}
            </motion.div>
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
                    reduceMotion={reduceMotion}
                    variant="float"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div ref={mobileRef} className="sport-constellation-mobile">
        <div className="sport-constellation-mobile__glow" aria-hidden />
        <motion.div
          className="sport-constellation-mobile__intro"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={mobileInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.65, ease: easePremium }}
        >
          {centerCopy}
        </motion.div>

        <div className="sport-constellation-mobile__cluster" role="list">
          {SHOWCASE_NODES.map((node, index) => {
            const feature = featureById.get(node.id);
            if (!feature) return null;
            const Icon = sportFeatureIcons[feature.id];

            return (
              <div
                key={feature.id}
                role="listitem"
                className={`sport-constellation-mobile__item sport-constellation-mobile__item--${node.size}`}
              >
                <FeatureCard
                  feature={feature}
                  Icon={Icon}
                  node={node}
                  index={index}
                  inView={mobileInView}
                  reduceMotion={reduceMotion}
                  variant="cluster"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
