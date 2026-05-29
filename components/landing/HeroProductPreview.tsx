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

type HeroProductPreviewProps = {
  /** Intégré dans HeroProductComposition — pas de marge externe ni animation double */
  embedded?: boolean;
};

export default function HeroProductPreview({ embedded = false }: HeroProductPreviewProps) {
  const shell = (
    <div
      className={`relative w-full ${embedded ? "" : "mx-auto mt-10 max-w-[min(100%,720px)] md:mt-12"}`}
    >
      <div className="pointer-events-none absolute inset-x-[8%] top-[20%] -z-10 h-[55%] rounded-full bg-white/20 blur-3xl" />
      <div className="rounded-[1.35rem] border border-white/25 bg-white/[0.08] p-1.5 shadow-[0_28px_60px_rgba(2,6,23,0.35)] backdrop-blur-md md:rounded-[1.5rem] md:p-2 [transform:perspective(1200px)_rotateX(4deg)]">
        <div className="overflow-hidden rounded-[1.1rem] border border-white/20 bg-white shadow-[0_20px_50px_rgba(2,6,23,0.25)] md:rounded-[1.25rem]">
          <div className="flex min-h-[200px] sm:min-h-[220px]">
            <aside className="hidden w-[130px] shrink-0 border-r border-slate-200 bg-[#F4F7FB] p-3 sm:block lg:w-[148px]">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1A23FF] text-[10px] font-black text-white">
                  O
                </div>
                <span className="text-[11px] font-bold text-slate-800">Obillz</span>
              </div>
              <nav className="space-y-1" aria-hidden>
                <div className="flex items-center gap-1.5 rounded-lg bg-[#1A23FF] px-2 py-1.5 text-[10px] font-semibold text-white">
                  <LayoutDashboard className="h-3 w-3" />
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
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-medium text-slate-600"
                  >
                    <Icon className="h-3 w-3" strokeWidth={1.75} />
                    {label}
                  </div>
                ))}
              </nav>
            </aside>
            <div className="min-w-0 flex-1 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-slate-900 sm:text-base">Dashboard du club</p>
                  <p className="text-[10px] text-slate-500 sm:text-xs">
                    Membres · cotisations · finances
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-emerald-200 sm:text-[10px]">
                  En direct
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
                {[
                  { label: "Membres", value: "284", sub: "+12 ce mois" },
                  { label: "Cotisations", value: "92%", sub: "8% en attente" },
                  { label: "Factures", value: "4", sub: "À relancer" },
                  { label: "Solde", value: "À jour", sub: "Vue consolidée", accent: true },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-xl border p-2.5 sm:p-3 ${
                      stat.accent
                        ? "border-[#1A23FF]/25 bg-[#1A23FF]/[0.06]"
                        : "border-slate-200 bg-slate-50/90"
                    }`}
                  >
                    <p className="text-[9px] font-semibold text-slate-500 sm:text-[10px]">{stat.label}</p>
                    <p className="mt-0.5 text-lg font-black tabular-nums text-slate-900 sm:text-xl">
                      {stat.value}
                    </p>
                    <p
                      className={`mt-0.5 text-[9px] sm:text-[10px] ${
                        stat.sub.includes("+") ? "text-emerald-600" : "text-slate-500"
                      }`}
                    >
                      {stat.sub}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-800 shadow-sm sm:text-xs">
                  <Plus className="h-3 w-3 text-[#1A23FF]" strokeWidth={2.5} />
                  Envoyer cotisation
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-800 shadow-sm sm:text-xs">
                  <Plus className="h-3 w-3 text-[#1A23FF]" strokeWidth={2.5} />
                  Nouvelle facture
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) return shell;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      {shell}
    </motion.div>
  );
}
