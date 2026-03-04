"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type Feature = {
  title: string;
  description: string;
  icon: ReactNode;
};

type Benefit = {
  title: string;
  description: string;
};

type Faq = {
  question: string;
  answer: string;
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
    title: "Organisation des evenements",
    description: "Planifiez matchs, tournois et activites en quelques clics.",
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
    description: "Organisez facilement les benevoles et les services.",
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

const benefits: Benefit[] = [
  {
    title: "Gain de temps",
    description: "Reduisez les taches administratives et l'organisation manuelle.",
  },
  {
    title: "Organisation simplifiee",
    description: "Toutes les informations du club sont au meme endroit.",
  },
  {
    title: "Plus simple pour tout le monde",
    description: "Le comite, les benevoles et les membres trouvent vite ce qu'il faut.",
  },
];

const faqItems: Faq[] = [
  {
    question: "Obillz est-il facile a utiliser ?",
    answer:
      "Oui. L'interface est pensee pour les comites de clubs avec une prise en main rapide, sans formation technique.",
  },
  {
    question: "Combien de temps faut-il pour etre operationnel ?",
    answer:
      "La configuration initiale prend generalement moins d'une heure pour commencer a gerer membres, evenements et benevoles.",
  },
  {
    question: "Les membres doivent-ils installer une application ?",
    answer:
      "Non. Obillz fonctionne dans le navigateur sur mobile, tablette et ordinateur.",
  },
  {
    question: "Quels types de clubs sportifs peuvent utiliser Obillz ?",
    answer:
      "Obillz s'adapte aux clubs amateurs et associatifs, quel que soit le sport ou la taille de l'organisation.",
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

function SectionTitle({
  overline,
  title,
  description,
}: {
  overline: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--obillz-hero-blue)]">
        {overline}
      </p>
      <h2 className="mt-4 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base text-slate-600 md:text-lg">{description}</p>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mt-14 w-full max-w-5xl animate-fade-in-up">
      <div className="absolute -inset-1 rounded-[30px] bg-white/30 blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-[28px] border border-white/30 bg-white/95 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="ml-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Apercu plateforme Obillz
          </span>
        </div>

        <div className="grid gap-4 bg-slate-50 p-4 md:grid-cols-[1.25fr_1fr] md:p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Prochains evenements
            </p>
            <div className="mt-4 space-y-3">
              {[
                "Match seniors - 14h00",
                "Tournoi jeunes - Samedi",
                "Permanence buvette - Dimanche",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                >
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                  <span className="rounded-full bg-[var(--obillz-hero-blue)]/10 px-2 py-1 text-xs font-semibold text-[var(--obillz-hero-blue)]">
                    Planifie
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Benevoles
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">48</p>
              <p className="text-sm text-slate-600">disponibilites centralisees</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Buvette
              </p>
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-[var(--obillz-hero-blue)]"
                  style={{ width: "72%" }}
                />
              </div>
              <p className="mt-3 text-sm text-slate-600">72% des services assignes</p>
            </div>
          </div>
        </div>
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
            <Link href="#solution" className="transition hover:text-white">
              Solution
            </Link>
            <Link href="#fonctionnalites" className="transition hover:text-white">
              Fonctionnalites
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
              Obillz centralise l'organisation de votre club : membres, evenements,
              benevoles et buvette, depuis une seule plateforme.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up">
              <Link
                href="/inscription"
                className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-[var(--obillz-hero-blue)] transition hover:-translate-y-0.5 hover:shadow-2xl md:text-base"
              >
                Essayer gratuitement
              </Link>
              <a
                href="#solution"
                className="rounded-full border border-white/40 bg-transparent px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10 md:text-base"
              >
                Decouvrir la plateforme
              </a>
            </div>
            <DashboardPreview />
          </div>
        </section>

        <section className="px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto grid w-full max-w-6xl gap-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.06)] md:grid-cols-2 md:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Le probleme
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
                Trop d'outils, trop de frictions.
              </h2>
              <ul className="mt-6 space-y-4 text-base text-slate-600">
                <li>Fichiers Excel disperses et difficiles a maintenir.</li>
                <li>Groupes WhatsApp pour organiser l'urgence.</li>
                <li>Planning des benevoles complexe a coordonner.</li>
                <li>Temps perdu sur l'administratif au lieu du terrain.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[var(--obillz-hero-blue)]/15 bg-[var(--obillz-hero-blue)]/[0.03] p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--obillz-hero-blue)]">
                La reponse
              </p>
              <h3 className="mt-4 text-2xl font-bold leading-tight text-slate-900">
                Obillz centralise tout au meme endroit.
              </h3>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Une seule plateforme pour piloter les operations quotidiennes de votre
                club, avec des informations claires, partagees et toujours a jour.
              </p>
            </div>
          </div>
        </section>

        <section id="solution" className="px-4 py-16 md:px-6 md:py-24">
          <SectionTitle
            overline="La solution"
            title="Une plateforme simple, moderne et accessible partout."
            description="Obillz unifie la gestion du club dans une experience fluide, compatible mobile et pensee pour aller vite."
          />
          <div className="mx-auto mt-12 grid w-full max-w-6xl gap-5 md:grid-cols-4">
            {[
              "Interface intuitive",
              "Accessible en quelques clics",
              "Compatible mobile",
              "Gestion centralisee",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <p className="text-sm font-semibold text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="fonctionnalites" className="bg-slate-50/60 px-4 py-20 md:px-6 md:py-24">
          <SectionTitle
            overline="Fonctionnalites"
            title="Les briques essentielles pour piloter votre club."
            description="Chaque module est concu pour simplifier le quotidien du comite et des benevoles."
          />
          <div className="mx-auto mt-12 grid w-full max-w-6xl gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[var(--obillz-hero-blue)]/25 hover:shadow-xl"
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
        </section>

        <section className="px-4 py-20 md:px-6 md:py-24">
          <SectionTitle
            overline="Benefices"
            title="Des resultats concrets pour votre club."
            description="Obillz fluidifie l'organisation et reduit la charge operationnelle."
          />
          <div className="mx-auto mt-12 grid w-full max-w-6xl gap-6 md:grid-cols-3">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold text-slate-900">{benefit.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="bg-slate-50/60 px-4 py-20 md:px-6 md:py-24">
          <SectionTitle
            overline="FAQ"
            title="Questions frequentes."
            description="Les reponses pour vous lancer sereinement avec Obillz."
          />
          <div className="mx-auto mt-12 w-full max-w-4xl space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <summary className="cursor-pointer list-none text-base font-semibold text-slate-900">
                  {item.question}
                </summary>
                <p className="mt-3 text-base leading-relaxed text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto w-full max-w-5xl rounded-[32px] bg-[var(--obillz-hero-blue)] px-6 py-12 text-center shadow-[0_28px_80px_rgba(26,35,255,0.33)] md:px-10 md:py-16">
            <h2 className="mx-auto max-w-3xl text-3xl font-bold leading-tight text-white md:text-5xl">
              Simplifiez la gestion de votre club des aujourd'hui.
            </h2>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/inscription"
                className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-[var(--obillz-hero-blue)] transition hover:-translate-y-0.5 hover:shadow-2xl md:text-base"
              >
                Essayer gratuitement
              </Link>
              <a
                href="#solution"
                className="rounded-full border border-white/45 bg-transparent px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10 md:text-base"
              >
                Decouvrir la plateforme
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-sm text-slate-500 sm:flex-row sm:justify-between">
          <p>Obillz - Plateforme de gestion pour clubs sportifs</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/connexion" className="hover:text-slate-700">
              Connexion
            </Link>
            <Link href="/mentions-legales" className="hover:text-slate-700">
              Mentions legales
            </Link>
            <Link href="/politique-confidentialite" className="hover:text-slate-700">
              Politique de confidentialite
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
