"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type ComparisonMode = "without" | "with";

const features = [
  {
    title: "Dashboard du club",
    description:
      "Visualisez en un coup d'oeil les indicateurs importants et les actions a traiter par le comite.",
  },
  {
    title: "Membres",
    description:
      "Centralisez les fiches membres, les statuts et les informations utiles dans une base claire et fiable.",
  },
  {
    title: "Cotisations",
    description:
      "Suivez les cotisations payees ou en attente avec une vue immediate pour relancer au bon moment.",
  },
  {
    title: "Factures",
    description:
      "Creez rapidement des factures propres pour vos partenaires, sponsors ou activites du club.",
  },
  {
    title: "Produits",
    description:
      "Pilotez vos ventes et produits du club avec une organisation simple et un suivi des revenus.",
  },
  {
    title: "Charges",
    description:
      "Enregistrez toutes les depenses pour garder une vision nette des couts et de la tresorerie.",
  },
  {
    title: "Evenements",
    description:
      "Preparez les matchs et manifestations avec des informations structurees et partageables.",
  },
  {
    title: "Buvette",
    description:
      "Organisez les tours de presence et les besoins buvette avec une gestion pratique et centralisee.",
  },
  {
    title: "Plannings",
    description:
      "Construisez les plannings de benevoles et de permanences sans multiplication de tableaux externes.",
  },
  {
    title: "QR Codes",
    description:
      "Generez des QR codes pour simplifier les inscriptions, les reservations ou les parcours de paiement.",
  },
  {
    title: "Campagnes marketing",
    description:
      "Communiquez avec vos membres et supporters grace a des campagnes ciblees et faciles a envoyer.",
  },
  {
    title: "Parametres du club",
    description:
      "Personnalisez les regles et les informations du club pour adapter la plateforme a votre fonctionnement.",
  },
];

const faqItems = [
  {
    question: "Est-ce facile a utiliser ?",
    answer:
      "Oui. Obillz est concu pour etre simple et rapide a prendre en main par les comites de clubs.",
  },
  {
    question: "Est-ce accessible sur telephone ?",
    answer:
      "Oui. La plateforme fonctionne sur ordinateur, tablette et telephone.",
  },
  {
    question: "Est-ce que plusieurs personnes peuvent gerer le club ?",
    answer:
      "Oui. Plusieurs membres du comite peuvent acceder a la plateforme et collaborer.",
  },
  {
    question: "Combien de temps faut-il pour commencer ?",
    answer: "La mise en place du club prend seulement quelques minutes.",
  },
];

function HeroFloatingCard({
  className,
  title,
  line1,
  line2,
  secondary,
}: {
  className: string;
  title: string;
  line1: string;
  line2: string;
  secondary: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute hidden rounded-2xl border border-slate-200/90 bg-white p-4 text-slate-900 shadow-[0_20px_40px_rgba(15,23,42,0.18)] backdrop-blur-sm md:block ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm font-black leading-tight text-[#1A23FF]">{line1}</p>
      <p className="mt-1 text-sm font-bold leading-tight text-slate-800">{line2}</p>
      <p className="mt-2 text-xs text-slate-500">{secondary}</p>
    </div>
  );
}

export default function LandingPage() {
  const [mode, setMode] = useState<ComparisonMode>("with");
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--obillz-hero-blue)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 pb-20">
        <section className="mt-0 w-full">
          <div className="w-full px-3 pb-6 pt-4 md:px-8 md:pb-8 md:pt-6 lg:px-12">
            <header className="mx-auto flex max-w-[1140px] items-center justify-between gap-4">
              <Link href="/" className="transition hover:opacity-95">
                <Image src="/logo-obillz.png" alt="Obillz" width={124} height={30} priority />
              </Link>
              <nav className="hidden items-center gap-2 md:flex">
                {["A propos", "Fonctions", "Tarifs", "Aide"].map((item) => (
                  <a
                    key={item}
                    href="#fonctionnalites"
                    className="rounded-full border border-white/35 bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-50 transition hover:bg-white/20"
                  >
                    {item}
                  </a>
                ))}
              </nav>
              <div className="flex items-center gap-2">
                <Link
                  href="/connexion"
                  className="rounded-full border border-white/45 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="rounded-full border border-white/60 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Creer mon club gratuitement
                </Link>
              </div>
            </header>

            <div className="relative mt-8 min-h-[390px] overflow-visible p-5 md:min-h-[460px] md:p-10">
              <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,0.11)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.11)_1px,transparent_1px)] [background-size:36px_36px]" />
              <div className="pointer-events-none absolute inset-0 rounded-t-[26px] border border-b-0 border-white/25" />

              <div className="relative z-10">
                <div className="mt-12 text-center md:mt-20">
                  <h1 className="text-balance text-2xl font-black leading-tight md:text-4xl">
                    Gerer un club sportif ne devrait pas etre complique.
                  </h1>
                  <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-blue-100 md:text-lg">
                    Simplifiez l&apos;administration de votre club, gagnez du temps et offrez une
                    organisation claire et professionnelle a votre comite.
                  </p>
                  <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      href="/inscription"
                      className="inline-flex w-full items-center justify-center rounded-full bg-white px-7 py-3 text-base font-bold text-[#1A23FF] shadow-[0_14px_30px_rgba(15,23,42,0.28)] transition hover:-translate-y-0.5 sm:w-auto"
                    >
                      Creer mon club gratuitement
                    </Link>
                    <a
                      href="#comparaison"
                      className="inline-flex w-full items-center justify-center rounded-full border border-white/45 px-7 py-3 text-base font-bold text-white transition hover:bg-white/10 sm:w-auto"
                    >
                      Voir comment ca fonctionne
                    </a>
                  </div>
                </div>
              </div>

              <HeroFloatingCard
                className="left-6 top-[58%] -rotate-6 animate-float [animation-delay:120ms]"
                title="Inscriptions ouvertes"
                line1="Repas apres match"
                line2="42 participants"
                secondary="Lien ou QR code partage au club"
              />
              <HeroFloatingCard
                className="right-6 top-[56%] rotate-6 animate-float [animation-delay:260ms]"
                title="Planning manifestation"
                line1="Soiree du club"
                line2="8 benevoles inscrits"
                secondary="Organisation simple des benevoles"
              />
              <HeroFloatingCard
                className="left-1/2 top-[84%] -translate-x-1/2 rotate-[-2deg] animate-float [animation-delay:400ms]"
                title="Cotisation annuelle"
                line1="Envoyee aux membres"
                line2="Equipe 1"
                secondary="Envoi en 2 clics"
              />
            </div>
          </div>
        </section>

        <section id="comparaison" className="mx-auto mt-20 w-[94%] max-w-[1160px]">
          <div className="rounded-3xl border border-white/20 bg-white p-6 text-slate-900 shadow-[0_24px_60px_rgba(2,6,23,0.2)] md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr]">
              <div className="rounded-2xl border border-slate-200 bg-[#F8FAFF] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] md:p-5">
                <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                  Sans Obillz
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    {
                      title: "Excel",
                      description: "Listes membres et suivis eparpilles dans plusieurs fichiers.",
                    },
                    {
                      title: "Gestion manuelle des paiements",
                      description: "Relances et verification des cotisations a la main.",
                    },
                    {
                      title: "Emails et messages disperses",
                      description: "Les informations importantes sont reparties entre plusieurs outils.",
                    },
                    {
                      title: "Organisation compliquee",
                      description: "Les evenements et benevoles sont difficiles a gerer.",
                    },
                  ].map((item) => (
                    <article
                      key={item.title}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.06)]"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                            <path d="M7 7h10v10H7z" strokeWidth="2" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-sm font-black text-slate-900">{item.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div>
                <div className="inline-flex rounded-full bg-slate-100 p-1 shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
                  <button
                    type="button"
                    onClick={() => setMode("without")}
                    className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                      mode === "without" ? "bg-white text-slate-700 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Sans Obillz
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("with")}
                    className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                      mode === "with" ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Avec Obillz
                  </button>
                </div>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-900 md:text-5xl">
                  Une seule plateforme pour tout centraliser
                </h2>
                <p className="mt-4 text-lg font-semibold text-slate-700">
                  Toute l&apos;organisation du club au meme endroit.
                </p>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-[#F8FAFF] p-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
                  <Image
                    src="/images/obillz-preview.svg"
                    alt="Mockup dashboard Obillz"
                    width={1000}
                    height={600}
                    className="h-auto w-full rounded-xl"
                  />
                </div>

                <ul className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  {[
                    "Membres et equipes centralises",
                    "Cotisations envoyees automatiquement",
                    "Organisation simple des evenements et benevoles",
                    "Communication facilitee avec les membres",
                    "Suivi clair des finances",
                    "Gain de temps enorme pour le comite",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                          <path d="M5 13l4 4L19 7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-20 w-[94%] max-w-[1160px]">
          <div className="rounded-3xl border border-white/20 bg-white p-8 text-slate-900 shadow-[0_24px_60px_rgba(2,6,23,0.2)] md:p-12">
            <h2 className="text-3xl font-black md:text-5xl">
              Une seule plateforme pour gerer tout votre club.
            </h2>
            <p className="mt-5 max-w-4xl text-base leading-relaxed text-slate-600 md:text-lg">
              Obillz centralise les operations quotidiennes du club dans une interface moderne.
              Votre comite gagne en clarte, en coordination et en rapidite d&apos;execution.
            </p>
          </div>
        </section>

        <section id="fonctionnalites" className="mx-auto mt-20 w-[94%] max-w-[1180px]">
          <h2 className="text-center text-3xl font-black md:text-5xl">Fonctionnalites</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-[0_16px_35px_rgba(15,23,42,0.14)] transition hover:-translate-y-1 hover:shadow-[0_24px_46px_rgba(15,23,42,0.2)]"
              >
                <h3 className="text-lg font-black">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-20 w-[94%] max-w-[1160px]">
          <div className="rounded-3xl border border-white/20 bg-white p-8 text-center text-slate-900 shadow-[0_24px_60px_rgba(2,6,23,0.2)] md:p-12">
            <h2 className="text-3xl font-black md:text-5xl">
              Moins d&apos;administratif. Plus de temps pour votre club.
            </h2>
            <p className="mx-auto mt-5 max-w-4xl text-base leading-relaxed text-slate-600 md:text-lg">
              Automatisez l&apos;essentiel, structurez vos donnees et concentrez l&apos;energie du
              comite sur la vie sportive et les projets du club.
            </p>
          </div>
        </section>

        <section id="faq" className="mx-auto mt-20 w-[94%] max-w-[1040px]">
          <div className="rounded-3xl border border-white/20 bg-white p-8 text-slate-900 shadow-[0_24px_60px_rgba(2,6,23,0.2)] md:p-12">
            <h2 className="text-center text-3xl font-black md:text-5xl">FAQ</h2>
            <div className="mt-8 space-y-3">
              {faqItems.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <article key={faq.question} className="overflow-hidden rounded-xl border border-slate-200 bg-[#F8FAFF]">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="font-bold">{faq.question}</span>
                      <span className="text-2xl font-light text-[#1A23FF]">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen ? <p className="border-t border-slate-200 px-5 py-4 text-sm text-slate-600">{faq.answer}</p> : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="tarifs" className="mx-auto mt-20 w-[94%] max-w-[1040px]">
          <div className="rounded-3xl border border-white/20 bg-white p-8 text-center text-slate-900 shadow-[0_24px_60px_rgba(2,6,23,0.22)] md:p-12">
            <h2 className="text-3xl font-black md:text-5xl">
              Simplifiez la gestion de votre club d aujourd hui.
            </h2>
            <div className="mt-8">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-full bg-[#1A23FF] px-8 py-4 text-base font-bold text-white shadow-[0_14px_30px_rgba(26,35,255,0.32)] transition hover:-translate-y-0.5"
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
