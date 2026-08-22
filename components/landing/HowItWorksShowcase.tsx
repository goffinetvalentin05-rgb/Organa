"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { easePremium, scrollReveal, viewportOnce } from "@/components/landing/landing-motion";
import { PracticeStepVisual } from "@/components/landing/ProductShowcaseVisuals";

type Step = { label: string; title: string; description: string };

const STEP_NUMBERS = ["01", "02", "03", "04"] as const;
const STEP_CONTENT_ID = "how-it-works-step-content";
const VISUAL_PANEL_ID = "how-it-works-visual-panel";
const MOBILE_STEP_CONTENT_ID = "how-it-works-mobile-step-content";
const MOBILE_VISUAL_PANEL_ID = "how-it-works-mobile-visual-panel";
const STEP_DURATION_MS = 4500;
const RESUME_DELAY_MS = 2200;
const SWIPE_THRESHOLD_PX = 48;
const visualFade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.42, ease: easePremium },
} as const;

const mobileFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.28, ease: easePremium },
} as const;

function useStepAutoplay() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [progressKey, setProgressKey] = useState(0);
  const [filling, setFilling] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const resumeTimerRef = useRef<number | null>(null);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current != null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const goTo = useCallback((index: number) => {
    const current = activeIndexRef.current;
    const next = ((index % STEP_NUMBERS.length) + STEP_NUMBERS.length) % STEP_NUMBERS.length;
    if (next === current) {
      setProgressKey((key) => key + 1);
      return;
    }
    const last = STEP_NUMBERS.length - 1;
    const forwardWrap = current === last && next === 0;
    const backwardWrap = current === 0 && next === last;
    setDirection(forwardWrap || (!backwardWrap && next > current) ? 1 : -1);
    setActiveIndex(next);
    setProgressKey((key) => key + 1);
  }, []);

  const pauseAutoplay = useCallback(() => {
    clearResumeTimer();
    setAutoplayPaused(true);
    setFilling(false);
    resumeTimerRef.current = window.setTimeout(() => {
      setAutoplayPaused(false);
      setFilling(true);
      setProgressKey((key) => key + 1);
    }, RESUME_DELAY_MS);
  }, [clearResumeTimer]);

  const selectStep = useCallback(
    (index: number) => {
      goTo(index);
      pauseAutoplay();
    },
    [goTo, pauseAutoplay],
  );

  useEffect(() => {
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => () => clearResumeTimer(), [clearResumeTimer]);

  useEffect(() => {
    if (reduceMotion) {
      setFilling(false);
      setAutoplayPaused(true);
      return;
    }
    if (!tabVisible || autoplayPaused) return;

    setFilling(true);
    const timer = window.setTimeout(() => {
      goTo(activeIndex + 1);
    }, STEP_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, autoplayPaused, goTo, reduceMotion, tabVisible]);

  return {
    activeIndex,
    direction,
    progressKey,
    filling: filling && !reduceMotion && tabVisible && !autoplayPaused,
    held: Boolean(reduceMotion) || autoplayPaused || !tabVisible,
    reduceMotion: Boolean(reduceMotion),
    goTo,
    pauseAutoplay,
    selectStep,
  };
}

function StepNav({
  steps,
  activeIndex,
  onSelect,
}: {
  steps: Step[];
  activeIndex: number;
  onSelect: (index: number, event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <nav className="how-it-works-step-nav relative flex flex-row gap-3.5 lg:flex-col lg:gap-8" aria-label="Étapes">
      <span className="how-it-works-step-rail" aria-hidden />
      {STEP_NUMBERS.map((num, index) => {
        const isActive = activeIndex === index;
        const step = steps[index];
        return (
          <button
            key={num}
            type="button"
            onClick={(event) => onSelect(index, event)}
            className="how-it-works-step-btn group relative z-10 flex items-center rounded-full outline-none"
            aria-current={isActive ? "step" : undefined}
            aria-selected={isActive}
            aria-controls={STEP_CONTENT_ID}
            aria-label={step ? `${num} — ${step.label}` : `Étape ${num}`}
          >
            <span
              className={`how-it-works-step-dot flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 sm:h-11 sm:w-11 sm:text-[13px] ${
                isActive ? "how-it-works-step-dot--active how-it-works-blue-fill text-white" : "how-it-works-step-dot--idle"
              }`}
            >
              {num}
            </span>
            {index < STEP_NUMBERS.length - 1 ? (
              <span className="how-it-works-step-connector mx-0.5 h-px w-4 sm:mx-1 sm:w-6 lg:hidden" aria-hidden />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

function StepContent({
  steps,
  activeIndex,
}: {
  steps: Step[];
  activeIndex: number;
}) {
  const step = steps[activeIndex] ?? steps[0]!;
  const num = STEP_NUMBERS[activeIndex] ?? STEP_NUMBERS[0];

  return (
    <div
      id={STEP_CONTENT_ID}
      className="relative min-h-[220px] sm:min-h-[280px] md:min-h-[320px]"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.42, ease: easePremium }}
          className="min-w-0"
        >
          <p
            className="how-it-works-blue-text display-title select-none text-[clamp(3rem,11vw,7.25rem)] leading-[0.86]"
            aria-hidden
          >
            {num}
          </p>
          <p className="how-it-works-step-kicker">{step.label}</p>
          <h3 className="how-it-works-step-title mt-3 text-[1.2rem] font-bold tracking-tight sm:mt-3.5 sm:text-2xl md:text-[1.75rem]">
            {step.title}
          </h3>
          <p className="how-it-works-step-desc mx-auto mt-3.5 max-w-md text-[0.975rem] leading-relaxed sm:mt-4 sm:text-[1.0625rem] lg:mx-0">
            {step.description}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function VisualPanel({
  activeIndex,
}: {
  activeIndex: number;
}) {
  return (
    <div
      id={VISUAL_PANEL_ID}
      className="how-it-works-visual-stage relative w-full"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="how-it-works-visual-stage__glow" aria-hidden />
      <div className="how-it-works-visual-stage__frame">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeIndex}
            initial={visualFade.initial}
            animate={visualFade.animate}
            exit={visualFade.exit}
            transition={visualFade.transition}
            className="how-it-works-visual-stage__layer"
          >
            <PracticeStepVisual stepIndex={activeIndex} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function DesktopHowItWorks({
  intro,
  steps,
}: {
  intro: ReactNode;
  steps: Step[];
}) {
  const { activeIndex, selectStep } = useStepAutoplay();
  const reduceMotion = useReducedMotion();

  const onSelect = (index: number, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    selectStep(index);
  };

  return (
    <div className="how-it-works-desktop grid items-center gap-12 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] lg:gap-12 xl:gap-16">
      <motion.div
        className="how-it-works-desktop__copy flex min-w-0 flex-col gap-12 sm:gap-14 lg:max-w-[40rem] lg:justify-self-start"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 0.65, ease: easePremium, delay: 0.08 }}
      >
        {intro}
        <div className="flex flex-col gap-8 sm:gap-10 lg:flex-row lg:items-start lg:gap-10">
          <div className="flex justify-center lg:justify-start">
            <StepNav steps={steps} activeIndex={activeIndex} onSelect={onSelect} />
          </div>
          <div className="min-w-0 flex-1 pt-1 text-center lg:text-left">
            <StepContent steps={steps} activeIndex={activeIndex} />
          </div>
        </div>
      </motion.div>

      <motion.div
        className="how-it-works-desktop__visual flex w-full items-center justify-center"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 0.7, ease: easePremium, delay: 0.18 }}
      >
        <VisualPanel activeIndex={activeIndex} />
      </motion.div>
    </div>
  );
}

function MobileProgressBar({
  steps,
  activeIndex,
  progressKey,
  filling,
  held,
  onSelect,
}: {
  steps: Step[];
  activeIndex: number;
  progressKey: number;
  filling: boolean;
  held: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <nav className="how-it-works-mobile-progress" aria-label="Progression des étapes">
      {STEP_NUMBERS.map((num, index) => {
        const isActive = activeIndex === index;
        const step = steps[index];
        return (
          <button
            key={num}
            type="button"
            className="how-it-works-mobile-progress__segment"
            onClick={() => onSelect(index)}
            aria-current={isActive ? "step" : undefined}
            aria-label={step ? `${num} — ${step.label}` : `Étape ${num}`}
            aria-controls={MOBILE_STEP_CONTENT_ID}
          >
            <span className="how-it-works-mobile-progress__track" aria-hidden>
              {isActive && held ? (
                <span className="how-it-works-mobile-progress__fill how-it-works-mobile-progress__fill--held" />
              ) : null}
              {isActive && !held ? (
                <motion.span
                  key={`${progressKey}-${index}`}
                  className="how-it-works-mobile-progress__fill"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: filling ? 1 : 0 }}
                  transition={
                    filling
                      ? { duration: STEP_DURATION_MS / 1000, ease: "linear" }
                      : { duration: 0.18, ease: easePremium }
                  }
                />
              ) : null}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function MobileStepBody({
  steps,
  activeIndex,
}: {
  steps: Step[];
  activeIndex: number;
}) {
  const step = steps[activeIndex] ?? steps[0]!;
  const num = STEP_NUMBERS[activeIndex] ?? STEP_NUMBERS[0];

  return (
    <div
      id={MOBILE_STEP_CONTENT_ID}
      className="how-it-works-mobile-copy"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeIndex}
          initial={mobileFade.initial}
          animate={mobileFade.animate}
          exit={mobileFade.exit}
          transition={mobileFade.transition}
          className="min-w-0"
        >
          <p className="how-it-works-blue-text display-title how-it-works-mobile-number select-none" aria-hidden>
            {num}
          </p>
          <p className="how-it-works-step-kicker">{step.label}</p>
          <h3 className="how-it-works-mobile-step-title">{step.title}</h3>
          <p className="how-it-works-mobile-step-desc">{step.description}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MobileVisualPanel({
  activeIndex,
}: {
  activeIndex: number;
}) {
  return (
    <div
      id={MOBILE_VISUAL_PANEL_ID}
      className="how-it-works-mobile-visual"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="how-it-works-mobile-visual__glow" aria-hidden />
      <div className="how-it-works-mobile-visual__frame">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeIndex}
            initial={mobileFade.initial}
            animate={mobileFade.animate}
            exit={mobileFade.exit}
            transition={mobileFade.transition}
            className="how-it-works-mobile-visual__layer"
          >
            <PracticeStepVisual stepIndex={activeIndex} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function MobileHowItWorks({
  steps,
}: {
  steps: Step[];
}) {
  const {
    activeIndex,
    progressKey,
    filling,
    held,
    goTo,
    pauseAutoplay,
    selectStep,
  } = useStepAutoplay();
  const pointerStartX = useRef<number | null>(null);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerStartX.current = event.clientX;
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current == null) return;
    const deltaX = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    if (deltaX < 0) {
      goTo(activeIndex + 1);
    } else {
      goTo(activeIndex - 1);
    }
    pauseAutoplay();
  };

  const onPointerCancel = () => {
    pointerStartX.current = null;
  };

  return (
    <div
      className="how-it-works-mobile"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <MobileProgressBar
        steps={steps}
        activeIndex={activeIndex}
        progressKey={progressKey}
        filling={filling}
        held={held}
        onSelect={selectStep}
      />

      <MobileStepBody steps={steps} activeIndex={activeIndex} />
      <MobileVisualPanel activeIndex={activeIndex} />
    </div>
  );
}

export default function HowItWorksShowcase({
  intro,
  steps,
}: {
  intro: ReactNode;
  steps: Step[];
}) {
  return (
    <div className="how-it-works-showcase relative">
      <div className="lg:hidden">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          {intro}
        </motion.div>
        <div className="landing-section-content how-it-works-content">
          <MobileHowItWorks steps={steps} />
        </div>
      </div>
      <div className="hidden lg:block">
        <DesktopHowItWorks intro={intro} steps={steps} />
      </div>
    </div>
  );
}
