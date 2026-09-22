"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import ScrollReveal from "@/components/landing/ScrollReveal";
import { easePremium } from "@/components/landing/landing-motion";

const CONVERGE = [
  {
    label: "Facture",
    from: { left: "22%", top: "24%" },
    mid: { left: "18%", top: "34%" },
    to: { left: "30%", top: "40%" },
    delay: 0,
  },
  {
    label: "Cotisation",
    from: { left: "74%", top: "22%" },
    mid: { left: "78%", top: "32%" },
    to: { left: "70%", top: "38%" },
    delay: 0.12,
  },
  {
    label: "Document",
    from: { left: "22%", top: "76%" },
    mid: { left: "18%", top: "66%" },
    to: { left: "32%", top: "68%" },
    delay: 0.22,
  },
  {
    label: "Réunion",
    from: { left: "74%", top: "74%" },
    mid: { left: "78%", top: "64%" },
    to: { left: "68%", top: "66%" },
    delay: 0.3,
  },
  {
    label: "Tâche",
    from: { left: "70%", top: "18%" },
    mid: { left: "76%", top: "28%" },
    to: { left: "50%", top: "18%" },
    delay: 0.08,
  },
] as const;

const BITS = [
  { kind: "card", from: { left: "4%", top: "8%", rotate: -8 }, to: { left: "12%", top: "14%", rotate: 0 }, delay: 0 },
  { kind: "line", from: { left: "62%", top: "4%", rotate: 7 }, to: { left: "12%", top: "36%", rotate: 0 }, delay: 0.08 },
  { kind: "task", from: { left: "2%", top: "58%", rotate: 5 }, to: { left: "12%", top: "52%", rotate: 0 }, delay: 0.14 },
  { kind: "ping", from: { left: "64%", top: "42%", rotate: -6 }, to: { left: "12%", top: "68%", rotate: 0 }, delay: 0.2 },
  { kind: "doc", from: { left: "38%", top: "74%", rotate: 8 }, to: { left: "12%", top: "78%", rotate: 0 }, delay: 0.26 },
] as const;

function useGather(play: boolean, still: boolean, hold: number) {
  const [run, setRun] = useState(0);
  const [gather, setGather] = useState(still);

  useEffect(() => {
    if (still) {
      setGather(true);
      return;
    }
    if (!play) return;

    setGather(false);
    const arm = window.setTimeout(() => setGather(true), 780);
    const loop = window.setTimeout(() => setRun((value) => value + 1), hold);
    return () => {
      window.clearTimeout(arm);
      window.clearTimeout(loop);
    };
  }, [play, still, run, hold]);

  return { gather: still || gather, run };
}

function AutomateVisual({ play, still }: { play: boolean; still: boolean }) {
  const [phase, setPhase] = useState(still ? 6 : 0);

  useEffect(() => {
    if (still) {
      setPhase(6);
      return;
    }
    if (!play) return;

    let current = 0;
    let timer = 0;
    let cancelled = false;
    setPhase(0);

    const advance = () => {
      if (cancelled) return;
      current += 1;
      if (current > 6) {
        timer = window.setTimeout(() => {
          if (cancelled) return;
          current = 0;
          setPhase(0);
          timer = window.setTimeout(advance, 640);
        }, 3200);
        return;
      }
      setPhase(current);
      timer = window.setTimeout(advance, current % 2 === 1 ? 720 : 620);
    };

    timer = window.setTimeout(advance, 360);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [play, still]);

  const steps = [
    { label: "PV validé", on: phase >= 1 },
    { label: "Tâche créée", on: phase >= 3 },
  ] as const;

  return (
    <article className="lp-platform__piece lp-platform__piece--auto">
      <h3 className="lp-platform__piece-title">Automatiser</h3>
      <div className="lp-platform__flow">
        {steps.map((step, index) => (
          <div key={step.label} className="lp-platform__flow-step">
            <span className={`lp-platform__node${step.on ? " is-on" : ""}`}>{step.label}</span>
            <span className={`lp-platform__link${phase >= index * 2 + 2 ? " is-on" : ""}`} aria-hidden>
              <svg viewBox="0 0 48 8" preserveAspectRatio="none">
                <path d="M1 4 H47" />
              </svg>
            </span>
          </div>
        ))}
        <div className={`lp-platform__node lp-platform__node--todo${phase >= 5 ? " is-on" : ""}`}>
          <span>To Do List</span>
          <span className={`lp-platform__todo${phase >= 6 ? " is-in" : ""}`}>
            <span className="lp-platform__todo-inner">
              <span className="lp-platform__tick" />
              <span className="lp-platform__todo-line" />
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}

function CentralizeVisual({ play, still }: { play: boolean; still: boolean }) {
  const { gather, run } = useGather(play, still, 5600);

  return (
    <article className="lp-platform__piece lp-platform__piece--central">
      <h3 className="lp-platform__piece-title">Centraliser</h3>
      <div className="lp-platform__converge" aria-hidden>
        <span className="lp-platform__hub">OBILLZ</span>
        {CONVERGE.map((item) =>
          still ? (
            <span key={item.label} className="lp-platform__chip" style={item.to}>
              {item.label}
            </span>
          ) : (
            <motion.span
              key={`${item.label}-${run}`}
              className="lp-platform__chip"
              initial={{ ...item.from, opacity: 0 }}
              animate={
                gather
                  ? {
                      left: [item.from.left, item.mid.left, item.to.left],
                      top: [item.from.top, item.mid.top, item.to.top],
                      opacity: 1,
                    }
                  : { ...item.from, opacity: 1 }
              }
              transition={
                gather
                  ? { duration: 1.7, delay: item.delay, ease: easePremium, times: [0, 0.46, 1] }
                  : { duration: 0.45, ease: easePremium }
              }
            >
              {item.label}
            </motion.span>
          )
        )}
      </div>
    </article>
  );
}

function BitShape({ kind }: { kind: (typeof BITS)[number]["kind"] }) {
  if (kind === "card") {
    return (
      <span className="lp-platform__bit lp-platform__bit--card">
        <span />
      </span>
    );
  }
  if (kind === "line") {
    return (
      <span className="lp-platform__bit lp-platform__bit--line">
        <span />
        <span />
      </span>
    );
  }
  if (kind === "task") {
    return (
      <span className="lp-platform__bit lp-platform__bit--task">
        <span />
        <span />
      </span>
    );
  }
  if (kind === "ping") {
    return (
      <span className="lp-platform__bit lp-platform__bit--ping">
        <span />
        <span />
      </span>
    );
  }
  return (
    <span className="lp-platform__bit lp-platform__bit--doc">
      <span />
    </span>
  );
}

function SimplifyVisual({ play, still }: { play: boolean; still: boolean }) {
  const { gather, run } = useGather(play, still, 5400);

  return (
    <article className="lp-platform__piece lp-platform__piece--simple">
      <h3 className="lp-platform__piece-title">Simplifier</h3>
      <div className="lp-platform__mess" aria-hidden>
        {BITS.map((bit) =>
          still ? (
            <span key={bit.kind} className="lp-platform__float" style={{ left: bit.to.left, top: bit.to.top }}>
              <BitShape kind={bit.kind} />
            </span>
          ) : (
            <motion.span
              key={`${bit.kind}-${run}`}
              className="lp-platform__float"
              initial={{ ...bit.from, opacity: 0 }}
              animate={
                gather
                  ? { left: bit.to.left, top: bit.to.top, rotate: 0, opacity: 1 }
                  : { ...bit.from, opacity: 1 }
              }
              transition={
                gather
                  ? { duration: 1.45, delay: bit.delay, ease: easePremium }
                  : { duration: 0.4, ease: easePremium }
              }
            >
              <BitShape kind={bit.kind} />
            </motion.span>
          )
        )}
      </div>
    </article>
  );
}

export default function CommitteePlatformSection() {
  const reduceMotion = useReducedMotion();
  const [still, setStill] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { amount: 0.22, once: true });

  useEffect(() => {
    if (reduceMotion) setStill(true);
  }, [reduceMotion]);

  const play = inView && !still;

  return (
    <section className="lp-platform" aria-labelledby="lp-platform-title">
      <div className="lp-platform__wrap">
        <ScrollReveal y={22}>
          <h2 id="lp-platform-title" className="lp-platform__title">
            <span>Pensé pour votre comité.</span>
            <span>Construit pour faire grandir votre club.</span>
          </h2>
        </ScrollReveal>

        <div className="lp-platform__split">
          <ScrollReveal className="lp-platform__copy" y={16} delay={0.04}>
            <p className="lp-platform__lead">
              Les clubs reposent sur des personnes qui donnent déjà énormément de leur temps.
              <span className="lp-platform__lead-strong">
                OBILLZ a été pensé pour leur en faire récupérer.
              </span>
            </p>
          </ScrollReveal>

          <ScrollReveal className="lp-platform__visual" y={20} delay={0.06}>
            <div ref={stageRef} className="lp-platform__stage">
              <AutomateVisual play={play} still={still} />
              <CentralizeVisual play={play} still={still} />
              <SimplifyVisual play={play} still={still} />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
