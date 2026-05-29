"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Building2, Send, TrendingUp, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LandingSection from "@/components/landing/LandingSection";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";

const steps: Array<{
  step: number;
  icon: LucideIcon;
  title: string;
  line: string;
  visual: ReactNode;
}> = [
  {
    step: 1,
    icon: Building2,
    title: "Créez votre espace club",
    line: "Quelques minutes pour être opérationnel.",
    visual: <StepVisualClub />,
  },
  {
    step: 2,
    icon: UserPlus,
    title: "Ajoutez vos membres et catégories",
    line: "Fiches, équipes et coordonnées au même endroit.",
    visual: <StepVisualMembers />,
  },
  {
    step: 3,
    icon: Send,
    title: "Envoyez cotisations, factures et inscriptions",
    line: "Envoi par email et liens partageables.",
    visual: <StepVisualSend />,
  },
  {
    step: 4,
    icon: TrendingUp,
    title: "Suivez les paiements et l'activité du club",
    line: "Encaissements et suivi en temps réel.",
    visual: <StepVisualTrack />,
  },
];

export default function HowItWorksSection() {
  return (
    <LandingSection
      id="comment-ca-marche"
      className="mt-24 md:mt-36"
      glow
      eyebrow="Comment ça marche"
      title="De la création du club au suivi des paiements, tout devient plus clair."
    >
      <div className="relative mt-12 md:mt-16">
        <div
          className="pointer-events-none absolute left-[12%] right-[12%] top-[4.5rem] hidden h-px bg-gradient-to-r from-transparent via-white/25 to-transparent md:block"
          aria-hidden
        />

        <ol className="grid gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-5">
          {steps.map((item, index) => (
            <motion.li
              key={item.step}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.65, delay: index * 0.1, ease: easePremium }}
            >
              <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/18 bg-gradient-to-br from-white/[0.14] via-white/[0.06] to-transparent p-5 shadow-[0_20px_50px_rgba(2,6,23,0.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-white/32 hover:shadow-[0_28px_60px_rgba(2,6,23,0.38)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/10 text-sm font-black text-white shadow-lg">
                    {item.step}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A23FF]/30 ring-1 ring-[#1A23FF]/50">
                    <item.icon className="h-4 w-4 text-white" strokeWidth={1.75} aria-hidden />
                  </span>
                </div>

                <div className="mt-4 flex-1">
                  <div className="overflow-hidden rounded-xl border border-white/20 bg-white/[0.06] p-2 transition group-hover:border-white/30">
                    {item.visual}
                  </div>
                </div>

                <h3 className="mt-4 text-base font-black leading-snug text-white md:text-lg">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-blue-100/85 md:text-sm">
                  {item.line}
                </p>
              </article>
            </motion.li>
          ))}
        </ol>
      </div>
    </LandingSection>
  );
}

function MiniUi({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200/90 bg-white p-2.5 text-left shadow-sm">
      {children}
    </div>
  );
}

function StepVisualClub() {
  return (
    <MiniUi>
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Nouveau club</p>
      <p className="mt-1 text-xs font-black text-slate-900">FC Rivière</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-3/4 rounded-full bg-[#1A23FF]" />
      </div>
      <p className="mt-1 text-[9px] text-emerald-600 font-semibold">Configuration · 2 min</p>
    </MiniUi>
  );
}

function StepVisualMembers() {
  return (
    <MiniUi>
      <ul className="space-y-1.5">
        {["Martin L.", "Dupont A.", "+ Importer"].map((name) => (
          <li
            key={name}
            className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-800"
          >
            {name}
            {name.startsWith("+") ? (
              <span className="text-[#1A23FF]">CSV</span>
            ) : (
              <span className="text-emerald-600 text-[9px]">Actif</span>
            )}
          </li>
        ))}
      </ul>
    </MiniUi>
  );
}

function StepVisualSend() {
  return (
    <MiniUi>
      <p className="text-[9px] font-bold text-slate-500">Cotisation saison</p>
      <p className="mt-1 text-xs font-black text-[#1A23FF]">48 emails envoyés</p>
      <p className="mt-1.5 text-[9px] text-slate-500">Facture buvette · lien inscription</p>
    </MiniUi>
  );
}

function StepVisualTrack() {
  return (
    <MiniUi>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-md bg-[#1A23FF]/10 px-2 py-1.5 text-center">
          <p className="text-[8px] text-slate-500">Payé</p>
          <p className="text-sm font-black text-[#1A23FF]">92%</p>
        </div>
        <div className="rounded-md bg-emerald-50 px-2 py-1.5 text-center">
          <p className="text-[8px] text-slate-500">Solde</p>
          <p className="text-sm font-black text-emerald-700">OK</p>
        </div>
      </div>
    </MiniUi>
  );
}
