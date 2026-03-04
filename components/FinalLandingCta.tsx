"use client";

import Link from "next/link";

export default function FinalLandingCta() {
  return (
    <section className="mx-auto mt-20 w-full max-w-[1100px] pb-10">
      <div className="rounded-[1.8rem] border border-emerald-300/20 bg-[linear-gradient(140deg,#0F2A1F_0%,#123B2C_55%,#0A231A_100%)] p-8 shadow-[0_28px_70px_rgba(2,12,8,0.45)] md:p-12">
        <h2 className="max-w-4xl text-3xl font-extrabold leading-[1.1] tracking-[-0.02em] text-white md:text-5xl">
          La plateforme qui simplifie la gestion de votre club sportif
        </h2>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-emerald-50/85 md:text-lg">
          Gérez vos membres, cotisations, événements, bénévoles et finances depuis une seule
          plateforme.
          <br className="hidden md:block" />
          Passez moins de temps sur l’administratif et plus de temps à faire vivre votre club.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/inscription"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-900 transition hover:-translate-y-0.5 hover:bg-emerald-50"
          >
            Démarrer gratuitement
          </Link>
          <Link
            href="/connexion?demo=1"
            className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/20"
          >
            Demander une démo
          </Link>
        </div>

        <p className="mt-4 text-sm text-emerald-100/80">
          Sans engagement
          <br />
          Aucune carte bancaire requise
        </p>
      </div>
    </section>
  );
}
