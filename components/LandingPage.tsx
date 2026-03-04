"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type Feature = {
  title: string;
  description: string;
  icon: ReactNode;
};

type Faq = {
  question: string;
  answer: string;
};

type Problem = {
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    title: "Gestion des membres",
    description: "Centralisez toutes les informations de vos membres.",
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
    title: "Organisation des événements",
    description: "Planifiez matchs, tournois et activités en quelques clics.",
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
    title: "Gestion de la buvette",
    description: "Organisez facilement les bénévoles et les services.",
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
    title: "Communication du club",
    description: "Diffusez les informations importantes simplement.",
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

const problems: Problem[] = [
  {
    title: "Organisation dispersée",
    description:
      "Les informations sont réparties entre Excel, messages et documents.",
  },
  {
    title: "Temps administratif",
    description:
      "Les responsables passent trop de temps à organiser plutôt qu’à développer le club.",
  },
  {
    title: "Manque de visibilité",
    description:
      "Les bénévoles et membres ne savent pas toujours où trouver les informations.",
  },
];

const benefits = [
  {
    title: "Gain de temps",
    description:
      "Automatisez la coordination et réduisez les tâches administratives.",
  },
  {
    title: "Organisation simplifiée",
    description:
      "Tout le club s’appuie sur une source unique d’information.",
  },
  {
    title: "Plus simple pour tous",
    description:
      "Comité, bénévoles et membres trouvent rapidement ce dont ils ont besoin.",
  },
];

const faqItems: Faq[] = [
  {
    question: "Obillz est-il facile à utiliser ?",
    answer:
      "Oui. L’interface est pensée pour les comités de clubs, avec une prise en main rapide, sans formation technique.",
  },
  {
    question: "Combien de temps faut-il pour être opérationnel ?",
    answer:
      "La configuration initiale prend généralement moins d’une heure pour démarrer la gestion des membres, événements et bénévoles.",
  },
  {
    question: "Les membres doivent-ils installer une application ?",
    answer:
      "Non. Obillz fonctionne directement dans le navigateur, sur mobile, tablette et ordinateur.",
  },
  {
    question: "Quels types de clubs sportifs peuvent utiliser Obillz ?",
    answer:
      "Obillz s’adapte aux clubs amateurs et associatifs, quel que soit le sport ou la taille de l’organisation.",
  },
];

function GridBackground() {
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

function SectionHeader({
  title,
  description,
  dark = false,
}: {
  title: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2
        className={`text-3xl font-bold leading-tight md:text-5xl ${
          dark ? "text-white" : "text-slate-900"
        }`}
      >
        {title}
      </h2>
      <p className={`mt-4 text-base md:text-lg ${dark ? "text-slate-200" : "text-slate-600"}`}>
        {description}
      </p>
    </div>
  );
}

function ProductPlaceholder({
  className,
  label,
}: {
  className?: string;
  label: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100/80 p-8 shadow-[0_16px_50px_rgba(15,23,42,0.12)] ${className ?? ""}`}
    >
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 px-6 py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
        <p className="mt-3 text-sm text-slate-500">Capture produit à venir</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[var(--obillz-hero-blue)]/90 backdrop-blur-xl">
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
            <Link href="#obillz" className="transition hover:text-white">
              Obillz
            </Link>
            <Link href="#pourquoi" className="transition hover:text-white">
              Pourquoi
            </Link>
            <Link href="#fonctionnalites" className="transition hover:text-white">
              Fonctionnalités
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

      <main className="pt-16">
        <section
          className="relative overflow-hidden px-4 pb-24 pt-12 md:px-6 md:pt-16 lg:pt-20"
          style={{
            background:
              "radial-gradient(1200px 520px at 50% -20%, rgba(255,255,255,0.18), transparent), linear-gradient(180deg, #1A23FF 0%, #121AD0 100%)",
          }}
        >
          <GridBackground />
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center text-center">
            <p className="animate-fade-in-up rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
              Plateforme de gestion pour clubs sportifs
            </p>
            <h1 className="mt-8 max-w-4xl animate-fade-in-up text-4xl font-bold leading-tight text-white md:text-6xl">
              La gestion des clubs sportifs, enfin simple.
            </h1>
            <p className="mt-6 max-w-3xl animate-fade-in-up text-base leading-relaxed text-white/90 md:text-xl">
              Obillz centralise l’organisation de votre club : membres, événements,
              bénévoles et buvette sur une seule plateforme.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up">
              <Link
                href="/inscription"
                className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-[var(--obillz-hero-blue)] transition hover:-translate-y-0.5 hover:shadow-2xl md:text-base"
              >
                Essayer gratuitement
              </Link>
              <a
                href="#obillz"
                className="rounded-full border border-white/40 bg-transparent px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10 md:text-base"
              >
                Découvrir la plateforme
              </a>
            </div>
            <ProductPlaceholder
              className="mt-14 w-full max-w-5xl animate-fade-in-up border-white/35 bg-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.2)]"
              label="Aperçu produit"
            />
          </div>
        </section>

        <section id="obillz" className="bg-white px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              title="Gérer un club sportif est souvent plus compliqué que le sport lui-même."
              description="Obillz supprime la dispersion et vous redonne une vision claire de l’organisation."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {problems.map((problem) => (
                <article
                  key={problem.title}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <h3 className="text-xl font-semibold text-slate-900">{problem.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600">
                    {problem.description}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-10 text-center text-lg font-semibold text-[var(--obillz-hero-blue)]">
              Obillz centralise tout au même endroit.
            </p>
          </div>
        </section>

        <section id="pourquoi" className="bg-slate-50/60 px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--obillz-hero-blue)]">
                La solution
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
                Une plateforme simple, pensée pour les clubs sportifs.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
                Obillz regroupe les informations et les actions clés dans un seul outil.
                Votre équipe gagne en fluidité, en visibilité et en réactivité.
              </p>
              <ul className="mt-8 space-y-3 text-slate-700">
                <li>• Interface claire et accessible à tous les profils</li>
                <li>• Compatible mobile pour agir partout</li>
                <li>• Processus plus fiables au quotidien</li>
              </ul>
            </div>
            <div className="md:pl-6">
              <ProductPlaceholder label="Aperçu plateforme" />
            </div>
          </div>
        </section>

        <section id="fonctionnalites" className="bg-white px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              title="Tout ce dont votre club a besoin."
              description="Des modules premium pour gérer l’essentiel, sans friction."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {features.map((feature, index) => (
                <article
                  key={feature.title}
                  className={`rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-[var(--obillz-hero-blue)]/25 hover:shadow-xl ${
                    index % 2 === 1 ? "md:translate-y-6" : ""
                  }`}
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--obillz-hero-blue)]/10 text-[var(--obillz-hero-blue)]">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      {feature.icon}
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-900 px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              title="Pourquoi les clubs utilisent Obillz."
              description="Une organisation plus fluide pour se concentrer sur le sport et la vie du club."
              dark
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {benefits.map((benefit, index) => (
                <article
                  key={benefit.title}
                  className="rounded-3xl border border-white/20 bg-white/5 p-6 text-white backdrop-blur-sm"
                >
                  <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-200">
                    {benefit.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="bg-slate-50/70 px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-4xl">
            <SectionHeader
              title="FAQ"
              description="Les réponses aux questions les plus fréquentes."
            />
            <div className="mt-12 space-y-4">
              {faqItems.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <summary className="cursor-pointer list-none text-base font-semibold text-slate-900">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-base leading-relaxed text-slate-600">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          className="px-4 py-20 md:px-6 md:py-28"
          style={{
            background:
              "radial-gradient(900px 380px at 50% -30%, rgba(255,255,255,0.16), transparent), linear-gradient(180deg, #1A23FF 0%, #121AD0 100%)",
          }}
        >
          <div className="mx-auto w-full max-w-5xl rounded-[32px] border border-white/25 bg-white/10 px-6 py-12 text-center shadow-[0_28px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm md:px-10 md:py-16">
            <h2 className="mx-auto max-w-3xl text-3xl font-bold leading-tight text-white md:text-5xl">
              Simplifiez la gestion de votre club dès aujourd’hui.
            </h2>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/inscription"
                className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-[var(--obillz-hero-blue)] transition hover:-translate-y-0.5 hover:shadow-2xl md:text-base"
              >
                Essayer gratuitement
              </Link>
              <a
                href="#pourquoi"
                className="rounded-full border border-white/45 bg-transparent px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10 md:text-base"
              >
                Découvrir la plateforme
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-sm text-slate-500 sm:flex-row sm:justify-between">
          <p>Obillz — Plateforme de gestion pour clubs sportifs</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/connexion" className="hover:text-slate-700">
              Connexion
            </Link>
            <Link href="/mentions-legales" className="hover:text-slate-700">
              Mentions légales
            </Link>
            <Link href="/politique-confidentialite" className="hover:text-slate-700">
              Politique de confidentialité
            </Link>
            <Link href="/conditions-utilisation" className="hover:text-slate-700">
              Conditions d'utilisation
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
