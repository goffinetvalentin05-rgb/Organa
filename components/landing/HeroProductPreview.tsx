"use client";

import {
  CalendarDays,
  LayoutDashboard,
  Plus,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { easePremium } from "@/components/landing/landing-motion";

type HeroProductPreviewProps = {
  embedded?: boolean;
  /** Toast animé intégré (mobile) */
  showLiveToast?: boolean;
};

const stats = [
  { label: "Membres", value: "284", sub: "+12 ce mois", positive: true },
  { label: "Cotisations", value: "92%", sub: "8% en attente" },
  { label: "Factures", value: "4", sub: "À relancer", warn: true },
  { label: "Solde club", value: "À jour", sub: "Temps réel", accent: true },
];

export default function HeroProductPreview({
  embedded = false,
  showLiveToast = false,
}: HeroProductPreviewProps) {
  const shell = (
    <div className={`relative w-full ${embedded ? "" : "mx-auto mt-10 max-w-[800px] md:mt-12"}`}>
      <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.25),transparent_70%)] blur-2xl" aria-hidden />

      <div className="relative rounded-[1.25rem] border border-white/30 bg-gradient-to-b from-white/20 to-white/5 p-[3px] shadow-[0_40px_100px_rgba(2,6,23,0.5),0_0_60px_rgba(26,35,255,0.15),0_0_0_1px_rgba(255,255,255,0.12)_inset] backdrop-blur-xl md:rounded-[1.5rem] md:p-1 [transform:perspective(1400px)_rotateX(4deg)]">
        <div className="relative overflow-hidden rounded-[1.1rem] border border-white/25 bg-white shadow-[0_24px_64px_rgba(2,6,23,0.3)] md:rounded-[1.35rem]">
          <div className="flex items-center gap-2 border-b border-slate-200/80 bg-slate-100/90 px-3 py-2 md:px-4">
            <span className="flex gap-1" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
            </span>
            <span className="flex-1 truncate rounded-md bg-white/80 px-2 py-0.5 text-center font-mono text-[9px] text-slate-500 md:text-[10px]">
              app.obillz.com · dashboard
            </span>
          </div>

          {showLiveToast ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.45, ease: easePremium }}
              className="absolute left-1/2 top-3 z-20 flex w-[min(88%,260px)] -translate-x-1/2 items-center gap-2 rounded-lg border border-[#1A23FF]/20 bg-white px-3 py-2 shadow-lg"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1A23FF]" />
              <div className="min-w-0 text-left">
                <p className="text-[8px] font-bold uppercase text-slate-500">Cotisation</p>
                <p className="truncate text-[10px] font-bold text-slate-900">48 emails envoyés</p>
              </div>
            </motion.div>
          ) : null}

          <div className="flex min-h-[240px] sm:min-h-[280px] md:min-h-[300px]">
            <aside className="hidden w-[140px] shrink-0 border-r border-slate-200 bg-[#F4F7FB] p-3 md:block lg:w-[160px] lg:p-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A23FF] text-[11px] font-black text-white shadow-[0_4px_12px_rgba(26,35,255,0.4)]">
                  O
                </div>
                <span className="text-xs font-bold text-slate-800">Obillz</span>
              </div>
              <nav className="space-y-0.5" aria-hidden>
                <div className="flex items-center gap-2 rounded-lg bg-[#1A23FF] px-2.5 py-2 text-[11px] font-semibold text-white shadow-md">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </div>
                {[
                  { Icon: Users, label: "Membres" },
                  { Icon: Wallet, label: "Cotisations" },
                  { Icon: Receipt, label: "Factures" },
                  { Icon: CalendarDays, label: "Événements" },
                ].map(({ Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium text-slate-600 transition hover:bg-white/60"
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {label}
                  </div>
                ))}
              </nav>
            </aside>

            <div className="min-w-0 flex-1 p-4 md:p-5 lg:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-black text-slate-900 md:text-lg">Dashboard du club</p>
                  <p className="mt-0.5 text-[10px] text-slate-500 md:text-xs">
                    Membres · cotisations · encaissements
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative rounded-full bg-emerald-500" />
                  </span>
                  En direct
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:gap-3">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.07, duration: 0.45, ease: easePremium }}
                    className={`rounded-xl border p-2.5 transition hover:-translate-y-0.5 md:p-3 ${
                      stat.accent
                        ? "border-[#1A23FF]/30 bg-gradient-to-br from-[#1A23FF]/10 to-[#1A23FF]/[0.03] shadow-[0_4px_16px_rgba(26,35,255,0.12)]"
                        : "border-slate-200/90 bg-slate-50/95 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 md:text-[10px]">
                      {stat.label}
                    </p>
                    <p className="mt-0.5 text-xl font-black tabular-nums text-slate-900 md:text-2xl">
                      {stat.value}
                    </p>
                    <p
                      className={`mt-0.5 text-[9px] md:text-[10px] ${
                        stat.positive
                          ? "font-medium text-emerald-600"
                          : stat.warn
                            ? "font-medium text-amber-700"
                            : "text-slate-500"
                      }`}
                    >
                      {stat.sub}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.85, duration: 0.4 }}
                className="mt-4 flex flex-wrap gap-2"
              >
                {["Envoyer cotisation", "Nouvelle facture", "Ajouter membre"].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-800 shadow-sm transition hover:border-[#1A23FF]/30 hover:shadow md:text-xs"
                  >
                    <Plus className="h-3 w-3 text-[#1A23FF]" strokeWidth={2.5} />
                    {label}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) return shell;

  return (
    <motion.div custom={0.15} variants={{ visible: (d: number) => ({ opacity: 1, y: 0, scale: 1, transition: { duration: 0.75, delay: d, ease: easePremium } }), hidden: { opacity: 0, y: 40, scale: 0.94 } }} initial="hidden" animate="visible">
      {shell}
    </motion.div>
  );
}
