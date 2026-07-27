"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, type MouseEvent } from "react";
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
              <span className="mx-1 h-px w-6 bg-slate-200 lg:hidden" aria-hidden />
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
      className="relative min-h-[220px] sm:min-h-[240px]"
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
            className="how-it-works-blue-text select-none text-[clamp(4rem,11vw,6.75rem)] font-black leading-[0.9] tracking-[-0.06em]"
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
      className="relative min-h-[320px] sm:min-h-[360px] lg:min-h-[400px]"
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

export default function HowItWorksShowcase({
  steps,
  mockLabels,
}: {
  steps: Step[];
  mockLabels: MockLabels;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const selectStep = (index: number, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex(index);
  };

  return (
    <div className="relative">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12 xl:gap-16">
        <div className="flex flex-col gap-6 sm:gap-8">
          <div className="flex items-start gap-5 sm:gap-6">
            <StepNav activeIndex={activeIndex} onSelect={selectStep} />
            <div className="min-w-0 flex-1 pt-0.5">
              <StepContent steps={steps} activeIndex={activeIndex} />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-100/70 p-4 sm:p-5 md:rounded-[2.25rem] md:p-6 lg:p-7">
          <VisualPanel activeIndex={activeIndex} mockLabels={mockLabels} />
        </div>
      </div>
    </div>
  );
}
