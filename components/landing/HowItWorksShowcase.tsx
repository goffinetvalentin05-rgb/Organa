"use client";

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { useCallback, useRef, useState } from "react";
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

function StepNav({
  activeIndex,
  onSelect,
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
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
            onClick={() => onSelect(index)}
            className="group relative z-10 flex items-center"
            aria-current={isActive ? "step" : undefined}
            aria-label={`Étape ${num}`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 sm:h-10 sm:w-10 sm:text-xs ${
                isActive
                  ? "bg-[#1A23FF] text-white shadow-[0_8px_20px_-6px_rgba(26,35,255,0.55)]"
                  : "border border-slate-200 bg-white text-slate-400 group-hover:border-slate-300 group-hover:text-slate-600"
              }`}
            >
              {num}
            </span>
            {index < STEP_NUMBERS.length - 1 ? (
              <span className="mx-1 h-px w-6 bg-slate-200 lg:hidden" aria-hidden />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

function StepContent({
  step,
  index,
  activeIndex,
}: {
  step: Step;
  index: number;
  activeIndex: number;
}) {
  const isActive = activeIndex === index;
  const num = STEP_NUMBERS[index];

  return (
    <AnimatePresence mode="wait">
      {isActive ? (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45, ease: easePremium }}
          className="min-w-0"
        >
          <p
            className="select-none text-[clamp(4rem,11vw,6.75rem)] font-black leading-[0.9] tracking-[-0.06em] text-[#1A23FF]"
            aria-hidden
          >
            {num}
          </p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-[1.65rem]">
            {step.title}
          </h3>
          <p className="mt-3 max-w-md text-base leading-relaxed text-slate-600 sm:text-[1.05rem]">
            {step.description}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
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
    <div className="relative min-h-[320px] sm:min-h-[360px] lg:min-h-[400px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, x: 24, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -16, scale: 0.98 }}
          transition={{ duration: 0.5, ease: easePremium }}
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

export default function HowItWorksShowcase({
  steps,
  mockLabels,
}: {
  steps: Step[];
  mockLabels: MockLabels;
}) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollEnabled = !reduceMotion;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (!scrollEnabled || !containerRef.current) return;
    const height = containerRef.current.offsetHeight;
    if (height < window.innerHeight * 1.5) return;
    const idx = Math.min(steps.length - 1, Math.floor(value * steps.length));
    setActiveIndex(idx);
  });

  const scrollToStep = useCallback(
    (index: number) => {
      setActiveIndex(index);
      if (!scrollEnabled || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY + rect.top;
      const stepHeight = containerRef.current.offsetHeight / steps.length;
      window.scrollTo({
        top: scrollTop + stepHeight * index + 1,
        behavior: "smooth",
      });
    },
    [scrollEnabled, steps.length],
  );

  return (
    <div
      ref={containerRef}
      className={scrollEnabled ? "relative lg:h-[220vh]" : "relative"}
    >
      <div className="lg:sticky lg:top-28 lg:pb-4 xl:top-32">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12 xl:gap-16">
          <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex items-start gap-5 sm:gap-6">
              <StepNav activeIndex={activeIndex} onSelect={scrollToStep} />
              <div className="min-w-0 flex-1 pt-0.5">
                <StepContent
                  step={steps[activeIndex] ?? steps[0]!}
                  index={activeIndex}
                  activeIndex={activeIndex}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-slate-100/70 p-4 sm:p-5 md:rounded-[2.25rem] md:p-6 lg:p-7">
            <VisualPanel activeIndex={activeIndex} mockLabels={mockLabels} />
          </div>
        </div>
      </div>
    </div>
  );
}
