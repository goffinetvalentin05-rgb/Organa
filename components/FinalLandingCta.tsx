"use client";

import Link from "next/link";

export default function FinalLandingCta() {
  return (
    <section className="mx-auto mt-20 w-full max-w-[1100px] pb-10">
      <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(145deg,#071126_0%,#0B1732_55%,#091327_100%)] p-8 text-center shadow-[0_28px_70px_rgba(2,6,23,0.5)] md:p-12">
        <span className="inline-flex rounded-full border border-blue-200/25 bg-white/10 px-4 py-2 text-xs font-semibold text-blue-100 backdrop-blur-sm">
          Essayez Obillz dès aujourd&apos;hui
        </span>

        <h2 className="mx-auto mt-6 max-w-4xl text-3xl font-extrabold leading-[1.1] tracking-[-0.02em] text-white md:text-5xl">
          Simplifiez la gestion de votre club.
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
          Créez votre espace en quelques secondes et découvrez comment Obillz peut vous faire
          gagner du temps.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/inscription"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.4)] transition hover:-translate-y-0.5"
          >
            Démarrer gratuitement
          </Link>
          <Link
            href="/connexion?demo=1"
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/20"
          >
            Demander une démo
          </Link>
        </div>

        <p className="mt-4 text-sm text-slate-400">
          Sans engagement
          <br />
          Aucune carte bancaire requise
        </p>
      </div>
    </section>
  );
}
