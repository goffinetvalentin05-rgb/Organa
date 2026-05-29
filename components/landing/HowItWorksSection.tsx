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
import ScrollReveal from "@/components/landing/ScrollReveal";
import LandingCta from "@/components/landing/LandingCta";

const steps: Array<{
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    step: 1,
    icon: Building2,
    title: "Créez l'espace de votre club",
    description:
      "La mise en place prend seulement quelques minutes. Vous configurez votre club et vous êtes prêts à démarrer.",
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
      "Inscriptions aux repas ou événements, page publique du club — tout est partageable en quelques secondes.",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="comment-ca-marche"
      className="relative mx-auto mt-24 w-[94%] max-w-[1160px] scroll-mt-24 md:mt-36"
    >
      <ScrollReveal className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200/90">Comment ça marche</p>
        <h2 className="mt-4 text-3xl font-black text-white md:text-5xl">
          Une logique simple, du premier jour au quotidien
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-blue-100/90 md:text-lg">
          Obillz guide le comité étape par étape : configuration rapide, gestion centralisée et
          gain de temps au fil des saisons.
        </p>
      </ScrollReveal>

      <div className="relative mt-14">
        <div
          className="pointer-events-none absolute left-[1.65rem] top-8 bottom-8 hidden w-px bg-gradient-to-b from-white/40 via-white/15 to-transparent md:block"
          aria-hidden
        />
        <ol className="grid gap-5 md:gap-6">
          {steps.map((item, index) => (
            <ScrollReveal key={item.step} delay={index * 0.06} y={18}>
              <li className="group relative flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
                <div className="flex shrink-0 items-center gap-4 md:w-[4.5rem] md:flex-col md:items-center md:gap-2">
                  <span className="relative z-10 flex h-[3.3rem] w-[3.3rem] items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-lg font-black text-white shadow-[0_12px_28px_rgba(2,6,23,0.25)] backdrop-blur-md transition group-hover:border-white/40 group-hover:bg-white/15 md:h-14 md:w-14">
                    {item.step}
                  </span>
                </div>
                <article className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.09] via-white/[0.04] to-transparent p-5 backdrop-blur-xl transition duration-300 hover:border-white/22 md:p-6 lg:flex lg:items-center lg:gap-8">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1A23FF]/20 ring-1 ring-[#1A23FF]/30">
                    <item.icon className="h-6 w-6 text-white" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="mt-4 lg:mt-0">
                    <h3 className="text-lg font-black text-white md:text-xl">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-blue-100/85 md:text-[0.9375rem]">
                      {item.description}
                    </p>
                  </div>
                  {index === steps.length - 1 ? (
                    <div className="mt-5 hidden shrink-0 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 lg:mt-0 lg:block">
                      <p className="flex items-center gap-2 text-sm font-bold text-emerald-100">
                        <Link2 className="h-4 w-4" aria-hidden />
                        Gagnez du temps
                      </p>
                      <p className="mt-1 text-xs text-emerald-100/80">Moins d&apos;oublis, plus de clarté</p>
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
    </section>
  );
}
