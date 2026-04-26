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

function HighlightWord({ children }: { children: string }) {
  return (
    <span className="relative inline-block px-1 text-[#60A5FA]">
      <span className="relative z-10 font-extrabold">{children}</span>
      <svg
        viewBox="0 0 210 52"
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-2 left-0 z-0 h-[0.56em] w-full transition-transform duration-300 ease-out"
      >
        <path
          d="M6 35C46 22 83 18 121 21C152 23 179 28 203 34"
          stroke="#93C5FD"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.5"
        />
        <path
          d="M8 39C44 28 83 25 125 28C155 30 180 34 201 38"
          stroke="#60A5FA"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}

function PricingCard({
  title,
  price,
  period,
  subPrice,
  badge,
}: {
  title: string;
  price: string;
  period: string;
  subPrice?: string;
  badge?: string;
}) {
  return (
    <article
      data-reveal
      className="relative rounded-xl border border-gray-200 bg-white p-8 shadow-md transition-all duration-200 ease-in-out hover:scale-[1.03] hover:border-blue-500 hover:shadow-xl"
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
    <section
      id="tarifs"
      className="mx-auto mt-20 mb-20 w-full max-w-[1000px]"
    >
      <div className="group text-center">
        <h2
          data-reveal
          className="text-4xl font-extrabold tracking-[-0.025em] text-slate-900 md:text-[3rem]"
        >
          Un tarif <HighlightWord>simple</HighlightWord> et transparent
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

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        <PricingCard title="Mensuel" price="39 CHF" period="/ mois" />
        <PricingCard
          title="Annuel"
          price="390 CHF"
          period="/ an"
          subPrice="≈ 33 CHF / mois"
          badge="2 mois offerts"
        />
      </div>
    </section>
  );
}
