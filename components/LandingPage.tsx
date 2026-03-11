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

function FloatingCard({
  className,
  title,
  value,
}: {
  className: string;
  title: string;
  value: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute hidden rounded-2xl border border-slate-200/90 bg-white p-4 text-slate-900 shadow-[0_20px_40px_rgba(15,23,42,0.18)] backdrop-blur-sm md:block ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-black text-[#1A23FF]">{value}</p>
      <p className="mt-1 text-xs text-slate-500">Mise a jour en temps reel</p>
    </div>
  );
}

export default function LandingPage() {
  const [mode, setMode] = useState<ComparisonMode>("with");
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#1A23FF] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(129,140,248,0.36),transparent_44%),radial-gradient(circle_at_88%_10%,rgba(96,165,250,0.25),transparent_36%),radial-gradient(circle_at_50%_80%,rgba(191,219,254,0.18),transparent_40%)]" />

      <div className="relative z-10 pb-20">
        <section className="mt-0 w-full">
          <div className="w-full border border-white/25 bg-[#1230ff]/80 px-3 pb-6 pt-4 shadow-[0_30px_90px_rgba(2,6,23,0.4)] backdrop-blur-sm md:px-8 md:pb-8 md:pt-6 lg:px-12">
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
              <Link
                href="/inscription"
                className="rounded-full border border-white/60 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Creer mon club gratuitement
              </Link>
            </header>

            <div className="relative mt-8 overflow-hidden rounded-[26px] border border-white/20 p-5 md:p-10">
              <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,0.11)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.11)_1px,transparent_1px)] [background-size:36px_36px]" />

              <div className="relative z-10">
                <div className="mt-6 text-center md:mt-10">
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

              <FloatingCard className="-left-6 top-[44%] -rotate-12 animate-float !block md:!block" title="Membres" value="baseclub.eth" />
              <FloatingCard className="-right-6 top-[42%] rotate-12 animate-float !block md:!block" title="Score global" value="520 pts" />
            </div>

            <div className="mx-auto mt-6 max-w-5xl rounded-[28px] border border-white/35 bg-white p-3 shadow-[0_28px_80px_rgba(2,6,23,0.38)] md:p-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#F8FAFF]">
                <Image
                  src="/images/obillz-preview.svg"
                  alt="Dashboard Obillz"
                  width={1600}
                  height={900}
                  className="h-auto w-full"
                />
              </div>
            </div>

            <div className="relative mt-6 rounded-[30px] border border-white/30 bg-[#eef2ff] p-4 shadow-[0_25px_70px_rgba(2,6,23,0.35)] md:p-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    t: "Dashboard du club",
                    d: "Toutes les infos importantes dans une seule vue claire.",
                  },
                  {
                    t: "Cotisations et finances",
                    d: "Suivi simple des paiements, factures et charges du club.",
                  },
                  {
                    t: "Planning et evenements",
                    d: "Organisez les activites et les benevoles sans friction.",
                  },
                ].map((item) => (
                  <article
                    key={item.t}
                    className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-[0_14px_28px_rgba(15,23,42,0.1)]"
                  >
                    <h3 className="text-xl font-black">{item.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.d}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="probleme" className="mx-auto mt-20 w-[94%] max-w-[1160px]">
          <div className="rounded-3xl border border-white/20 bg-white p-8 text-slate-900 shadow-[0_24px_60px_rgba(2,6,23,0.2)] md:p-12">
            <h2 className="text-3xl font-black leading-tight text-slate-900 md:text-5xl">
              Aujourd&apos;hui, gerer un club sportif peut vite devenir un casse-tete.
            </h2>
            <p className="mt-5 max-w-4xl text-base leading-relaxed text-slate-600 md:text-lg">
              Dans beaucoup de clubs, les taches sont eparpillees entre Excel, messages, emails et
              gestion manuelle. Le comite perd du temps, les infos se dispersent, et le suivi des
              membres comme des cotisations devient vite difficile a maintenir.
            </p>
          </div>
        </section>

        <section id="comparaison" className="mx-auto mt-20 w-[94%] max-w-[1160px]">
          <div className="rounded-3xl border border-white/20 bg-white p-6 text-slate-900 shadow-[0_24px_60px_rgba(2,6,23,0.2)] md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-3xl font-black md:text-4xl">Sans Obillz / Avec Obillz</h2>
              <div className="inline-flex rounded-full bg-[#E9EDFF] p-1">
                <button
                  type="button"
                  onClick={() => setMode("without")}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                    mode === "without" ? "bg-[#1A23FF] text-white" : "text-[#1A23FF]"
                  }`}
                >
                  Sans Obillz
                </button>
                <button
                  type="button"
                  onClick={() => setMode("with")}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                    mode === "with" ? "bg-[#1A23FF] text-white" : "text-[#1A23FF]"
                  }`}
                >
                  Avec Obillz
                </button>
              </div>
            </div>

            <div className="relative mt-8 min-h-[310px] overflow-hidden rounded-2xl border border-slate-200 bg-[#F7F9FF] p-5 md:min-h-[280px]">
              <div
                className={`absolute inset-0 p-5 transition-all duration-500 md:p-7 ${
                  mode === "without"
                    ? "translate-x-0 scale-100 opacity-100"
                    : "-translate-x-8 scale-[0.98] pointer-events-none opacity-0"
                }`}
              >
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">Sans Obillz</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    "Fichiers Excel disperses",
                    "Relances de paiement manuelles",
                    "Informations perdues dans les messages",
                    "Organisation evenementielle complexe",
                  ].map((item) => (
                    <div key={item} className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`absolute inset-0 p-5 transition-all duration-500 md:p-7 ${
                  mode === "with"
                    ? "translate-x-0 scale-100 opacity-100"
                    : "translate-x-8 scale-[0.98] pointer-events-none opacity-0"
                }`}
              >
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#1A23FF]">Avec Obillz</p>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_16px_30px_rgba(15,23,42,0.12)]">
                  <Image
                    src="/images/obillz-preview.svg"
                    alt="Vue unifiee de la gestion dans Obillz"
                    width={900}
                    height={500}
                    className="h-auto w-full rounded-xl"
                  />
                </div>
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
