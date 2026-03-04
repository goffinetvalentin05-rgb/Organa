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
  accent: string;
};

const features: Feature[] = [
  {
    title: "Gestion des membres",
    description:
      "Fiches à jour, cotisations et suivi administratif réunis dans un seul espace clair.",
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
    description:
      "Créez vos matchs, tournois et manifestations avec un pilotage simple pour toute l'équipe.",
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
    title: "Planning des bénévoles",
    description:
      "Assignez les créneaux rapidement et gardez une vision précise de qui fait quoi.",
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
    title: "Buvette et bar du club",
    description:
      "Organisez vos ventes et votre logistique buvette sans complexité opérationnelle.",
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
    title: "Communication club",
    description:
      "Partagez les infos importantes à tous les membres et bénévoles depuis une plateforme unique.",
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
    title: "Complexité administrative",
    description:
      "Cotisations, listes, documents et suivis sont souvent gérés dans des outils différents.",
    accent: "from-rose-400/20 to-rose-500/5",
  },
  {
    title: "Communication éparpillée",
    description:
      "Messages, e-mails et groupes se multiplient. Les bonnes infos n'arrivent pas toujours aux bonnes personnes.",
    accent: "from-amber-400/20 to-amber-500/5",
  },
  {
    title: "Coordination des bénévoles",
    description:
      "La planification des événements et de la buvette devient vite chronophage et source d'oublis.",
    accent: "from-violet-400/20 to-violet-500/5",
  },
  {
    title: "Temps perdu chaque semaine",
    description:
      "Le comité passe plus de temps à gérer l'organisation qu'à développer la vie sportive du club.",
    accent: "from-sky-400/20 to-sky-500/5",
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
      "Tous les modules clés sont centralisés, avec une vision partagée par le comité.",
  },
  {
    title: "Communication alignée",
    description:
      "Les membres reçoivent la bonne information au bon moment, sans friction.",
  },
  {
    title: "Pilotage plus serein",
    description:
      "Vous gardez le contrôle au quotidien, même pendant les périodes les plus intenses.",
  },
];

const faqItems: Faq[] = [
  {
    question: "Obillz est-il facile à utiliser ?",
    answer:
      "Oui. L'interface est pensée pour les comités de clubs, avec une prise en main rapide, sans formation technique.",
  },
  {
    question: "Combien de temps faut-il pour être opérationnel ?",
    answer:
      "La configuration initiale prend généralement moins d'une heure pour démarrer la gestion des membres, événements et bénévoles.",
  },
  {
    question: "Les membres doivent-ils installer une application ?",
    answer:
      "Non. Obillz fonctionne directement dans le navigateur, sur mobile, tablette et ordinateur.",
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

function SectionTag({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <p
      className={`inline-flex rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] ${
        dark
          ? "border-white/35 bg-white/10 text-white/90"
          : "border-[var(--obillz-hero-blue)]/20 bg-[var(--obillz-hero-blue)]/5 text-[var(--obillz-hero-blue)]"
      }`}
    >
      {children}
    </p>
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
      className={`relative overflow-hidden rounded-[30px] border border-slate-200 bg-slate-100/80 p-8 shadow-[0_20px_55px_rgba(15,23,42,0.11)] ${className ?? ""}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(26,35,255,0.12),transparent_40%),radial-gradient(circle_at_100%_100%,rgba(26,35,255,0.08),transparent_45%)]" />
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
            <Link href="#probleme" className="transition hover:text-white">
              Problèmes
            </Link>
            <Link href="#solution" className="transition hover:text-white">
              Solution
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
          <div className="pointer-events-none absolute -left-20 top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 top-44 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />

          <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center text-center">
            <SectionTag dark>Plateforme SaaS pour clubs sportifs</SectionTag>
            <h1 className="mt-8 max-w-4xl animate-fade-in-up text-4xl font-bold leading-tight text-white md:text-6xl">
              Toute l'organisation de votre club, dans une seule plateforme.
            </h1>
            <p className="mt-6 max-w-3xl animate-fade-in-up text-base leading-relaxed text-white/90 md:text-xl">
              Obillz centralise membres, événements, bénévoles, buvette et communication
              pour vous faire gagner du temps chaque semaine.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up">
              <Link
                href="/inscription"
                className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-[var(--obillz-hero-blue)] transition hover:-translate-y-0.5 hover:shadow-2xl md:text-base"
              >
                Essayer Obillz
              </Link>
              <a
                href="#solution"
                className="rounded-full border border-white/40 bg-transparent px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10 md:text-base"
              >
                Découvrir la plateforme
              </a>
            </div>
            <ProductPlaceholder
              className="mt-14 w-full max-w-5xl animate-fade-in-up border-white/35 bg-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.2)]"
              label="Grand aperçu produit"
            />
          </div>
        </section>

        <section id="probleme" className="bg-white px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <SectionTag>Le problème</SectionTag>
              <h2 className="mt-5 text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
                Les clubs perdent du temps à jongler entre trop d'outils.
              </h2>
              <p className="mt-4 text-base text-slate-600 md:text-lg">
                Excel, groupes de messages, documents, tableaux manuels : l'organisation
                devient vite lourde et difficile à maintenir.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {problems.map((problem, index) => (
                <article
                  key={problem.title}
                  className={`rounded-3xl border border-slate-200 bg-gradient-to-br p-6 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-xl ${problem.accent} ${
                    index % 2 === 1 ? "sm:translate-y-6" : ""
                  }`}
                >
                  <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300/80 bg-white/80 text-sm font-semibold text-slate-700">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{problem.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600">
                    {problem.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="solution" className="bg-slate-50/70 px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-2 md:items-center">
            <div>
              <SectionTag>Ce qu'est Obillz</SectionTag>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
                Une plateforme simple qui centralise toute la gestion du club.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
                Obillz réunit les modules essentiels sur une interface claire. Votre comité
                agit plus vite, avec une meilleure visibilité et un usage fluide sur mobile.
              </p>
              <ul className="mt-8 grid gap-3 text-slate-700">
                <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  Interface accessible, même pour les équipes non techniques.
                </li>
                <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  Informations centralisées pour éviter les oublis et doublons.
                </li>
                <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  Utilisable sur ordinateur, tablette et smartphone.
                </li>
              </ul>
            </div>
            <div className="md:pl-6">
              <ProductPlaceholder className="bg-white" label="Aperçu plateforme" />
            </div>
          </div>
        </section>

        <section id="fonctionnalites" className="bg-white px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <SectionTag>Fonctionnalités clés</SectionTag>
              <h2 className="mt-5 text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
                Les modules Obillz pour piloter votre club.
              </h2>
              <p className="mt-4 text-base text-slate-600 md:text-lg">
                Des cartes produits modernes, conçues pour un usage quotidien rapide et fiable.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {features.map((feature, index) => (
                <article
                  key={feature.title}
                  className={`group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-[var(--obillz-hero-blue)]/25 hover:shadow-[0_20px_35px_rgba(26,35,255,0.13)] ${
                    index === 1 || index === 4 ? "md:translate-y-8" : ""
                  }`}
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--obillz-hero-blue)]/10 text-[var(--obillz-hero-blue)] transition group-hover:scale-110 group-hover:bg-[var(--obillz-hero-blue)] group-hover:text-white">
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
            <div className="grid gap-8 md:grid-cols-[1.05fr_1fr] md:items-center">
              <div>
                <SectionTag dark>Bénéfices</SectionTag>
                <h2 className="mt-4 text-3xl font-bold leading-tight text-white md:text-5xl">
                  Pourquoi les clubs choisissent Obillz.
                </h2>
                <p className="mt-5 max-w-lg text-base text-slate-200 md:text-lg">
                  Obillz réduit la charge mentale du comité et rend l'organisation plus fluide
                  pour tous les acteurs du club.
                </p>
              </div>
              <div className="rounded-3xl border border-white/20 bg-white/10 p-7 backdrop-blur-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
                  Impact au quotidien
                </p>
                <p className="mt-3 text-4xl font-bold text-white">+ de clarté, - d'administratif</p>
                <p className="mt-3 text-slate-200">
                  Une organisation plus simple qui laisse plus de place au sport, aux membres et à la
                  dynamique associative.
                </p>
              </div>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {benefits.map((benefit, index) => (
                <article
                  key={benefit.title}
                  className="rounded-3xl border border-white/20 bg-white/5 p-6 text-white backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/10"
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
            <div className="text-center">
              <SectionTag>FAQ</SectionTag>
              <h2 className="mt-5 text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
                Questions fréquentes
              </h2>
              <p className="mt-4 text-base text-slate-600 md:text-lg">
                Les réponses rapides pour démarrer en confiance.
              </p>
            </div>
            <div className="mt-12 space-y-4">
              {faqItems.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-900">
                    <span>{item.question}</span>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition group-open:rotate-45 group-open:border-[var(--obillz-hero-blue)] group-open:text-[var(--obillz-hero-blue)]">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 border-t border-slate-100 pt-3 text-base leading-relaxed text-slate-600">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          className="relative overflow-hidden px-4 py-20 md:px-6 md:py-28"
          style={{
            background:
              "radial-gradient(900px 380px at 50% -30%, rgba(255,255,255,0.16), transparent), linear-gradient(180deg, #1A23FF 0%, #121AD0 100%)",
          }}
        >
          <div className="pointer-events-none absolute left-0 top-0 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-indigo-300/25 blur-3xl" />

          <div className="relative mx-auto w-full max-w-5xl rounded-[32px] border border-white/25 bg-white/10 px-6 py-12 text-center shadow-[0_28px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm md:px-10 md:py-16">
            <SectionTag dark>Passez à l'action</SectionTag>
            <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-bold leading-tight text-white md:text-5xl">
              Donnez à votre club une plateforme à la hauteur de son ambition.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/90 md:text-lg">
              Testez Obillz et découvrez une gestion plus simple, plus rapide et plus claire.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/inscription"
                className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-[var(--obillz-hero-blue)] transition hover:-translate-y-0.5 hover:shadow-2xl md:text-base"
              >
                Essayer Obillz
              </Link>
              <a
                href="#solution"
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
          <p>Obillz - Plateforme de gestion pour clubs sportifs</p>
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
