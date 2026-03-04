"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type Feature = {
  title: string;
  description: string;
  icon: ReactNode;
  tone: string;
};

type Faq = {
  question: string;
  answer: string;
};

const pains = [
  {
    title: "Informations dispersées",
    description: "Excel, messages, documents : les infos sont partout et difficiles à suivre.",
    style:
      "md:col-span-2 border-white/28 bg-white/14",
  },
  {
    title: "Trop d'administratif",
    description:
      "Le comité passe trop de temps à organiser au lieu de se concentrer sur la vie du club.",
    style:
      "md:col-span-1 md:translate-y-6 border-indigo-200/35 bg-indigo-200/10",
  },
  {
    title: "Communication compliquée",
    description:
      "Bénévoles et membres manquent souvent d'informations au bon moment.",
    style:
      "md:col-span-1 border-sky-200/35 bg-sky-200/10",
  },
];

const features: Feature[] = [
  {
    title: "Centralisez toutes les informations de vos membres",
    description:
      "Accédez rapidement aux contacts, cotisations et informations importantes depuis un seul espace fiable.",
    tone: "border-white/30 bg-white/12",
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
    title: "Planifiez vos événements sans perdre de temps",
    description:
      "Matchs, tournois et manifestations sont structurés avec une vue claire pour toute l'équipe.",
    tone: "border-indigo-200/35 bg-indigo-200/10",
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
    title: "Organisez les bénévoles et la buvette plus sereinement",
    description:
      "Attribuez les créneaux facilement et gardez une coordination fluide le jour J.",
    tone: "border-violet-200/35 bg-violet-200/10",
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
    title: "Diffusez la bonne information au bon moment",
    description:
      "La communication club devient plus claire pour les membres, bénévoles et responsables.",
    tone: "border-sky-200/35 bg-sky-200/10",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M7 8h10M7 12h7m-9 8 4-4h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
      />
    ),
  },
];

const faqItems: Faq[] = [
  {
    question: "La plateforme est-elle facile à prendre en main ?",
    answer:
      "Oui. Obillz est pensé pour les clubs sportifs, avec une interface claire et rapide à utiliser.",
  },
  {
    question: "Combien de temps faut-il pour démarrer ?",
    answer:
      "La plupart des clubs peuvent lancer leur organisation principale en moins d'une heure.",
  },
  {
    question: "Les membres doivent-ils installer une application ?",
    answer:
      "Non. Obillz fonctionne directement dans le navigateur, sur mobile, tablette et ordinateur.",
  },
  {
    question: "Pour quels clubs Obillz est-il adapté ?",
    answer:
      "Obillz convient aux clubs amateurs et associatifs, quel que soit le sport ou la taille.",
  },
];

function BlueGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-35"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "46px 46px",
      }}
    />
  );
}

function GlassPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[30px] border border-white/22 bg-white/10 text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

function ProductPlaceholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[30px] border border-white/30 bg-white/12 p-7 shadow-[0_26px_70px_rgba(0,0,0,0.24)] backdrop-blur-md ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(255,255,255,0.16),transparent_45%),radial-gradient(circle_at_100%_100%,rgba(255,255,255,0.12),transparent_45%)]" />
      <div className="relative rounded-2xl border-2 border-dashed border-white/35 bg-white/8 px-6 py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/90">{label}</p>
        <p className="mt-3 text-sm text-white/80">Capture produit à venir</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "radial-gradient(1000px 520px at 50% -15%, rgba(255,255,255,0.14), transparent), linear-gradient(180deg, #1A23FF 0%, #1620EB 45%, #1119C8 100%)",
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
            <Link href="#clubs" className="transition hover:text-white">
              Clubs
            </Link>
            <Link href="#plateforme" className="transition hover:text-white">
              Plateforme
            </Link>
            <Link href="#impact" className="transition hover:text-white">
              Impact
            </Link>
            <Link href="#faq" className="transition hover:text-white">
              FAQ
            </Link>
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
        <BlueGrid />
        <div className="pointer-events-none absolute -left-20 top-20 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-64 h-96 w-96 rounded-full bg-indigo-300/25 blur-3xl" />

        <section className="px-4 pb-14 pt-12 md:px-6 md:pt-20">
          <div className="relative z-10 mx-auto max-w-6xl">
            <div className="mx-auto max-w-4xl text-center">
              <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
                Pour les clubs sportifs
              </p>
              <h1 className="mt-7 text-4xl font-bold leading-tight text-white md:text-6xl">
                La gestion des clubs sportifs, enfin simple.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-white/85 md:text-xl">
                Obillz centralise membres, événements, bénévoles, buvette et communication
                dans une plateforme claire, moderne et accessible à tout le club.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/inscription"
                  className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-[var(--obillz-hero-blue)] transition hover:-translate-y-0.5 hover:shadow-2xl md:text-base"
                >
                  Essayer gratuitement
                </Link>
                <a
                  href="#plateforme"
                  className="rounded-full border border-white/45 bg-transparent px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10 md:text-base"
                >
                  Découvrir la plateforme
                </a>
              </div>
            </div>
            <div className="mx-auto mt-14 max-w-5xl">
              <ProductPlaceholder label="Aperçu produit" />
            </div>
          </div>
        </section>

        <section id="clubs" className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <GlassPanel className="p-8 md:p-10">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold leading-tight md:text-5xl">
                  Gérer un club sportif ne devrait pas être aussi compliqué.
                </h2>
                <p className="mt-4 text-base text-white/85 md:text-lg">
                  La réalité des clubs est souvent la même : trop d'outils, trop de tâches manuelles,
                  pas assez de visibilité.
                </p>
              </div>
              <div className="mt-10 grid gap-5 md:grid-cols-3">
                {pains.map((pain, index) => (
                  <article
                    key={pain.title}
                    className={`rounded-3xl border p-6 transition duration-300 hover:-translate-y-1.5 hover:bg-white/18 ${pain.style}`}
                  >
                    <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{pain.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/80">{pain.description}</p>
                  </article>
                ))}
              </div>
            </GlassPanel>
          </div>
        </section>

        <section id="plateforme" className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <GlassPanel className="p-8 md:p-10">
              <div className="grid gap-10 md:grid-cols-2 md:items-center">
                <div>
                  <h2 className="text-3xl font-bold leading-tight md:text-5xl">
                    Une plateforme pensée pour simplifier la vie des clubs.
                  </h2>
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
                    Obillz rassemble les opérations du club dans un seul espace. Le comité gagne en
                    clarté, les bénévoles sont mieux coordonnés, et tout reste accessible sur mobile.
                  </p>
                  <ul className="mt-8 grid gap-3">
                    <li className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90">
                      Simplicité d'usage pour tous les profils du club
                    </li>
                    <li className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90">
                      Centralisation des données et des actions importantes
                    </li>
                    <li className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90">
                      Utilisable partout : mobile, tablette et ordinateur
                    </li>
                  </ul>
                </div>
                <ProductPlaceholder label="Aperçu de la plateforme" />
              </div>
            </GlassPanel>
          </div>
        </section>

        <section className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold leading-tight md:text-5xl">
                Tout ce dont votre club a besoin pour s'organiser.
              </h2>
              <p className="mt-4 text-base text-white/85 md:text-lg">
                Chaque module est conçu pour vous faire gagner du temps et réduire la complexité.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {features.map((feature, index) => (
                <GlassPanel
                  key={feature.title}
                  className={`group p-7 transition duration-300 hover:-translate-y-1.5 hover:bg-white/14 ${feature.tone} ${
                    index % 2 === 1 ? "md:translate-y-8" : ""
                  }`}
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-white transition group-hover:scale-105 group-hover:bg-white/20">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      {feature.icon}
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold leading-tight text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">{feature.description}</p>
                </GlassPanel>
              ))}
            </div>
          </div>
        </section>

        <section id="impact" className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-[1.15fr_1fr] md:items-stretch">
              <GlassPanel className="p-8 md:p-10">
                <h2 className="text-3xl font-bold leading-tight md:text-5xl">
                  Plus de clarté. Moins de charge mentale. Plus de temps pour le sport.
                </h2>
                <p className="mt-5 max-w-xl text-base text-white/85 md:text-lg">
                  Obillz crée un cadre simple pour organiser le club au quotidien sans alourdir les équipes.
                </p>
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/25 bg-white/12 p-5">
                    <p className="text-sm font-semibold text-white/75">Organisation</p>
                    <p className="mt-2 text-2xl font-semibold text-white">Plus lisible</p>
                  </div>
                  <div className="rounded-2xl border border-white/25 bg-white/12 p-5 md:translate-y-5">
                    <p className="text-sm font-semibold text-white/75">Comité</p>
                    <p className="mt-2 text-2xl font-semibold text-white">Plus serein</p>
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel className="flex flex-col justify-between p-8 md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/75">
                  Impact concret
                </p>
                <p className="mt-4 text-4xl font-bold leading-tight text-white md:text-5xl">
                  Une gestion pro,
                  <br />
                  sans complexité.
                </p>
                <p className="mt-6 text-sm leading-relaxed text-white/80">
                  Le club fonctionne mieux au quotidien, avec des décisions plus rapides et une meilleure coordination.
                </p>
              </GlassPanel>
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-4xl">
            <GlassPanel className="p-8 md:p-10">
              <h2 className="text-center text-3xl font-bold leading-tight md:text-5xl">FAQ</h2>
              <div className="mt-10 space-y-4">
                {faqItems.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-2xl border border-white/25 bg-white/10 p-5 transition hover:bg-white/14"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-white">
                      <span>{item.question}</span>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/35 text-white/80 transition group-open:rotate-45 group-open:bg-white/20">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 border-t border-white/20 pt-3 text-sm leading-relaxed text-white/80">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </GlassPanel>
          </div>
        </section>

        <section className="px-4 pb-20 pt-14 md:px-6 md:pt-16">
          <div className="mx-auto max-w-6xl">
            <GlassPanel className="relative overflow-hidden p-10 text-center md:p-14">
              <div className="pointer-events-none absolute -left-12 top-2 h-36 w-36 rounded-full bg-white/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-8 bottom-2 h-44 w-44 rounded-full bg-indigo-200/30 blur-3xl" />
              <h2 className="mx-auto max-w-3xl text-3xl font-bold leading-tight text-white md:text-5xl">
                Simplifiez la gestion de votre club dès aujourd'hui.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base text-white/85 md:text-lg">
                Reprenez le contrôle sur l'organisation du club avec une plateforme claire et moderne.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/inscription"
                  className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-[var(--obillz-hero-blue)] transition hover:-translate-y-0.5 hover:shadow-2xl md:text-base"
                >
                  Essayer gratuitement
                </Link>
                <a
                  href="#plateforme"
                  className="rounded-full border border-white/45 bg-transparent px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10 md:text-base"
                >
                  Découvrir la plateforme
                </a>
              </div>
            </GlassPanel>
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
              Mentions légales
            </Link>
            <Link href="/politique-confidentialite" className="hover:text-white">
              Politique de confidentialité
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
