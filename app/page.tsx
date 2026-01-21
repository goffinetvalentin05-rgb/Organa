import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import SiteFooter from "@/components/SiteFooter";
import FaqAccordion from "@/components/FaqAccordion";

export const metadata: Metadata = {
  title: "OBILLZ — La facturation en deux clics",
  description:
    "Logiciel de facturation et de suivi des dépenses pour indépendants et petites entreprises. Simple, rapide, moderne, pensé pour l'Europe.",
};

const featureCards = [
  {
    title: "Devis & factures en 2 clics",
    text: "Créez, envoyez et suivez vos documents sans friction, avec des modèles clairs et pro.",
    icon: (
      <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    title: "Suivi des paiements",
    text: "Visualisez en un coup d'œil ce qui est payé, en attente ou à relancer.",
    icon: (
      <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16v10H4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h4" />
      </svg>
    ),
  },
  {
    title: "Dépenses & échéances",
    text: "Enregistrez vos dépenses et planifiez les échéances importantes sans tableaux externes.",
    icon: (
      <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5l3 3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 0-9 9" />
      </svg>
    ),
  },
  {
    title: "Notifications utiles",
    text: "Recevez les rappels clés au bon moment pour relancer ou payer sans stress.",
    icon: (
      <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a3 3 0 0 0 6 0" />
      </svg>
    ),
  },
  {
    title: "Assistant IA intégré",
    text: "Rédigez des relances et emails pro en quelques secondes, sans y penser.",
    icon: (
      <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l2.2 4.5L19 9l-4 3.9.9 5.6-5-2.7-5 2.7.9-5.6L5 9l4.8-1.5L12 3z" />
      </svg>
    ),
  },
  {
    title: "Dashboard complet",
    text: "Un cockpit clair pour piloter vos clients, vos revenus et vos charges.",
    icon: (
      <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v14H4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h4M7 13h6" />
      </svg>
    ),
  },
];

const howItWorksSteps = [
  { label: "01", text: "Créez un client en 30 secondes." },
  { label: "02", text: "Générez un devis ou une facture." },
  { label: "03", text: "Envoyez et suivez le statut." },
  { label: "04", text: "Ajoutez vos dépenses." },
  { label: "05", text: "Laissez OBILLZ gérer les rappels." },
  { label: "06", text: "Pilotez tout depuis le dashboard." },
];

const valueCards = [
  {
    title: "Zéro friction",
    text: "Une interface claire, sans jargon administratif, pour rester concentré sur l'essentiel.",
  },
  {
    title: "Pensé pour l'Europe",
    text: "Gestion simple des devises et des pratiques européennes, sans être centré sur un pays.",
  },
  {
    title: "Visibilité immédiate",
    text: "Retards, paiements, échéances : tout est lisible instantanément.",
  },
  {
    title: "Toujours maîtrisé",
    text: "Pas de surcharges inutiles : uniquement ce qui vous aide à facturer et suivre vos dépenses.",
  },
];

const faqItems = [
  {
    question: "OBILLZ convient-il aux freelances et petites équipes ?",
    answer: "Oui, OBILLZ est conçu pour les indépendants, freelances et petites entreprises.",
  },
  {
    question: "Puis-je commencer gratuitement ?",
    answer: "Oui, le plan Free vous permet de créer devis et factures avec un accès limité.",
  },
  {
    question: "Le plan Pro est-il sans engagement ?",
    answer: "Oui, vous pouvez passer au plan Pro et l'arrêter quand vous le souhaitez.",
  },
  {
    question: "L'assistant IA est-il inclus dans Pro ?",
    answer: "Oui, l'assistant IA fait partie du plan Pro avec les notifications et le dashboard complet.",
  },
];

const pricing = {
  free: ["Création de devis et factures", "Suivi basique", "Accès limité"],
  pro: [
    "Facturation illimitée",
    "Dépenses + échéances",
    "Notifications",
    "IA assistant",
    "Dashboard complet",
  ],
};

function SectionTitle({ label, title, description }: { label: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-500/80">{label}</p>
      <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">{description}</p> : null}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <LandingNav />
      <main className="pt-28">
        <section className="px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[56px] border border-indigo-100 bg-white shadow-[0_35px_120px_rgba(15,23,42,0.15)]">
            <div className="grid gap-14 px-8 py-14 md:px-12 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                  OBILLZ — La facturation en deux clics
                </div>
                <h1 className="mt-6 text-4xl font-semibold leading-tight text-slate-900 md:text-6xl">
                  Gérez vos devis et factures <br />
                  où que vous soyez.
                </h1>
                <p className="mt-5 text-lg leading-relaxed text-slate-600 md:text-xl">
                  Un outil moderne pour facturer vite, suivre vos dépenses et rester concentré sur votre activité.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {[
                    "Facturation rapide et professionnelle",
                    "Suivi clair des paiements et relances",
                    "Dépenses + échéances réunies",
                    "Accès simple, sans jargon administratif",
                    "Pensé pour l'Europe et l'international",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(79,70,229,0.35)] hover:bg-indigo-500 transition-colors"
                  >
                    Commencer gratuitement
                  </Link>
                  <Link
                    href="#dashboard"
                    className="inline-flex items-center justify-center rounded-full border border-indigo-200 bg-white px-8 py-3 text-sm font-semibold text-indigo-700 hover:border-indigo-300 transition-colors"
                  >
                    Voir la démo
                  </Link>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>Compatible paiements :</span>
                  {["SEPA", "Carte", "Virement", "Multi-devises"].map((item) => (
                    <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-12 top-10 h-52 w-52 rounded-full bg-indigo-200/40 blur-3xl" />
                <div className="absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-violet-200/40 blur-3xl" />
                <div className="relative rounded-[32px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.15)]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">Aperçu produit</p>
                    <span className="rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white">OBILLZ</span>
                  </div>
                  <div className="mt-6 grid gap-4">
                    <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Factures</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">€12 300</p>
                      <div className="mt-4 h-2 w-full rounded-full bg-indigo-100">
                        <div className="h-2 w-3/4 rounded-full bg-indigo-600" />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Devis</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">8 envoyés</p>
                        <p className="mt-1 text-xs text-slate-500">2 en attente</p>
                      </div>
                      <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dépenses</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">€3 480</p>
                        <p className="mt-1 text-xs text-slate-500">Échéances à 10 jours</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Suivi</p>
                      <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-3">
                        {["Relance #2043", "Paiement reçu", "Échéance dépense"].map((item) => (
                          <div key={item} className="rounded-lg bg-indigo-50 px-3 py-2">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Visuel abstrait</p>
                  <div className="mt-4 h-28 rounded-2xl bg-gradient-to-r from-indigo-100 via-violet-100 to-blue-100" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div className="grid gap-6">
              {[
                {
                  title: "Trop d'outils dispersés",
                  text: "Factures, dépenses, relances… tout est éparpillé entre des fichiers et des apps.",
                },
                {
                  title: "Suivi approximatif",
                  text: "Impossible de voir rapidement ce qui est payé, en retard, ou à prévoir.",
                },
                {
                  title: "Charge mentale inutile",
                  text: "Vous perdez du temps sur l'administratif au lieu de développer votre activité.",
                },
              ].map((card) => (
                <div key={card.title} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <p className="text-base font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[36px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-11 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500/80">Le problème</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
                L'administratif ne doit pas ralentir votre business.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                OBILLZ centralise facturation et dépenses pour vous donner une vue claire, rapide, actionnable.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                Vous gagnez du temps, évitez les oublis, et gardez un suivi fiable sans complexité.
              </p>
              <div className="mt-8">
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  Commencer gratuitement
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[56px] bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 px-8 py-14 text-white shadow-[0_32px_90px_rgba(15,23,42,0.35)] md:px-12">
            <SectionTitle
              label="La solution OBILLZ"
              title="Une seule interface pour facturer, suivre et avancer."
              description="Structure claire, actions rapides, et une vue globale de votre activité. Sans jargon, sans lourdeur."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "Tout est centralisé",
                  text: "Clients, documents, dépenses et échéances réunis dans un espace simple.",
                },
                {
                  title: "Vous gardez le contrôle",
                  text: "Des rappels intelligents pour ne plus laisser passer un paiement ou une dépense.",
                },
              ].map((card) => (
                <div key={card.title} className="rounded-[30px] border border-white/15 bg-white/10 p-7 shadow-[0_18px_40px_rgba(15,23,42,0.25)]">
                  <p className="text-base font-semibold text-white">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/85">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              label="Fonctionnalités clés"
              title="Tout ce dont vous avez besoin. Rien de superflu."
              description="Pensé pour les indépendants et petites entreprises qui veulent aller vite."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featureCards.map((card) => (
                <div key={card.title} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 ring-1 ring-indigo-100">
                    {card.icon}
                  </div>
                  <p className="text-base font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="dashboard" className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <SectionTitle
                label="Vue produit"
                title="Un dashboard qui parle vraiment."
                description="Suivi des revenus, paiements, dépenses et échéances, tout est là, lisible et actionnable."
              />
              <div className="mt-8 flex flex-wrap gap-3">
                {["Suivi paiements", "Relances IA", "Vue dépenses", "Notifications"].map((item) => (
                  <span key={item} className="rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-8 top-10 h-48 w-48 rounded-full bg-indigo-200/50 blur-3xl" />
              <div className="rounded-[32px] border border-indigo-100 bg-white p-6 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">Aperçu dashboard</p>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">OBILLZ</span>
                </div>
                <div className="mt-6 grid gap-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    {["Factures payées", "En attente", "Dépenses"].map((label) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">+12%</p>
                        <p className="mt-1 text-xs text-slate-500">Cette semaine</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Échéances</p>
                    <div className="mt-3 grid gap-2 text-xs text-slate-600">
                      {["Relance facture #1098", "Paiement dépense cloud", "Devis à valider"].map((item) => (
                        <div key={item} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                          <span>{item}</span>
                          <span className="text-indigo-600">Aujourd'hui</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-400">Mockup UI (placeholder).</p>
            </div>
          </div>
        </section>

        <section id="comment-ca-marche" className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              label="Comment ça marche"
              title="Simple, fluide, sans surcharge."
              description="6 étapes claires pour garder votre facturation sous contrôle."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {howItWorksSteps.map((step) => (
                <div key={step.label} className="rounded-[26px] border border-slate-200 bg-white p-7 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">{step.label}</p>
                  <p className="mt-3 text-base font-semibold text-slate-900">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[44px] border border-indigo-100 bg-white px-8 py-12 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <SectionTitle label="Tarifs" title="Deux plans, clairs et efficaces." />
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-7">
                <p className="text-base font-semibold text-slate-900">Free</p>
                <p className="mt-2 text-sm text-slate-600">Pour démarrer sans risque.</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {pricing.free.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-400 transition-colors"
                  >
                    Commencer gratuitement
                  </Link>
                </div>
              </div>
              <div className="relative rounded-[28px] border border-indigo-200 bg-white p-7 shadow-[0_18px_40px_rgba(79,70,229,0.2)]">
                <span className="absolute -top-3 right-6 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                  Recommandé
                </span>
                <p className="text-base font-semibold text-slate-900">Pro</p>
                <p className="mt-2 text-sm text-slate-600">29€ / mois (prix provisoire)</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {pricing.pro.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                  >
                    Passer au plan Pro
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[48px] border border-slate-200 bg-slate-50 px-8 py-12 shadow-[0_26px_70px_rgba(15,23,42,0.08)]">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-500/80">Comparatif</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
                Sans OBILLZ / Avec OBILLZ
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                Une lecture rapide de la différence, comme un avant / après.
              </p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
              <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Sans OBILLZ</p>
                  <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-500">
                    Avant
                  </span>
                </div>
                <ul className="mt-6 space-y-4 text-sm text-slate-600">
                  {[
                    "Création manuelle des factures, longue et source d’erreurs",
                    "Factures et dépenses dispersées sur plusieurs outils",
                    "Aucune alerte sur les échéances de paiement",
                    "Manque de visibilité sur ce qui est payé ou en retard",
                    "Perte de temps à chercher des documents",
                    "Suivi financier stressant et peu clair",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                        ✕
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="hidden items-center justify-center lg:flex">
                <div className="flex h-full w-16 flex-col items-center justify-center gap-3">
                  <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-[11px] font-semibold text-indigo-600">
                    AVANT
                  </span>
                  <div className="h-40 w-px bg-gradient-to-b from-transparent via-indigo-200 to-transparent" />
                  <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-[11px] font-semibold text-indigo-600">
                    APRÈS
                  </span>
                </div>
              </div>
              <div className="rounded-[28px] border border-indigo-100 bg-white p-7 shadow-[0_20px_50px_rgba(79,70,229,0.12)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Avec OBILLZ</p>
                  <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
                    Après
                  </span>
                </div>
                <div className="mt-6 grid gap-4">
                  {[
                    {
                      title: "Facturation rapide et centralisée",
                      text: "Créez et envoyez vos factures en quelques clics depuis un seul outil.",
                    },
                    {
                      title: "Suivi clair des paiements et dépenses",
                      text: "Visualisez instantanément ce que vous devez payer et encaisser.",
                    },
                    {
                      title: "Alertes automatiques",
                      text: "Recevez des notifications avant les échéances importantes.",
                    },
                    {
                      title: "Vue d’ensemble en temps réel",
                      text: "Statuts clairs : payé, en attente, en retard.",
                    },
                    {
                      title: "Organisation sans effort",
                      text: "Tous vos documents sont centralisés et accessibles.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-[22px] border border-indigo-100 bg-indigo-50/40 p-5">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                          ✓
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{item.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[44px] border border-slate-200 bg-white px-8 py-12 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <SectionTitle label="FAQ" title="Questions fréquentes." />
            <div className="mt-10">
              <FaqAccordion items={faqItems} />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
