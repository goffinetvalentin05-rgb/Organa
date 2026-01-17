import Link from "next/link";
import LandingNav from "@/components/LandingNav";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <LandingNav />
      <main className="pt-24">
        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl rounded-[48px] border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-8 md:p-12 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] items-center">
              <div className="text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900">
                  Moins d'administratif.
                  <br />
                  Plus de temps pour ce qui compte vraiment.
                </h1>
                <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                  Organa automatise la gestion administrative de votre entreprise afin que vous
                  puissiez consacrer plus de temps à vos clients, à votre activité… et à ce qui
                  compte vraiment pour vous.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-900/10 hover:bg-slate-800 transition-colors"
                  >
                    Découvrir Organa
                  </Link>
                  <Link
                    href="#tarifs"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/70 px-7 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors"
                  >
                    Tarifs
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="rounded-[40px] border border-slate-200 bg-white/90 p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="relative h-80 rounded-[32px] bg-gradient-to-br from-indigo-100/80 via-white to-fuchsia-100/80">
                    <div className="absolute -top-8 right-8 h-28 w-28 rounded-full bg-indigo-200/70 blur-2xl" />
                    <div className="absolute bottom-6 left-6 h-32 w-32 rounded-full bg-fuchsia-200/70 blur-2xl" />

                    <div className="absolute left-6 top-6 w-64 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 ring-1 ring-indigo-200" />
                        <div className="h-2 w-16 rounded-full bg-slate-100" />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                            <div className="h-2 w-12 rounded-full bg-slate-200" />
                            <div className="mt-2 h-3 w-16 rounded-full bg-slate-300" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="absolute right-8 top-14 w-52 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-fuchsia-100 ring-1 ring-fuchsia-200" />
                        <div className="space-y-2">
                          <div className="h-2 w-20 rounded-full bg-slate-200" />
                          <div className="h-2 w-14 rounded-full bg-slate-100" />
                        </div>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="h-2 w-full rounded-full bg-slate-100" />
                        <div className="h-2 w-5/6 rounded-full bg-slate-100" />
                        <div className="h-2 w-2/3 rounded-full bg-slate-100" />
                      </div>
                    </div>

                    <div className="absolute bottom-8 right-10 w-60 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
                      <div className="flex items-center justify-between">
                        <div className="h-3 w-24 rounded-full bg-slate-200" />
                        <div className="h-6 w-6 rounded-full bg-indigo-100 ring-1 ring-indigo-200" />
                      </div>
                      <div className="mt-4 space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="h-2 w-24 rounded-full bg-slate-100" />
                            <div className="h-2 w-12 rounded-full bg-slate-200" />
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
                Votre temps est trop précieux pour être perdu dans l'administratif. Pourtant, ce
                sont encore ces tâches qui occupent une place disproportionnée dans votre quotidien.
              </p>
              <p className="text-lg leading-relaxed">
                Factures, devis, suivi des clients, documents dispersés, outils qui ne communiquent
                pas entre eux… L'administratif s'accumule, ralentit votre activité et devient une
                charge mentale permanente.
              </p>
              <p className="text-lg leading-relaxed">
                Ce temps perdu a un coût réel : moins de disponibilité pour vos clients, moins
                d'énergie pour développer votre entreprise, et moins de temps investi là où il crée
                réellement de la valeur.
              </p>
            </div>
            <div className="rounded-[36px] border border-slate-200 bg-slate-50 p-8 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
              <div className="grid gap-4">
                {[
                  "Factures",
                  "Devis",
                  "Clients",
                  "Documents",
                  "Calendrier",
                  "Suivi",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 ring-1 ring-indigo-200" />
                      <div className="h-2 w-24 rounded-full bg-slate-200" />
                    </div>
                    <div className="h-2 w-12 rounded-full bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[0.95fr_1.05fr] items-start">
            <div className="grid gap-6 md:grid-cols-2">
              {[
                "Organa a été conçu pour reprendre le contrôle de votre administratif.",
                "La plateforme centralise les éléments essentiels de votre gestion : factures, devis, clients et suivi administratif, au même endroit.",
                "En simplifiant et en structurant vos tâches administratives, Organa vous permet de gérer plus efficacement votre activité et de vous concentrer sur ce qui fait réellement avancer votre entreprise.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_16px_36px_rgba(15,23,42,0.06)]"
                >
                  <div className="mb-4 h-10 w-10 rounded-full bg-slate-100 ring-1 ring-slate-200" />
                  <p className="text-sm text-slate-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[44px] border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-8 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
              <div className="space-y-4">
                {[
                  "Factures",
                  "Devis",
                  "Clients",
                  "Suivi",
                ].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-fuchsia-100 ring-1 ring-fuchsia-200" />
                      <div className="h-2 w-20 rounded-full bg-slate-200" />
                    </div>
                    <div className="h-2 w-10 rounded-full bg-slate-100" />
                  </div>
                ))}
              </div>
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
                    "Vous commencez par créer vos clients dans Organa. Leurs informations sont automatiquement réutilisées pour vos devis et factures.",
                },
                {
                  title: "Créez et envoyez vos devis",
                  description:
                    "À partir d'un client, vous créez un devis en quelques clics. Vous pouvez l'envoyer par e-mail depuis Organa ou le télécharger.",
                },
                {
                  title: "Transformez vos devis en factures",
                  description:
                    "Une fois le devis validé, vous le transformez instantanément en facture, sans ressaisie ni perte d'information.",
                },
                {
                  title: "Personnalisez vos documents",
                  description:
                    "Vous configurez vos paramètres : logo, en-tête, coordonnées, informations bancaires. Tous vos documents reflètent automatiquement votre identité.",
                },
                {
                  title: "Pilotez votre activité depuis le dashboard",
                  description:
                    "Le dashboard vous offre une vue claire sur votre activité : documents en cours, factures payées ou en attente, actions à effectuer.",
                },
                {
                  title: "Suivez vos paiements et vos tâches",
                  description:
                    "Vous suivez l'état de vos documents et organisez vos tâches grâce au calendrier intégré.",
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
          <div className="mx-auto max-w-6xl rounded-[48px] border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-8 md:p-12 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">
              Pourquoi les entreprises font confiance à Organa
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Sécurité et confidentialité des données",
                  description:
                    "Vos données sont hébergées sur une infrastructure cloud sécurisée et protégées par des mécanismes d'accès stricts.",
                },
                {
                  title: "Une plateforme fiable, accessible quand vous en avez besoin",
                  description:
                    "Organa repose sur une infrastructure robuste, conçue pour être stable et disponible au quotidien.",
                },
                {
                  title: "Conçu pour les indépendants et les PME",
                  description:
                    "Organa a été pensé pour répondre aux besoins concrets des petites entreprises et des indépendants. Une interface claire, des actions simples, sans complexité inutile ni fonctionnalités superflues. Un outil pensé pour le terrain, pas pour compliquer votre quotidien.",
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
          <div className="mx-auto max-w-6xl rounded-[48px] border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 px-8 py-12 text-center shadow-[0_22px_70px_rgba(15,23,42,0.06)] md:px-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">
              Prêt à simplifier votre gestion administrative ?
            </h2>
            <div className="mt-6">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-900/10 hover:bg-slate-800 transition-colors"
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
