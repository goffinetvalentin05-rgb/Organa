"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Building2, Send, TrendingUp, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LandingSection, { LandingSectionHeader } from "@/components/landing/LandingSection";
import ScrollReveal from "@/components/landing/ScrollReveal";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
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
    title: "Créez votre club",
    line: "Quelques minutes pour être opérationnel.",
    visual: <StepVisualClub />,
  },
  {
    step: 2,
    icon: UserPlus,
    title: "Ajoutez vos membres",
    line: "Fiches, équipes et coordonnées centralisées.",
    visual: <StepVisualMembers />,
  },
  {
    step: 3,
    icon: Send,
    title: "Gérez cotisations, factures et événements",
    line: "Envoi par email, liens et QR codes partageables.",
    visual: <StepVisualSend />,
  },
  {
    step: 4,
    icon: TrendingUp,
    title: "Suivez les paiements et l'activité",
    line: "Encaissements et suivi en temps réel.",
    visual: <StepVisualTrack />,
  },
];

export default function HowItWorksSection() {
  return (
    <LandingSection id="comment-ca-marche" className="mt-24 md:mt-36" glow>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16">
        <div className="lg:sticky lg:top-28">
          <LandingSectionHeader
            align="left"
            eyebrow="Comment ça marche"
            title="Quatre étapes pour reprendre le contrôle."
            subtitle="De la création du club au suivi des paiements — sans complexité inutile."
          />
          <ScrollReveal className="mt-8 hidden lg:block" y={16}>
            <LandingPrimaryButton href="/inscription" showArrow>
              Créer mon club gratuitement
            </LandingPrimaryButton>
          </ScrollReveal>
        </div>

        <ol className="relative space-y-4 md:space-y-5">
          <div
            className="pointer-events-none absolute left-[1.65rem] top-8 bottom-8 hidden w-px bg-gradient-to-b from-white/30 via-white/15 to-transparent md:block"
            aria-hidden
          />
          {steps.map((item, index) => (
            <motion.li
              key={item.step}
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.65, delay: index * 0.1, ease: easePremium }}
            >
              <article
                className={`group relative flex gap-4 overflow-hidden rounded-[1.35rem] border border-white/18 bg-gradient-to-br from-white/[0.14] via-white/[0.06] to-transparent p-5 shadow-[0_20px_50px_rgba(2,6,23,0.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/32 hover:shadow-[0_28px_60px_rgba(26,35,255,0.2)] md:gap-5 md:p-6 ${
                  index === 1 ? "md:ml-6" : index === 3 ? "md:ml-3" : ""
                }`}
              >
                <div
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden
                />
                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-[#1A23FF]/40 text-sm font-black text-white shadow-[0_8px_24px_rgba(26,35,255,0.45)]">
                  {item.step}
                </span>
                <div className="relative z-10 min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black leading-snug text-white md:text-lg">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-blue-100/85 md:text-sm">
                        {item.line}
                      </p>
                    </div>
                    <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20 sm:flex">
                      <item.icon className="h-4 w-4 text-white" strokeWidth={1.75} aria-hidden />
                    </span>
                  </div>
                  <div className="mt-4 overflow-hidden rounded-xl border border-white/20 bg-white/[0.06] p-2 transition group-hover:border-white/30">
                    {item.visual}
                  </div>
                </div>
              </article>
            </motion.li>
          ))}
        </ol>
      </div>

      <ScrollReveal className="mt-8 flex justify-center lg:hidden" y={12}>
        <LandingPrimaryButton href="/inscription">Créer mon club gratuitement</LandingPrimaryButton>
      </ScrollReveal>
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
      <p className="mt-1 text-[9px] font-semibold text-emerald-600">Configuration · 2 min</p>
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
              <span className="text-[9px] text-emerald-600">Actif</span>
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
      <p className="mt-1.5 text-[9px] text-slate-500">Facture · lien inscription événement</p>
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
