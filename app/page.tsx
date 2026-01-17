import Link from "next/link";
import LandingNav from "@/components/LandingNav";

const features = [
  {
    title: "Devis et factures",
    description:
      "Créez, envoyez et transformez vos documents sans ressaisie. Chaque action est reliée à vos clients.",
  },
  {
    title: "Centralisation des données",
    description:
      "Toutes les informations clés au même endroit : clients, documents, paiements et historique.",
  },
  {
    title: "Pilotage de l’activité",
    description:
      "Tableau de bord clair pour suivre les encours, les paiements et les actions à venir.",
  },
  {
    title: "Documents personnalisés",
    description:
      "Logo, informations d’entreprise et coordonnées intégrés pour une présentation cohérente.",
  },
];

const benefits = [
  "Réduire les tâches répétitives et les ressaisies.",
  "Garder une visibilité fiable sur les encours.",
  "Fluidifier le traitement des devis et des factures.",
  "Standardiser les documents pour l’équipe.",
  "Limiter les outils dispersés.",
  "Sécuriser l’accès aux informations clés.",
];

const testimonials = [
  {
    quote:
      "Nous avons gagné en visibilité sur les encours et réduit le temps passé à rassembler les informations.",
    name: "Camille R.",
    role: "Responsable administratif",
  },
  {
    quote:
      "Les devis et factures sont enfin alignés avec notre organisation. Le suivi est plus simple.",
    name: "Nicolas D.",
    role: "Dirigeant, PME",
  },
  {
    quote:
      "L’équipe suit les dossiers sans aller chercher dans plusieurs outils. C’est plus fiable.",
    name: "Sarah L.",
    role: "Office manager",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <LandingNav />
      <main className="pt-24">
        <section className="px-6 py-16 md:py-20">
          <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Gestion administrative pour les entreprises
              </p>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
                Pilotez vos documents et votre suivi client avec une structure claire.
              </h1>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                Organa centralise l’essentiel de votre activité pour réduire le temps
                administratif, fiabiliser le suivi et garder une vision nette de vos dossiers.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
                >
                  Commencer
                </Link>
                <Link
                  href="/tarifs"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors"
                >
                  Voir les tarifs
                </Link>
              </div>
              <div className="mt-8 grid gap-3 text-sm text-slate-600">
                <div>Centralisation des documents et des clients.</div>
                <div>Suivi des statuts et des paiements.</div>
                <div>Documents structurés pour votre activité.</div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Tableau de bord
                  </p>
                  <p className="text-lg font-semibold text-slate-900">Vue d’ensemble</p>
                </div>
                <span className="text-xs text-slate-500">30 derniers jours</span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {[
                  { label: "Clients", value: "24" },
                  { label: "Devis", value: "32" },
                  { label: "Factures", value: "48" },
                  { label: "Encours", value: "12.5k CHF" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className="text-lg font-semibold text-slate-900">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  Activité récente
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>Facture #1284 envoyée</li>
                  <li>Devis #452 validé</li>
                  <li>Nouveau client ajouté</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="fonctionnalites" className="px-6 py-16 bg-white border-t border-slate-200">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Fonctionnalités clés
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold text-slate-900">
                Un socle simple pour gérer l’administratif.
              </h2>
              <p className="mt-3 text-slate-600">
                Des fonctionnalités essentielles, pensées pour un usage quotidien et
                une organisation rigoureuse.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-6"
                >
                  <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="avantages" className="px-6 py-16">
          <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-start">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Avantages pour les entreprises
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold text-slate-900">
                Des gains concrets, visibles dans le quotidien.
              </h2>
              <p className="mt-3 text-slate-600">
                Organa structure la gestion administrative pour limiter les frictions
                et améliorer la visibilité opérationnelle.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm text-slate-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="temoignages" className="px-6 py-16 bg-white border-t border-slate-200">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Preuves sociales
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold text-slate-900">
                Des équipes qui gagnent en clarté.
              </h2>
              <p className="mt-3 text-slate-600">
                Témoignages issus d’utilisateurs qui ont rationalisé leur gestion.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.name}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-6"
                >
                  <p className="text-sm text-slate-700">“{testimonial.quote}”</p>
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-xs text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tarifs" className="px-6 py-16">
          <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">
              Tarifs simples et lisibles
            </h2>
            <p className="mt-3 text-slate-600">
              Choisissez un plan adapté à votre volume d’activité et à votre organisation.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/tarifs"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors"
              >
                Consulter les tarifs
              </Link>
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
              >
                Commencer
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 text-sm text-slate-500 md:flex-row md:justify-between">
          <p>© 2026 Organa — Développé en Suisse</p>
          <div className="flex gap-6">
            <Link href="/connexion" className="text-slate-500 hover:text-slate-700">
              Connexion
            </Link>
            <Link href="/inscription" className="text-slate-500 hover:text-slate-700">
              Inscription
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
