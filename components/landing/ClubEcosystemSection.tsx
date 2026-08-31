"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Check } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { scrollReveal, viewportOnce } from "@/components/landing/landing-motion";
import { getTranslationValue } from "@/lib/i18n";
import {
  getSportFeatureById,
  sportFeatureIcons,
  type SportFeatureId,
} from "@/lib/sport-features";

type EcoVisual = "none" | "members" | "progress" | "calendar" | "checks" | "bubbles" | "bars" | "spark";

type EcoNodeConfig = {
  id: SportFeatureId;
  /** Position en % de la scène — composition éditoriale libre. */
  x: number;
  y: number;
  size: "sm" | "lg";
  visual: EcoVisual;
};

/**
 * Les cartes sont réparties autour d'une zone éditoriale protégée, sans anneau
 * régulier ni relation fonctionnelle avec un centre.
 */
const ECO_NODES: EcoNodeConfig[] = [
  { id: "sponsors", x: 19, y: 11, size: "sm", visual: "none" },
  { id: "membres", x: 47, y: 7, size: "lg", visual: "members" },
  { id: "cotisations", x: 78, y: 13, size: "lg", visual: "progress" },
  { id: "pagePublique", x: 10, y: 34, size: "sm", visual: "none" },
  { id: "factures", x: 91, y: 34, size: "sm", visual: "none" },
  { id: "statistiques", x: 13, y: 59, size: "lg", visual: "spark" },
  { id: "revenus", x: 89, y: 59, size: "lg", visual: "bars" },
  { id: "qrcodes", x: 14, y: 82, size: "sm", visual: "none" },
  { id: "plannings", x: 35, y: 88, size: "lg", visual: "checks" },
  { id: "communication", x: 57, y: 91, size: "lg", visual: "bubbles" },
  { id: "evenements", x: 78, y: 84, size: "lg", visual: "calendar" },
  { id: "buvette", x: 94, y: 79, size: "sm", visual: "none" },
];

/** Volontairement `false` au premier rendu : SSR et hydratation doivent produire les mêmes styles inline. */
function useIsCompact() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return compact;
}

function NodeVisual({ visual }: { visual: EcoVisual }) {
  switch (visual) {
    case "members":
      return (
        <span className="lp-eco__visual lp-eco__avatars">
          <span className="lp-eco__avatar">ML</span>
          <span className="lp-eco__avatar">TA</span>
          <span className="lp-eco__avatar">JR</span>
          <span className="lp-eco__count">+124</span>
        </span>
      );
    case "progress":
      return (
        <span className="lp-eco__visual lp-eco__bar">
          <span className="lp-eco__bar-fill" />
        </span>
      );
    case "calendar":
      return (
        <span className="lp-eco__visual lp-eco__cal">
          <span />
          <span />
          <span className="is-on" />
          <span />
          <span />
          <span className="is-on" />
          <span />
        </span>
      );
    case "checks":
      return (
        <span className="lp-eco__visual lp-eco__rows">
          <span className="lp-eco__row">
            <span className="lp-eco__check">
              <Check strokeWidth={3} />
            </span>
            <span className="lp-eco__row-line" />
          </span>
          <span className="lp-eco__row">
            <span className="lp-eco__check">
              <Check strokeWidth={3} />
            </span>
            <span className="lp-eco__row-line lp-eco__row-line--short" />
          </span>
        </span>
      );
    case "bubbles":
      return (
        <span className="lp-eco__visual lp-eco__bubbles">
          <span className="lp-eco__bubble" />
          <span className="lp-eco__bubble lp-eco__bubble--out" />
        </span>
      );
    case "spark":
      return (
        <span className="lp-eco__visual lp-eco__spark">
          <svg viewBox="0 0 100 34" fill="none" preserveAspectRatio="none" aria-hidden>
            <path
              d="M2 27C14 27 18 12 30 14C42 16 46 24 58 20C70 16 76 5 98 6"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </span>
      );
    case "bars":
    default:
      return (
        <span className="lp-eco__visual lp-eco__bars">
          <span />
          <span />
          <span />
          <span />
          <span />
        </span>
      );
  }
}

function EcoNode({
  node,
  index,
  label,
  progress,
  compact,
}: {
  node: EcoNodeConfig;
  index: number;
  label: string;
  progress: MotionValue<number>;
  compact: boolean;
}) {
  const start = 0.08 + index * 0.018;
  const Icon = sportFeatureIcons[node.id];

  const x = useTransform(progress, [start, start + 0.5], [compact ? 0 : index % 2 === 0 ? -18 : 18, 0]);
  const y = useTransform(progress, [start, start + 0.5], [compact ? 12 : 22, 0]);
  const opacity = useTransform(progress, [start, start + 0.24], [0, 1]);
  const scale = useTransform(progress, [start, start + 0.5], [0.975, 1]);

  return (
    <li
      className={`lp-eco__anchor lp-eco__anchor--${node.size}`}
      style={{ "--eco-x": `${node.x}%`, "--eco-y": `${node.y}%` } as CSSProperties}
    >
      <motion.div
        className={`lp-eco__node lp-eco__node--${node.size}`}
        style={{ x, y, opacity, scale }}
      >
        <span className="lp-eco__node-head">
          <span className="lp-eco__node-icon" aria-hidden>
            <Icon strokeWidth={1.9} />
          </span>
          <span className="lp-eco__node-label">{label}</span>
        </span>
        {node.visual === "none" ? null : <NodeVisual visual={node.visual} />}
      </motion.div>
    </li>
  );
}

export default function ClubEcosystemSection() {
  const { t, locale } = useI18n();
  const compact = useIsCompact();
  const stageRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start end", "center center"],
  });

  const labels = useMemo(() => {
    const raw = getTranslationValue(locale, "marketing.modules.orbitFeatures");
    const list = (Array.isArray(raw) ? raw : []) as Array<{ id?: string; label?: string }>;

    return ECO_NODES.reduce<Record<string, string>>((acc, node) => {
      const fromI18n = list.find((item) => item.id === node.id)?.label;
      acc[node.id] = fromI18n ?? getSportFeatureById(node.id)?.title ?? node.id;
      return acc;
    }, {});
  }, [locale]);

  return (
    <section id="modules" className="lp-eco scroll-mt-32 md:scroll-mt-36">
      <div className="lp-eco__wrap">
        <div
          ref={stageRef}
          className="lp-eco__stage"
          role="group"
          aria-label={t("marketing.ecosystem.stageAriaLabel")}
        >
          <div className="lp-eco__ambiance" aria-hidden>
            <span className="lp-eco__glow lp-eco__glow--a" />
            <span className="lp-eco__glow lp-eco__glow--b" />
          </div>

          <svg
            className="lp-eco__curves"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path d="M-5 30C18 12 28 19 38 34" />
            <path d="M65 14C82 20 83 35 105 39" />
            <path d="M7 76C25 65 31 70 42 99" />
            <path d="M66 100C70 78 86 70 105 75" />
          </svg>

          <div className="lp-eco__editorial">
            <motion.header
              className="lp-eco__head"
              variants={scrollReveal}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              <p className="lp-eyebrow">{t("marketing.ecosystem.badge")}</p>
              <h2 className="lp-eco__title">{t("marketing.ecosystem.title")}</h2>
              <p className="lp-eco__lead">{t("marketing.ecosystem.subtitle")}</p>
            </motion.header>
          </div>

          <ul className="lp-eco__nodes">
            {ECO_NODES.map((node, index) => (
              <EcoNode
                key={node.id}
                node={node}
                index={index}
                label={labels[node.id] ?? node.id}
                progress={scrollYProgress}
                compact={compact}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
