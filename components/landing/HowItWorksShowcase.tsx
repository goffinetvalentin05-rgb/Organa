"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { easePremium } from "@/components/landing/landing-motion";
import {
  CentralizedMock,
  ClubCreationMock,
  CommitteeMock,
  MemberImportMock,
  type MockLabels,
} from "@/components/landing/HowItWorksMocks";

type Step = { title: string; description: string };

const STEP_NUMBERS = ["01", "02", "03", "04"] as const;
const STEP_CONTENT_ID = "how-it-works-step-content";
const VISUAL_PANEL_ID = "how-it-works-visual-panel";
const MOBILE_STEP_CONTENT_ID = "how-it-works-mobile-step-content";
const MOBILE_VISUAL_PANEL_ID = "how-it-works-mobile-visual-panel";
const STEP_DURATION_MS = 4500;
const RESUME_DELAY_MS = 2200;
const SWIPE_THRESHOLD_PX = 48;

function StepNav({
  activeIndex,
  onSelect,
}: {
  activeIndex: number;
  onSelect: (index: number, event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <nav className="relative flex flex-row gap-3 lg:flex-col lg:gap-5" aria-label="Étapes">
      <span
        className="absolute left-[18px] top-5 bottom-5 hidden w-px bg-gradient-to-b from-slate-200 via-slate-200/80 to-transparent lg:block sm:left-[19px]"
        aria-hidden
      />
      {STEP_NUMBERS.map((num, index) => {
        const isActive = activeIndex === index;
        return (
          <button
            key={num}
            type="button"
            onClick={(event) => onSelect(index, event)}
            className="group relative z-10 flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#175dd4]/40 focus-visible:ring-offset-2"
            aria-current={isActive ? "step" : undefined}
            aria-selected={isActive}
            aria-controls={STEP_CONTENT_ID}
            aria-label={`Étape ${num}`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 sm:h-10 sm:w-10 sm:text-xs ${
                isActive
                  ? "how-it-works-blue-fill text-white"
                  : "border border-slate-200 bg-white text-slate-400 group-hover:border-slate-300 group-hover:text-slate-600"
              }`}
            >
              {num}
            </span>
            {index < STEP_NUMBERS.length - 1 ? (
              <span className="mx-0.5 h-px w-4 bg-slate-200 sm:mx-1 sm:w-6 lg:hidden" aria-hidden />
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
      className="relative min-h-[160px] sm:min-h-[220px] md:min-h-[240px]"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: easePremium }}
          className="min-w-0"
        >
          <p
            className="how-it-works-blue-text display-title select-none text-[clamp(2.5rem,12vw,6.75rem)] leading-[0.88]"
            aria-hidden
          >
            {num}
          </p>
          <h3 className="mt-2 text-[1.15rem] font-bold tracking-tight text-slate-900 sm:mt-1 sm:text-2xl md:text-[1.65rem]">
            {step.title}
          </h3>
          <p className="mx-auto mt-2.5 max-w-md text-[0.9375rem] leading-relaxed text-slate-600 sm:mt-3 sm:text-[1.05rem] lg:mx-0">
            {step.description}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function VisualPanel({
  activeIndex,
  mockLabels,
}: {
  activeIndex: number;
  mockLabels: MockLabels;
}) {
  return (
    <div
      id={VISUAL_PANEL_ID}
      className="relative min-h-[240px] sm:min-h-[320px] lg:min-h-[400px]"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.4, ease: easePremium }}
          className="w-full"
        >
          {activeIndex === 0 ? <ClubCreationMock labels={mockLabels.step1} /> : null}
          {activeIndex === 1 ? (
            <MemberImportMock labels={mockLabels.step2} active={true} />
          ) : null}
          {activeIndex === 2 ? <CommitteeMock labels={mockLabels.step3} /> : null}
          {activeIndex === 3 ? <CentralizedMock labels={mockLabels.step4} /> : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DesktopHowItWorks({
  steps,
  mockLabels,
  activeIndex,
  onSelect,
}: {
  steps: Step[];
  mockLabels: MockLabels;
  activeIndex: number;
  onSelect: (index: number, event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div className="grid items-start gap-7 sm:gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12 xl:gap-16">
      <div className="flex flex-col gap-5 sm:gap-8">
        <div className="flex flex-col gap-6 sm:gap-6 lg:flex-row lg:items-start">
          <div className="flex justify-center lg:justify-start">
            <StepNav activeIndex={activeIndex} onSelect={onSelect} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5 text-center lg:text-left">
            <StepContent steps={steps} activeIndex={activeIndex} />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.35rem] bg-slate-100/70 p-3 sm:rounded-[2rem] sm:p-5 md:rounded-[2.25rem] md:p-6 lg:p-7">
        <VisualPanel activeIndex={activeIndex} mockLabels={mockLabels} />
      </div>
    </div>
  );
}

function MobileProgressBar({
  activeIndex,
  progressKey,
  filling,
  held,
  onSelect,
}: {
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
        return (
          <button
            key={num}
            type="button"
            className="how-it-works-mobile-progress__segment"
            onClick={() => onSelect(index)}
            aria-current={isActive ? "step" : undefined}
            aria-label={`Étape ${num}`}
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
  direction,
}: {
  steps: Step[];
  activeIndex: number;
  direction: number;
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
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={activeIndex}
          custom={direction}
          initial={{ opacity: 0, x: direction * 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -22 }}
          transition={{ duration: 0.38, ease: easePremium }}
          className="min-w-0"
        >
          <p className="how-it-works-blue-text display-title how-it-works-mobile-number select-none" aria-hidden>
            {num}
          </p>
          <h3 className="how-it-works-mobile-step-title">{step.title}</h3>
          <p className="how-it-works-mobile-step-desc">{step.description}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MobileVisualPanel({
  activeIndex,
  mockLabels,
  direction,
}: {
  activeIndex: number;
  mockLabels: MockLabels;
  direction: number;
}) {
  return (
    <div
      id={MOBILE_VISUAL_PANEL_ID}
      className="how-it-works-mobile-visual"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="how-it-works-mobile-visual__glow" aria-hidden />
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={activeIndex}
          custom={direction}
          initial={{ opacity: 0, x: direction * 36 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -28 }}
          transition={{ duration: 0.4, ease: easePremium }}
          className="relative w-full"
        >
          {activeIndex === 0 ? (
            <ClubCreationMock labels={mockLabels.step1} compact />
          ) : null}
          {activeIndex === 1 ? (
            <MemberImportMock labels={mockLabels.step2} active compact />
          ) : null}
          {activeIndex === 2 ? (
            <CommitteeMock labels={mockLabels.step3} compact />
          ) : null}
          {activeIndex === 3 ? (
            <CentralizedMock labels={mockLabels.step4} compact />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MobileHowItWorks({
  steps,
  mockLabels,
}: {
  steps: Step[];
  mockLabels: MockLabels;
}) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [progressKey, setProgressKey] = useState(0);
  const [filling, setFilling] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const resumeTimerRef = useRef<number | null>(null);
  const pointerStartX = useRef<number | null>(null);
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

  const progressHeld = Boolean(reduceMotion) || autoplayPaused || !tabVisible;

  return (
    <div
      className="how-it-works-mobile"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <MobileProgressBar
        activeIndex={activeIndex}
        progressKey={progressKey}
        filling={filling && !reduceMotion && tabVisible && !autoplayPaused}
        held={progressHeld}
        onSelect={selectStep}
      />

      <MobileStepBody steps={steps} activeIndex={activeIndex} direction={direction} />
      <MobileVisualPanel
        activeIndex={activeIndex}
        mockLabels={mockLabels}
        direction={direction}
      />
    </div>
  );
}

export default function HowItWorksShowcase({
  steps,
  mockLabels,
}: {
  steps: Step[];
  mockLabels: MockLabels;
}) {
  const [desktopIndex, setDesktopIndex] = useState(0);

  const selectDesktopStep = (index: number, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDesktopIndex(index);
  };

  return (
    <div className="relative">
      <div className="md:hidden">
        <MobileHowItWorks steps={steps} mockLabels={mockLabels} />
      </div>
      <div className="hidden md:block">
        <DesktopHowItWorks
          steps={steps}
          mockLabels={mockLabels}
          activeIndex={desktopIndex}
          onSelect={selectDesktopStep}
        />
      </div>
    </div>
  );
}
