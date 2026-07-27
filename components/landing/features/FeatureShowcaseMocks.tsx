"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  Check,
  Clock,
  MapPin,
  Plus,
  Search,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { easePremium } from "@/components/landing/landing-motion";
import { landingPremiumInnerClass } from "@/components/ui/styles";

type MockProps = { active?: boolean; wide?: boolean };

/* ── Shared primitives (Obillz tokens) ── */

function StatusBadge({
  variant,
  children,
  large,
  pulse,
}: {
  variant: "success" | "info" | "warning" | "error" | "neutral";
  children: ReactNode;
  large?: boolean;
  pulse?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const styles = {
    success: "border-emerald-400/25 bg-emerald-500/[0.12] text-emerald-300",
    info: "border-[#38BDF8]/25 bg-[#2563EB]/[0.12] text-[#38BDF8]",
    warning: "border-amber-400/22 bg-amber-500/[0.1] text-amber-300",
    error: "border-rose-400/25 bg-rose-500/[0.12] text-rose-300",
    neutral: "border-white/14 bg-white/[0.06] text-[rgba(226,232,240,0.7)]",
  };
  const pulseAnim =
    pulse && !reduceMotion
      ? { boxShadow: ["0 0 0 transparent", "0 0 16px rgba(52,211,153,0.22)", "0 0 0 transparent"] }
      : undefined;

  return (
    <motion.span
      animate={pulseAnim}
      transition={pulseAnim ? { duration: 2.6, repeat: Infinity } : undefined}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold leading-none ${styles[variant]} ${
        large ? "px-3 py-1.5 text-[11px]" : "px-2 py-[3px] text-[9px]"
      }`}
    >
      {children}
    </motion.span>
  );
}

function MemberAvatar({
  initials,
  gradient,
  size = "md",
  online,
  highlight,
}: {
  initials: string;
  gradient: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
  highlight?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const sizes = {
    sm: { outer: "h-8 w-8", inner: "h-[1.75rem] w-[1.75rem] text-[9px]", ring: "p-[1.5px]" },
    md: { outer: "h-10 w-10", inner: "h-[2.25rem] w-[2.25rem] text-[10px]", ring: "p-[2px]" },
    lg: { outer: "h-12 w-12", inner: "h-[2.75rem] w-[2.75rem] text-[11px]", ring: "p-[2px]" },
  };
  const s = sizes[size];

  return (
    <span className={`relative inline-flex shrink-0 ${s.outer}`}>
      <span
        className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${gradient} ${s.ring} shadow-[0_0_18px_rgba(37,99,235,0.25)]`}
      >
        <span
          className={`flex ${s.inner} items-center justify-center rounded-full bg-[#020617]/50 font-bold text-white backdrop-blur-[1px]`}
        >
          {initials}
        </span>
      </span>
      {online ? (
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#020617] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
      ) : null}
      {highlight && !reduceMotion ? (
        <motion.span
          className="absolute -inset-1 rounded-full border border-[#38BDF8]/30"
          animate={{ opacity: [0.15, 0.55, 0.15], scale: [1, 1.06, 1] }}
          transition={{ duration: 2.6, repeat: Infinity }}
          aria-hidden
        />
      ) : null}
    </span>
  );
}

function AvatarStack({
  items,
  extra,
}: {
  items: { id: string; initials: string; gradient: string }[];
  extra?: number;
}) {
  return (
    <div className="flex items-center">
      {items.map((item, i) => (
        <span
          key={item.id}
          className="relative"
          style={{ marginLeft: i === 0 ? 0 : -10, zIndex: items.length - i }}
        >
          <MemberAvatar initials={item.initials} gradient={item.gradient} size="sm" />
        </span>
      ))}
      {extra ? (
        <span
          className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/14 bg-white/[0.07] text-[9px] font-semibold text-[rgba(226,232,240,0.75)] backdrop-blur-sm"
          style={{ marginLeft: -10, zIndex: 0 }}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

function MockRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`${landingPremiumInnerClass} flex items-center gap-3 px-3.5 py-3 transition-[border-color,background-color] duration-300 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function ProgressBar({ value, active }: { value: number; active?: boolean }) {
  const reduceMotion = useReducedMotion();
  const pct = `${value}%`;
  return (
    <div className="relative overflow-hidden rounded-full bg-white/[0.06] h-[7px]">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#67E8F9]"
        initial={reduceMotion ? false : { width: "0%" }}
        animate={{ width: active || reduceMotion ? pct : `${Math.max(value - 18, 40)}%` }}
        transition={{ duration: 1.2, ease: easePremium }}
      />
      <motion.div
        className="absolute inset-y-[-2px] w-6 rounded-full bg-[#67E8F9]/40 blur-[3px]"
        style={{ left: `calc(${pct} - 0.75rem)` }}
        animate={active && !reduceMotion ? { opacity: [0.3, 0.75, 0.3] } : { opacity: 0.4 }}
        transition={{ duration: 2.4, repeat: Infinity }}
        aria-hidden
      />
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   01 · MEMBRES — search bar + 2–3 member cards + floating "Nouveau"
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function MembersShowcaseMock({ active }: MockProps) {
  const reduceMotion = useReducedMotion();
  const members = [
    { id: "lea", initials: "LM", name: "Léa Martin", role: "Juniors A", gradient: "from-sky-400 to-blue-600", status: "Actif" as const, online: true },
    { id: "thomas", initials: "TK", name: "Thomas K.", role: "Comité", gradient: "from-indigo-400 to-violet-600", status: "Actif" as const, online: true },
    { id: "nina", initials: "NR", name: "Nina R.", role: "Senior", gradient: "from-cyan-400 to-teal-500", status: "Nouveau" as const, online: false },
  ];

  return (
    <div className="relative flex h-full flex-col justify-end">
      {/* Search bar — large, clipped at top */}
      <div className="relative mb-4 flex items-center gap-2.5 overflow-hidden rounded-xl border border-white/14 bg-white/[0.07] px-4 py-3 backdrop-blur-sm">
        <Search className="h-4 w-4 shrink-0 text-[rgba(226,232,240,0.45)]" strokeWidth={2} aria-hidden />
        <span className="text-[13px] text-[rgba(226,232,240,0.4)]">Rechercher un membre…</span>
        <div className="ml-auto flex gap-2">
          <span className="rounded-lg border border-white/12 bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium text-[rgba(226,232,240,0.6)]">
            Joueur ▾
          </span>
          <span className="rounded-lg border border-white/12 bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium text-[rgba(226,232,240,0.6)]">
            Juniors A ▾
          </span>
        </div>
      </div>

      {/* Member rows */}
      <ul className="relative space-y-2.5">
        {members.map((m, i) => (
          <motion.li
            key={m.id}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: easePremium }}
          >
            <MockRow>
              <MemberAvatar
                initials={m.initials}
                gradient={m.gradient}
                size="md"
                online={m.online}
                highlight={active && i === 0}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold leading-tight text-[#F8FAFC]">{m.name}</span>
                <span className="mt-0.5 block text-[11px] text-[rgba(226,232,240,0.5)]">{m.role}</span>
              </span>
              <StatusBadge variant={m.status === "Nouveau" ? "info" : "neutral"}>
                {m.status}
              </StatusBadge>
            </MockRow>
          </motion.li>
        ))}
      </ul>

      {/* Floating "Nouveau membre" panel — partially clipped bottom-right */}
      <motion.div
        className="absolute -bottom-3 -right-3 z-10 w-[200px] overflow-hidden rounded-2xl border border-white/20 bg-[#0F2744]/95 p-4 shadow-[0_24px_56px_rgba(2,6,23,0.5)] backdrop-blur-xl"
        initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: easePremium }}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-[0_0_14px_rgba(37,99,235,0.35)]">
            <Plus className="h-3.5 w-3.5 text-white" strokeWidth={2.5} aria-hidden />
          </span>
          <span className="text-[12px] font-bold text-white">Nouveau membre</span>
        </div>
        <div className="space-y-1.5">
          <div className="h-2 w-3/4 rounded bg-white/10" />
          <div className="h-2 w-1/2 rounded bg-white/[0.07]" />
        </div>
      </motion.div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   02 · COTISATIONS — big amount + statuses + 1-2 rows + animation
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function CotisationsShowcaseMock({ active }: MockProps) {
  const reduceMotion = useReducedMotion();
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setPaid((v) => !v), active ? 2600 : 3600);
    return () => window.clearInterval(id);
  }, [active, reduceMotion]);

  return (
    <div className="relative flex h-full flex-col justify-end">
      {/* Big headline amount */}
      <div className="relative mb-5">
        <div className="flex items-end gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(226,232,240,0.45)]">
              Encaissements saison 25/26
            </p>
            <p className="mt-1 text-[2rem] font-bold leading-none tracking-tight text-white sm:text-[2.2rem]">
              CHF 18&apos;400
            </p>
          </div>
          <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            92%
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar value={92} active={active} />
        </div>
      </div>

      {/* Status badges — large */}
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge variant="success" large>
          <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          156 payées
        </StatusBadge>
        <StatusBadge variant="warning" large>
          <Clock className="h-3 w-3" strokeWidth={2} aria-hidden />
          14 en attente
        </StatusBadge>
        <StatusBadge variant="error" large>
          2 en retard
        </StatusBadge>
      </div>

      {/* Single cotisation row with animated status */}
      <MockRow>
        <MemberAvatar initials="DS" gradient="from-indigo-400 to-violet-600" size="md" />
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-semibold text-[#F8FAFC]">Dupuit Simon</span>
          <span className="mt-0.5 block text-[10px] text-[rgba(226,232,240,0.5)]">COT-2026-002 · 280.00 CHF</span>
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={paid ? "paid" : "pending"}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.85, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.85, y: -4 }}
            transition={{ duration: 0.3, ease: easePremium }}
            className="inline-flex"
          >
            <StatusBadge variant={paid ? "success" : "info"} pulse={paid}>
              {paid ? (
                <>
                  <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
                  Payée
                </>
              ) : (
                "En attente"
              )}
            </StatusBadge>
          </motion.span>
        </AnimatePresence>
      </MockRow>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   03 · ÉVÉNEMENTS — big date card + info + 3 participants + new inscription
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function EvenementsShowcaseMock({ active }: MockProps) {
  const reduceMotion = useReducedMotion();
  const [showNew, setShowNew] = useState(false);

  const attendees = [
    { id: "marc", initials: "MD", gradient: "from-blue-400 to-indigo-500" },
    { id: "julie", initials: "JP", gradient: "from-violet-400 to-purple-500" },
    { id: "alex", initials: "AT", gradient: "from-cyan-400 to-blue-500" },
  ];

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setShowNew((v) => !v), active ? 3000 : 4000);
    return () => window.clearInterval(id);
  }, [active, reduceMotion]);

  return (
    <div className="relative flex h-full flex-col justify-end">
      {/* Big date + event name */}
      <div className="mb-5 flex items-start gap-4">
        <motion.div
          className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/16 bg-gradient-to-br from-[#2563EB]/35 to-[#020617]/80 shadow-[0_0_28px_rgba(37,99,235,0.22)]"
          animate={active && !reduceMotion ? { y: [0, -3, 0] } : undefined}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(103,232,249,0.15),transparent_60%)]" aria-hidden />
          <span className="relative text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgba(226,232,240,0.5)]">
            Mar
          </span>
          <span className="relative text-[1.75rem] font-bold leading-none text-white">14</span>
        </motion.div>

        <div className="min-w-0 flex-1 pt-1">
          <p className="text-[16px] font-bold leading-tight text-white sm:text-[17px]">Tournoi de printemps</p>
          <div className="mt-2 flex flex-col gap-1">
            <p className="flex items-center gap-1.5 text-[11px] text-[rgba(226,232,240,0.55)]">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#38BDF8]/55" strokeWidth={2} aria-hidden />
              14 mars 2026 · 09:00
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-[rgba(226,232,240,0.55)]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#38BDF8]/55" strokeWidth={2} aria-hidden />
              Stade municipal · Terrains 1–3
            </p>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AvatarStack
            items={attendees.map((a) => ({ id: a.id, initials: a.initials, gradient: a.gradient }))}
            extra={21}
          />
        </div>
        <StatusBadge variant="info">
          <Users className="mr-0.5 inline h-3 w-3 opacity-70" strokeWidth={2} aria-hidden />
          {showNew ? "25" : "24"} inscrits
        </StatusBadge>
      </div>

      {/* New inscription appearing */}
      <AnimatePresence>
        {showNew ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.4, ease: easePremium }}
            className="overflow-hidden"
          >
            <MockRow className="border border-emerald-400/15 bg-emerald-500/[0.04]">
              <MemberAvatar initials="SB" gradient="from-emerald-400 to-teal-500" size="sm" online />
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-medium text-[#F8FAFC]">Sophie Blanc</span>
                <span className="mt-0.5 block text-[10px] text-[rgba(226,232,240,0.5)]">Vient de s&apos;inscrire</span>
              </span>
              <StatusBadge variant="success" pulse>
                <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
                Confirmé
              </StatusBadge>
            </MockRow>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   04 · SPONSORS — single large sponsor card + contract preview
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function SponsorsShowcaseMock({ active }: MockProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex h-full flex-col justify-end">
      {/* Sponsor card */}
      <div className="relative">
        <div className="flex items-start gap-4">
          <MemberAvatar initials="BL" gradient="from-amber-400 to-orange-500" size="lg" highlight={active} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[rgba(226,232,240,0.45)]">
              Contrat sponsor
            </p>
            <p className="mt-1 text-[16px] font-bold leading-tight text-white">Boulangerie du Lac</p>
            <p className="mt-0.5 text-[11px] text-[rgba(226,232,240,0.5)]">Partenaire principal · Or</p>
          </div>
          <motion.span
            animate={
              active && !reduceMotion
                ? { boxShadow: ["0 0 0 transparent", "0 0 16px rgba(34,211,238,0.22)", "0 0 0 transparent"] }
                : undefined
            }
            transition={{ duration: 2.8, repeat: Infinity }}
          >
            <StatusBadge variant="info" large>Renouvellement</StatusBadge>
          </motion.span>
        </div>

        {/* Contract details — 2×2 grid */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/12 bg-white/[0.04] p-3.5">
            <p className="text-[10px] text-[rgba(226,232,240,0.45)]">Montant annuel</p>
            <p className="mt-1 text-[18px] font-bold tabular-nums leading-none text-white">CHF 2&apos;400</p>
          </div>
          <div className="rounded-xl border border-white/12 bg-white/[0.04] p-3.5">
            <p className="text-[10px] text-[rgba(226,232,240,0.45)]">Échéance</p>
            <motion.p
              className="mt-1 flex items-center gap-1.5 text-[16px] font-bold tabular-nums leading-none text-[#67E8F9]/90"
              animate={
                active && !reduceMotion
                  ? { textShadow: ["0 0 0 transparent", "0 0 16px rgba(34,211,238,0.3)", "0 0 0 transparent"] }
                  : undefined
              }
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Clock className="h-4 w-4 text-[#38BDF8]/55" strokeWidth={2} aria-hidden />
              01.09.26
            </motion.p>
          </div>
        </div>

        {/* Mini contract preview — white doc peeking */}
        <motion.div
          className="absolute -bottom-4 -right-4 z-10 w-[140px] rotate-2 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3 text-[#0F172A] shadow-[0_16px_40px_rgba(2,6,23,0.3)]"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.55, ease: easePremium }}
        >
          <p className="text-[8px] font-bold uppercase tracking-wider text-[#1A23FF]">Contrat</p>
          <div className="mt-1.5 space-y-1">
            <div className="h-1.5 w-full rounded bg-slate-100" />
            <div className="h-1.5 w-3/4 rounded bg-slate-100" />
            <div className="h-1.5 w-1/2 rounded bg-slate-50" />
          </div>
          <div className="mt-2 flex justify-between text-[7px] text-slate-500">
            <span>390.00 CHF</span>
            <span>08.06.2026</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   05 · DOCUMENTS — contained product visual under text
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function DocumentsShowcaseMock(_props: MockProps) {
  return (
    // Native img preserves PNG alpha; contained by parent visual zone
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/documents-obillz-preview.png"
      alt="Aperçu de documents Obillz : planning et procès-verbal de séance"
      width={1024}
      height={576}
      decoding="async"
      draggable={false}
      className="feature-card-documents__img block h-full w-full max-h-full max-w-full select-none bg-transparent object-contain object-bottom"
    />
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   06 · ACCÈS (conservé — large role cards)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function AccesShowcaseMock({ active, wide }: MockProps) {
  const reduceMotion = useReducedMotion();
  const roles = [
    { id: "president", initials: "PK", label: "Président", access: "Accès complet", gradient: "from-[#2563EB] to-[#1D4ED8]", tag: "Admin", online: true },
    { id: "treasurer", initials: "ML", label: "Trésorier", access: "Finances", gradient: "from-indigo-500 to-violet-600", tag: "Finances", online: true },
    { id: "secretary", initials: "SR", label: "Secrétaire", access: "Documents", gradient: "from-cyan-500 to-blue-600", tag: "Documents", online: false },
    { id: "committee", initials: "JB", label: "Comité", access: "Événements", gradient: "from-blue-400 to-sky-500", tag: "Événements", online: true },
  ];

  return (
    <div className={`relative flex h-full ${wide ? "flex-col justify-center gap-4" : "items-end justify-end"}`}>
      {wide ? (
        <div className="hidden w-full items-center justify-center gap-2 lg:flex">
          <AvatarStack
            items={roles.map((r) => ({ id: r.id, initials: r.initials, gradient: r.gradient }))}
          />
          <span className="text-[10px] text-[rgba(226,232,240,0.45)]">· 4 membres du comité</span>
        </div>
      ) : null}

      <div className={`relative grid w-full gap-3 ${wide ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1"}`}>
        {roles.map((role, i) => (
          <motion.div
            key={role.id}
            className={`${landingPremiumInnerClass} flex flex-col items-center px-4 py-4 text-center`}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: easePremium }}
          >
            <MemberAvatar
              initials={role.initials}
              gradient={role.gradient}
              size="lg"
              online={role.online}
              highlight={active && i === 0}
            />
            <span className="mt-3 text-[12px] font-semibold text-white">{role.label}</span>
            <span className="mt-0.5 text-[10px] text-[rgba(226,232,240,0.45)]">{role.access}</span>
            <span className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-[#38BDF8]/18 bg-[#2563EB]/[0.1] px-2.5 py-1 text-[9px] font-medium text-[rgba(226,232,240,0.75)]">
              <Shield className="h-3 w-3 text-[#38BDF8]/55" strokeWidth={2} aria-hidden />
              {role.tag}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Export map ── */

export const showcaseMockById: Record<string, ComponentType<MockProps>> = {
  membres: MembersShowcaseMock,
  cotisations: CotisationsShowcaseMock,
  evenements: EvenementsShowcaseMock,
  sponsors: SponsorsShowcaseMock,
  documents: DocumentsShowcaseMock,
  acces: AccesShowcaseMock,
};
