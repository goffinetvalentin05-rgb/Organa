"use client";

import type { ComponentType, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  Check,
  Clock,
  FileText,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { easePremium } from "@/components/landing/landing-motion";

type MockProps = { active?: boolean; wide?: boolean };

/* ── Shared primitives ── */

function MockLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-[0.13em] text-blue-300/42">
      {children}
    </span>
  );
}

function VisualGlow({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-3xl ${className ?? ""}`}
      aria-hidden
    />
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
    sm: { outer: "h-7 w-7", inner: "h-[1.625rem] w-[1.625rem] text-[8px]", ring: "p-[1.5px]" },
    md: { outer: "h-9 w-9", inner: "h-[2.125rem] w-[2.125rem] text-[9px]", ring: "p-[2px]" },
    lg: { outer: "h-11 w-11", inner: "h-[2.625rem] w-[2.625rem] text-[10px]", ring: "p-[2px]" },
  };
  const s = sizes[size];

  return (
    <span className={`relative inline-flex shrink-0 ${s.outer}`}>
      <span
        className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${gradient} ${s.ring} shadow-[0_0_16px_rgba(26,35,255,0.22)]`}
      >
        <span
          className={`flex ${s.inner} items-center justify-center rounded-full bg-[#0a1028]/40 font-bold text-white backdrop-blur-[1px]`}
        >
          {initials}
        </span>
      </span>
      {online ? (
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0a1028] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
      ) : null}
      {highlight && !reduceMotion ? (
        <motion.span
          className="absolute -inset-1 rounded-full border border-cyan-400/35"
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
          style={{ marginLeft: i === 0 ? 0 : -8, zIndex: items.length - i }}
        >
          <MemberAvatar initials={item.initials} gradient={item.gradient} size="sm" />
        </span>
      ))}
      {extra ? (
        <span
          className="relative flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[8px] font-semibold text-blue-100/70 backdrop-blur-sm"
          style={{ marginLeft: -8, zIndex: 0 }}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

function StatusBadge({
  variant,
  children,
  dot,
  pulse,
}: {
  variant: "success" | "warning" | "info" | "neutral";
  children: ReactNode;
  dot?: boolean;
  pulse?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const styles = {
    success: { wrap: "border-emerald-400/22 bg-emerald-500/[0.09]", dot: "bg-emerald-400" },
    warning: { wrap: "border-amber-400/20 bg-amber-500/[0.08]", dot: "bg-amber-400" },
    info: { wrap: "border-blue-400/22 bg-blue-500/[0.09]", dot: "bg-blue-400" },
    neutral: { wrap: "border-white/[0.09] bg-white/[0.04]", dot: "bg-blue-300/60" },
  };
  const s = styles[variant];

  return (
    <motion.span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-[3px] text-[9px] font-semibold leading-none tracking-[0.01em] text-white/85 ${s.wrap}`}
      animate={
        pulse && !reduceMotion
          ? { boxShadow: ["0 0 0 transparent", "0 0 14px rgba(52,211,153,0.2)", "0 0 0 transparent"] }
          : undefined
      }
      transition={{ duration: 2.6, repeat: Infinity }}
    >
      {dot ? <span className={`h-1.5 w-1.5 rounded-full ${s.dot} shadow-[0_0_6px_currentColor]`} /> : null}
      {children}
    </motion.span>
  );
}

function ProgressBar({
  value,
  active,
  height = "h-[6px]",
}: {
  value: number;
  active?: boolean;
  height?: string;
}) {
  const reduceMotion = useReducedMotion();
  const pct = `${value}%`;

  return (
    <div className={`relative overflow-hidden rounded-full bg-white/[0.05] ${height}`}>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#1A23FF] via-[#4f46e5] to-[#22d3ee]"
        initial={reduceMotion ? false : { width: "0%" }}
        animate={{ width: active || reduceMotion ? pct : `${Math.max(value - 18, 40)}%` }}
        transition={{ duration: 1.1, ease: easePremium }}
      />
      <motion.div
        className="absolute inset-y-[-2px] w-6 rounded-full bg-cyan-300/50 blur-[3px]"
        style={{ left: `calc(${pct} - 0.75rem)` }}
        animate={active && !reduceMotion ? { opacity: [0.3, 0.75, 0.3] } : { opacity: 0.4 }}
        transition={{ duration: 2.4, repeat: Infinity }}
        aria-hidden
      />
    </div>
  );
}

function MockRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 transition-[border-color,background-color,box-shadow] duration-300 group-hover/card:border-blue-400/18 group-hover/card:bg-white/[0.04] group-hover/card:shadow-[0_4px_20px_rgba(26,35,255,0.06)] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/* ── Card mocks ── */

export function MembersShowcaseMock({ active }: MockProps) {
  const reduceMotion = useReducedMotion();
  const members = [
    { id: "lea", initials: "LM", name: "Léa Martin", role: "Senior", gradient: "from-sky-400 to-blue-600", status: "Actif" as const, online: true },
    { id: "thomas", initials: "TK", name: "Thomas K.", role: "Comité", gradient: "from-indigo-400 to-violet-600", status: "Actif" as const, online: true },
    { id: "nina", initials: "NR", name: "Nina R.", role: "Junior", gradient: "from-cyan-400 to-teal-500", status: "Nouveau" as const, online: false },
  ];

  return (
    <div className="relative flex h-full flex-col justify-end">
      <VisualGlow className="right-0 top-0 h-28 w-28 bg-[radial-gradient(circle,rgba(26,35,255,0.32),transparent_68%)] opacity-40" />

      <div className="relative mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <MockLabel>Base membres</MockLabel>
          <AvatarStack
            items={members.map((m) => ({
              id: m.id,
              initials: m.initials,
              gradient: m.gradient,
            }))}
            extra={281}
          />
        </div>
        <StatusBadge variant="success" dot pulse={active}>
          284
        </StatusBadge>
      </div>

      <ul className="relative space-y-2">
        {members.map((m, i) => (
          <motion.li
            key={m.id}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.09, ease: easePremium }}
          >
            <MockRow>
              <MemberAvatar
                initials={m.initials}
                gradient={m.gradient}
                online={m.online}
                highlight={active && i === 0}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-medium leading-tight text-white">{m.name}</span>
                <span className="mt-0.5 block text-[9px] text-blue-200/40">{m.role}</span>
              </span>
              <StatusBadge variant={m.status === "Nouveau" ? "info" : "neutral"} dot={m.status === "Actif"}>
                {m.status}
              </StatusBadge>
            </MockRow>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export function CotisationsShowcaseMock({ active }: MockProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex h-full flex-col justify-end">
      <VisualGlow className="right-0 top-0 h-32 w-32 bg-[radial-gradient(circle,rgba(99,102,241,0.28),transparent_68%)] opacity-35" />

      <div className="relative flex items-center gap-4">
        {/* Anneau de progression */}
        <div className="relative shrink-0">
          <svg className="h-[4.5rem] w-[4.5rem] -rotate-90" viewBox="0 0 72 72" aria-hidden>
            <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <motion.circle
              cx="36"
              cy="36"
              r="30"
              fill="none"
              stroke="url(#cotGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={188.5}
              initial={reduceMotion ? false : { strokeDashoffset: 188.5 }}
              animate={{ strokeDashoffset: active || reduceMotion ? 188.5 * 0.08 : 188.5 * 0.28 }}
              transition={{ duration: 1.2, ease: easePremium }}
            />
            <defs>
              <linearGradient id="cotGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1A23FF" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold tabular-nums leading-none text-white">92</span>
            <span className="text-[8px] font-medium text-cyan-300/60">%</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <MockLabel>Saison 25/26</MockLabel>
          <p className="mt-1 text-[11px] text-blue-100/45">Taux de recouvrement</p>
          <div className="mt-2.5 flex gap-2">
            <div className="flex flex-1 flex-col rounded-xl border border-emerald-400/18 bg-emerald-500/[0.06] px-2.5 py-2">
              <span className="flex items-center gap-1 text-[9px] text-emerald-200/70">
                <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
                Payé
              </span>
              <span className="mt-0.5 text-sm font-bold tabular-nums text-white">156</span>
            </div>
            <div className="flex flex-1 flex-col rounded-xl border border-amber-400/16 bg-amber-500/[0.05] px-2.5 py-2">
              <span className="flex items-center gap-1 text-[9px] text-amber-200/65">
                <Clock className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
                En attente
              </span>
              <span className="mt-0.5 text-sm font-bold tabular-nums text-white">14</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[10px] text-blue-100/42">
            <TrendingUp className="h-3 w-3 text-cyan-400/50" strokeWidth={2} aria-hidden />
            Encaissements
          </span>
          <span className="text-[10px] font-semibold tabular-nums text-white/80">CHF 18&apos;400</span>
        </div>
        <ProgressBar value={92} active={active} />
      </div>

      <motion.div
        className="relative mt-3"
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.45, ease: easePremium }}
      >
        <MockRow className="justify-between">
          <div className="flex items-center gap-2">
            <MemberAvatar initials="LM" gradient="from-sky-400 to-blue-600" size="sm" />
            <span className="text-[10px] font-medium text-blue-100/50">Cotisation senior</span>
          </div>
          <StatusBadge variant="success" dot pulse={active}>
            Payé
          </StatusBadge>
        </MockRow>
      </motion.div>
    </div>
  );
}

export function EvenementsShowcaseMock({ active }: MockProps) {
  const reduceMotion = useReducedMotion();
  const attendees = [
    { id: "marc", initials: "MD", name: "Marc D.", gradient: "from-blue-400 to-indigo-500" },
    { id: "julie", initials: "JP", name: "Julie P.", gradient: "from-violet-400 to-purple-500" },
    { id: "alex", initials: "AT", name: "Alex T.", gradient: "from-cyan-400 to-blue-500" },
  ];

  return (
    <div className="relative flex h-full flex-col justify-end">
      <VisualGlow className="left-1/2 top-0 h-24 w-36 -translate-x-1/2 bg-[radial-gradient(circle,rgba(26,35,255,0.26),transparent_70%)] opacity-40" />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div className="flex gap-3">
          <motion.div
            className="relative flex h-[4.25rem] w-[4.25rem] shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl border border-blue-400/22 bg-gradient-to-br from-[#1A23FF]/25 to-[#0a1028]/60 shadow-[0_0_24px_rgba(26,35,255,0.18)]"
            animate={active && !reduceMotion ? { y: [0, -2, 0] } : undefined}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.15),transparent_60%)]" aria-hidden />
            <span className="relative text-[8px] font-semibold uppercase tracking-[0.12em] text-blue-200/55">Mar</span>
            <span className="relative text-xl font-bold leading-none text-white">14</span>
          </motion.div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">Tournoi printemps</p>
            <p className="mt-1 flex items-center gap-1 text-[10px] text-blue-200/40">
              <CalendarDays className="h-3 w-3 shrink-0 text-cyan-400/45" strokeWidth={2} aria-hidden />
              Inscription ouverte
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge variant="info" dot>
                <Users className="mr-0.5 inline h-2.5 w-2.5 opacity-70" strokeWidth={2} aria-hidden />
                24 inscrits
              </StatusBadge>
              <StatusBadge variant="success" dot>
                18 confirmés
              </StatusBadge>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-3">
        <div className="mb-2 flex items-center justify-between">
          <MockLabel>Inscrits récents</MockLabel>
          <AvatarStack
            items={attendees.map((a) => ({
              id: a.id,
              initials: a.initials,
              gradient: a.gradient,
            }))}
            extra={21}
          />
        </div>
        <ul className="space-y-1.5">
          {attendees.map((a, i) => (
            <motion.li
              key={a.id}
              initial={reduceMotion ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.08, duration: 0.4, ease: easePremium }}
            >
              <MockRow>
                <MemberAvatar initials={a.initials} gradient={a.gradient} size="sm" online />
                <span className="flex-1 text-[10px] font-medium text-blue-100/55">{a.name}</span>
                <StatusBadge variant="success" dot>
                  Confirmé
                </StatusBadge>
              </MockRow>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function SponsorsShowcaseMock({ active }: MockProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex h-full flex-col justify-end">
      <VisualGlow className="right-0 top-0 h-32 w-32 bg-[radial-gradient(circle,rgba(34,211,238,0.14),transparent_68%)] opacity-45" />

      <div className="relative">
        <div className="flex items-start gap-3">
          <MemberAvatar initials="BD" gradient="from-amber-400 to-orange-500" size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <MockLabel>Contrat sponsor</MockLabel>
                <p className="mt-1 text-[13px] font-semibold text-white">Boulangerie du Lac</p>
                <p className="mt-0.5 text-[10px] text-blue-200/38">Partenaire principal</p>
              </div>
              <motion.span
                animate={
                  active && !reduceMotion
                    ? { boxShadow: ["0 0 0 transparent", "0 0 14px rgba(34,211,238,0.2)", "0 0 0 transparent"] }
                    : undefined
                }
                transition={{ duration: 2.8, repeat: Infinity }}
              >
                <StatusBadge variant="info" dot pulse={active}>
                  Renouv.
                </StatusBadge>
              </motion.span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div>
            <p className="text-[9px] text-blue-100/35">Montant annuel</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-white">CHF 2&apos;400</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-blue-100/35">Échéance</p>
            <motion.p
              className="mt-0.5 flex items-center justify-end gap-1 text-sm font-bold tabular-nums text-cyan-200/90"
              animate={
                active && !reduceMotion
                  ? { textShadow: ["0 0 0 transparent", "0 0 14px rgba(34,211,238,0.28)", "0 0 0 transparent"] }
                  : undefined
              }
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Clock className="h-3 w-3 text-cyan-400/50" strokeWidth={2} aria-hidden />
              01.09.25
            </motion.p>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex justify-between text-[9px]">
            <span className="text-blue-100/35">Durée contrat</span>
            <span className="font-medium tabular-nums text-blue-100/55">68%</span>
          </div>
          <ProgressBar value={68} active={active} height="h-1.5" />
        </div>
      </div>
    </div>
  );
}

export function DocumentsShowcaseMock({ active }: MockProps) {
  const reduceMotion = useReducedMotion();
  const docs = [
    { name: "PV AG 2024.pdf", tone: "red" as const, selected: true, size: "248 Ko" },
    { name: "Contrat sponsor.pdf", tone: "blue" as const, selected: false, size: "412 Ko" },
    { name: "Facture buvette.pdf", tone: "violet" as const, selected: false, size: "96 Ko" },
  ];

  const toneStyles = {
    red: { icon: "bg-red-500/16 text-red-300/90 ring-red-400/16", accent: "from-red-500/10" },
    blue: { icon: "bg-blue-500/16 text-blue-300/90 ring-blue-400/16", accent: "from-blue-500/10" },
    violet: { icon: "bg-violet-500/16 text-violet-300/90 ring-violet-400/16", accent: "from-violet-500/10" },
  };

  return (
    <div className="relative flex h-full items-end justify-center sm:justify-start">
      <VisualGlow className="left-1/3 top-1/4 h-36 w-36 bg-[radial-gradient(circle,rgba(99,102,241,0.24),transparent_68%)] opacity-35" />

      <div className="relative w-full max-w-[320px] pt-1">
        {docs.map((doc, i) => {
          const tone = toneStyles[doc.tone];
          return (
            <motion.div
              key={doc.name}
              className={`relative overflow-hidden rounded-xl border transition-[box-shadow,border-color] duration-300 ${
                doc.selected
                  ? "border-cyan-400/22 bg-white/[0.055] shadow-[0_10px_36px_rgba(0,0,0,0.3),0_0_28px_rgba(34,211,238,0.08)]"
                  : "border-white/[0.07] bg-white/[0.03] shadow-[0_6px_24px_rgba(0,0,0,0.22)]"
              }`}
              style={{
                marginTop: i === 0 ? 0 : -16,
                zIndex: docs.length - i,
                rotate: i === 0 ? -2 : i === 1 ? 0.6 : 2,
              }}
              animate={
                active && !reduceMotion
                  ? { y: i === 0 ? [0, -4, 0] : i === 1 ? [0, -2, 0] : [0, -1, 0] }
                  : undefined
              }
              transition={{ duration: 4, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.accent} to-transparent opacity-60`} aria-hidden />
              <div className="relative flex gap-3 p-3">
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${tone.icon}`}>
                    <FileText className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="text-[7px] tabular-nums text-blue-200/30">{doc.size}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[10px] font-medium text-white">{doc.name}</p>
                    {doc.selected ? <StatusBadge variant="info">Ouvert</StatusBadge> : null}
                  </div>
                  <div className="mt-2.5 space-y-1 rounded-md border border-white/[0.04] bg-[#060b18]/40 p-2">
                    {[92, 78, 64, 48].slice(0, doc.selected ? 4 : 2).map((w, li) => (
                      <div
                        key={li}
                        className={`h-[3px] rounded-full ${doc.selected && li === 0 ? "bg-cyan-400/35" : "bg-white/10"}`}
                        style={{ width: `${w}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function AccesShowcaseMock({ active, wide }: MockProps) {
  const reduceMotion = useReducedMotion();
  const roles = [
    { id: "president", initials: "PK", label: "Président", access: "Accès complet", gradient: "from-[#1A23FF] to-indigo-500", tag: "Admin", online: true },
    { id: "treasurer", initials: "ML", label: "Trésorier", access: "Finances", gradient: "from-indigo-500 to-violet-600", tag: "Finances", online: true },
    { id: "secretary", initials: "SR", label: "Secrétaire", access: "Documents", gradient: "from-cyan-500 to-blue-600", tag: "Documents", online: false },
    { id: "committee", initials: "JB", label: "Comité", access: "Événements", gradient: "from-blue-400 to-sky-500", tag: "Événements", online: true },
  ];

  return (
    <div className={`relative flex h-full ${wide ? "flex-col justify-center gap-3" : "items-end justify-end"}`}>
      <VisualGlow className="left-1/2 top-0 h-28 w-48 -translate-x-1/2 bg-[radial-gradient(circle,rgba(26,35,255,0.22),transparent_68%)] opacity-40" />

      {wide ? (
        <div className="hidden w-full items-center justify-center gap-2 lg:flex">
          <AvatarStack
            items={roles.map((r) => ({
              id: r.id,
              initials: r.initials,
              gradient: r.gradient,
            }))}
          />
          <span className="text-[9px] text-blue-200/35">· 4 membres du comité</span>
        </div>
      ) : null}

      <div className={`relative grid w-full gap-2.5 ${wide ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1"}`}>
        {roles.map((role, i) => (
          <motion.div
            key={role.id}
            className="flex flex-col items-center rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3.5 text-center transition-[border-color,background-color,box-shadow] duration-300 group-hover/card:border-blue-400/16 group-hover/card:bg-white/[0.035] group-hover/card:shadow-[0_4px_20px_rgba(26,35,255,0.06)]"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.45, ease: easePremium }}
          >
            <MemberAvatar
              initials={role.initials}
              gradient={role.gradient}
              size="lg"
              online={role.online}
              highlight={active && i === 0}
            />
            <span className="mt-2.5 text-[11px] font-medium text-white">{role.label}</span>
            <span className="mt-0.5 text-[9px] text-blue-200/35">{role.access}</span>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-cyan-400/14 bg-cyan-500/[0.06] px-2 py-[3px] text-[8px] font-medium text-cyan-100/70">
              <Shield className="h-2.5 w-2.5 text-cyan-300/50" strokeWidth={2} aria-hidden />
              {role.tag}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export const showcaseMockById: Record<string, ComponentType<MockProps>> = {
  membres: MembersShowcaseMock,
  cotisations: CotisationsShowcaseMock,
  evenements: EvenementsShowcaseMock,
  sponsors: SponsorsShowcaseMock,
  documents: DocumentsShowcaseMock,
  acces: AccesShowcaseMock,
};
