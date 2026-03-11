"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type ComparisonMode = "without" | "with";

const features = [
  {
    title: "Dashboard du club",
    description:
      "Le tableau de bord donne une vue globale sur l'activite du club: membres, cotisations et informations importantes.",
  },
  {
    title: "Membres",
    description:
      "Centralisez tous les membres du club dans un seul endroit avec des informations claires et bien organisees.",
  },
  {
    title: "Cotisations",
    description:
      "Suivez les cotisations et identifiez rapidement les paiements effectues ou en attente.",
  },
  {
    title: "Factures",
    description:
      "Creez des factures professionnelles en quelques secondes pour sponsors, partenaires ou evenements.",
  },
  {
    title: "Produits",
    description:
      "Gerez les revenus du club comme les ventes a la buvette ou les repas organises lors des evenements.",
  },
  {
    title: "Charges",
    description:
      "Enregistrez facilement les depenses du club pour conserver une vision claire des finances.",
  },
  {
    title: "Evenements",
    description:
      "Organisez matchs, tournois et manifestations avec toutes les informations centralisees.",
  },
  {
    title: "Buvette",
    description:
      "Un calendrier dedie permet de reserver la buvette et d'organiser les responsables de creneaux.",
  },
  {
    title: "Plannings",
    description:
      "Creez des plannings pour les manifestations et partagez un lien pour l'inscription des benevoles.",
  },
  {
    title: "QR Codes",
    description:
      "Generez des QR codes ou des liens pour permettre des inscriptions simples aux evenements ou repas.",
  },
  {
    title: "Campagnes marketing",
    description:
      "Utilisez les informations des inscrits pour communiquer avec les membres, supporters et participants.",
  },
  {
    title: "Parametres du club",
    description:
      "Configurez les informations du club et gerez les parametres generaux de la plateforme.",
  },
];

const faqItems = [
  {
    question: "Est-ce que la plateforme est facile a utiliser ?",
    answer:
      "Oui, Obillz est concu pour etre simple et rapide a prendre en main par les comites de clubs.",
  },
  {
    question: "Est-ce que plusieurs personnes peuvent gerer le club ?",
    answer:
      "Oui, plusieurs membres du comite peuvent acceder a la plateforme avec des acces adaptes.",
  },
  {
    question: "Est-ce accessible depuis un telephone ?",
    answer: "Oui, la plateforme fonctionne sur ordinateur, tablette et telephone.",
  },
  {
    question: "Combien de temps faut-il pour commencer ?",
    answer: "La mise en place du club prend seulement quelques minutes.",
  },
];

function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-4 z-50 mx-auto w-[94%] max-w-[1240px]">
      <div className="rounded-[34px] border border-white/20 bg-white/10 px-4 py-3 shadow-[0_10px_30px_rgba(2,6,23,0.25)] backdrop-blur-md md:px-7">
        <div className="flex items-center justify-between">
          <Link href="/" className="transition hover:opacity-90">
            <Image src="/logo-obillz.png" alt="Obillz" width={140} height={36} priority />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-blue-50 lg:flex">
            <a href="#fonctionnalites" className="transition hover:text-white">
              Fonctionnalites
            </a>
            <a href="#comment-ca-marche" className="transition hover:text-white">
              Comment ca marche
            </a>
            <a href="#tarifs" className="transition hover:text-white">
              Tarifs
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/connexion"
              className="rounded-full border border-white/50 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#2563EB] shadow-[0_12px_25px_rgba(2,6,23,0.22)] transition hover:-translate-y-0.5"
            >
              Creer mon club gratuitement
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 text-white md:hidden"
            aria-label="Ouvrir le menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
              <path
                d={menuOpen ? "M6 6L18 18M6 18L18 6" : "M4 7h16M4 12h16M4 17h16"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {menuOpen ? (
          <div className="mt-4 space-y-2 border-t border-white/20 pt-4 md:hidden">
            <a href="#fonctionnalites" className="block rounded-xl px-3 py-2 text-white hover:bg-white/10">
              Fonctionnalites
            </a>
            <a href="#comment-ca-marche" className="block rounded-xl px-3 py-2 text-white hover:bg-white/10">
              Comment ca marche
            </a>
            <a href="#tarifs" className="block rounded-xl px-3 py-2 text-white hover:bg-white/10">
              Tarifs
            </a>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default function LandingPage() {
  const [mode, setMode] = useState<ComparisonMode>("with");
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#2563EB] text-white">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_12%_10%,rgba(191,219,254,0.25),transparent_45%),radial-gradient(circle_at_85%_18%,rgba(96,165,250,0.2),transparent_44%),radial-gradient(circle_at_52%_80%,rgba(147,197,253,0.16),transparent_40%)]" />

      <div className="relative z-10 pt-5">
        <LandingHeader />

        <section className="mx-auto mt-12 w-[94%] max-w-[1240px]">
          <div className="relative overflow-hidden rounded-[38px] border border-white/20 bg-white/8 p-6 shadow-[0_25px_80px_rgba(2,6,23,0.28)] backdrop-blur-md md:p-10" data-reveal>
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:38px_38px]" />
            <div className="relative mx-auto max-w-4xl text-center">
              <h1 className="text-balance text-[2rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl md:text-6xl">
                Gerer un club sportif ne devrait pas etre complique.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-blue-50 sm:text-lg">
                Simplifiez l&apos;administration de votre club, gagnez du temps et offrez une
                organisation claire et professionnelle a votre comite.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/inscription"
                  className="inline-flex w-full items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-[#2563EB] shadow-[0_14px_32px_rgba(2,6,23,0.25)] transition hover:-translate-y-0.5 hover:scale-[1.02] sm:w-auto"
                >
                  Creer mon club gratuitement
                </Link>
                <a
                  href="#comment-ca-marche"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/45 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
                >
                  Voir comment ca fonctionne
                </a>
              </div>
              <p className="mt-3 text-sm text-blue-100">
                Sans engagement • mise en place en quelques minutes
              </p>
            </div>
            <div className="relative mx-auto mt-12 max-w-6xl">
              <div className="pointer-events-none absolute -left-4 top-20 hidden rounded-2xl border border-white/35 bg-white/20 px-4 py-3 text-sm shadow-[0_12px_30px_rgba(2,6,23,0.24)] backdrop-blur md:block animate-float [transform:rotate(-7deg)]">
                Membres du club
                <p className="mt-1 text-xs text-blue-50">+284 actifs</p>
              </div>
              <div className="pointer-events-none absolute -right-4 top-14 hidden rounded-2xl border border-white/35 bg-white/20 px-4 py-3 text-sm shadow-[0_12px_30px_rgba(2,6,23,0.24)] backdrop-blur md:block animate-float [transform:rotate(6deg)]">
                Cotisations payees
                <p className="mt-1 text-xs text-blue-50">92% ce mois</p>
              </div>
              <div className="pointer-events-none absolute left-[8%] top-[72%] hidden rounded-2xl border border-white/35 bg-white/20 px-4 py-3 text-sm shadow-[0_12px_30px_rgba(2,6,23,0.24)] backdrop-blur lg:block animate-float [transform:rotate(-4deg)]">
                Evenements
                <p className="mt-1 text-xs text-blue-50">4 a venir</p>
              </div>
              <div className="pointer-events-none absolute right-[8%] top-[75%] hidden rounded-2xl border border-white/35 bg-white/20 px-4 py-3 text-sm shadow-[0_12px_30px_rgba(2,6,23,0.24)] backdrop-blur lg:block animate-float [transform:rotate(4deg)]">
                Finances
                <p className="mt-1 text-xs text-blue-50">vision claire</p>
              </div>

              <div className="rounded-[1.9rem] border border-white/25 bg-white/12 p-3 shadow-[0_34px_90px_rgba(2,6,23,0.35)] backdrop-blur-sm [transform:perspective(1200px)_rotateX(3deg)] md:p-5">
                <div className="overflow-hidden rounded-2xl border border-white/15 bg-white">
                  <Image
                    src="/images/obillz-preview.svg"
                    alt="Mockup dashboard Obillz"
                    width={1600}
                    height={900}
                    className="h-auto w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-24 w-[94%] max-w-[1200px]" data-reveal>
          <div className="rounded-3xl border border-white/25 bg-white/12 p-8 shadow-[0_18px_45px_rgba(2,6,23,0.2)] backdrop-blur md:p-12">
            <h2 className="text-3xl font-extrabold leading-tight md:text-5xl">
              Aujourd&apos;hui, gerer un club sportif peut vite devenir un casse-tete.
            </h2>
            <p className="mt-5 max-w-4xl text-base leading-relaxed text-blue-50 md:text-lg">
              Dans beaucoup de clubs, l&apos;organisation repose encore sur plusieurs outils et
              beaucoup de gestion manuelle. Les informations sont dispersees entre Excel,
              messages, taches administratives et suivis manuels des membres et des cotisations.
              Le comite doit constamment verifier que tout est a jour.
            </p>
          </div>
        </section>

        <section
          id="comment-ca-marche"
          className="mx-auto mt-24 w-[94%] max-w-[1200px]"
          data-reveal
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-3xl border border-white/25 bg-white/12 p-6 shadow-[0_18px_45px_rgba(2,6,23,0.2)] backdrop-blur md:p-8">
              <div className="inline-flex rounded-full border border-white/30 bg-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setMode("without")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    mode === "without" ? "bg-white text-[#2563EB]" : "text-white/80"
                  }`}
                >
                  Sans Obillz
                </button>
                <button
                  type="button"
                  onClick={() => setMode("with")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    mode === "with" ? "bg-white text-[#2563EB]" : "text-white/80"
                  }`}
                >
                  Avec Obillz
                </button>
              </div>

            <div className="relative mt-6 min-h-[260px] overflow-hidden rounded-2xl border border-white/20 bg-white/95 p-5 text-slate-800 shadow-[0_22px_45px_rgba(2,6,23,0.16)]">
                <div
                  className={`absolute inset-0 p-5 transition-all duration-500 ${
                    mode === "without"
                      ? "translate-x-0 scale-100 opacity-100"
                      : "-translate-x-6 scale-[0.98] pointer-events-none opacity-0"
                  }`}
                >
                  <p className="mb-4 text-sm font-semibold text-slate-500">Sans Obillz</p>
                  <div className="space-y-3">
                    {[
                      "Excel",
                      "Gestion manuelle des paiements",
                      "Emails et messages disperses",
                      "Organisation des evenements a la main",
                    ].map((item) => (
                      <div key={item} className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`absolute inset-0 p-5 transition-all duration-500 ${
                    mode === "with"
                      ? "translate-x-0 scale-100 opacity-100"
                      : "translate-x-6 scale-[0.98] pointer-events-none opacity-0"
                  }`}
                >
                  <p className="mb-4 text-sm font-semibold text-[#2563EB]">Avec Obillz</p>
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <Image
                      src="/images/obillz-preview.svg"
                      alt="Dashboard Obillz"
                      width={900}
                      height={500}
                    className="h-auto w-full [transform:rotate(-1deg)_scale(1.02)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/25 bg-white/12 p-6 shadow-[0_18px_45px_rgba(2,6,23,0.2)] backdrop-blur md:p-8">
              <h3 className="text-2xl font-bold">
                {mode === "without"
                  ? "Une gestion dispersee demande beaucoup de temps au comite."
                  : "Toute l'organisation du club se trouve au meme endroit."}
              </h3>
              <ul className="mt-6 grid gap-3 text-sm leading-relaxed text-blue-50 sm:grid-cols-2">
                {(mode === "without"
                  ? [
                      "Informations dispersees entre Excel, WhatsApp et papiers",
                      "Cotisations a relancer manuellement",
                      "Difficulte a suivre les membres",
                      "Organisation des evenements compliquee",
                      "Manque de visibilite sur les finances",
                    ]
                  : [
                      "Membres et equipes centralises",
                      "Cotisations envoyees automatiquement",
                      "Organisation simple des evenements",
                      "Communication facilitee avec les membres",
                      "Suivi clair des finances",
                      "Gain de temps enorme pour le comite",
                    ]
                ).map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-0.5">{mode === "without" ? "✕" : "✓"}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-24 w-[94%] max-w-[1200px]" data-reveal>
          <div className="rounded-3xl border border-white/25 bg-white/12 p-8 shadow-[0_18px_45px_rgba(2,6,23,0.2)] backdrop-blur md:p-12">
            <h2 className="text-3xl font-extrabold md:text-5xl">
              Une seule plateforme pour gerer tout votre club.
            </h2>
            <p className="mt-5 max-w-4xl text-base leading-relaxed text-blue-50 md:text-lg">
              Obillz centralise toute la gestion de votre club sportif dans un seul outil simple
              et moderne. Toutes les informations du club sont accessibles au meme endroit, ce qui
              permet au comite de gagner du temps et de mieux organiser les activites du club.
            </p>
          </div>
        </section>

        <section id="fonctionnalites" className="mx-auto mt-24 w-[94%] max-w-[1200px]">
          <h2 className="text-center text-3xl font-extrabold md:text-5xl" data-reveal>
            Fonctionnalites
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                data-reveal
                className={`rounded-2xl border border-white/20 bg-white p-6 text-[#0F172A] shadow-[0_16px_35px_rgba(2,6,23,0.14)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_rgba(2,6,23,0.2)] ${
                  Number((feature.title.charCodeAt(0) + feature.title.length) % 2) === 0
                    ? "[transform:rotate(-0.8deg)] hover:[transform:rotate(-0.2deg)_translateY(-4px)]"
                    : "[transform:rotate(0.8deg)] hover:[transform:rotate(0.2deg)_translateY(-4px)]"
                }`}
              >
                <h3 className="text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-24 w-[94%] max-w-[1100px]" data-reveal>
          <div className="rounded-3xl border border-white/25 bg-white/12 p-8 shadow-[0_18px_45px_rgba(2,6,23,0.2)] backdrop-blur md:p-12">
            <h2 className="text-center text-3xl font-extrabold md:text-5xl">
              Moins d&apos;administratif. Plus de temps pour votre club.
            </h2>
            <p className="mx-auto mt-5 max-w-4xl text-center text-base leading-relaxed text-blue-50 md:text-lg">
              Obillz permet au comite de se concentrer sur l&apos;essentiel : les joueurs, les
              evenements et la vie du club, au lieu de passer des heures dans l&apos;administration.
            </p>
          </div>
        </section>

        <section className="mx-auto mt-24 w-[94%] max-w-[1100px]" data-reveal>
          <div className="rounded-3xl border border-white/25 bg-white/12 p-8 shadow-[0_18px_45px_rgba(2,6,23,0.2)] backdrop-blur md:p-12">
            <h2 className="text-center text-3xl font-extrabold md:text-5xl">FAQ</h2>
            <div className="mt-8 space-y-3">
              {faqItems.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <article key={faq.question} className="overflow-hidden rounded-xl border border-white/20 bg-white/90 text-slate-900">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left"
                    >
                      <span className="font-semibold">{faq.question}</span>
                      <span className="text-xl">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen ? <p className="border-t border-slate-200 px-5 py-4 text-sm text-slate-600">{faq.answer}</p> : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="tarifs" className="mx-auto mt-24 w-[94%] max-w-[1100px] pb-16" data-reveal>
          <div className="rounded-3xl border border-white/25 bg-[linear-gradient(145deg,rgba(255,255,255,0.18)_0%,rgba(191,219,254,0.24)_50%,rgba(255,255,255,0.18)_100%)] p-8 text-center shadow-[0_20px_50px_rgba(2,6,23,0.24)] backdrop-blur md:p-12">
            <h2 className="text-3xl font-extrabold md:text-5xl">
              Simplifiez la gestion de votre club dès aujourd&apos;hui.
            </h2>
            <div className="mt-8">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-[#2563EB] shadow-[0_14px_30px_rgba(2,6,23,0.22)] transition hover:-translate-y-0.5"
              >
                Creer mon club gratuitement
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
