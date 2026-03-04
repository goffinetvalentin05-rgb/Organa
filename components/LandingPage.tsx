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

const problems: Problem[] = [
  {
    title: "Organisation dispersée",
    description: "Excel, messages et documents partout. Les infos sont difficiles à retrouver.",
  },
  {
    title: "Trop d'administratif",
    description:
      "Les responsables passent trop de temps à organiser au lieu de faire vivre le club.",
  },
  {
    title: "Communication compliquée",
    description:
      "Les bénévoles et membres manquent souvent d'informations ou les reçoivent trop tard.",
  },
];

const features: Feature[] = [
  {
    title: "Gestion des membres",
    description: "Centralisez profils, cotisations et suivi administratif en un seul endroit.",
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
    description: "Planifiez matchs, tournois et activités avec une vue claire pour l'équipe.",
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
    description: "Attribuez les créneaux rapidement et réduisez les oublis le jour J.",
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
    title: "Buvette / bar",
    description: "Organisez la buvette plus simplement avec un pilotage fluide au quotidien.",
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
    description: "Diffusez les informations importantes au bon moment à tout le club.",
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

const benefits = [
  {
    title: "Gain de temps",
    description: "Moins d'administratif, plus d'énergie pour le sport et la vie du club.",
  },
  {
    title: "Organisation simplifiée",
    description: "Une plateforme unique pour structurer les opérations du comité.",
  },
  {
    title: "Communication claire",
    description: "Les bonnes informations arrivent aux bonnes personnes au bon moment.",
  },
];

const faqItems: Faq[] = [
  {
    question: "La plateforme est-elle facile à utiliser ?",
    answer: "Oui. Obillz est conçu pour les clubs sportifs avec une prise en main rapide.",
  },
  {
    question: "Combien de temps pour démarrer ?",
    answer: "La plupart des clubs peuvent être opérationnels en moins d'une heure.",
  },
  {
    question: "Les membres ont-ils besoin d'une app ?",
    answer: "Non. Obillz fonctionne directement dans le navigateur, sur mobile et ordinateur.",
  },
  {
    question: "Quels clubs peuvent utiliser Obillz ?",
    answer: "Obillz s'adapte aux clubs amateurs et associatifs, quel que soit le sport.",
  },
];

function SectionTag({ children }: { children: string }) {
  return (
    <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
      {children}
    </p>
  );
}

function BlueGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-35"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  );
}

function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[28px] border border-white/20 bg-white/10 p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

function ProductPlaceholder({ label }: { label: string }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/30 bg-white/12 p-7 shadow-[0_26px_70px_rgba(0,0,0,0.24)] backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(255,255,255,0.15),transparent_45%),radial-gradient(circle_at_100%_100%,rgba(255,255,255,0.12),transparent_45%)]" />
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
            <Link href="#probleme" className="transition hover:text-white">
              Problème
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

      <main className="relative overflow-hidden pt-16">
        <BlueGrid />
        <div className="pointer-events-none absolute -left-20 top-20 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-64 h-96 w-96 rounded-full bg-indigo-300/25 blur-3xl" />

        <section className="px-4 pb-14 pt-12 md:px-6 md:pt-20">
          <div className="relative z-10 mx-auto max-w-6xl">
            <div className="mx-auto max-w-4xl text-center">
              <SectionTag>Plateforme SaaS pour clubs sportifs</SectionTag>
              <h1 className="mt-7 text-4xl font-bold leading-tight text-white md:text-6xl">
                La gestion de votre club devient enfin simple et maîtrisée.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-white/85 md:text-xl">
                Obillz centralise membres, événements, bénévoles, buvette et communication
                dans un seul outil moderne.
              </p>
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
                  Découvrir la plateforme
                </a>
              </div>
            </div>
            <div className="mx-auto mt-14 max-w-5xl">
              <ProductPlaceholder label="Aperçu produit" />
            </div>
          </div>
        </section>

        <section id="probleme" className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <GlassCard className="p-8 md:p-10">
              <div className="mx-auto max-w-3xl text-center">
                <SectionTag>Le problème</SectionTag>
                <h2 className="mt-5 text-3xl font-bold leading-tight md:text-5xl">
                  Les clubs sportifs gèrent trop de complexité au quotidien.
                </h2>
              </div>
              <div className="mt-10 grid gap-5 md:grid-cols-3">
                {problems.map((problem, index) => (
                  <article
                    key={problem.title}
                    className={`rounded-3xl border border-white/25 bg-white/12 p-6 transition duration-300 hover:-translate-y-1.5 hover:bg-white/16 ${
                      index === 1 ? "md:-translate-y-2" : ""
                    }`}
                  >
                    <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{problem.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/80">{problem.description}</p>
                  </article>
                ))}
              </div>
            </GlassCard>
          </div>
        </section>

        <section id="solution" className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <GlassCard className="p-8 md:p-10">
              <div className="grid gap-10 md:grid-cols-2 md:items-center">
                <div>
                  <SectionTag>La solution</SectionTag>
                  <h2 className="mt-5 text-3xl font-bold leading-tight md:text-5xl">
                    Obillz centralise tout ce dont votre club a besoin.
                  </h2>
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
                    Une plateforme claire et accessible pour simplifier l'organisation, fluidifier
                    la communication et piloter le club en mobilité.
                  </p>
                  <ul className="mt-8 grid gap-3">
                    <li className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90">
                      Simplicité pour les équipes non techniques
                    </li>
                    <li className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90">
                      Centralisation de tous les flux du club
                    </li>
                    <li className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90">
                      Utilisation mobile, tablette et ordinateur
                    </li>
                  </ul>
                </div>
                <ProductPlaceholder label="Aperçu plateforme" />
              </div>
            </GlassCard>
          </div>
        </section>

        <section id="fonctionnalites" className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <SectionTag>Fonctionnalités</SectionTag>
              <h2 className="mt-5 text-3xl font-bold leading-tight md:text-5xl">
                Des modules pensés pour le quotidien d'un club sportif.
              </h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {features.map((feature, index) => (
                <GlassCard
                  key={feature.title}
                  className={`group p-7 transition duration-300 hover:-translate-y-1.5 hover:bg-white/14 ${
                    index === 1 || index === 4 ? "md:translate-y-7" : ""
                  }`}
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/10 text-white transition group-hover:scale-105 group-hover:bg-white/20">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      {feature.icon}
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">{feature.description}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-stretch">
              <GlassCard className="p-8 md:p-10">
                <SectionTag>Bénéfices</SectionTag>
                <h2 className="mt-5 text-3xl font-bold leading-tight md:text-5xl">
                  Pourquoi les clubs utilisent Obillz.
                </h2>
                <p className="mt-5 max-w-xl text-base text-white/85 md:text-lg">
                  Une organisation plus claire pour gagner du temps et mieux coordonner tout le club.
                </p>
                <div className="mt-8 grid gap-3">
                  {benefits.map((benefit, index) => (
                    <div
                      key={benefit.title}
                      className="rounded-2xl border border-white/25 bg-white/10 px-4 py-4 transition hover:bg-white/15"
                    >
                      <p className="text-sm font-semibold text-white/85">0{index + 1}</p>
                      <p className="mt-1 text-lg font-semibold text-white">{benefit.title}</p>
                      <p className="mt-1 text-sm text-white/80">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="flex flex-col justify-between p-8 md:p-10">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/75">
                    Impact
                  </p>
                  <p className="mt-4 text-4xl font-bold leading-tight text-white md:text-5xl">
                    + de clarté
                    <br />- de charge mentale
                  </p>
                </div>
                <p className="mt-6 text-sm leading-relaxed text-white/80">
                  Obillz vous aide à structurer durablement le club sans alourdir les équipes.
                </p>
              </GlassCard>
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-4xl">
            <GlassCard className="p-8 md:p-10">
              <div className="text-center">
                <SectionTag>FAQ</SectionTag>
                <h2 className="mt-5 text-3xl font-bold leading-tight md:text-5xl">
                  Questions fréquentes
                </h2>
              </div>
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
            </GlassCard>
          </div>
        </section>

        <section className="px-4 pb-20 pt-14 md:px-6 md:pt-16">
          <div className="mx-auto max-w-6xl">
            <GlassCard className="relative overflow-hidden p-10 text-center md:p-14">
              <div className="pointer-events-none absolute -left-12 top-2 h-36 w-36 rounded-full bg-white/20 blur-3xl" />
              <div className="pointer-events-none absolute -right-8 bottom-2 h-44 w-44 rounded-full bg-indigo-200/30 blur-3xl" />
              <SectionTag>Final CTA</SectionTag>
              <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-bold leading-tight text-white md:text-5xl">
                Lancez votre club dans une gestion moderne avec Obillz.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base text-white/85 md:text-lg">
                Testez la plateforme et découvrez une organisation plus fluide dès aujourd'hui.
              </p>
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
                  Découvrir la plateforme
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
