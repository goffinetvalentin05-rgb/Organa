"use client";

import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";
import { getTranslationValue } from "@/lib/i18n";

type TrustStat = {
  id: string;
  value: string;
  description: string;
  counterFrom?: number;
  counterTo?: number;
  counterTemplate?: string;
};

const titleDelays: Record<string, number> = {
  swiss: 0.04,
  support: 0.16,
  percent: 0.1,
  simple: 0.26,
};

const titleMotion = {
  hidden: { opacity: 0, y: 26, filter: "blur(8px)" },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, delay, ease: easePremium },
  }),
};

const descMotion = {
  hidden: { opacity: 0, y: 12 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, delay: delay + 0.22, ease: easePremium },
  }),
};

const counterDurations: Record<string, number> = {
  support: 2.2,
  percent: 2.6,
};

function CountUpStat({
  stat,
  active,
  reduceMotion,
  delay = 0.22,
}: {
  stat: TrustStat;
  active: boolean;
  reduceMotion: boolean;
  delay?: number;
}) {
  const from = stat.counterFrom ?? 0;
  const to = stat.counterTo ?? 0;
  const template = stat.counterTemplate ?? "{n}";
  const [value, setValue] = useState(reduceMotion ? to : from);
  const [done, setDone] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) {
      setValue(to);
      setDone(true);
      return;
    }

    if (!active) {
      setValue(from);
      setDone(false);
      return;
    }

    let controls: ReturnType<typeof animate> | undefined;
    const duration = counterDurations[stat.id] ?? 2;

    const timeout = window.setTimeout(() => {
      setValue(from);
      setDone(false);
      controls = animate(from, to, {
        duration,
        ease: easePremium,
        onUpdate: (latest) => setValue(Math.round(latest)),
        onComplete: () => setDone(true),
      });
    }, delay * 1000);

    return () => {
      window.clearTimeout(timeout);
      controls?.stop();
    };
  }, [active, reduceMotion, delay, from, to, stat.id]);

  const display = done ? stat.value : template.replace("{n}", String(value));

  return (
    <motion.span
      className="inline-block tabular-nums"
      animate={
        done && !reduceMotion
          ? { opacity: 1, y: 0, scale: [1, 1.04, 1] }
          : { opacity: 1, y: 0, scale: 1 }
      }
      transition={{ duration: done ? 0.45 : 0.2, ease: easePremium }}
    >
      {display}
    </motion.span>
  );
}

function TrustStatItem({
  stat,
  active,
  reduceMotion,
}: {
  stat: TrustStat;
  active: boolean;
  reduceMotion: boolean;
}) {
  const delay = titleDelays[stat.id] ?? 0;
  const isLongLabel = stat.id === "swiss";
  const hasCounter =
    stat.counterTemplate != null &&
    stat.counterTo != null &&
    stat.counterFrom != null;

  const valueClass = isLongLabel
    ? "text-xl font-bold leading-[1.12] tracking-tight text-[#F8FAFC] sm:text-2xl lg:text-[1.85rem]"
    : "text-2xl font-bold leading-none tracking-tight text-[#F8FAFC] sm:text-3xl lg:text-[2.35rem]";

  const motionState = active || reduceMotion ? "visible" : "hidden";

  return (
    <div className="landing-trust-strip__item group relative text-center">
      <motion.p
        custom={delay}
        initial="hidden"
        animate={motionState}
        variants={titleMotion}
        className={`${valueClass} transition-[color,text-shadow] duration-300 group-hover:text-white group-hover:[text-shadow:0_0_28px_rgba(96,165,250,0.22)] max-md:text-[clamp(1.875rem,9vw,2.625rem)] max-md:leading-[1.05]`}
      >
        {hasCounter ? (
          <CountUpStat
            stat={stat}
            active={active}
            reduceMotion={reduceMotion}
            delay={delay + 0.32}
          />
        ) : (
          stat.value
        )}
      </motion.p>

      <motion.p
        custom={delay}
        initial="hidden"
        animate={motionState}
        variants={descMotion}
        className="text-xs leading-relaxed text-blue-100/50 transition-colors duration-300 group-hover:text-blue-100/68 max-md:text-[15px] max-md:leading-normal sm:text-[0.8125rem]"
      >
        {stat.description}
      </motion.p>
    </div>
  );
}

export default function TrustStatsSection() {
  const { t, locale } = useI18n();
  const reduceMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { ...viewportOnce, amount: 0.45 });
  const raw = getTranslationValue(locale, "marketing.trustStats.items");
  const items = (Array.isArray(raw) ? raw : []) as TrustStat[];

  if (items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="landing-trust-strip"
      aria-label={t("marketing.trustStats.ariaLabel")}
    >
      <div className="landing-trust-strip__grid">
        {items.map((stat) => (
          <TrustStatItem
            key={stat.id}
            stat={stat}
            active={isInView}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </section>
  );
}
