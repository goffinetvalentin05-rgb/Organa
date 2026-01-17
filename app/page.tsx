import Link from "next/link";
import LandingNav from "@/components/LandingNav";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <LandingNav />
      <main className="pt-24">
        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl rounded-[52px] border border-cyan-100 bg-gradient-to-br from-cyan-500/90 via-cyan-500 to-teal-400/90 p-8 md:p-12 shadow-[0_28px_80px_rgba(14,116,144,0.25)]">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] items-center">
              <div className="text-left text-white">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
                  Moins d'administratif.
                  <br />
                  Plus de temps pour ce qui compte vraiment.
                </h1>
                <p className="mt-6 text-lg text-white/90 leading-relaxed">
                  Organa automatise votre administratif pour libérer du temps client, garder une
                  vision claire de vos documents et piloter l’activité sans friction.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-cyan-900 shadow-sm hover:bg-cyan-50 transition-colors"
                  >
                    Découvrir Organa
                  </Link>
                  <Link
                    href="#tarifs"
                    className="inline-flex items-center justify-center rounded-full border border-white/50 bg-white/15 px-7 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                  >
                    Tarifs
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="rounded-[40px] border border-white/40 bg-white/95 p-8 shadow-[0_22px_50px_rgba(15,23,42,0.12)]">
                  <div className="relative h-80 rounded-[32px] bg-gradient-to-br from-cyan-50 via-white to-teal-50">
                    <div className="absolute -top-8 right-8 h-28 w-28 rounded-full bg-cyan-200/70 blur-2xl" />
                    <div className="absolute bottom-6 left-6 h-32 w-32 rounded-full bg-teal-200/70 blur-2xl" />

                    <div className="absolute left-6 top-6 w-64 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500">Vue d’ensemble</p>
                        <span className="text-xs text-slate-400">30 jours</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {[
                          { label: "Clients", value: "24" },
                          { label: "Devis", value: "32" },
                          { label: "Factures", value: "48" },
                          { label: "Encours", value: "12.5k CHF" },
                        ].map((stat) => (
                          <div key={stat.label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-[11px] text-slate-500">{stat.label}</p>
                            <p className="text-sm font-semibold text-slate-900">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="absolute right-8 top-14 w-52 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500">Facture #1284</p>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-600">
                          Envoyée
                        </span>
                      </div>
                      <div className="mt-3 space-y-2 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span>Client</span>
                          <span className="font-medium text-slate-700">Studio Atlas</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Montant</span>
                          <span className="font-medium text-slate-700">2 450 CHF</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Échéance</span>
                          <span className="font-medium text-slate-700">12 oct.</span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-8 right-10 w-60 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                      <p className="text-xs font-semibold text-slate-500">Clients récents</p>
                      <div className="mt-3 space-y-3 text-xs text-slate-600">
                        {[
                          { name: "Maison Rivage", status: "Actif" },
                          { name: "Nordline", status: "Devis envoyé" },
                          { name: "Atelier Hugo", status: "En suivi" },
                        ].map((client) => (
                          <div key={client.name} className="flex items-center justify-between">
                            <span className="font-medium text-slate-700">{client.name}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                              {client.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-start">
            <div className="space-y-6 text-slate-700">
              <p className="text-lg leading-relaxed">
                Votre temps est trop précieux pour être absorbé par l'administratif. Pourtant, ces
                tâches prennent encore une place disproportionnée.
              </p>
              <p className="text-lg leading-relaxed">
                Documents dispersés, outils qui ne communiquent pas, doublons de saisie : la charge
                s'accumule et ralentit votre activité.
              </p>
              <p className="text-lg leading-relaxed">
                Résultat : moins de disponibilité client, moins d'énergie pour développer l'entreprise.
              </p>
            </div>
            <div className="rounded-[36px] border border-slate-200 bg-slate-50 p-8 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
              <div className="grid gap-4">
                {[
                  { title: "Factures", note: "Suivi manuel et relances" },
                  { title: "Devis", note: "Multiples versions" },
                  { title: "Clients", note: "Infos éparpillées" },
                  { title: "Documents", note: "Dossiers dispersés" },
                  { title: "Calendrier", note: "Rappels oubliés" },
                  { title: "Suivi", note: "Peu de visibilité" },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 ring-1 ring-indigo-200" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.note}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">À corriger</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl rounded-[52px] border border-cyan-100 bg-gradient-to-br from-cyan-500/90 via-cyan-500 to-teal-400/90 p-8 md:p-12 shadow-[0_28px_80px_rgba(14,116,144,0.22)]">
            <div className="text-white">
              <p className="text-sm font-semibold uppercase tracking-widest text-white/80">
                Valeur
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold">
                Une base claire pour piloter l’activité.
              </h2>
              <p className="mt-4 text-lg text-white/90">
                Organa centralise les documents, fluidifie les tâches et donne une lecture nette de
                votre activité.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Centralisation",
                  description: "Factures, devis, clients et suivi au même endroit.",
                },
                {
                  title: "Automatisation",
                  description: "Moins de ressaisies, plus de continuité.",
                },
                {
                  title: "Pilotage",
                  description: "Encours visibles et actions à jour.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-white/40 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.08)]"
                >
                  <div className="mb-4 h-10 w-10 rounded-full bg-cyan-100 ring-1 ring-cyan-200" />
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="comment-ca-marche" className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1fr_1.1fr] items-start">
            <div className="rounded-[44px] border border-slate-200 bg-white p-8 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">Comment ça marche</h2>
              <p className="mt-4 text-lg text-slate-600">
                Un fonctionnement simple, pensé pour votre gestion quotidienne.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "Créez vos clients",
                  description:
                    "Saisissez une fois, réutilisez partout dans vos documents.",
                },
                {
                  title: "Créez et envoyez vos devis",
                  description:
                    "Devis prêts en quelques clics, envoi direct ou téléchargement.",
                },
                {
                  title: "Transformez vos devis en factures",
                  description:
                    "Conversion immédiate, sans ressaisie.",
                },
                {
                  title: "Personnalisez vos documents",
                  description:
                    "Logo, en-tête, coordonnées : votre identité partout.",
                },
                {
                  title: "Pilotez votre activité depuis le dashboard",
                  description:
                    "Vue claire sur les encours, paiements et actions.",
                },
                {
                  title: "Suivez vos paiements et vos tâches",
                  description:
                    "Statuts à jour et tâches organisées.",
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 shadow-[0_14px_30px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl rounded-[52px] border border-cyan-100 bg-gradient-to-br from-cyan-500/90 via-cyan-500 to-teal-400/90 p-8 md:p-12 shadow-[0_28px_80px_rgba(14,116,144,0.22)]">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">
              Pourquoi les entreprises font confiance à Organa
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Sécurité et confidentialité des données",
                  description:
                    "Données hébergées sur une infrastructure cloud sécurisée.",
                },
                {
                  title: "Une plateforme fiable, accessible quand vous en avez besoin",
                  description:
                    "Infrastructure robuste, disponible au quotidien.",
                },
                {
                  title: "Conçu pour les indépendants et les PME",
                  description:
                    "Pensé pour le terrain : clair, simple, sans superflu.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[28px] bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
                  <div className="mb-4 h-10 w-10 rounded-full bg-slate-100 ring-1 ring-slate-200" />
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tarifs" className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-5xl rounded-[44px] border border-slate-200 bg-white p-8 md:p-10">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">Tarifs</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-8 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                <p className="text-lg font-semibold text-slate-900">Plan Gratuit</p>
                <p className="mt-2 text-sm text-slate-600">Idéal pour démarrer</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li>Maximum 2 clients</li>
                  <li>Maximum 3 documents par mois</li>
                  <li>Toutes les fonctionnalités de base</li>
                </ul>
              </div>
              <div className="rounded-[32px] border border-indigo-200 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <p className="text-lg font-semibold text-slate-900">Plan Pro</p>
                <p className="mt-2 text-sm text-slate-600">Accès illimité</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li>Clients illimités</li>
                  <li>Documents illimités</li>
                  <li>Support prioritaire</li>
                  <li>Toutes les fonctionnalités</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl rounded-[52px] border border-cyan-100 bg-gradient-to-br from-cyan-500/90 via-cyan-500 to-teal-400/90 px-8 py-12 text-center shadow-[0_28px_80px_rgba(14,116,144,0.22)] md:px-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-white">
              Prêt à simplifier votre gestion administrative ?
            </h2>
            <div className="mt-6">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-cyan-900 shadow-sm hover:bg-cyan-50 transition-colors"
              >
                Découvrir Organa
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Organa. Développé en Suisse.</p>
          <div className="flex items-center gap-2">
            <Link href="/connexion" className="text-slate-500 hover:text-slate-700">
              Connexion
            </Link>
            <span>·</span>
            <Link href="/inscription" className="text-slate-500 hover:text-slate-700">
              Inscription
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
