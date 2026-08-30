"use client";

import Image from "next/image";
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
  /** Position en % de la scène — anneau volontairement irrégulier. */
  x: number;
  y: number;
  size: "sm" | "lg";
  visual: EcoVisual;
};

/**
 * Les 11 modules de l'ancienne section « Fonctionnalités » + le Dashboard.
 * Les cartes `lg` portent un mini-visuel, les `sm` restent de simples pastilles
 * pour aérer l'anneau.
 */
const ECO_NODES: EcoNodeConfig[] = [
  { id: "membres", x: 50, y: 10, size: "lg", visual: "members" },
  { id: "cotisations", x: 68.5, y: 14, size: "lg", visual: "progress" },
  { id: "factures", x: 85, y: 28, size: "sm", visual: "none" },
  { id: "revenus", x: 88, y: 51, size: "lg", visual: "bars" },
  { id: "buvette", x: 85, y: 72.5, size: "sm", visual: "none" },
  { id: "evenements", x: 68.5, y: 86, size: "lg", visual: "calendar" },
  { id: "communication", x: 50.5, y: 90, size: "lg", visual: "bubbles" },
  { id: "plannings", x: 32, y: 86, size: "lg", visual: "checks" },
  { id: "qrcodes", x: 15, y: 72.5, size: "sm", visual: "none" },
  { id: "statistiques", x: 12, y: 49, size: "lg", visual: "spark" },
  { id: "pagePublique", x: 15, y: 28, size: "sm", visual: "none" },
  { id: "sponsors", x: 32, y: 14, size: "sm", visual: "none" },
];

/** Décalage initial de chaque module : le long de l'axe centre → module. */
const SPREAD_PX = 42;

function radial(node: EcoNodeConfig) {
  const dx = node.x - 50;
  const dy = node.y - 50;
  const length = Math.hypot(dx, dy) || 1;
  return { dx, dy, ux: dx / length, uy: dy / length };
}

function awayVector(node: EcoNodeConfig) {
  const { ux, uy } = radial(node);
  return { x: ux * SPREAD_PX, y: uy * SPREAD_PX };
}

/**
 * Courbe très légère entre le noyau et un module. Elle démarre en dehors du bloc
 * central et s'arrête avant la carte : la connexion est suggérée, jamais tracée
 * en entier.
 */
function connectorPath(node: EcoNodeConfig) {
  const { ux, uy } = radial(node);
  const startX = 50 + ux * 9;
  const startY = 50 + uy * 9;
  const endX = node.x - ux * 5;
  const endY = node.y - uy * 5;
  const bend = 5.5;
  const controlX = (startX + endX) / 2 - uy * bend;
  const controlY = (startY + endY) / 2 + ux * bend;

  return `M${startX.toFixed(2)} ${startY.toFixed(2)}Q${controlX.toFixed(2)} ${controlY.toFixed(
    2
  )} ${endX.toFixed(2)} ${endY.toFixed(2)}`;
}

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
  const start = 0.14 + index * 0.015;
  const away = awayVector(node);
  const Icon = sportFeatureIcons[node.id];

  const x = useTransform(progress, [start, start + 0.6], [compact ? 0 : away.x, 0]);
  const y = useTransform(progress, [start, start + 0.6], [compact ? 14 : away.y, 0]);
  const opacity = useTransform(progress, [start, start + 0.24], [0, 1]);
  const scale = useTransform(progress, [start, start + 0.6], [0.965, 1]);

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

  const coreOpacity = useTransform(scrollYProgress, [0.1, 0.4], [0, 1]);
  const coreScale = useTransform(scrollYProgress, [0.1, 0.9], [0.975, 1]);
  const haloOpacity = useTransform(scrollYProgress, [0.3, 1], [0.25, 1]);
  const linksOpacity = useTransform(scrollYProgress, [0.4, 0.95], [0, 1]);

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
        <motion.header
          className="lp-eco__head"
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <span className="lp-eco__badge">{t("marketing.ecosystem.badge")}</span>
          <h2 className="lp-eco__title">{t("marketing.ecosystem.title")}</h2>
          <p className="lp-eco__lead">{t("marketing.ecosystem.subtitle")}</p>
        </motion.header>

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

          <motion.svg
            className="lp-eco__links"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ opacity: linksOpacity }}
            aria-hidden
          >
            {ECO_NODES.map((node) => (
              <path
                key={node.id}
                d={connectorPath(node)}
                fill="none"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </motion.svg>

          <div className="lp-eco__core-anchor">
            <motion.div className="lp-eco__core" style={{ opacity: coreOpacity, scale: coreScale }}>
              <motion.span className="lp-eco__core-halo" style={{ opacity: haloOpacity }} aria-hidden />
              <Image
                src="/logo-obillz-bleu.png"
                alt="Obillz"
                width={500}
                height={114}
                className="lp-eco__core-logo"
              />
              <p className="lp-eco__core-label">{t("marketing.ecosystem.coreLabel")}</p>
            </motion.div>
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
