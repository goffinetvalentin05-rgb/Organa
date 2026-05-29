"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Building2,
  CalendarDays,
  QrCode,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LandingCta from "@/components/landing/LandingCta";
import LandingSection from "@/components/landing/LandingSection";
import { easePremium } from "@/components/landing/landing-motion";

const steps: Array<{
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    step: 1,
    icon: Building2,
    title: "Créez votre club",
    description: "Quelques minutes pour configurer votre espace et être opérationnel.",
  },
  {
    step: 2,
    icon: UserPlus,
    title: "Ajoutez les membres",
    description: "Fiches, équipes et coordonnées centralisées dans une base claire.",
  },
  {
    step: 3,
    icon: Wallet,
    title: "Cotisations & factures",
    description: "Génération, envoi par email et suivi des paiements en temps réel.",
  },
  {
    step: 4,
    icon: CalendarDays,
    title: "Événements & buvette",
    description: "Manifestations, bénévoles, réservations et sponsoring au même endroit.",
  },
  {
    step: 5,
    icon: TrendingUp,
    title: "Suivez les encaissements",
    description: "Entrées, sorties et situation financière lisible en un coup d'œil.",
  },
  {
    step: 6,
    icon: QrCode,
    title: "Liens publics & QR codes",
    description: "Inscriptions, page publique du club — partageable en quelques secondes.",
  },
];

export default function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const lineScale = useTransform(scrollYProgress, [0.1, 0.85], [0, 1]);

  return (
    <LandingSection
      id="comment-ca-marche"
      className="mt-20 md:mt-32"
      glow
      eyebrow="Comment ça marche"
      title="Six étapes. Un club mieux organisé."
      subtitle="Un parcours simple et visuel — de la création du club au partage de vos liens publics."
    >
      <div ref={ref} className="relative mt-12 md:mt-16">
        <div className="pointer-events-none absolute left-7 top-0 bottom-0 hidden w-px overflow-hidden md:block" aria-hidden>
          <motion.div
            className="h-full w-full origin-top bg-gradient-to-b from-white via-[#1A23FF]/60 to-emerald-400/50"
            style={{ scaleY: lineScale }}
          />
        </div>

        <ol className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none md:grid md:overflow-visible md:pb-0 md:snap-none md:gap-5">
          {steps.map((item, index) => (
            <motion.li
              key={item.step}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: index * 0.06, ease: easePremium }}
              className="min-w-[min(100%,300px)] shrink-0 snap-center md:min-w-0"
            >
              <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.12] via-white/[0.05] to-transparent p-5 shadow-[0_16px_40px_rgba(2,6,23,0.22)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:shadow-[0_24px_52px_rgba(2,6,23,0.32)] md:flex-row md:items-center md:gap-6 md:p-6">
                <div className="flex items-center gap-4 md:w-auto">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-lg font-black text-white shadow-lg backdrop-blur-md transition group-hover:scale-105 group-hover:border-white/45 md:h-14 md:w-14">
                    {item.step}
                  </span>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1A23FF]/25 ring-1 ring-[#1A23FF]/40 md:hidden">
                    <item.icon className="h-5 w-5 text-white" strokeWidth={1.75} aria-hidden />
                  </div>
                </div>
                <div className="mt-4 min-w-0 md:mt-0 md:flex md:flex-1 md:items-center md:gap-5">
                  <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1A23FF]/25 ring-1 ring-[#1A23FF]/40 md:flex">
                    <item.icon className="h-6 w-6 text-white" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-blue-100/85">{item.description}</p>
                  </div>
                </div>
              </article>
            </motion.li>
          ))}
        </ol>
      </div>

      <LandingCta
        compact
        title="Commencez gratuitement en quelques minutes"
        subtitle="Votre club mérite une gestion aussi sérieuse que votre sport."
        secondaryLabel="Voir les fonctionnalités"
        secondaryHref="#fonctionnalites"
      />
    </LandingSection>
  );
}
