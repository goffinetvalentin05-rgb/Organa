"use client";

import Link from "next/link";

function HighlightWord({ children }: { children: string }) {
  return (
    <span className="relative inline-block px-1 text-[#60A5FA]">
      <span className="relative z-10">{children}</span>
      <svg
        viewBox="0 0 210 52"
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-2 left-0 z-0 h-[0.56em] w-full"
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

export default function FinalLandingCta() {
  return (
    <section className="mx-auto mt-20 w-full max-w-[1100px] pb-10">
      <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(145deg,#071126_0%,#0B1732_55%,#091327_100%)] p-8 text-center shadow-[0_28px_70px_rgba(2,6,23,0.5)] md:p-12">
        <h2 className="mx-auto mt-6 max-w-4xl text-3xl font-extrabold leading-[1.1] tracking-[-0.02em] text-white md:text-5xl">
          Prêt à <HighlightWord>simplifier</HighlightWord> la gestion de votre club ?
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
          Créez votre espace club en quelques secondes et commencez à gérer vos membres,
          cotisations et événements depuis un seul endroit.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3">
          <Link
            href="/inscription"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.4)] transition hover:-translate-y-0.5"
          >
            Démarrer gratuitement
          </Link>
        </div>

        <p className="mt-4 text-sm text-slate-400">Sans engagement • Aucune carte bancaire requise</p>
      </div>
    </section>
  );
}
