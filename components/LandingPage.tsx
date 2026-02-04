"use client";

import Link from "next/link";
import Image from "next/image";

/* ----- Grid d'arrière-plan (hero bleu) ----- */
function GridBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-30"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }}
    />
  );
}

/* ----- Carte section blanche (fonctionnalités) ----- */
function WhiteSectionCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300 hover:border-[var(--obillz-hero-blue)]/30 hover:shadow-xl">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--obillz-hero-blue)]/10 text-[var(--obillz-hero-blue)]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ----- Nav (fond bleu hero, logo blanc, bouton blanc bordure bleue) ----- */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-md"
        style={{ backgroundColor: "var(--obillz-hero-blue)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 md:px-6">
          <Link
            href="/"
            className="relative flex items-center transition-opacity hover:opacity-90"
            aria-label="Obillz - Accueil"
          >
            <Image
              src="/logo-obillz.png"
              alt="Obillz"
              width={140}
              height={40}
              className="h-9 w-auto object-contain object-left md:h-10"
              priority
            />
          </Link>

          <div className="hidden flex-1 justify-center gap-8 md:flex">
            <Link
              href="#fonctionnement"
              className="text-sm font-medium text-white/90 hover:text-white"
            >
              Fonctionnement
            </Link>
            <Link
              href="#fonctionnalites"
              className="text-sm font-medium text-white/90 hover:text-white"
            >
              Fonctionnalités
            </Link>
            <Link
              href="#demo"
              className="text-sm font-medium text-white/90 hover:text-white"
            >
              Démo
            </Link>
          </div>

          <Link
            href="/connexion"
            className="rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Connexion
          </Link>
        </div>
      </nav>

      <main className="pt-16">
        {/* ========== 1. HERO — Titre unique + sous-titre (sans cartes) ========== */}
        <section
          className="relative min-h-[88vh] overflow-visible px-4 pb-0 pt-6 md:px-6 md:pt-8 lg:pt-10"
          style={{ backgroundColor: "var(--obillz-hero-blue)" }}
        >
          <GridBackground />

          <div className="relative z-20 mx-auto flex max-w-6xl flex-col items-center justify-center pb-24 pt-16 md:pb-28 md:pt-24 lg:pb-32 lg:pt-28">
            <h1
              className="max-w-4xl text-center text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl"
              style={{ lineHeight: "1.15" }}
            >
              La gestion des clubs sportifs centralisée.
            </h1>
            <p className="mt-4 max-w-2xl text-center text-sm leading-relaxed text-white/95 md:text-base">
              Obillz permet de gérer les membres, les cotisations, les manifestations,
              les plannings et les finances du club depuis un seul endroit.
            </p>
            <Link
              href="/inscription"
              className="hero-cta-button mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl md:px-10 md:py-4 md:text-lg"
              style={{ color: "var(--obillz-hero-blue)" }}
            >
              Essayer gratuitement pendant 7 jours
            </Link>
          </div>

          {/* Transition nette : courbe blanche qui coupe le bleu */}
          <div className="absolute bottom-0 left-0 right-0 z-10 h-28 w-full md:h-36 lg:h-44" aria-hidden>
            <svg
              className="h-full w-full"
              viewBox="0 0 1440 180"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M0 180 L0 100 Q400 20 720 50 Q1040 80 1440 90 L1440 180 Z"
                fill="white"
              />
            </svg>
          </div>
        </section>

        {/* ========== 2. UN OUTIL ADAPTÉ (fond blanc) ========== */}
        <section
          id="fonctionnement"
          className="relative bg-white px-4 pt-16 pb-20 md:px-6 md:pt-20 md:pb-28"
        >
          <div className="relative mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl">
              Un outil adapté à l'organisation des clubs
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
              Obillz s'adapte à l'organisation du club, pas l'inverse.
            </p>

            <div className="mx-auto mt-14 flex max-w-3xl flex-col gap-6">
              {/* BLOC 1 — Les membres du club */}
              <div className="flex items-start gap-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-6 md:p-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--obillz-hero-blue)]/10 text-[var(--obillz-hero-blue)]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Les membres du club</h3>
                  <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">
                    <p>Une base unique avec les joueurs, bénévoles et membres, leurs rôles et leurs coordonnées.</p>
                    <p>Chaque information est utilisée directement dans l'organisation du club.</p>
                  </div>
                </div>
              </div>

              {/* BLOC 2 — Manifestations & calendriers */}
              <div className="flex items-start gap-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-6 md:p-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--obillz-hero-blue)]/10 text-[var(--obillz-hero-blue)]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Manifestations & calendriers</h3>
                  <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">
                    <p>Créez des calendriers par événement ou par rôle. Assignez des personnes à des plages précises (bar, vestiaires, terrain, montage, etc.).</p>
                    <p>Les personnes reçoivent automatiquement un e-mail lorsqu'elles sont inscrites.</p>
                    <p>Chacun sait quand et où il doit être.</p>
                  </div>
                </div>
              </div>

              {/* BLOC 3 — Cotisations */}
              <div className="flex items-start gap-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-6 md:p-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--obillz-hero-blue)]/10 text-[var(--obillz-hero-blue)]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Cotisations</h3>
                  <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">
                    <p>Créez les cotisations du club et suivez les paiements sans gestion manuelle.</p>
                    <p>Le statut payé / en attente est visible en temps réel.</p>
                    <p>Le trésorier ne court plus après les gens.</p>
                  </div>
                </div>
              </div>

              {/* BLOC 4 — Finances par manifestation */}
              <div className="flex items-start gap-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-6 md:p-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--obillz-hero-blue)]/10 text-[var(--obillz-hero-blue)]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Finances par manifestation</h3>
                  <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">
                    <p>Chaque manifestation peut avoir son propre suivi financier.</p>
                    <p>Ajoutez les dépenses (location de salle, boissons, matériel, communication) et les recettes (repas, billets, ventes).</p>
                    <p>Vous voyez immédiatement si un événement est rentable.</p>
                  </div>
                </div>
              </div>

              {/* BLOC 5 — Réservations par QR code */}
              <div className="flex items-start gap-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-6 md:p-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--obillz-hero-blue)]/10 text-[var(--obillz-hero-blue)]">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Réservations par QR code</h3>
                  <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">
                    <p>Créez un repas ou un événement sur réservation. Les participants s'inscrivent via un QR code.</p>
                    <p>Les coordonnées sont enregistrées dans Obillz pour communiquer facilement sur les prochains événements du club.</p>
                    <p>Le club construit sa communauté, naturellement.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== 3. AVANT / AVEC OBILLZ (fond gris clair) ========== */}
        <section className="relative bg-slate-50 px-4 py-20 md:px-6 md:py-28">
          <div className="relative mx-auto max-w-4xl">
            <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl">
              Avant / Avec Obillz
            </h2>

            <div className="mt-14 flex flex-col gap-5">
              {/* En-têtes colonnes (desktop) */}
              <div className="hidden md:grid md:grid-cols-2 md:gap-4">
                <div className="rounded-lg bg-slate-200/60 px-5 py-3 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Avant
                </div>
                <div
                  className="rounded-lg px-5 py-3 text-center text-sm font-semibold uppercase tracking-wide text-white"
                  style={{ backgroundColor: "var(--obillz-hero-blue)" }}
                >
                  Avec Obillz
                </div>
              </div>

              {/* SITUATION 1 — Cotisations */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cotisations</span>
                </div>
                <div className="grid md:grid-cols-2">
                  <div className="border-b border-slate-100 p-5 md:border-b-0 md:border-r">
                    <span className="mb-2 inline-block text-xs font-semibold uppercase text-slate-400 md:hidden">Avant</span>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Vous imprimez les cotisations, vous les distribuez, vous relancez à la main.
                    </p>
                  </div>
                  <div className="p-5">
                    <span className="mb-2 inline-block text-xs font-semibold uppercase text-[var(--obillz-hero-blue)] md:hidden">Avec Obillz</span>
                    <p className="text-sm leading-relaxed text-slate-700">
                      Les cotisations sont envoyées par e-mail directement depuis la plateforme. Ça prend deux secondes.
                    </p>
                  </div>
                </div>
              </div>

              {/* SITUATION 2 — Manifestations & organisation */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manifestations & organisation</span>
                </div>
                <div className="grid md:grid-cols-2">
                  <div className="border-b border-slate-100 p-5 md:border-b-0 md:border-r">
                    <span className="mb-2 inline-block text-xs font-semibold uppercase text-slate-400 md:hidden">Avant</span>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Vous remplissez des fichiers Excel, vous communiquez dans des groupes WhatsApp, les infos se perdent.
                    </p>
                  </div>
                  <div className="p-5">
                    <span className="mb-2 inline-block text-xs font-semibold uppercase text-[var(--obillz-hero-blue)] md:hidden">Avec Obillz</span>
                    <p className="text-sm leading-relaxed text-slate-700">
                      Vous remplissez les cases directement dans le logiciel. Chaque personne assignée à une tâche reçoit automatiquement un e-mail de confirmation.
                    </p>
                  </div>
                </div>
              </div>

              {/* SITUATION 3 — Dépenses & recettes */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dépenses & recettes</span>
                </div>
                <div className="grid md:grid-cols-2">
                  <div className="border-b border-slate-100 p-5 md:border-b-0 md:border-r">
                    <span className="mb-2 inline-block text-xs font-semibold uppercase text-slate-400 md:hidden">Avant</span>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Pas de vrai suivi par événement. Les chiffres sont notés à part, sans vue globale.
                    </p>
                  </div>
                  <div className="p-5">
                    <span className="mb-2 inline-block text-xs font-semibold uppercase text-[var(--obillz-hero-blue)] md:hidden">Avec Obillz</span>
                    <p className="text-sm leading-relaxed text-slate-700">
                      Vous ajoutez les dépenses et les recettes et les rattachez directement à une manifestation. Vous voyez clairement ce que l'événement rapporte.
                    </p>
                  </div>
                </div>
              </div>

              {/* SITUATION 4 — Communication du club */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Communication du club</span>
                </div>
                <div className="grid md:grid-cols-2">
                  <div className="border-b border-slate-100 p-5 md:border-b-0 md:border-r">
                    <span className="mb-2 inline-block text-xs font-semibold uppercase text-slate-400 md:hidden">Avant</span>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Vous ne savez pas vraiment comment communiquer efficacement sur les prochains événements.
                    </p>
                  </div>
                  <div className="p-5">
                    <span className="mb-2 inline-block text-xs font-semibold uppercase text-[var(--obillz-hero-blue)] md:hidden">Avec Obillz</span>
                    <p className="text-sm leading-relaxed text-slate-700">
                      Les inscriptions (repas, événements) vous permettent de garder des contacts pour informer et promouvoir les prochaines activités du club.
                    </p>
                  </div>
                </div>
              </div>

              {/* SITUATION 5 — Réservations de repas */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Réservations de repas</span>
                </div>
                <div className="grid md:grid-cols-2">
                  <div className="border-b border-slate-100 p-5 md:border-b-0 md:border-r">
                    <span className="mb-2 inline-block text-xs font-semibold uppercase text-slate-400 md:hidden">Avant</span>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Vous recevez des messages, vous les transférez ou les notez à la main. Difficile de savoir qui vient, combien, et ce qu'ils mangent.
                    </p>
                  </div>
                  <div className="p-5">
                    <span className="mb-2 inline-block text-xs font-semibold uppercase text-[var(--obillz-hero-blue)] md:hidden">Avec Obillz</span>
                    <p className="text-sm leading-relaxed text-slate-700">
                      Les personnes s'inscrivent via un QR code. Tout arrive directement dans le logiciel : nombre de participants, choix des repas, informations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== 4. FONCTIONNALITÉS (fond blanc) ========== */}
        <section
          id="fonctionnalites"
          className="relative bg-white px-4 py-20 md:px-6 md:py-28"
        >
          <div className="relative mx-auto max-w-6xl">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Fonctionnalités
            </p>
            <h2 className="mt-3 text-center text-3xl font-bold text-slate-900 md:text-4xl">
              Ce que permet Obillz
            </h2>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <WhiteSectionCard
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                title="Base unique"
                text="Joueurs et membres dans une seule base, avec e-mails et téléphones."
              />
              <WhiteSectionCard
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
                title="Cotisations"
                text="Création, envoi par e-mail et suivi payé / non payé."
              />
              <WhiteSectionCard
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                title="Manifestations"
                text="Calendriers, plages horaires, affectation des personnes, e-mail automatique (date, heure, lieu, rôle)."
              />
              <WhiteSectionCard
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                }
                title="Dépenses & recettes"
                text="Enregistrement, lien à une manifestation ou activité, vue coût et revenu par événement."
              />
            </div>
          </div>
        </section>

        {/* ========== 5. CENTRALISATION (fond blanc) ========== */}
        <section className="relative bg-white px-4 py-20 md:px-6 md:py-28">
          <div className="relative mx-auto max-w-5xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Bénéfices
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
              Centralisation, clarté, organisation
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Un outil unique. Des données à jour. Une vue claire sur les activités et les finances du club.
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {[
                {
                  title: "Centralisation",
                  text: "Joueurs, membres, cotisations, manifestations, dépenses et recettes dans un seul logiciel.",
                },
                {
                  title: "Clarté",
                  text: "Suivi des paiements, coût et revenu par manifestation, affectations aux plages horaires.",
                },
                {
                  title: "Organisation",
                  text: "Calendriers liés aux manifestations, e-mails automatiques aux personnes assignées, campagnes ciblées.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300 hover:border-[var(--obillz-hero-blue)]/30 hover:shadow-xl"
                >
                  <p
                    className="text-lg font-semibold text-slate-900"
                    style={{ color: "var(--obillz-hero-blue)" }}
                  >
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== 6. CTA FINAL (fond blanc) ========== */}
        <section id="demo" className="relative bg-white px-4 py-24 md:px-6 md:py-32">
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Demander une démo
            </h2>
            <p className="mt-4 text-slate-600">
              Vous souhaitez voir Obillz en fonctionnement ? Contactez-nous pour organiser une démonstration adaptée à votre club.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="mailto:contact@obillz.fr?subject=Demande%20de%20d%C3%A9mo%20Obillz"
                className="inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
                style={{ backgroundColor: "var(--obillz-hero-blue)" }}
              >
                Nous contacter
              </a>
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-full border-2 border-slate-300 bg-white px-8 py-3.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer (fond blanc) */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-sm text-slate-500 sm:flex-row sm:justify-between">
          <p>Obillz — Logiciel de gestion pour les clubs sportifs</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/connexion" className="hover:text-slate-700">
              Connexion
            </Link>
            <Link href="#demo" className="hover:text-slate-700">
              Demander une démo
            </Link>
            <Link href="/mentions-legales" className="hover:text-slate-700">
              Mentions légales
            </Link>
            <Link href="/politique-confidentialite" className="hover:text-slate-700">
              Politique de confidentialité
            </Link>
            <Link href="/conditions-utilisation" className="hover:text-slate-700">
              Conditions d&apos;utilisation
            </Link>
            <Link href="/politique-cookies" className="hover:text-slate-700">
              Cookies
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
