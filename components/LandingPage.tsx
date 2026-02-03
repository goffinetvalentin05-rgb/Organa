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

/* ----- Carte hero : flottante (absolute) ou en ligne (inline) ----- */
function FloatingHeroCard({
  title,
  children,
  position,
  animationDelay = "0s",
  inline = false,
}: {
  title: string;
  children: React.ReactNode;
  position?: string;
  animationDelay?: string;
  inline?: boolean;
}) {
  const baseClass =
    "w-[200px] min-w-[160px] max-w-[220px] rounded-3xl border border-white/25 bg-white/15 p-4 shadow-lg backdrop-blur-xl transition-transform duration-300 hover:scale-[1.02] hover:border-white/35 hover:shadow-xl";
  const positionedClass = inline
    ? "flex-1 shrink-0"
    : `absolute ${position ?? ""}`;
  return (
    <div
      className={`${baseClass} ${positionedClass}`}
      style={
        inline
          ? undefined
          : { animation: "hero-float 6s ease-in-out infinite", animationDelay }
      }
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
        {title}
      </p>
      <div className="mt-2 text-sm text-white">{children}</div>
    </div>
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
            href="#demo"
            className="rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Demander une démo
          </Link>
        </div>
      </nav>

      <main className="pt-16">
        {/* ========== 1. HERO — Titre 2 lignes max, 4 cartes en ligne en dessous ========== */}
        <section
          className="relative min-h-[88vh] overflow-hidden px-4 pb-0 pt-12 md:px-6 md:pt-14 lg:pt-16"
          style={{ backgroundColor: "var(--obillz-hero-blue)" }}
        >
          <GridBackground />

          <div className="relative mx-auto flex min-h-[80vh] max-w-6xl flex-col items-center justify-center gap-10 py-12 md:min-h-[82vh] md:gap-12">
            {/* Logo au-dessus */}
            <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
              <Image
                src="/logo-obillz.png"
                alt="Obillz"
                width={160}
                height={44}
                className="h-11 w-auto object-contain opacity-90 sm:h-12"
                priority
              />
            </div>

            {/* Titre : 2 lignes max, centré */}
            <h1
              className="z-20 max-w-4xl text-center text-2xl font-bold uppercase leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl"
              style={{ lineHeight: "1.15" }}
            >
              <span className="line-clamp-2 block">
                La gestion des clubs sportifs centralisée.
              </span>
            </h1>

            {/* 4 cartes alignées sur une seule ligne sous le hero */}
            <div className="z-20 flex w-full max-w-5xl flex-wrap items-stretch justify-center gap-4 px-2 md:gap-6">
              <FloatingHeroCard title="Joueur / Membre" inline>
                <p className="font-semibold text-white">marie.dupont@club.fr</p>
                <p className="mt-1 text-xs text-white/80">124 membres</p>
              </FloatingHeroCard>
              <FloatingHeroCard title="Cotisation" inline>
                <p className="font-semibold text-white">Saison 2024-2025</p>
                <p className="mt-1 text-xs text-white/80">Payé · 2 en attente</p>
              </FloatingHeroCard>
              <FloatingHeroCard title="Dépense / Recette" inline>
                <p className="font-semibold text-white">- 420 €</p>
                <p className="mt-1 text-xs text-white/80">Arbitrage · Match 12/01</p>
              </FloatingHeroCard>
              <FloatingHeroCard title="Manifestation" inline>
                <p className="font-semibold text-white">Match domicile</p>
                <p className="mt-1 text-sm text-white/80">Sam. 14h · Stade Jean-Moulin</p>
              </FloatingHeroCard>
            </div>
          </div>

          {/* Transition nette : courbe blanche qui coupe le bleu */}
          <div className="absolute bottom-0 left-0 right-0 h-28 w-full md:h-36 lg:h-44" aria-hidden>
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

        {/* ========== 2. FONCTIONNEMENT (fond blanc) ========== */}
        <section
          id="fonctionnement"
          className="relative -mt-1 bg-white px-4 pt-16 pb-20 md:px-6 md:pt-20 md:pb-28"
        >
          <div className="relative mx-auto max-w-6xl">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Fonctionnement
            </p>
            <h2 className="mt-3 text-center text-3xl font-bold text-slate-900 md:text-4xl">
              Tout centralisé, tout visible
            </h2>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Joueur / Membre",
                  items: ["Une base unique", "E-mail, téléphone", "Filtres et tri"],
                },
                {
                  title: "Manifestation",
                  items: ["Date, heure, lieu", "Calendrier lié", "Plages horaires"],
                },
                {
                  title: "Cotisation",
                  items: ["Création dans l'outil", "Envoi par e-mail", "Payé / en attente"],
                },
                {
                  title: "Dépense / Recette",
                  items: ["Montant enregistré", "Lien à l'événement", "Coût et revenu par événement"],
                },
              ].map((block) => (
                <div
                  key={block.title}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300 hover:border-[var(--obillz-hero-blue)]/30 hover:shadow-xl"
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--obillz-hero-blue)" }}
                  >
                    {block.title}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {block.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: "var(--obillz-hero-blue)" }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== 3. FONCTIONNALITÉS (fond blanc) ========== */}
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

        {/* ========== 4. CENTRALISATION (fond blanc) ========== */}
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

        {/* ========== 5. CTA FINAL (fond blanc) ========== */}
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
