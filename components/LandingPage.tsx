"use client";

import Hero from "@/components/Hero";
import ComparisonSection from "@/components/ComparisonSection";
import ShowcaseSliderSection from "@/components/ShowcaseSliderSection";
import GetStartedStepsSection from "@/components/GetStartedStepsSection";

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
      {children}
    </p>
  );
}

export default function LandingPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden text-slate-100">
      <div className="relative z-10">
        <Hero />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <ComparisonSection />
        <ShowcaseSliderSection />
        <GetStartedStepsSection />

        <section className="mt-20 rounded-3xl border border-slate-200 bg-white p-8 md:p-12">
          <SectionLabel>PROBLÈME</SectionLabel>
          <h2 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
            La gestion d’un club repose souvent sur quelques bénévoles.
          </h2>
          <p className="mt-8 text-lg text-slate-700">Ils doivent gérer :</p>
          <ul className="mt-4 space-y-2 text-slate-600">
            <li>- les membres du club</li>
            <li>- les cotisations</li>
            <li>- les événements</li>
            <li>- les bénévoles</li>
            <li>- la buvette</li>
            <li>- les finances</li>
          </ul>
          <p className="mt-8 text-lg text-slate-700">Mais l’organisation ressemble souvent à ça :</p>
          <div className="mt-4 space-y-2 text-slate-600">
            <p>Un fichier Excel pour les membres.</p>
            <p>Des groupes WhatsApp pour organiser les bénévoles.</p>
            <p>Des inscriptions envoyées par message.</p>
            <p>Des informations dispersées entre plusieurs outils.</p>
          </div>
          <p className="mt-8 text-slate-700">
            Résultat : beaucoup de temps perdu et une gestion difficile à suivre pour le comité.
          </p>
        </section>

        <section className="mt-20">
          <SectionLabel>AVANT / APRÈS</SectionLabel>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-7">
              <h3 className="text-2xl font-semibold text-slate-900">Sans Obillz</h3>
              <ul className="mt-5 space-y-3 text-slate-700">
                <li>Excel pour les membres</li>
                <li>Cotisations envoyées manuellement</li>
                <li>Bénévoles organisés sur WhatsApp</li>
                <li>Finances difficiles à suivre</li>
                <li>Événements compliqués à gérer</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#DDE3FF] bg-[#F4F6FF] p-7">
              <h3 className="text-2xl font-semibold text-slate-900">Avec Obillz</h3>
              <ul className="mt-5 space-y-3 text-slate-700">
                <li>Tous les membres centralisés</li>
                <li>Cotisations envoyées facilement</li>
                <li>Planning clair pour les bénévoles</li>
                <li>Suivi des finances en temps réel</li>
                <li>Événements mieux organisés</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-20 rounded-3xl border border-[#DDE3FF] bg-[#F4F6FF] p-8 md:p-12">
          <SectionLabel>IMPACT</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
            Une gestion plus simple pour votre club
          </h2>
          <p className="mt-6 max-w-4xl text-lg leading-relaxed text-slate-700">
            Avec Obillz, le comité gagne du temps et l’organisation devient plus claire.
          </p>
          <div className="mt-8 space-y-2 text-slate-700">
            <p>Moins de fichiers.</p>
            <p>Moins de messages.</p>
            <p>Moins de tâches administratives.</p>
          </div>
          <p className="mt-8 text-slate-700">Tout est centralisé dans une seule plateforme.</p>
        </section>

        <section className="mt-20 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-14">
          <SectionLabel>CTA FINAL</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
            Simplifiez la gestion de votre club.
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-600">
            Obillz aide les clubs et associations à organiser leur gestion plus efficacement.
          </p>
          <button
            type="button"
            className="mt-9 rounded-xl bg-[#1A23FF] px-8 py-4 text-sm font-semibold text-white transition hover:bg-[#151dd9]"
          >
            Découvrir la plateforme
          </button>
        </section>
      </div>
    </main>
  );
}
