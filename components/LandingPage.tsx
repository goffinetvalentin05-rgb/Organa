"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type Feature = {
  title: string;
  description: string;
  icon: ReactNode;
  highlight?: boolean;
};

type FaqItem = {
  question: string;
  answer: string;
};

const painPoints = [
  {
    title: "Des outils partout, aucune vue globale",
    description:
      "Entre Excel, WhatsApp, e-mails et papiers, les informations sont dispersées et difficiles à suivre.",
  },
  {
    title: "Toujours plus d'administratif",
    description:
      "Le comité passe ses soirées à gérer des tâches manuelles au lieu de développer la vie du club.",
  },
  {
    title: "Une organisation qui dépend de quelques personnes",
    description:
      "Quand tout repose sur 2 ou 3 bénévoles, le moindre oubli crée du stress et du retard.",
  },
];

const features: Feature[] = [
  {
    title: "Vue d'ensemble du club",
    description:
      "Un tableau de bord unique pour voir l'activité, les priorités et les actions clés en un coup d'œil.",
    highlight: true,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-13v2h6V4h-6v3Z"
      />
    ),
  },
  {
    title: "Gestion des membres",
    description:
      "Centralisez joueurs, coaches, bénévoles et comité avec des informations toujours à jour.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M17 20h5v-2a3 3 0 0 0-5.36-1.86M17 20H7m10 0v-2a4.96 4.96 0 0 0-.36-1.86M7 20H2v-2a3 3 0 0 1 5.36-1.86M7 20v-2c0-.65.13-1.28.36-1.86m0 0a5 5 0 0 1 9.28 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    ),
  },
  {
    title: "Cotisations simplifiées",
    description:
      "Créez vos cotisations, envoyez-les par e-mail et suivez les paiements sans tableau manuel.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 8c-2 0-3 1-3 2s1 2 3 2 3 1 3 2-1 2-3 2m0-8V6m0 10v2M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0Z"
      />
    ),
  },
  {
    title: "Facturation sponsor et activités",
    description:
      "Émettez des factures professionnelles pour partenaires, sponsors ou événements du club.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 14h6m-6-4h6m2 10H7a2 2 0 0 1-2-2V4h14v14a2 2 0 0 1-2 2Zm0-16-2-2H9L7 4"
      />
    ),
  },
  {
    title: "Gestion des événements",
    description:
      "Planifiez vos activités et suivez recettes/dépenses pour connaître le résultat réel de chaque événement.",
    highlight: true,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
      />
    ),
  },
  {
    title: "Réservations buvette en ligne",
    description:
      "Publiez un lien de réservation, recevez les demandes et organisez votre buvette sans friction.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M5 3h12a1 1 0 0 1 1 1v5a7 7 0 1 1-14 0V4a1 1 0 0 1 1-1Zm0 3h13M8 21h6M10 17v4M14 17v4"
      />
    ),
  },
  {
    title: "Planning des bénévoles",
    description:
      "Assignez chaque tâche (cuisine, service, rangement...) et fluidifiez l'organisation le jour J.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M4 5h16m-2 0v6a6 6 0 1 1-12 0V5m4 13v2m4-2v2m-9 0h14"
      />
    ),
  },
  {
    title: "Inscriptions par lien ou QR code",
    description:
      "Créez des inscriptions rapides pour repas, événements et activités, avec données enregistrées automatiquement.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm11 0h1m-1 3h1m2-3h2m-3 6h3"
      />
    ),
  },
  {
    title: "Base contacts marketing",
    description:
      "Constituez votre communauté grâce aux inscriptions et gardez vos contacts prêts pour vos prochaines campagnes.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"
      />
    ),
  },
  {
    title: "Suivi des dépenses transparent",
    description:
      "Enregistrez vos charges, ajoutez vos justificatifs PDF et facilitez le pilotage financier du club.",
    highlight: true,
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 8v8m-4-4h8m7-2A9 9 0 1 1 5 5a9 9 0 0 1 18 5Z"
      />
    ),
  },
];

const faqs: FaqItem[] = [
  {
    question: "Obillz est-il adapté à un club 100% bénévole ?",
    answer:
      "Oui. La plateforme est pensée pour des équipes terrain, avec une prise en main simple et rapide.",
  },
  {
    question: "Combien de temps faut-il pour démarrer ?",
    answer:
      "La plupart des clubs démarrent en moins d'une heure pour les bases (membres, cotisations, événements).",
  },
  {
    question: "Doit-on installer une application ?",
    answer:
      "Non. Obillz fonctionne dans le navigateur, sur mobile, tablette et ordinateur.",
  },
  {
    question: "Peut-on l'utiliser pour plusieurs types de sports ?",
    answer:
      "Oui. Obillz convient à la majorité des clubs et associations sportives, quelle que soit la discipline.",
  },
];

function GridOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-30"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-white/20 bg-white/10 text-white shadow-[0_22px_64px_rgba(0,0,0,0.22)] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

function ProductPlaceholder({ label }: { label: string }) {
  return (
    <GlassCard className="relative overflow-hidden p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.2),transparent_40%),radial-gradient(circle_at_100%_100%,rgba(255,255,255,0.13),transparent_45%)]" />
      <div className="relative rounded-2xl border-2 border-dashed border-white/35 bg-white/8 px-6 py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-white/90">{label}</p>
        <p className="mt-3 text-sm text-white/80">Capture produit a venir</p>
      </div>
    </GlassCard>
  );
}

export default function LandingPage() {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "radial-gradient(1200px 580px at 50% -20%, rgba(255,255,255,0.18), transparent), linear-gradient(180deg, #1A23FF 0%, #1620EB 45%, #1119C8 100%)",
      }}
    >
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/15 bg-[var(--obillz-hero-blue)]/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" aria-label="Obillz - Accueil">
            <Image
              src="/logo-obillz.png"
              alt="Obillz"
              width={144}
              height={40}
              className="h-9 w-auto object-contain md:h-10"
              priority
            />
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-white/90 md:flex">
            <a href="#reality" className="transition hover:text-white">
              Realite clubs
            </a>
            <a href="#platform" className="transition hover:text-white">
              Plateforme
            </a>
            <a href="#impact" className="transition hover:text-white">
              Impact
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </div>
          <Link
            href="/connexion"
            className="rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Connexion
          </Link>
        </div>
      </nav>

      <main className="relative overflow-hidden pt-16">
        <GridOverlay />
        <div className="pointer-events-none absolute -left-24 top-20 h-80 w-80 rounded-full bg-white/12 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-72 h-96 w-96 rounded-full bg-indigo-300/25 blur-3xl" />

        <section className="px-4 pb-14 pt-14 md:px-6 md:pt-20">
          <div className="relative z-10 mx-auto max-w-6xl text-center">
            <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
              SaaS pour clubs et associations sportives
            </p>
            <h1 className="mx-auto mt-7 max-w-5xl text-4xl font-bold leading-tight md:text-6xl">
              La gestion des clubs sportifs, enfin simple.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-white/85 md:text-xl">
              Obillz centralise votre organisation pour faire gagner du temps au comité et
              rendre le club plus fluide au quotidien.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/inscription"
                className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-[var(--obillz-hero-blue)] transition hover:-translate-y-0.5 hover:shadow-2xl md:text-base"
              >
                Essayer gratuitement
              </Link>
              <a
                href="#platform"
                className="rounded-full border border-white/45 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10 md:text-base"
              >
                Decouvrir la plateforme
              </a>
            </div>
            <div className="mx-auto mt-14 max-w-5xl">
              <ProductPlaceholder label="Apercu produit" />
            </div>
          </div>
        </section>

        <section id="reality" className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <GlassCard className="p-8 md:p-10">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold leading-tight md:text-5xl">
                  Si vous gerez un club, vous connaissez deja cette realite.
                </h2>
                <p className="mt-5 text-base text-white/85 md:text-lg">
                  La gestion devient vite plus complexe que le sport lui-meme. Obillz est ne pour
                  retirer cette charge du quotidien.
                </p>
              </div>
              <div className="mt-10 grid gap-5 md:grid-cols-3">
                {painPoints.map((pain, index) => (
                  <article
                    key={pain.title}
                    className={`rounded-3xl border border-white/25 p-6 transition duration-300 hover:-translate-y-1.5 hover:bg-white/14 ${
                      index === 1 ? "md:translate-y-5 bg-indigo-200/10" : "bg-white/12"
                    }`}
                  >
                    <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-sm font-semibold">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-semibold">{pain.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/80">{pain.description}</p>
                  </article>
                ))}
              </div>
            </GlassCard>
          </div>
        </section>

        <section id="platform" className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <GlassCard className="p-8 md:p-10">
              <div className="grid gap-10 md:grid-cols-2 md:items-center">
                <div>
                  <h2 className="text-3xl font-bold leading-tight md:text-5xl">
                    Une plateforme unique pour structurer tout votre club.
                  </h2>
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
                    Avec Obillz, le comite centralise membres, cotisations, evenements, buvette,
                    factures et depenses. Tout devient plus lisible, plus rapide et plus fiable.
                  </p>
                  <ul className="mt-8 grid gap-3">
                    <li className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90">
                      Simplicite d'usage pour les benevoles et responsables
                    </li>
                    <li className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90">
                      Centralisation des donnees et des actions importantes
                    </li>
                    <li className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90">
                      Accessible sur mobile, tablette et ordinateur
                    </li>
                  </ul>
                </div>
                <ProductPlaceholder label="Apercu de la plateforme" />
              </div>
            </GlassCard>
          </div>
        </section>

        <section className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold leading-tight md:text-5xl">
                Tout ce qu'il faut pour piloter le club, sans perte de temps.
              </h2>
              <p className="mt-4 text-base text-white/85 md:text-lg">
                Des modules pensés pour l'operationnel et la serenite du comite.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {features.map((feature, index) => (
                <GlassCard
                  key={feature.title}
                  className={`group p-7 transition duration-300 hover:-translate-y-1.5 hover:bg-white/14 ${
                    feature.highlight ? "border-white/35 bg-white/14" : ""
                  } ${index % 2 === 1 ? "md:translate-y-8" : ""}`}
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-white transition group-hover:scale-105 group-hover:bg-white/20">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      {feature.icon}
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold leading-tight">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">{feature.description}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section id="impact" className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-[1.15fr_1fr]">
              <GlassCard className="p-8 md:p-10">
                <h2 className="text-3xl font-bold leading-tight md:text-5xl">
                  Moins d'administratif. Plus de clarté. Plus de sport.
                </h2>
                <p className="mt-5 max-w-xl text-base text-white/85 md:text-lg">
                  Obillz permet au comité de mieux s'organiser, de réduire la charge mentale et de
                  consacrer plus de temps aux membres et aux projets du club.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/25 bg-white/12 p-5">
                    <p className="text-sm text-white/75">Organisation</p>
                    <p className="mt-2 text-2xl font-semibold">Plus claire</p>
                  </div>
                  <div className="rounded-2xl border border-white/25 bg-white/12 p-5 sm:translate-y-4">
                    <p className="text-sm text-white/75">Comité</p>
                    <p className="mt-2 text-2xl font-semibold">Plus serein</p>
                  </div>
                  <div className="rounded-2xl border border-white/25 bg-white/12 p-5">
                    <p className="text-sm text-white/75">Temps</p>
                    <p className="mt-2 text-2xl font-semibold">Mieux utilisé</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="flex flex-col justify-between p-8 md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/75">
                  Ce que gagne un club
                </p>
                <p className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                  Une gestion pro,
                  <br />
                  sans complexité.
                </p>
                <p className="mt-6 text-sm leading-relaxed text-white/80">
                  Tout est structure autour de vos besoins terrain pour rendre l'organisation plus
                  simple et plus durable.
                </p>
              </GlassCard>
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-4xl">
            <GlassCard className="p-8 md:p-10">
              <h2 className="text-center text-3xl font-bold leading-tight md:text-5xl">FAQ</h2>
              <div className="mt-10 space-y-4">
                {faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group rounded-2xl border border-white/25 bg-white/10 p-5 transition hover:bg-white/14"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold">
                      <span>{faq.question}</span>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/35 text-white/80 transition group-open:rotate-45 group-open:bg-white/20">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 border-t border-white/20 pt-3 text-sm leading-relaxed text-white/80">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </GlassCard>
          </div>
        </section>

        <section className="px-4 pb-20 pt-14 md:px-6 md:pt-16">
          <div className="mx-auto max-w-6xl">
            <GlassCard className="relative overflow-hidden p-10 text-center md:p-14">
              <div className="pointer-events-none absolute -left-12 top-2 h-36 w-36 rounded-full bg-white/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-8 bottom-2 h-44 w-44 rounded-full bg-indigo-200/30 blur-3xl" />
              <h2 className="mx-auto max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
                Simplifiez la gestion de votre club des cette semaine.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base text-white/85 md:text-lg">
                Faites gagner du temps a votre comite et donnez au club une organisation plus solide.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/inscription"
                  className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-[var(--obillz-hero-blue)] transition hover:-translate-y-0.5 hover:shadow-2xl md:text-base"
                >
                  Essayer gratuitement
                </Link>
                <a
                  href="#platform"
                  className="rounded-full border border-white/45 px-8 py-4 text-sm font-semibold transition hover:bg-white/10 md:text-base"
                >
                  Decouvrir la plateforme
                </a>
              </div>
            </GlassCard>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/20 px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-sm text-white/75 sm:flex-row sm:justify-between">
          <p>Obillz - Plateforme de gestion pour clubs sportifs</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/connexion" className="hover:text-white">
              Connexion
            </Link>
            <Link href="/mentions-legales" className="hover:text-white">
              Mentions legales
            </Link>
            <Link href="/politique-confidentialite" className="hover:text-white">
              Politique de confidentialite
            </Link>
            <Link href="/conditions-utilisation" className="hover:text-white">
              Conditions d'utilisation
            </Link>
            <Link href="/politique-cookies" className="hover:text-white">
              Cookies
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
