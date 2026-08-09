"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Headphones, MapPin, Sparkles } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";

type TrustStat = {
  id: string;
  value: string;
  description: string;
};

type CardMeta = {
  Icon: LucideIcon;
  slot: string;
  duration: number;
  delay: number;
  rotate: number;
  scale: number;
  driftX: number;
  driftY: number;
};

const CARD_META: Record<string, CardMeta> = {
  swiss: {
    Icon: MapPin,
    slot: "tl",
    duration: 6.2,
    delay: 0.05,
    rotate: -2,
    scale: 1,
    driftX: -1.5,
    driftY: -4,
  },
  support: {
    Icon: Headphones,
    slot: "tr",
    duration: 7.6,
    delay: 0.5,
    rotate: 3,
    scale: 0.94,
    driftX: 2,
    driftY: -5,
  },
  percent: {
    Icon: CheckCircle2,
    slot: "bl",
    duration: 8.4,
    delay: 1.05,
    rotate: 1.5,
    scale: 0.96,
    driftX: -2,
    driftY: 3.5,
  },
  simple: {
    Icon: Sparkles,
    slot: "br",
    duration: 9.1,
    delay: 0.3,
    rotate: -2,
    scale: 1.03,
    driftX: 1.5,
    driftY: 4,
  },
};

function FloatingCard({
  stat,
  reduceMotion,
  className = "",
}: {
  stat: TrustStat;
  reduceMotion: boolean | null;
  className?: string;
}) {
  const meta = CARD_META[stat.id] ?? CARD_META.simple!;
  const { Icon, slot, duration, delay, rotate, scale, driftX, driftY } = meta;

  return (
    <motion.article
      className={`hero-float-card hero-float-card--${slot} ${className}`.trim()}
      aria-label={`${stat.value}. ${stat.description}`}
      initial={false}
      animate={
        reduceMotion
          ? { rotate, scale }
          : {
              x: [0, driftX, 0],
              y: [0, driftY, 0],
              rotate: [rotate, rotate + 0.45, rotate],
              scale,
            }
      }
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: driftY - 3,
              scale: scale * 1.02,
              transition: { duration: 0.28, ease: "easeOut" },
            }
      }
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
    >
      <span className="hero-float-card__glow" aria-hidden />
      <span className="hero-float-card__aura" aria-hidden />
      <span className="hero-float-card__shine" aria-hidden />
      <span className="hero-float-card__rim" aria-hidden />
      <span className="hero-float-card__icon" aria-hidden>
        <Icon strokeWidth={2} className="h-3.5 w-3.5" />
      </span>
      <div className="hero-float-card__copy">
        <p className="hero-float-card__value">{stat.value}</p>
        <p className="hero-float-card__desc">{stat.description}</p>
      </div>
    </motion.article>
  );
}

function useTrustItems() {
  const { locale } = useI18n();
  const raw = getTranslationValue(locale, "marketing.trustStats.items");
  return (Array.isArray(raw) ? raw : []) as TrustStat[];
}

/** Orbit desktop (4 cartes) — sur mobile aussi, via positions CSS asymétriques. */
export default function HeroFloatingTrustCards() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const items = useTrustItems();

  if (items.length === 0) return null;

  return (
    <div className="hero-float-cards" aria-label={t("marketing.trustStats.ariaLabel")}>
      {items.map((stat) => (
        <FloatingCard key={stat.id} stat={stat} reduceMotion={reduceMotion} />
      ))}
    </div>
  );
}

/** @deprecated Ancienne bande mobile 2×2 — conservé pour éviter les imports cassés, non rendu. */
export function HeroFloatingTrustMobileStack() {
  return null;
}
