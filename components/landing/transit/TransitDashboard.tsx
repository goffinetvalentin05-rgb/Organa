"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CalendarDays, Receipt, TrendingUp, Users, Wallet } from "lucide-react";
import { easePremium } from "@/components/landing/landing-motion";

const rows = [
  { icon: Users, label: "Membres", value: "284", sub: "+12 ce mois", accent: false },
  { icon: Wallet, label: "Cotisations", value: "92 %", sub: "À jour", accent: true },
  { icon: Receipt, label: "Factures", value: "3", sub: "À relancer", accent: false },
  { icon: CalendarDays, label: "Événements", value: "5", sub: "Ce mois", accent: false },
] as const;

type TransitDashboardProps = {
  inView: boolean;
  motionOn: boolean;
  tagline: string;
};

export default function TransitDashboard({ inView, motionOn, tagline }: TransitDashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
      transition={{ duration: 0.75, delay: 0.3, ease: easePremium }}
      className="relative z-[18] w-[min(100%,248px)] sm:w-[248px]"
    >
      {motionOn ? (
        <motion.div
          className="pointer-events-none absolute -inset-5 rounded-2xl bg-[radial-gradient(circle,rgba(26,35,255,0.3),transparent_70%)] blur-xl"
          animate={{ opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
      ) : null}

      <motion.div
        animate={
          motionOn
            ? {
                boxShadow: [
                  "0 20px 60px rgba(26,35,255,0.22), 0 0 0 1px rgba(255,255,255,0.1) inset",
                  "0 28px 72px rgba(26,35,255,0.32), 0 0 0 1px rgba(255,255,255,0.14) inset",
                  "0 20px 60px rgba(26,35,255,0.22), 0 0 0 1px rgba(255,255,255,0.1) inset",
                ],
              }
            : undefined
        }
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-[#121a38]/95 via-[#0d1228]/98 to-[#080c1a]/98 p-3.5 backdrop-blur-xl sm:p-4"
      >
        {motionOn ? (
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1A23FF]/[0.07] via-transparent to-[#7c3aed]/[0.05]"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        ) : null}

        <div className="relative mb-3 flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2.5">
          <Image src="/obillz-logo.png" alt="Obillz" width={88} height={22} className="h-5 w-auto opacity-95" />
          <span className="flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-300/90">
            <span className="relative flex h-1 w-1">
              {motionOn ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              ) : null}
              <span className="relative rounded-full bg-emerald-400" />
            </span>
            Live
          </span>
        </div>

        <div className="relative space-y-1.5" aria-hidden>
          {rows.map((row, i) => {
            const Icon = row.icon;
            return (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: 8 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 8 }}
                transition={{ delay: 0.45 + i * 0.06, duration: 0.45, ease: easePremium }}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                  row.accent
                    ? "border-[#1A23FF]/25 bg-[#1A23FF]/[0.08]"
                    : "border-white/[0.06] bg-white/[0.03]"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.05] ring-1 ring-white/[0.08]">
                  <Icon className="h-3 w-3 text-blue-200/80" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-medium uppercase tracking-wide text-white/40">{row.label}</p>
                  <p className="text-[11px] font-bold tabular-nums text-white/90">{row.value}</p>
                </div>
                <span className="text-[8px] font-medium text-white/35">{row.sub}</span>
              </motion.div>
            );
          })}
        </div>

        <div className="relative mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
          <span className="text-[8px] font-medium text-white/40">Encaissements</span>
          <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#93c5fd]">
            <TrendingUp className="h-2.5 w-2.5" aria-hidden />
            +18 %
          </span>
        </div>

        <p className="relative mt-2 text-center text-[8px] font-medium leading-snug text-white/35">{tagline}</p>
      </motion.div>
    </motion.div>
  );
}
