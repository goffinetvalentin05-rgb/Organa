"use client";

import {
  CalendarDays,
  LayoutDashboard,
  Plus,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { easePremium } from "@/components/landing/landing-motion";

type HeroProductPreviewProps = {
  embedded?: boolean;
  /** Variante compacte pour la scène transit sous le hero */
  variant?: "default" | "transit";
  /** Toast animé intégré (mobile) */
  showLiveToast?: boolean;
};

const stats = [
  { label: "Membres", value: "284", sub: "+12 ce mois", positive: true },
  { label: "Cotisations", value: "92%", sub: "8% en attente" },
  { label: "Factures", value: "4", sub: "À relancer", warn: true },
  { label: "Solde club", value: "À jour", sub: "Temps réel", accent: true },
];

const chartBars = [38, 52, 44, 68, 58, 74, 62];

export default function HeroProductPreview({
  embedded = false,
  variant = "default",
  showLiveToast = false,
}: HeroProductPreviewProps) {
  const isTransit = variant === "transit";
  const showToast = showLiveToast || isTransit;

  const shell = (
    <div className={`relative w-full ${embedded || isTransit ? "" : "mx-auto mt-10 max-w-[820px] md:mt-12"}`}>
      <div
        className={`pointer-events-none absolute -inset-6 rounded-[2.25rem] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.28),transparent_68%)] blur-2xl ${isTransit ? "-inset-4" : ""}`}
        aria-hidden
      />

      <div
        className={`relative rounded-[1.35rem] border border-white/35 bg-gradient-to-b from-white/25 via-white/10 to-white/[0.04] p-[3px] shadow-[0_48px_120px_rgba(2,6,23,0.55),0_0_80px_rgba(26,35,255,0.22),0_0_0_1px_rgba(255,255,255,0.14)_inset] backdrop-blur-xl md:rounded-[1.65rem] md:p-1 ${
          isTransit ? "" : "[transform:perspective(1600px)_rotateX(5deg)]"
        }`}
      >
        <div className="relative overflow-hidden rounded-[1.15rem] border border-white/30 bg-white shadow-[0_28px_72px_rgba(2,6,23,0.32)] md:rounded-[1.4rem]">
          <div className={`flex items-center gap-2 border-b border-slate-200/80 bg-gradient-to-b from-slate-100 to-slate-50/95 px-3 ${isTransit ? "py-2" : "py-2.5 md:px-4"}`}>
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#1A23FF]/80" />
            </span>
            <span className="flex-1 truncate rounded-md bg-white/90 px-2 py-0.5 text-center font-mono text-[9px] text-slate-500 md:text-[10px]">
              app.obillz.com · tableau de bord
            </span>
          </div>

          {showToast ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.45, ease: easePremium }}
              className="absolute left-1/2 top-3 z-20 flex w-[min(88%,280px)] -translate-x-1/2 items-center gap-2 rounded-lg border border-[#1A23FF]/20 bg-white px-3 py-2 shadow-lg"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1A23FF]" />
              <div className="min-w-0 text-left">
                <p className="text-[8px] font-bold uppercase text-slate-500">Cotisation</p>
                <p className="truncate text-[10px] font-bold text-slate-900">48 cotisations envoyées</p>
              </div>
            </motion.div>
          ) : null}

          <div className={`flex ${isTransit ? "min-h-[210px]" : "min-h-[252px] sm:min-h-[290px] md:min-h-[320px]"}`}>
            <aside
              className={`hidden shrink-0 border-r border-slate-200/90 bg-[#F4F7FB] md:block ${
                isTransit ? "w-[118px] p-2.5" : "w-[148px] p-3 lg:w-[168px] lg:p-4"
              }`}
            >
              <div className={`flex items-center gap-2 ${isTransit ? "mb-3" : "mb-4"}`}>
                <div
                  className={`flex items-center justify-center rounded-lg bg-[#1A23FF] font-black text-white shadow-[0_4px_14px_rgba(26,35,255,0.45)] ${
                    isTransit ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-[11px]"
                  }`}
                >
                  O
                </div>
                <span className={`font-bold text-slate-800 ${isTransit ? "text-[11px]" : "text-xs"}`}>Obillz</span>
              </div>
              <nav className="space-y-0.5" aria-hidden>
                <div className="flex items-center gap-2 rounded-lg bg-[#1A23FF] px-2.5 py-2 text-[11px] font-semibold text-white shadow-[0_4px_14px_rgba(26,35,255,0.35)]">
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
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium text-slate-600"
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {label}
                  </div>
                ))}
              </nav>
            </aside>

            <div className={`min-w-0 flex-1 ${isTransit ? "p-3" : "p-4 md:p-5 lg:p-6"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`font-black text-slate-900 ${isTransit ? "text-sm" : "text-base md:text-lg"}`}>
                    Dashboard du club
                  </p>
                  <p className={`mt-0.5 text-slate-500 ${isTransit ? "text-[9px]" : "text-[10px] md:text-xs"}`}>
                    Vue d&apos;ensemble · membres · finances
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#1A23FF]/[0.08] px-2.5 py-1 text-[10px] font-bold text-[#1A23FF] ring-1 ring-[#1A23FF]/20">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute animate-ping rounded-full bg-[#1A23FF] opacity-60" />
                    <span className="relative rounded-full bg-[#1A23FF]" />
                  </span>
                  En direct
                </span>
              </div>

              <div
                className={`mt-3 grid grid-cols-2 gap-2 ${isTransit ? "" : "sm:grid-cols-4 md:gap-3"} ${isTransit ? "" : "mt-4 gap-2.5"}`}
              >
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.52 + i * 0.07, duration: 0.45, ease: easePremium }}
                    className={`rounded-xl border transition hover:-translate-y-0.5 ${isTransit ? "p-2" : "p-2.5 md:p-3"} ${
                      stat.accent
                        ? "border-[#1A23FF]/35 bg-gradient-to-br from-[#1A23FF]/12 to-[#1A23FF]/[0.03] shadow-[0_4px_18px_rgba(26,35,255,0.14)]"
                        : "border-slate-200/90 bg-slate-50/95 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 md:text-[10px]">
                      {stat.label}
                    </p>
                    <p
                      className={`mt-0.5 font-black tabular-nums text-slate-900 ${isTransit ? "text-lg" : "text-xl md:text-2xl"}`}
                    >
                      {stat.value}
                    </p>
                    <p
                      className={`mt-0.5 text-[9px] md:text-[10px] ${
                        stat.positive
                          ? "font-medium text-[#1A23FF]"
                          : stat.warn
                            ? "font-medium text-slate-600"
                            : "text-slate-500"
                      }`}
                    >
                      {stat.sub}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.88, duration: 0.45, ease: easePremium }}
                className={`rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 ${isTransit ? "mt-2.5 p-2.5" : "mt-4 p-3"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-bold text-slate-700 ${isTransit ? "text-[9px]" : "text-[10px] md:text-xs"}`}>
                    Encaissements · 7 jours
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1A23FF]">
                    <TrendingUp className="h-3 w-3" aria-hidden />
                    +18%
                  </span>
                </div>
                <div
                  className={`mt-2 flex items-end justify-between gap-1 ${isTransit ? "h-9" : "mt-3 h-12 gap-1.5"}`}
                  aria-hidden
                >
                  {chartBars.map((h, i) => (
                    <div
                      key={i}
                      className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-[#1A23FF] to-[#5b6bff]"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </motion.div>

              {!isTransit ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.95, duration: 0.4 }}
                  className="mt-3 flex flex-wrap gap-2"
                >
                  {["Envoyer cotisation", "Nouvelle facture", "Ajouter membre"].map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-800 shadow-sm md:text-xs"
                    >
                      <Plus className="h-3 w-3 text-[#1A23FF]" strokeWidth={2.5} />
                      {label}
                    </span>
                  ))}
                </motion.div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) return shell;

  return (
    <motion.div
      custom={0.15}
      variants={{
        visible: (d: number) => ({
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.75, delay: d, ease: easePremium },
        }),
        hidden: { opacity: 0, y: 40, scale: 0.94 },
      }}
      initial="hidden"
      animate="visible"
    >
      {shell}
    </motion.div>
  );
}
