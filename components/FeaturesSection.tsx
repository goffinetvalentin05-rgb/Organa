"use client";

import { Calendar2, CreditCard, Users, Wallet } from "@/lib/icons";

const features = [
  {
    title: "Gestion des membres",
    description:
      "Ajoutez, organisez et suivez tous les membres de votre club dans un espace centralise.",
    icon: Users,
  },
  {
    title: "Suivi des cotisations",
    description:
      "Visualisez les paiements en un clin d'oeil et relancez facilement les membres en attente.",
    icon: CreditCard,
  },
  {
    title: "Organisation des evenements",
    description:
      "Planifiez vos evenements, affectez les benevoles et gardez une vue claire du planning.",
    icon: Calendar2,
  },
  {
    title: "Gestion financiere",
    description:
      "Suivez revenus, charges et indicateurs cles pour piloter votre club avec precision.",
    icon: Wallet,
  },
];

export default function FeaturesSection() {
  return (
    <section id="fonctionnalites" className="mx-auto mt-24 w-full max-w-[1200px]">
      <div className="text-center" data-reveal>
        <h2 className="text-4xl font-extrabold tracking-[-0.025em] text-[#0F172A] md:text-[3rem]">
          Fonctionnalites cles pour clubs sportifs
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-[#64748B] md:text-lg">
          Tout ce qu&apos;il faut pour structurer votre club et faire gagner du temps au comite.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
        {features.map((feature) => (
          <article
            key={feature.title}
            data-reveal
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_25px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#2563EB]/40 hover:shadow-[0_20px_35px_rgba(37,99,235,0.16)]"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <feature.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-xl font-bold text-[#0F172A]">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
