"use client";

import Link from "next/link";

const features = [
  "Membres illimités",
  "Événements illimités",
  "Plannings & affectations",
  "Factures & devis",
  "Gestion des dépenses",
  "QR codes personnalisés",
  "Export des données",
  "Support prioritaire",
];

function PricingCard({
  title,
  price,
  period,
  subPrice,
  highlighted,
  badge,
}: {
  title: string;
  price: string;
  period: string;
  subPrice?: string;
  highlighted?: boolean;
  badge?: string;
}) {
  return (
    <article
      className={`relative rounded-xl bg-white p-8 shadow-lg ${
        highlighted ? "border-2 border-[#2563eb] md:scale-105" : "border border-slate-200"
      }`}
    >
      {badge ? (
        <div className="mb-4">
          <span className="inline-flex rounded-full bg-green-500 px-2 py-1 text-xs font-medium text-white">
            {badge}
          </span>
        </div>
      ) : null}

      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <div className="mt-4">
        <p className="text-4xl font-extrabold tracking-tight text-slate-900">
          {price}
          <span className="ml-2 text-lg font-medium text-slate-600">{period}</span>
        </p>
        {subPrice ? <p className="mt-2 text-sm text-slate-600">{subPrice}</p> : null}
      </div>

      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-0.5 text-green-600">✔</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link
          href="/inscription"
          className="block w-full rounded-lg bg-[#2563eb] px-4 py-3 text-center font-semibold text-white transition-opacity hover:opacity-90"
        >
          Commencer l&apos;essai gratuit
        </Link>
        <p className="mt-2 text-center text-xs text-slate-500">7 jours gratuits</p>
      </div>
    </article>
  );
}

export default function PricingSection() {
  return (
    <section className="mx-auto mt-20 mb-20 w-full max-w-[1000px]">
      <div className="text-center">
        <h2 className="text-4xl font-extrabold tracking-[-0.025em] text-slate-900 md:text-[3rem]">
          Un tarif simple et transparent
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
          Essayez Obillz gratuitement pendant 7 jours. Sans engagement.
        </p>
        <div className="mt-4">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Essai gratuit 7 jours — aucune carte bancaire requise
          </span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <PricingCard title="Mensuel" price="29 CHF" period="/ mois" />
        <PricingCard
          title="Annuel"
          price="299 CHF"
          period="/ an"
          subPrice="≈ 25 CHF / mois"
          highlighted
          badge="2 mois offerts"
        />
      </div>
    </section>
  );
}
