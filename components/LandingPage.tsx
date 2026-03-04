"use client";

import Hero from "@/components/Hero";

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6E7AB8]">
      {children}
    </p>
  );
}

function ScreenshotCard({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
      <div className="mb-4 h-8 w-28 rounded-md bg-slate-100" />
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-1 h-28 rounded-xl bg-slate-100" />
        <div className="col-span-3 h-28 rounded-xl bg-slate-50" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600">{title}</p>
    </div>
  );
}

function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#DDE3FF] bg-[#EEF1FF] text-[#1A23FF]">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor">
        {children}
      </svg>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Hero />

      <div className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <section className="mt-20">
          <SectionLabel>PREUVES</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
            Une organisation plus simple pour votre comité.
          </h2>
          <p className="mt-4 text-lg text-slate-600">Avec Obillz</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-base shadow-sm">
              ⏱ Jusqu’à 60% de temps administratif en moins
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-base shadow-sm">
              📊 Toutes les informations du club centralisées
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-base shadow-sm">
              📅 Événements et bénévoles mieux organisés
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-base shadow-sm">
              💳 Cotisations envoyées en quelques clics
            </div>
          </div>
        </section>

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

        <section className="mt-20">
          <SectionLabel>PRODUIT</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
            Une seule plateforme pour gérer votre club
          </h2>
          <p className="mt-6 max-w-4xl text-lg leading-relaxed text-slate-600">
            Obillz regroupe les outils essentiels pour les clubs sportifs et les associations.
            <br />
            Le comité peut gérer toute l’organisation depuis un seul espace.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <FeatureIcon>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M17 20h5v-2a3 3 0 0 0-5.36-1.86M17 20H7m10 0v-2a4.96 4.96 0 0 0-.36-1.86M7 20H2v-2a3 3 0 0 1 5.36-1.86M7 20v-2c0-.65.13-1.28.36-1.86m0 0a5 5 0 0 1 9.28 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </FeatureIcon>
              <h3 className="text-xl font-semibold">Gestion des membres</h3>
              <p className="mt-3 text-slate-600">
                Ajoutez vos joueurs, entraîneurs, bénévoles et membres du comité dans un seul
                système.
              </p>
              <p className="mt-3 text-slate-600">Organisez facilement les équipes et les rôles.</p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <FeatureIcon>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 8c-2 0-3 1-3 2s1 2 3 2 3 1 3 2-1 2-3 2m0-8V6m0 10v2M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0Z"
                />
              </FeatureIcon>
              <h3 className="text-xl font-semibold">Cotisations simplifiées</h3>
              <p className="mt-3 text-slate-600">
                Créez les cotisations et envoyez-les directement aux membres.
              </p>
              <p className="mt-3 text-slate-600">
                Suivez facilement les paiements et gardez un historique clair.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <FeatureIcon>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
                />
              </FeatureIcon>
              <h3 className="text-xl font-semibold">Organisation des événements</h3>
              <p className="mt-3 text-slate-600">
                Créez vos manifestations et suivez les revenus et dépenses associés.
              </p>
              <p className="mt-3 text-slate-600">
                Vous savez immédiatement si un événement est rentable.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <FeatureIcon>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 5h16m-2 0v6a6 6 0 1 1-12 0V5m4 13v2m4-2v2m-9 0h14"
                />
              </FeatureIcon>
              <h3 className="text-xl font-semibold">Planning des bénévoles</h3>
              <p className="mt-3 text-slate-600">Organisez les équipes pour vos manifestations.</p>
              <p className="mt-3 text-slate-600">
                Cuisine, service, montage, démontage : chaque membre peut être assigné à une tâche.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <FeatureIcon>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M5 3h12a1 1 0 0 1 1 1v5a7 7 0 1 1-14 0V4a1 1 0 0 1 1-1Zm0 3h13M8 21h6M10 17v4M14 17v4"
                />
              </FeatureIcon>
              <h3 className="text-xl font-semibold">Gestion de la buvette</h3>
              <p className="mt-3 text-slate-600">
                Partagez un lien de réservation et recevez les demandes automatiquement.
              </p>
              <p className="mt-3 text-slate-600">
                Les réservations sont intégrées directement dans votre calendrier.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <FeatureIcon>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm11 0h1m-1 3h1m2-3h2m-3 6h3"
                />
              </FeatureIcon>
              <h3 className="text-xl font-semibold">Inscriptions rapides</h3>
              <p className="mt-3 text-slate-600">
                Créez des QR codes ou des liens pour permettre aux participants de s’inscrire
                facilement à vos événements.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 lg:col-span-1">
              <FeatureIcon>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 8v8m-4-4h8m7-2A9 9 0 1 1 5 5a9 9 0 0 1 18 5Z"
                />
              </FeatureIcon>
              <h3 className="text-xl font-semibold">Suivi financier</h3>
              <p className="mt-3 text-slate-600">
                Centralisez les revenus, les dépenses et les justificatifs du club.
              </p>
              <p className="mt-3 text-slate-600">Gardez une vision claire des finances.</p>
            </article>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <ScreenshotCard title="dashboard screenshot" />
            <ScreenshotCard title="member management interface" />
            <ScreenshotCard title="event management interface" />
            <ScreenshotCard title="financial overview interface" />
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
