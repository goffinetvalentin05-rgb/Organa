"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  FileSpreadsheet,
  LayoutDashboard,
  MessageCircle,
  Plus,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import LandingCta from "@/components/landing/LandingCta";
import LandingSection, { LandingSectionHeader } from "@/components/landing/LandingSection";
import ScrollReveal from "@/components/landing/ScrollReveal";

type ComparisonView = "without" | "with";

export default function SolutionSection() {
  const [comparisonView, setComparisonView] = useState<ComparisonView>("with");

  return (
    <LandingSection
      id="comparaison"
      className="mt-24 md:mt-36 lg:mt-44"
      glow
    >
      <LandingSectionHeader
        eyebrow="La solution"
        title="Passez d'une gestion compliquée à une organisation claire"
        subtitle="Trop d'outils, trop de tâches manuelles, trop de flou — puis une seule plateforme pour piloter votre club avec une vue nette."
      />

      <ScrollReveal className="mt-10 flex justify-center" y={12}>
        <div
          className="inline-flex rounded-full border border-white/30 bg-white/[0.12] p-1.5 shadow-[0_16px_40px_rgba(2,6,23,0.35)] backdrop-blur-md"
          role="group"
          aria-label="Comparer sans et avec Obillz"
        >
          {(["without", "with"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setComparisonView(view)}
              className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all duration-200 md:px-8 md:py-3 md:text-[0.9375rem] ${
                comparisonView === view
                  ? "bg-white text-[#1A23FF] shadow-[0_4px_20px_rgba(26,35,255,0.35)] ring-2 ring-white/25"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {view === "without" ? "Sans Obillz" : "Avec Obillz"}
            </button>
          ))}
        </div>
      </ScrollReveal>

      <div className="relative mx-auto mt-10 max-w-[1080px] md:mt-12">
        <div
          className="pointer-events-none absolute inset-x-[-4%] -top-10 -bottom-10 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_60%)]"
          aria-hidden
        />
        <AnimatePresence mode="wait">
          {comparisonView === "without" ? (
            <ChaosScene key="without" />
          ) : (
            <DashboardScene key="with" />
          )}
        </AnimatePresence>
      </div>

      <LandingCta
        compact
        title="Une seule plateforme pour piloter votre club"
        secondaryLabel="Voir comment ça marche"
        secondaryHref="#comment-ca-marche"
      />
    </LandingSection>
  );
}

function ChaosScene() {
  return (
    <motion.div
      role="tabpanel"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/90 md:text-sm">
        Le quotidien sans outil centralisé
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ChaosCard
          icon={MessageCircle}
          iconClass="text-[#25D366]"
          iconBg="bg-[#25D366]/20"
          title="WhatsApp du comité"
          lines={["Qui tient la buvette ?", "+12 messages non lus"]}
          tone="dark"
        />
        <ChaosCard
          icon={FileSpreadsheet}
          title="membres_FINAL_v3.xlsx"
          lines={["#REF! · Non enregistré", "Cotisations ?"]}
          tone="sheet"
        />
        <ChaosCard
          icon={CalendarDays}
          title="Match samedi"
          lines={["3 bénévoles non confirmés", "Sponsor non suivi"]}
          tone="note"
        />
      </div>
    </motion.div>
  );
}

function ChaosCard({
  icon: Icon,
  iconClass,
  iconBg = "bg-white/10",
  title,
  lines,
  tone,
}: {
  icon: typeof MessageCircle;
  iconClass?: string;
  iconBg?: string;
  title: string;
  lines: string[];
  tone: "dark" | "sheet" | "note";
}) {
  const shell =
    tone === "dark"
      ? "bg-[#0B141A] border-white/10 text-white"
      : tone === "sheet"
        ? "bg-white border-slate-300 text-slate-900"
        : "bg-[#FFF8D6] border-amber-200/80 text-amber-950";

  return (
    <article
      className={`rounded-2xl border p-4 shadow-[0_12px_32px_rgba(2,6,23,0.2)] transition duration-300 hover:-translate-y-0.5 ${shell}`}
    >
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconClass ?? "text-white"}`} strokeWidth={2} aria-hidden />
        </span>
        <p className="text-sm font-bold">{title}</p>
      </div>
      <ul className="mt-3 space-y-1.5 text-xs leading-snug opacity-90">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </article>
  );
}

function DashboardScene() {
  return (
    <motion.div
      role="tabpanel"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/90 md:text-sm">
        Une seule plateforme — tout est visible
      </p>
      <div className="overflow-hidden rounded-[1.35rem] border border-white/25 bg-white/[0.08] p-1.5 shadow-[0_28px_60px_rgba(2,6,23,0.35)] backdrop-blur-md md:rounded-[1.5rem] md:p-2">
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white shadow-[0_24px_60px_rgba(2,6,23,0.28)]">
          <div className="flex flex-col md:flex-row">
            <aside className="hidden w-[168px] shrink-0 border-r border-slate-200 bg-[#F4F7FB] p-4 md:block lg:w-[188px]">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A23FF] text-[11px] font-black text-white">
                  O
                </div>
                <span className="text-xs font-bold text-slate-800">Obillz</span>
              </div>
              <nav className="space-y-1" aria-label="Navigation">
                <div className="flex items-center gap-2 rounded-lg bg-[#1A23FF] px-2.5 py-2 text-xs font-semibold text-white">
                  <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={2} />
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
                    className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600"
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {label}
                  </div>
                ))}
              </nav>
            </aside>
            <div className="min-w-0 flex-1 p-5 md:p-6">
              <h4 className="text-lg font-black text-slate-900 md:text-xl">Dashboard du club</h4>
              <p className="mt-1 text-xs text-slate-500 md:text-sm">
                Membres, cotisations, finances — une vue consolidée
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: "Membres", value: "284", sub: "+12 ce mois" },
                  { label: "Cotisations", value: "92%", sub: "8% en attente" },
                  { label: "Factures", value: "4", sub: "À relancer" },
                  { label: "Solde", value: "À jour", sub: "Temps réel", accent: true },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-xl border p-3 ${
                      stat.accent
                        ? "border-[#1A23FF]/20 bg-[#1A23FF]/[0.06]"
                        : "border-slate-200 bg-slate-50/90"
                    }`}
                  >
                    <p className="text-[10px] font-semibold text-slate-500">{stat.label}</p>
                    <p className="mt-1 text-xl font-black text-slate-900">{stat.value}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{stat.sub}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800">
                  <Plus className="h-3.5 w-3.5 text-[#1A23FF]" strokeWidth={2} />
                  Nouvelle cotisation
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800">
                  <Plus className="h-3.5 w-3.5 text-[#1A23FF]" strokeWidth={2} />
                  Ajouter un membre
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
