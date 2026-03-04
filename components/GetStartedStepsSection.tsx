"use client";

import { Calendar2, CreditCard, LayoutDashboard, Users } from "@/lib/icons";

function HandwrittenWord({ children }: { children: string }) {
  return (
    <span className="relative inline-block px-1 text-[#60A5FA]">
      <span className="relative z-10">{children}</span>
      <svg
        viewBox="0 0 210 52"
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-2 left-0 z-0 h-[0.58em] w-full"
      >
        <path
          d="M6 35C46 22 83 18 121 21C152 23 179 28 203 34"
          stroke="#93C5FD"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.45"
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

function StepBadge({ number }: { number: number }) {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700">
      {number}
    </span>
  );
}

export default function GetStartedStepsSection() {
  return (
    <section className="mx-auto mt-20 w-full max-w-[1200px]">
      <div className="text-center">
        <h2 className="text-4xl font-extrabold leading-[1.08] tracking-[-0.025em] text-white md:text-[3.1rem]">
          Démarrez votre club <HandwrittenWord>gratuitement</HandwrittenWord> en 3 étapes
        </h2>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.12)]">
          <div className="flex items-center gap-3">
            <StepBadge number={1} />
            <h3 className="text-lg font-semibold text-slate-900">Créez votre club</h3>
          </div>

          <div className="mt-5 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">Nom du club</span> : FC Obillz
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">Sport</span> : Football
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">Email du responsable</span> :
              contact@club.ch
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">Nombre approximatif de membres</span> :
              180
            </p>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            Créez votre espace club en quelques secondes et accédez immédiatement à votre tableau
            de bord.
          </p>
        </article>

        <article className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.12)]">
          <div className="flex items-center gap-3">
            <StepBadge number={2} />
            <h3 className="text-lg font-semibold text-slate-900">Configurez votre gestion</h3>
          </div>

          <ul className="mt-5 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <Users className="h-4 w-4 text-[#2563EB]" /> Ajouter vos membres
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <CreditCard className="h-4 w-4 text-[#2563EB]" /> Créer vos cotisations
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <Calendar2 className="h-4 w-4 text-[#2563EB]" /> Configurer vos événements
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-700">
              <LayoutDashboard className="h-4 w-4 text-[#2563EB]" /> Activer la buvette
            </li>
          </ul>

          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            Configurez les éléments essentiels de votre club pour commencer à tout gérer depuis
            Obillz.
          </p>
        </article>

        <article className="rounded-xl border border-blue-200 bg-white p-6 shadow-[0_18px_42px_rgba(37,99,235,0.2)] ring-1 ring-blue-100">
          <div className="flex items-center gap-3">
            <StepBadge number={3} />
            <h3 className="text-lg font-semibold text-slate-900">Commencez à gérer votre club</h3>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Dashboard du club</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                <p className="text-[11px] text-slate-500">Membres</p>
                <p className="mt-1 text-base font-semibold text-slate-900">284</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                <p className="text-[11px] text-slate-500">Cotisations suivies</p>
                <p className="mt-1 text-base font-semibold text-slate-900">92%</p>
              </div>
              <div className="col-span-2 rounded-lg border border-slate-200 bg-white p-2.5">
                <p className="text-[11px] text-slate-500">Statistiques membres</p>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-[70%] rounded-full bg-[#2563EB]" />
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            Suivez vos membres, encaissez les cotisations et gérez votre club facilement depuis un
            seul endroit.
          </p>
        </article>
      </div>
    </section>
  );
}
