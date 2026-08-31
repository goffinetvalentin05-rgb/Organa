"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import { getTranslationValue } from "@/lib/i18n";

type StoryStep = {
  label: string;
  lead: string;
  tail: string;
  /** Fragments du texte mis en avant en bleu Obillz une fois actifs. */
  emphasis?: string[];
};

type StoryToken = {
  text: string;
  emphasis: boolean;
};

/**
 * Fenêtres [entrée début, entrée fin / révélation début, révélation fin / sortie début, sortie fin].
 * Laisser assez de « hold » pour que 100 % des mots s’allument avant le crossfade suivant.
 */
const STEP_RANGES: [number, number, number, number][] = [
  [0, 0.045, 0.27, 0.33],
  [0.3, 0.355, 0.6, 0.66],
  [0.63, 0.69, 0.96, 1],
];

const COLOR_INACTIVE = "#94a3b8";
const COLOR_ACTIVE = "#0b1220";
const COLOR_EMPHASIS = "#1a23ff";

function buildTokens(step: StoryStep): StoryToken[] {
  const full = `${step.lead} ${step.tail}`.replace(/\s+/g, " ").trim();
  if (!full) return [];

  const marks = new Array<boolean>(full.length).fill(false);
  for (const fragment of step.emphasis ?? []) {
    if (!fragment) continue;
    let from = 0;
    while (from < full.length) {
      const index = full.indexOf(fragment, from);
      if (index < 0) break;
      for (let i = index; i < index + fragment.length; i += 1) marks[i] = true;
      from = index + fragment.length;
    }
  }

  const tokens: StoryToken[] = [];
  const wordRe = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = wordRe.exec(full))) {
    const start = match.index;
    const end = start + match[0].length;
    const emphasis = marks.slice(start, end).some(Boolean);
    tokens.push({ text: match[0], emphasis });
  }
  return tokens;
}

/** Volontairement `false` au premier rendu : SSR et hydratation alignés. */
function useIsCompact() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return compact;
}

function StoryLayer({
  progress,
  range,
  distance,
  className,
  children,
}: {
  progress: MotionValue<number>;
  range: [number, number, number, number];
  distance: number;
  className: string;
  children: ReactNode;
}) {
  const opacity = useTransform(progress, range, [0, 1, 1, 0]);
  const y = useTransform(progress, range, [distance, 0, 0, -distance * 0.45]);

  return (
    <motion.div className={className} style={{ opacity, y }}>
      {children}
    </motion.div>
  );
}

function StoryWord({
  progress,
  index,
  total,
  emphasis,
  children,
}: {
  progress: MotionValue<number>;
  index: number;
  total: number;
  emphasis: boolean;
  children: string;
}) {
  const start = index / total;
  const end = Math.min(1, (index + 1.15) / total);
  const opacity = useTransform(progress, [start, end], [0.55, 1]);
  const color = useTransform(
    progress,
    [start, end],
    [COLOR_INACTIVE, emphasis ? COLOR_EMPHASIS : COLOR_ACTIVE]
  );

  return (
    <motion.span className="lp-story__word" style={{ opacity, color }}>
      {children}
      {index < total - 1 ? " " : ""}
    </motion.span>
  );
}

function StoryRevealText({
  step,
  progress,
  staticActive = false,
}: {
  step: StoryStep;
  progress: MotionValue<number>;
  staticActive?: boolean;
}) {
  const tokens = useMemo(
    () => buildTokens(step),
    [step.lead, step.tail, (step.emphasis ?? []).join("\0")]
  );

  if (staticActive) {
    return (
      <p className="lp-story__text lp-story__text--static">
        {tokens.map((token, index) => (
          <span
            key={`${token.text}-${index}`}
            className={token.emphasis ? "lp-story__accent" : undefined}
          >
            {token.text}
            {index < tokens.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
    );
  }

  return (
    <p className="lp-story__text">
      {tokens.map((token, index) => (
        <StoryWord
          key={`${token.text}-${index}`}
          progress={progress}
          index={index}
          total={tokens.length}
          emphasis={token.emphasis}
        >
          {token.text}
        </StoryWord>
      ))}
    </p>
  );
}

function StoryRibbons({
  opacityA,
  opacityB,
  opacityC,
  yA,
  yB,
  yC,
}: {
  opacityA: MotionValue<number>;
  opacityB: MotionValue<number>;
  opacityC: MotionValue<number>;
  yA: MotionValue<number>;
  yB: MotionValue<number>;
  yC: MotionValue<number>;
}) {
  return (
    <div className="lp-story__bg" aria-hidden>
      <motion.div className="lp-story__layer lp-story__layer--a" style={{ opacity: opacityA, y: yA }}>
        <span className="lp-story__glow lp-story__glow--a" />
        <div className="lp-story__drift lp-story__drift--slow">
          <svg className="lp-story__wave" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="lpStoryWaveA" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0" />
                <stop offset="42%" stopColor="#9db8e4" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#c7d7f0" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g stroke="url(#lpStoryWaveA)" fill="none" strokeLinecap="round">
              <path d="M-160 486C220 392 430 566 764 502C1042 449 1250 336 1600 404" strokeWidth="4.2" />
              <path d="M-160 566C204 474 470 664 826 588C1104 529 1306 432 1620 494" strokeWidth="2.8" />
              <path d="M-160 402C258 312 508 478 884 428C1160 391 1362 306 1620 356" strokeWidth="1.8" />
            </g>
          </svg>
        </div>
      </motion.div>

      <motion.div className="lp-story__layer lp-story__layer--b" style={{ opacity: opacityB, y: yB }}>
        <span className="lp-story__glow lp-story__glow--b" />
        <div className="lp-story__drift lp-story__drift--medium">
          <svg className="lp-story__wave" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="lpStoryWaveB" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity="0" />
                <stop offset="48%" stopColor="#7d97f0" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g stroke="url(#lpStoryWaveB)" fill="none" strokeLinecap="round">
              <path d="M-160 520C240 610 460 400 780 448C1060 490 1268 606 1620 540" strokeWidth="4.4" />
              <path d="M-160 606C214 694 512 486 846 534C1108 571 1300 668 1620 612" strokeWidth="2.6" />
              <path d="M-160 438C280 520 540 356 900 396C1166 425 1372 512 1620 470" strokeWidth="1.7" />
            </g>
          </svg>
        </div>
      </motion.div>

      <motion.div className="lp-story__layer lp-story__layer--c" style={{ opacity: opacityC, y: yC }}>
        <span className="lp-story__glow lp-story__glow--c" />
        <div className="lp-story__drift lp-story__drift--fast">
          <svg className="lp-story__wave" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="lpStoryWaveC" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0" />
                <stop offset="46%" stopColor="#60a5fa" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g stroke="url(#lpStoryWaveC)" fill="none" strokeLinecap="round">
              <path d="M-160 466C236 356 486 512 806 456C1078 408 1274 316 1620 372" strokeWidth="4.6" />
              <path d="M-160 542C196 448 486 596 848 526C1112 475 1316 388 1620 442" strokeWidth="2.8" />
              <path d="M-160 372C286 288 528 430 902 386C1174 354 1380 274 1620 322" strokeWidth="1.6" />
            </g>
          </svg>
        </div>
      </motion.div>
    </div>
  );
}

function StepPanels({
  steps,
  scrollYProgress,
  isCompact,
}: {
  steps: StoryStep[];
  scrollYProgress: MotionValue<number>;
  isCompact: boolean;
}) {
  const total = String(steps.length).padStart(2, "0");
  const distance = isCompact ? 18 : 36;

  const railScale = useTransform(scrollYProgress, [0, 1], [0.1, 1]);

  /** Progressions locales 0→1 pendant le « hold » de chaque étape (révélation des mots). */
  const reveal0 = useTransform(
    scrollYProgress,
    [STEP_RANGES[0][1], STEP_RANGES[0][2]],
    [0, 1]
  );
  const reveal1 = useTransform(
    scrollYProgress,
    [STEP_RANGES[1][1], STEP_RANGES[1][2]],
    [0, 1]
  );
  const reveal2 = useTransform(
    scrollYProgress,
    [STEP_RANGES[2][1], STEP_RANGES[2][2]],
    [0, 1]
  );
  const reveals = [reveal0, reveal1, reveal2];

  return (
    <div className="lp-story__grid lp-story__wrap">
      <div className="lp-story__aside">
        <div className="lp-story__stack">
          {steps.map((step, index) => (
            <StoryLayer
              key={step.label}
              progress={scrollYProgress}
              range={STEP_RANGES[index] ?? STEP_RANGES[STEP_RANGES.length - 1]!}
              distance={12}
              className="lp-story__aside-item"
            >
              <span className="lp-story__count">
                {String(index + 1).padStart(2, "0")}
                <span className="lp-story__count-sep">/</span>
                {total}
              </span>
              <p className="lp-story__label">{step.label}</p>
            </StoryLayer>
          ))}
        </div>

        <div className="lp-story__rail" aria-hidden>
          <motion.span className="lp-story__rail-fill" style={{ scaleX: railScale }} />
        </div>
      </div>

      <div className="lp-story__stack lp-story__stage">
        {steps.map((step, index) => (
          <StoryLayer
            key={step.label}
            progress={scrollYProgress}
            range={STEP_RANGES[index] ?? STEP_RANGES[STEP_RANGES.length - 1]!}
            distance={distance}
            className={`lp-story__panel lp-story__panel--${index + 1}`}
          >
            <StoryRevealText
              step={step}
              progress={reveals[index] ?? reveal0}
            />
          </StoryLayer>
        ))}
      </div>
    </div>
  );
}

export default function StorySequenceSection() {
  const { t, locale } = useI18n();
  const reduceMotion = useReducedMotion();
  const isCompact = useIsCompact();
  const sectionRef = useRef<HTMLElement>(null);
  const [staticMode, setStaticMode] = useState(false);

  useEffect(() => {
    if (reduceMotion) setStaticMode(true);
  }, [reduceMotion]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const opacityA = useTransform(scrollYProgress, [0, 0.26, 0.42], [1, 1, 0]);
  const opacityB = useTransform(scrollYProgress, [0.28, 0.42, 0.58, 0.74], [0, 1, 1, 0]);
  const opacityC = useTransform(scrollYProgress, [0.62, 0.76, 1], [0, 1, 1]);
  const yA = useTransform(scrollYProgress, [0, 1], [0, isCompact ? -40 : -90]);
  const yB = useTransform(scrollYProgress, [0, 1], [isCompact ? 24 : 50, isCompact ? -28 : -55]);
  const yC = useTransform(scrollYProgress, [0, 1], [isCompact ? 36 : 80, isCompact ? -12 : -20]);

  const raw = getTranslationValue(locale, "marketing.story.steps");
  const steps = (Array.isArray(raw) ? raw : []) as StoryStep[];
  const total = String(steps.length).padStart(2, "0");

  if (steps.length === 0) return null;

  if (staticMode) {
    return (
      <section
        ref={sectionRef}
        className="lp-story lp-story--static"
        aria-label={t("marketing.story.ariaLabel")}
      >
        <div className="lp-story__static-list lp-story__wrap">
          {steps.map((step, index) => (
            <article key={step.label} className={`lp-story__grid lp-story__grid--${index + 1}`}>
              <div className="lp-story__aside-item">
                <span className="lp-story__count">
                  {String(index + 1).padStart(2, "0")}
                  <span className="lp-story__count-sep">/</span>
                  {total}
                </span>
                <p className="lp-story__label">{step.label}</p>
              </div>
              <StoryRevealText step={step} progress={scrollYProgress} staticActive />
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="lp-story"
      aria-label={t("marketing.story.ariaLabel")}
    >
      <div className="lp-story__viewport">
        <StoryRibbons
          opacityA={opacityA}
          opacityB={opacityB}
          opacityC={opacityC}
          yA={yA}
          yB={yB}
          yC={yC}
        />

        <StepPanels
          steps={steps}
          scrollYProgress={scrollYProgress}
          isCompact={isCompact}
        />
      </div>
    </section>
  );
}
