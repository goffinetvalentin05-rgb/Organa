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

/* ----- Flèche spirale type "main" (vers le haut) ----- */
function HandDrawnArrowUp({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`text-emerald-400 ${className}`}
      width="48"
      height="64"
      viewBox="0 0 48 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M24 56C24 56 12 44 12 32C12 20 24 8 24 8M24 8C24 8 36 20 36 32C36 44 24 56 24 56" />
      <path d="M24 8v56" />
    </svg>
  );
}

/* ----- Flèche spirale type "main" (vers le bas) ----- */
function HandDrawnArrowDown({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`text-emerald-400 ${className}`}
      width="48"
      height="64"
      viewBox="0 0 48 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M24 8C24 8 12 20 12 32C12 44 24 56 24 56M24 56C24 56 36 44 36 32C36 20 24 8 24 8" />
      <path d="M24 56V8" />
    </svg>
  );
}

/* Cercle CTA à droite du hero (style référence : cercle vert + texte + flèche) */
function HeroCtaCircleSimple() {
  return (
    <Link
      href="#demo"
      className="relative flex h-28 w-28 flex-shrink-0 items-center justify-center md:h-36 md:w-36"
      aria-label="Demander une démo"
    >
      <svg
        className="absolute inset-0 h-full w-full -rotate-90 text-emerald-400"
        viewBox="0 0 140 140"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <circle cx="70" cy="70" r="62" strokeDasharray="4 3" />
      </svg>
      <span className="absolute flex flex-col items-center justify-center gap-0.5 text-center">
        <span className="text-[9px] font-bold uppercase leading-tight tracking-widest text-emerald-400 md:text-[10px]">
          Demander
        </span>
        <span className="text-[9px] font-bold uppercase leading-tight tracking-widest text-emerald-400 md:text-[10px]">
          une démo
        </span>
      </span>
      <svg
        className="absolute bottom-5 h-5 w-5 text-emerald-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
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
  const isRelative = position.includes("relative");
  return (
    <div
      className={`rounded-3xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-300 hover:scale-105 hover:border-white/30 ${isRelative ? "" : "absolute"} ${position}`}
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
      {/* ----- Header (exactement comme maquette) ----- */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-blue-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 md:px-6">
          {/* Logo sur fond arrondi vert menthe / blanc */}
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-100 to-white px-4 py-2.5 shadow-sm transition-opacity hover:opacity-90"
          >
            <span className="text-lg font-bold text-blue-950">Obillz</span>
          </Link>

          {/* Liens nav au centre-droit */}
          <div className="hidden flex-1 justify-center gap-8 md:flex">
            <Link href="#fonctionnement" className="text-sm font-medium text-white/90 hover:text-white">
              Fonctionnement
            </Link>
            <Link href="#fonctionnalites" className="text-sm font-medium text-white/90 hover:text-white">
              Fonctionnalités
            </Link>
            <Link href="#demo" className="text-sm font-medium text-white/90 hover:text-white">
              Démo
            </Link>
          </div>

          {/* Bouton type "Connect wallet" : bleu foncé, texte blanc */}
          <Link
            href="#demo"
            className="rounded-full border border-white/20 bg-blue-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-900 hover:border-white/30"
          >
            Demander une démo
          </Link>
        </div>
      </nav>

      <main className="pt-16">
        {/* ========== 1. HERO (exactement comme maquette) ========== */}
        <section className="relative min-h-[92vh] overflow-hidden bg-blue-950 px-4 pb-20 pt-24 md:px-6 md:pt-28 lg:pt-32">
          <GridBackground />

          <div className="relative mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center lg:justify-between">
            {/* Bloc titre centré + 2 cartes flottantes autour + flèches */}
            <div className="relative flex flex-1 flex-col items-center justify-center text-center">
              {/* Titre XXL deux lignes : ligne 1 avec accent vert (style #CLUB), ligne 2 blanche */}
              <h1 className="relative z-10 mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
                <span className="block">
                  <span className="text-emerald-400">O</span>
                  <span>BILLZ</span>
                </span>
                <span className="mt-1 block">GESTION CLUBS SPORTIFS</span>
              </h1>

              {/* Carte gauche (petite) - sous "OBILLZ", à gauche */}
              <FloatingHeroCard
                title="Joueur / Membre"
                position="absolute left-0 top-1/2 -translate-y-1/2 md:left-[5%] lg:left-[0%] xl:left-[2%]"
                animationDelay="0s"
              >
                <p className="font-semibold text-white">marie.dupont@club.fr</p>
                <p className="mt-1 text-xs text-white/80">124 membres</p>
              </FloatingHeroCard>

              {/* Carte droite (plus grande) - à droite, niveau "GESTION CLUBS SPORTIFS" */}
              <FloatingHeroCard
                title="Manifestation"
                position="absolute right-0 top-1/2 -translate-y-1/2 md:right-[5%] lg:right-[0%] xl:right-[2%]"
                animationDelay="0.5s"
              >
                <p className="font-semibold text-white">Match domicile</p>
                <p className="mt-1 text-sm text-white/80">Sam. 14h · Stade Jean-Moulin</p>
                <p className="mt-2 inline-block rounded-full bg-emerald-400/30 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  Cotisation à jour
                </p>
              </FloatingHeroCard>

              {/* Flèche spirale vers le haut, sous "OBILLZ", près de la carte gauche */}
              <div className="absolute left-[18%] top-[58%] hidden lg:block xl:left-[22%]">
                <HandDrawnArrowUp className="h-10 w-10 text-emerald-400 md:h-12 md:w-12" />
              </div>

              {/* Flèche spirale vers le bas, près de la carte droite */}
              <div className="absolute right-[18%] top-[42%] hidden lg:block xl:right-[22%]">
                <HandDrawnArrowDown className="h-10 w-10 text-emerald-400 md:h-12 md:w-12" />
              </div>
            </div>

            {/* Cercle vert fluo à droite : "DEMANDER UNE DÉMO" + flèche centrale (style référence) */}
            <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 lg:flex lg:justify-end xl:right-8">
              <HeroCtaCircleSimple />
            </div>
          </div>
        </section>

        {/* ========== 2. CARTES FONCTIONNEMENT ========== */}
        <section id="fonctionnement" className="relative bg-gradient-to-b from-blue-950 to-indigo-950 px-4 py-20 md:px-6 md:py-28">
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
        <section id="fonctionnalites" className="relative bg-indigo-950 px-4 py-20 md:px-6 md:py-28">
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
