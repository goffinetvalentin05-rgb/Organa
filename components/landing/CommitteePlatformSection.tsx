"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  CupSoda,
  FileCheck,
  FileText,
  FolderOpen,
  Globe,
  Handshake,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Megaphone,
  MessageCircle,
  QrCode,
  Sheet,
  StickyNote,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { easePremium } from "@/components/landing/landing-motion";

const FEATURES: { label: string; icon: LucideIcon; tone: string }[] = [
  { label: "Membres", icon: Users, tone: "blue" },
  { label: "Cotisations", icon: Wallet, tone: "amber" },
  { label: "Factures", icon: FileText, tone: "sand" },
  { label: "Finances", icon: LineChart, tone: "mint" },
  { label: "Plannings", icon: CalendarDays, tone: "teal" },
  { label: "Événements", icon: CalendarRange, tone: "rose" },
  { label: "Communication", icon: Megaphone, tone: "violet" },
  { label: "Documents", icon: FolderOpen, tone: "sky" },
  { label: "QR Codes", icon: QrCode, tone: "blue" },
  { label: "Sponsoring", icon: Handshake, tone: "amber" },
  { label: "Buvette", icon: CupSoda, tone: "rose" },
  { label: "Tâches", icon: ListChecks, tone: "mint" },
  { label: "Réunions", icon: UsersRound, tone: "violet" },
  { label: "Page publique", icon: Globe, tone: "teal" },
  { label: "Dashboard", icon: LayoutDashboard, tone: "sky" },
];

const ORBIT = FEATURES.map((item, index) => {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / FEATURES.length;
  const tilt = (index % 2 === 0 ? -1 : 1) * (1.5 + (index % 4));
  const size = index % 5 === 0 ? "lg" : index % 3 === 1 ? "sm" : "md";
  return {
    ...item,
    left: `${(50 + Math.cos(angle) * 40).toFixed(2)}%`,
    top: `${(50 + Math.sin(angle) * 37).toFixed(2)}%`,
    tilt,
    size,
    aim: `${((angle * 180) / Math.PI + 180).toFixed(1)}deg`,
  };
});

const BEFORE: { label: string; detail: string; icon: LucideIcon; tone: string }[] = [
  { label: "WhatsApp", detail: "Qui est dispo ?", icon: MessageCircle, tone: "mint" },
  { label: "Excel", detail: "Onglet inscriptions", icon: Sheet, tone: "teal" },
  { label: "Papier", detail: "Liste à la main", icon: StickyNote, tone: "sand" },
];

const AFTER = ["14 inscrits", "Créneaux publiés", "Équipe prévenue"];

function useReveal(amount = 0.32) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount });
  return { ref, reduce: Boolean(reduce), active: Boolean(reduce) || inView };
}

function CardHead({ index, title }: { index: string; title: string }) {
  return (
    <div className="lp-platform__card-head">
      <span className="lp-platform__num" aria-hidden>
        {index}
      </span>
      <h3>{title}</h3>
    </div>
  );
}

function ObillzSymbol({ tone = "blue" }: { tone?: "blue" | "light" }) {
  return <span className={`lp-platform__symbol lp-platform__symbol--${tone}`} />;
}

function AutomateCard() {
  const { ref, reduce, active } = useReveal(0.38);
  const [phase, setPhase] = useState(reduce ? 5 : 0);

  useEffect(() => {
    if (reduce) {
      setPhase(5);
      return;
    }
    if (!active) return;
    const timers = [220, 720, 1240, 1760, 2280].map((delay, index) =>
      window.setTimeout(() => setPhase(index + 1), delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [active, reduce]);

  return (
    <motion.article
      ref={ref}
      className="lp-platform__card lp-platform__card--auto"
      initial={reduce ? false : { opacity: 0, x: 150, y: 28, scale: 0.96 }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.28 }}
      transition={{ duration: 0.95, ease: easePremium }}
    >
      <CardHead index="1" title="Automatiser" />
      <div className="lp-platform__flow" aria-hidden>
        <span className={`lp-platform__step${phase >= 1 ? " is-on" : ""}`}>
          <span className="lp-platform__step-icon">
            <FileCheck strokeWidth={1.75} />
          </span>
          <span>PV validé</span>
        </span>
        <span className={`lp-platform__link${phase >= 2 ? " is-on" : ""}`} />
        <span className={`lp-platform__step${phase >= 3 ? " is-on" : ""}`}>
          <span className="lp-platform__step-icon">
            <ListChecks strokeWidth={1.75} />
          </span>
          <span>Tâche créée</span>
        </span>
        <span className={`lp-platform__link${phase >= 4 ? " is-on" : ""}`} />
        <span className={`lp-platform__step lp-platform__step--todo${phase >= 5 ? " is-on" : ""}`}>
          <span className="lp-platform__step-icon">
            <ListChecks strokeWidth={1.75} />
          </span>
          <span className="lp-platform__step-copy">
            <span className="lp-platform__step-kicker">To Do List</span>
            <span className={`lp-platform__task${phase >= 5 ? " is-in" : ""}`}>
              <span className="lp-platform__tick" />
              Tâche du PV
            </span>
          </span>
        </span>
      </div>
    </motion.article>
  );
}

function SimplifyCard() {
  const { ref, reduce, active } = useReveal(0.34);
  const [phase, setPhase] = useState(reduce ? 3 : 0);

  useEffect(() => {
    if (reduce) {
      setPhase(3);
      return;
    }
    if (!active) return;
    const beats = [1300, 900, 700, 2800];
    let step = 0;
    let timer = 0;
    const tick = () => {
      setPhase(step);
      timer = window.setTimeout(() => {
        step = (step + 1) % beats.length;
        tick();
      }, beats[step]);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [active, reduce]);

  const pulling = !reduce && (phase === 1 || phase === 2);
  const lit = reduce || phase >= 3 ? AFTER.length : phase === 2 ? 1 : 0;

  return (
    <motion.article
      ref={ref}
      className="lp-platform__card lp-platform__card--simple"
      initial={reduce ? false : { opacity: 0, x: -150, y: 28, scale: 0.96 }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.28 }}
      transition={{ duration: 0.95, ease: easePremium }}
    >
      <CardHead index="2" title="Simplifier" />
      <div className={`lp-platform__shift${pulling ? " is-pull" : ""}${phase >= 2 && !reduce ? " is-glow" : ""}`}>
        <div className="lp-platform__before">
          <p>Avant</p>
          {BEFORE.map((item) => {
            const Icon = item.icon;
            return (
              <span key={item.label} className={`lp-platform__scrap lp-platform__tone--${item.tone}`}>
                <span>
                  <Icon strokeWidth={1.75} />
                </span>
                <strong>{item.label}</strong>
                <em>{item.detail}</em>
              </span>
            );
          })}
        </div>
        <span className="lp-platform__pivot" aria-hidden>
          <span className="lp-platform__hub">
            <ObillzSymbol tone="light" />
          </span>
        </span>
        <div className="lp-platform__after">
          <p>Avec OBILLZ</p>
          <div className="lp-platform__plan">
            <span className="lp-platform__plan-kicker">Planning</span>
            <strong>Tournoi samedi</strong>
            {AFTER.map((label, index) => (
              <span key={label} className={`lp-platform__plan-row${index < lit ? " is-on" : ""}`}>
                <span className="lp-platform__tick" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function CentralCard() {
  const { ref, reduce, active } = useReveal(0.2);
  const [live, setLive] = useState(0);

  useEffect(() => {
    if (!active || reduce) return;
    const id = window.setInterval(() => setLive((current) => (current + 1) % FEATURES.length), 1700);
    return () => window.clearInterval(id);
  }, [active, reduce]);

  return (
    <motion.article
      ref={ref}
      className="lp-platform__card lp-platform__card--central"
      initial={reduce ? false : { opacity: 0, y: 170, scale: 0.86 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 1.05, ease: easePremium }}
    >
      <CardHead index="3" title="Centraliser" />
      <div className="lp-platform__orbit">
        <span className="lp-platform__mark">
          <ObillzSymbol />
        </span>
        {ORBIT.map((item, index) => {
          const Icon = item.icon;
          return (
            <span
              key={item.label}
              className={`lp-platform__sat lp-platform__sat--${item.size}${!reduce && active && index === live ? " is-live" : ""}`}
              style={{
                ["--sat-x" as string]: item.left,
                ["--sat-y" as string]: item.top,
                ["--tilt" as string]: `${item.tilt}deg`,
                ["--aim" as string]: item.aim,
              }}
            >
              <span className="lp-platform__ray" />
              <motion.span
                className={`lp-platform__sat-icon lp-platform__tone--${item.tone}`}
                initial={reduce ? false : { opacity: 0, y: 18, scale: 0.86 }}
                animate={active ? { opacity: 1, y: 0, scale: 1 } : undefined}
                transition={{ duration: 0.6, delay: reduce ? 0 : 0.12 + index * 0.04, ease: easePremium }}
              >
                <span>
                  <Icon strokeWidth={1.8} />
                </span>
              </motion.span>
              <span className="lp-platform__sat-label">{item.label}</span>
            </span>
          );
        })}
      </div>
    </motion.article>
  );
}

export default function CommitteePlatformSection() {
  return (
    <section id="modules" className="lp-platform scroll-mt-32 md:scroll-mt-36" aria-labelledby="lp-platform-title">
      <div className="lp-platform__wrap">
        <header className="lp-platform__intro">
          <h2 id="lp-platform-title" className="lp-platform__title">
            <span>Pensé pour votre comité.</span>
            <span>Construit pour faire grandir votre club.</span>
          </h2>
          <p className="lp-platform__lead">
            Les clubs reposent sur des personnes qui donnent déjà énormément de leur temps.
            <span className="lp-platform__lead-strong">OBILLZ a été pensé pour leur en faire récupérer.</span>
          </p>
        </header>
        <div className="lp-platform__cards">
          <AutomateCard />
          <SimplifyCard />
          <CentralCard />
        </div>
      </div>
    </section>
  );
}
