"use client";

import {
  Building2,
  CalendarDays,
  Link2,
  QrCode,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LandingCta from "@/components/landing/LandingCta";
import LandingSection from "@/components/landing/LandingSection";
import ScrollReveal from "@/components/landing/ScrollReveal";

const steps: Array<{
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
  tag?: string;
}> = [
  {
    step: 1,
    icon: Building2,
    title: "Créez l'espace de votre club",
    description:
      "La mise en place prend seulement quelques minutes. Vous configurez votre club et vous êtes prêts à démarrer.",
    tag: "2 min",
  },
  {
    step: 2,
    icon: UserPlus,
    title: "Ajoutez vos membres",
    description:
      "Centralisez les fiches membres, les équipes et les coordonnées dans une base claire et organisée.",
  },
  {
    step: 3,
    icon: Wallet,
    title: "Gérez cotisations et factures",
    description:
      "Générez les cotisations en quelques clics, créez des factures propres et envoyez-les par email.",
  },
  {
    step: 4,
    icon: CalendarDays,
    title: "Organisez événements et buvette",
    description:
      "Planifiez les manifestations, les bénévoles et les réservations de buvette depuis une seule interface.",
  },
  {
    step: 5,
    icon: TrendingUp,
    title: "Suivez les encaissements",
    description:
      "Gardez une vision précise des entrées, sorties et paiements en attente pour le club.",
  },
  {
    step: 6,
    icon: QrCode,
    title: "Partagez liens publics et QR codes",
    description:
      "Inscriptions aux repas ou événements, page publique du club — partageable en quelques secondes.",
    tag: "Gagnez du temps",
  },
];

export default function HowItWorksSection() {
  return (
    <LandingSection
      id="comment-ca-marche"
      className="mt-24 md:mt-36"
      eyebrow="Comment ça fonctionne"
      title="Une logique simple, du premier jour au quotidien"
      subtitle="Obillz guide le comité étape par étape : configuration rapide, gestion centralisée et gain de temps au fil des saisons."
    >
      <div className="relative mt-14">
        <div
          className="pointer-events-none absolute left-7 top-4 bottom-4 hidden w-px bg-gradient-to-b from-white/50 via-white/15 to-transparent md:block"
          aria-hidden
        />
        <ol className="grid gap-4 md:gap-5">
          {steps.map((item, index) => (
            <ScrollReveal key={item.step} delay={index * 0.05} y={18}>
              <li className="group relative flex gap-4 md:gap-6">
                <div className="relative z-10 flex shrink-0 flex-col items-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-lg font-black text-white shadow-[0_12px_28px_rgba(2,6,23,0.28)] backdrop-blur-md transition group-hover:border-white/45 group-hover:bg-white/15">
                    {item.step}
                  </span>
                </div>
                <article className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.10] via-white/[0.04] to-transparent p-5 backdrop-blur-xl transition duration-300 hover:border-white/25 md:flex md:items-center md:justify-between md:gap-6 md:p-6">
                  <div className="flex gap-4 md:items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1A23FF]/25 ring-1 ring-[#1A23FF]/35">
                      <item.icon className="h-6 w-6 text-white" strokeWidth={1.75} aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white md:text-xl">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-blue-100/85">{item.description}</p>
                    </div>
                  </div>
                  {item.tag ? (
                    <div className="mt-4 shrink-0 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 md:mt-0">
                      <p className="flex items-center gap-2 text-sm font-bold text-emerald-100">
                        <Link2 className="h-4 w-4" aria-hidden />
                        {item.tag}
                      </p>
                    </div>
                  ) : null}
                </article>
              </li>
            </ScrollReveal>
          ))}
        </ol>
      </div>

      <LandingCta
        compact
        title="Commencez gratuitement en quelques minutes"
        secondaryLabel="Voir les fonctionnalités"
        secondaryHref="#fonctionnalites"
      />
    </LandingSection>
  );
}
