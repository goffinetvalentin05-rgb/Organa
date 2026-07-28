"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Heart, Lightbulb, Package, Rocket, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import LandingSectionIntro from "@/components/landing/LandingSectionIntro";
import { scrollReveal, viewportOnce } from "@/components/landing/landing-motion";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";

type WhyCard = {
  id: string;
  badge: string;
  title: string;
  paragraphs: string[];
};

const cardIcons: Record<string, LucideIcon> = {
  terrain: Heart,
  automate: Zap,
  unify: Package,
  simple: Rocket,
  evolve: Lightbulb,
};

const spring: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 30,
  mass: 0.85,
};

const fanSpring: Transition = {
  type: "spring",
  stiffness: 240,
  damping: 28,
  mass: 0.9,
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

function getFanPose(
  offset: number,
  compact: boolean,
  opened: boolean,
  reduceMotion: boolean | null,
) {
  if (!opened && !reduceMotion) {
    return {
      x: offset * 10,
      y: Math.abs(offset) * 4,
      rotate: offset * 2.5,
      scale: 0.92,
      opacity: 0.55,
    };
  }

  const spacing = compact ? 118 : 158;
  const rot = compact ? 7.5 : 9.5;
  const abs = Math.abs(offset);
  const isActive = offset === 0;

  return {
    x: offset * spacing,
    y: isActive ? -18 : 10 + abs * 14,
    rotate: offset * rot,
    scale: isActive ? 1.08 : Math.max(0.82, 0.96 - abs * 0.055),
    opacity: isActive ? 1 : Math.max(0.55, 0.88 - abs * 0.1),
  };
}

function FanCardFace({
  card,
  active,
  Icon,
}: {
  card: WhyCard;
  active: boolean;
  Icon: LucideIcon;
}) {
  return (
    <div className={`why-fan-card__face${active ? " is-active" : ""}`}>
      <div className="why-fan-card__glow" aria-hidden />
      <div className="why-fan-card__shine" aria-hidden />
      <div className="why-fan-card__rim" aria-hidden />

      <div className="why-fan-card__top">
        <span className="why-fan-card__icon" aria-hidden>
          <Icon strokeWidth={1.7} />
        </span>
        <span className="why-fan-card__badge">{card.badge}</span>
      </div>

      <h3 className="why-fan-card__title">{card.title}</h3>
      <div className="why-fan-card__body">
        {card.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}

export default function WhyChooseSection() {
  const { t, locale } = useI18n();
  const reduceMotion = useReducedMotion();
  const isTablet = useMediaQuery("(max-width: 1099px)");
  const raw = getTranslationValue(locale, "marketing.whyChoose.cards");
  const cards = (Array.isArray(raw) ? raw : []) as WhyCard[];

  const [active, setActive] = useState(2);
  const [opened, setOpened] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cards.length === 0) return;
    setActive((prev) => {
      if (prev >= cards.length) return Math.floor((cards.length - 1) / 2);
      return prev;
    });
  }, [cards.length]);

  useEffect(() => {
    if (!scrollerRef.current) return;
    const el = scrollerRef.current.querySelector<HTMLElement>(
      `[data-fan-index="${active}"]`,
    );
    if (!el) return;
    // Only scroll mobile scroller into view when it's the visible layout
    if (window.matchMedia("(max-width: 767px)").matches) {
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [active, reduceMotion]);

  return (
    <section
      id="pourquoi-obillz"
      className="why-choose discovery-chapter__block discovery-chapter__block--why scroll-mt-32 md:scroll-mt-36"
    >
      <motion.div
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="why-choose__intro"
      >
        <LandingSectionIntro
          layout="centered"
          label={t("marketing.whyChoose.label")}
          title={t("marketing.whyChoose.title")}
          description={t("marketing.whyChoose.description")}
          secondaryDescription={t("marketing.whyChoose.secondaryDescription")}
        />
      </motion.div>

      <motion.div
        className="why-fan"
        initial={false}
        onViewportEnter={() => setOpened(true)}
        viewport={{ once: true, margin: "-10% 0px" }}
      >
        <div className="why-fan__halo why-fan__halo--a" aria-hidden />
        <div className="why-fan__halo why-fan__halo--b" aria-hidden />

        {/* Desktop / tablet — éventail */}
        <div className="why-fan__desktop" aria-hidden={false}>
          <div className="why-fan__stage" role="list">
            {cards.map((card, index) => {
              const Icon = cardIcons[card.id] ?? Heart;
              const offset = index - active;
              const pose = getFanPose(offset, isTablet, opened || !!reduceMotion, reduceMotion);
              const isActive = offset === 0;

              return (
                <motion.button
                  key={card.id}
                  type="button"
                  role="listitem"
                  className={`why-fan-card${isActive ? " is-active" : ""}`}
                  aria-pressed={isActive}
                  aria-label={card.title}
                  onClick={() => setActive(index)}
                  initial={false}
                  animate={{
                    x: pose.x,
                    y: pose.y,
                    rotate: pose.rotate,
                    scale: pose.scale,
                    opacity: pose.opacity,
                    zIndex: 20 - Math.abs(offset),
                  }}
                  transition={reduceMotion ? { duration: 0 } : fanSpring}
                  whileHover={
                    reduceMotion || isActive
                      ? undefined
                      : { y: pose.y - 8, scale: pose.scale + 0.02, transition: spring }
                  }
                >
                  <FanCardFace card={card} active={isActive} Icon={Icon} />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Mobile — slider snap */}
        <div className="why-fan__mobile">
          <div
            ref={scrollerRef}
            className="why-fan__scroller"
            onScroll={(event) => {
              const node = event.currentTarget;
              const center = node.scrollLeft + node.clientWidth / 2;
              let nearest = 0;
              let best = Number.POSITIVE_INFINITY;
              node.querySelectorAll<HTMLElement>("[data-fan-index]").forEach((item) => {
                const mid = item.offsetLeft + item.offsetWidth / 2;
                const dist = Math.abs(mid - center);
                if (dist < best) {
                  best = dist;
                  nearest = Number(item.dataset.fanIndex);
                }
              });
              if (nearest !== active) setActive(nearest);
            }}
          >
            {cards.map((card, index) => {
              const Icon = cardIcons[card.id] ?? Heart;
              return (
                <button
                  key={card.id}
                  type="button"
                  data-fan-index={index}
                  className={`why-fan-card why-fan-card--mobile${
                    index === active ? " is-active" : ""
                  }`}
                  onClick={() => setActive(index)}
                  aria-pressed={index === active}
                  aria-label={card.title}
                >
                  <FanCardFace card={card} active={index === active} Icon={Icon} />
                </button>
              );
            })}
          </div>

          <div className="why-fan__dots" role="tablist" aria-label={t("marketing.whyChoose.title")}>
            {cards.map((card, index) => (
              <button
                key={card.id}
                type="button"
                className={`why-fan__dot${index === active ? " is-active" : ""}`}
                aria-label={card.title}
                aria-selected={index === active}
                onClick={() => setActive(index)}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
