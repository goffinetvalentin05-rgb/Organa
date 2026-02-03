"use client";

import Link from "next/link";

/* ----- Grid d'arrière-plan ----- */
function GridBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-40"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
      }}
    />
  );
}

/* ----- Accent graphique type "main" ----- */
function HandDrawnArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`text-emerald-400 ${className}`}
      width="80"
      height="40"
      viewBox="0 0 80 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 20h55M55 12l8 8-8 8" />
    </svg>
  );
}

function HandDrawnCircle({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border-2 border-dashed border-emerald-400 px-4 py-2 text-sm font-medium text-emerald-400">
      {children}
    </span>
  );
}

/* ----- Carte flottante hero ----- */
function FloatingHeroCard({
  title,
  children,
  position,
  animationDelay = "0s",
}: {
  title: string;
  children: React.ReactNode;
  rotate?: string;
  position: string;
  animationDelay?: string;
}) {
  return (
    <div
      className={`absolute rounded-3xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-300 hover:scale-105 hover:border-white/30 ${position}`}
      style={{ animation: "hero-float 6s ease-in-out infinite", animationDelay }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
        {title}
      </p>
      <div className="mt-2 text-sm text-white">{children}</div>
    </div>
  );
}

/* ----- Carte section (non flottante) ----- */
function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/30 hover:bg-white/10">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/70">{text}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ----- Nav (intégrée au hero bleu) ----- */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-blue-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link
            href="/"
            className="text-xl font-semibold text-white transition-opacity hover:opacity-90"
          >
            Obillz
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/connexion"
              className="rounded-full border border-white/30 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Connexion
            </Link>
            <Link
              href="#demo"
              className="rounded-full border-2 border-emerald-400 bg-transparent px-5 py-2 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-400 hover:text-blue-950"
            >
              Demander une démo
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* ========== 1. HERO VISUEL ========== */}
        <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-b from-blue-950 via-indigo-950 to-blue-950 px-4 pb-24 pt-28 md:px-6 md:pt-36">
          <GridBackground />

          <div className="relative mx-auto max-w-5xl text-center">
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
              Gestion pour
              <br />
              clubs sportifs
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
              Joueurs, membres, cotisations, manifestations, calendriers,
              dépenses, recettes et communication — tout dans un seul outil.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="#demo"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-emerald-400 bg-emerald-400 px-8 py-3.5 text-sm font-semibold text-blue-950 transition-all hover:bg-emerald-300 hover:border-emerald-300"
              >
                Demander une démo
              </Link>
              <HandDrawnCircle>Démo sur mesure</HandDrawnCircle>
            </div>

            <div className="relative mx-auto mt-16 h-72 w-full max-w-4xl md:mt-20 md:h-80 lg:mt-24">
              {/* Cartes flottantes hero */}
              <FloatingHeroCard
                title="Joueur / Membre"
                rotate="-rotate-6"
                position="left-0 top-0 md:left-[2%] md:top-[5%]"
                animationDelay="0s"
              >
                <p className="font-medium text-white">Marie Dupont</p>
                <p className="text-white/80">marie.dupont@email.fr</p>
              </FloatingHeroCard>

              <FloatingHeroCard
                title="Manifestation"
                rotate="rotate-3"
                position="right-0 top-0 md:right-[2%] md:top-[0%]"
                animationDelay="1s"
              >
                <p className="font-medium text-white">Match domicile</p>
                <p className="text-white/80">Sam. 14h · Stade Jean-Moulin</p>
              </FloatingHeroCard>

              <FloatingHeroCard
                title="Cotisation"
                rotate="-rotate-2"
                position="bottom-0 left-0 md:left-[8%] md:bottom-[5%]"
                animationDelay="0.5s"
              >
                <p className="font-medium text-white">Saison 2024-2025</p>
                <p className="mt-1 inline-block rounded-full bg-emerald-400/30 px-2 py-0.5 text-xs text-emerald-300">
                  Payé
                </p>
                <p className="mt-0.5 text-xs text-white/60">2 en attente</p>
              </FloatingHeroCard>

              <FloatingHeroCard
                title="Dépense / Recette"
                rotate="rotate-4"
                position="bottom-0 right-0 md:right-[5%] md:bottom-[0%]"
                animationDelay="1.5s"
              >
                <p className="font-medium text-white">- 420 €</p>
                <p className="text-white/80">Arbitrage · Match 12/01</p>
              </FloatingHeroCard>
            </div>

            {/* Flèche accent */}
            <div className="absolute -right-4 top-1/2 hidden translate-y-4 lg:block">
              <HandDrawnArrow />
            </div>
          </div>
        </section>

        {/* ========== 2. CARTES FONCTIONNEMENT ========== */}
        <section className="relative bg-gradient-to-b from-blue-950 to-indigo-950 px-4 py-20 md:px-6 md:py-28">
          <GridBackground />
          <div className="relative mx-auto max-w-6xl">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Fonctionnement
            </p>
            <h2 className="mt-3 text-center text-3xl font-bold text-white md:text-4xl">
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
                  items: ["Création dans l’outil", "Envoi par e-mail", "Payé / en attente"],
                },
                {
                  title: "Dépense / Recette",
                  items: ["Montant enregistré", "Lien à l’événement", "Coût et revenu par événement"],
                },
              ].map((block) => (
                <div
                  key={block.title}
                  className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-white/25 hover:bg-white/15"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    {block.title}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-white/90">
                    {block.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== 3. FONCTIONNALITÉS ========== */}
        <section className="relative bg-indigo-950 px-4 py-20 md:px-6 md:py-28">
          <GridBackground />
          <div className="relative mx-auto max-w-6xl">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Fonctionnalités
            </p>
            <h2 className="mt-3 text-center text-3xl font-bold text-white md:text-4xl">
              Ce que permet Obillz
            </h2>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                title="Base unique"
                text="Joueurs et membres dans une seule base, avec e-mails et téléphones."
              />
              <FeatureCard
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
                title="Cotisations"
                text="Création, envoi par e-mail et suivi payé / non payé."
              />
              <FeatureCard
                icon={
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                title="Manifestations"
                text="Calendriers, plages horaires, affectation des personnes, e-mail automatique (date, heure, lieu, rôle)."
              />
              <FeatureCard
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

        {/* ========== 4. CENTRALISATION / ORGANISATION ========== */}
        <section className="relative bg-gradient-to-b from-indigo-950 to-blue-950 px-4 py-20 md:px-6 md:py-28">
          <GridBackground />
          <div className="relative mx-auto max-w-5xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Bénéfices
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
              Centralisation, clarté, organisation
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/80">
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
                  className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl transition-all duration-300 hover:border-emerald-400/40 hover:bg-white/15"
                >
                  <p className="text-lg font-semibold text-white">{item.title}</p>
                  <p className="mt-3 text-sm text-white/80">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== 5. CTA FINAL ========== */}
        <section
          id="demo"
          className="relative bg-blue-950 px-4 py-24 md:px-6 md:py-32"
        >
          <GridBackground />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Demander une démo
            </h2>
            <p className="mt-4 text-white/80">
              Vous souhaitez voir Obillz en fonctionnement ? Contactez-nous pour organiser une démonstration adaptée à votre club.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="mailto:contact@obillz.fr?subject=Demande%20de%20d%C3%A9mo%20Obillz"
                className="inline-flex items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-400 px-8 py-3.5 text-sm font-semibold text-blue-950 transition-all hover:bg-emerald-300 hover:border-emerald-300"
              >
                Nous contacter
              </a>
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-full border-2 border-white/40 bg-white/10 px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-8 md:px-6">
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
