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
                <div className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="relative h-72 rounded-[32px] bg-gradient-to-br from-indigo-100/80 via-white to-fuchsia-100/80">
                    <div className="absolute -top-6 right-6 h-24 w-24 rounded-full bg-indigo-200/70 blur-xl" />
                    <div className="absolute bottom-6 left-8 h-28 w-28 rounded-full bg-fuchsia-200/70 blur-xl" />
                    <div className="absolute top-10 left-10 h-16 w-40 rounded-full bg-white/70 ring-1 ring-slate-200" />
                    <div className="absolute bottom-10 right-10 h-20 w-20 rounded-[24px] bg-white/70 ring-1 ring-slate-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-16 md:py-24">
          <div className="mx-auto max-w-5xl text-left space-y-6 text-slate-700">
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
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl rounded-[44px] border border-slate-200 bg-slate-50 p-8 md:p-10">
            <div className="grid gap-6 md:grid-cols-3">
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
          </div>
        </section>

        <section id="comment-ca-marche" className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl rounded-[44px] border border-slate-200 bg-white p-8 md:p-10">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-900">Comment ça marche</h2>
              <p className="mt-4 text-lg text-slate-600">
                Un fonctionnement simple, pensé pour votre gestion quotidienne.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                "Créez vos clients",
                "Créez et envoyez vos devis",
                "Transformez vos devis en factures",
                "Personnalisez vos documents",
                "Pilotez votre activité depuis le dashboard",
                "Suivez vos paiements et vos tâches",
              ].map((item, index) => (
                <div
                  key={item}
                  className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 shadow-[0_14px_30px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-900">{item}</p>
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
                "Sécurité et confidentialité des données",
                "Une plateforme fiable, accessible quand vous en avez besoin",
                "Conçu pour les indépendants et les PME",
              ].map((item) => (
                <div key={item} className="rounded-[28px] bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
                  <div className="mb-4 h-10 w-10 rounded-full bg-slate-100 ring-1 ring-slate-200" />
                  <p className="text-sm text-slate-700">{item}</p>
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
