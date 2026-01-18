import Link from "next/link";
import LandingNav from "@/components/LandingNav";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LandingNav />
      <main className="pt-32">
        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[64px] bg-premium-gradient shadow-[0_36px_110px_rgba(2,6,23,0.45)]">
            <div className="grid gap-14 px-8 py-14 md:px-14 md:py-18 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="text-white">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
                  Gestion administrative
                </div>
                <h1 className="mt-7 text-4xl font-semibold leading-tight md:text-6xl lg:text-7xl">
                  Moins d’administratif.
                  <br />
                  Plus de temps pour ce qui compte vraiment.
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-white/80 md:text-xl">
                  Organa automatise la gestion administrative de votre entreprise afin que vous puissiez consacrer
                  plus de temps à vos clients, à votre activité… et à ce qui compte vraiment pour vous.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.25)] hover:bg-slate-100 transition-colors"
                  >
                    Découvrir Organa
                  </Link>
                  <Link
                    href="#demo"
                    className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-8 py-3 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
                  >
                    Voir la démo
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-8 top-10 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
                <div className="absolute -right-10 bottom-6 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                <div className="relative grid gap-6">
                  <div className="rounded-[28px] border border-white/15 bg-white/5 p-5 text-white shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">Vue d'ensemble</p>
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] text-white/85">
                        7 jours
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        { label: "Clients", value: "18 actifs" },
                        { label: "Devis", value: "7 envoyés" },
                        { label: "Factures", value: "12 émises" },
                        { label: "Paiements", value: "9 reçus" },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-xl bg-white/10 px-3 py-3">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-white/55">{stat.label}</p>
                          <p className="text-sm font-semibold text-white">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] border border-white/15 bg-white/5 p-4 text-white shadow-[0_16px_36px_rgba(0,0,0,0.3)]">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">Devis</p>
                      <p className="mt-2 text-lg font-semibold">#2041</p>
                      <p className="mt-1 text-xs text-white/80">Validé · 3 200 CHF</p>
                      <div className="mt-4 h-2 w-full rounded-full bg-white/15">
                        <div className="h-2 w-3/4 rounded-full bg-white" />
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-white/15 bg-white/5 p-4 text-white shadow-[0_16px_36px_rgba(0,0,0,0.3)]">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/60">Paiements</p>
                      <p className="mt-2 text-lg font-semibold">4 reçus</p>
                      <p className="mt-1 text-xs text-white/80">Cette semaine</p>
                      <div className="mt-4 grid gap-2">
                        {["Payé", "À relancer", "En attente"].map((item) => (
                          <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-[11px]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-white/15 bg-white/5 p-4 text-white shadow-[0_16px_36px_rgba(0,0,0,0.3)]">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Suivi client</p>
                    <div className="mt-3 grid gap-2 text-xs text-white/85 md:grid-cols-3">
                      <div className="rounded-lg bg-white/10 px-3 py-2">Email envoyé</div>
                      <div className="rounded-lg bg-white/10 px-3 py-2">Relance planifiée</div>
                      <div className="rounded-lg bg-white/10 px-3 py-2">Paiement reçu</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div className="grid gap-6">
              {[
                {
                  title: "Clients, devis, factures",
                  text: "Tout est centralisé dans un seul espace clair et structuré.",
                  icon: (
                    <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6" />
                    </svg>
                  ),
                },
                {
                  title: "Suivi des paiements",
                  text: "Statuts, relances et encours visibles en un coup d’œil.",
                  icon: (
                    <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="3" y="6" width="18" height="12" rx="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10h4M7 14h6" />
                    </svg>
                  ),
                },
              ].map((card) => (
                <div key={card.title} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
                    {card.icon}
                  </div>
                  <p className="text-base font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[36px] border border-slate-200 bg-white p-10 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Constat</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
                Votre temps est trop précieux pour être perdu dans l’administratif.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                Factures, devis, suivi des clients, documents dispersés, relances, paiements à surveiller&nbsp;: ces
                tâches prennent une place excessive et ralentissent votre activité.
              </p>
              <div className="mt-8">
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Réduire l’administratif
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-20 md:pb-28">
          <div className="mx-auto max-w-6xl rounded-[56px] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-8 py-14 text-white shadow-[0_32px_90px_rgba(2,6,23,0.45)] md:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Clarté opérationnelle</p>
              <h2 className="mt-4 text-3xl font-semibold md:text-4xl">
                Organa centralise clients, devis, factures et suivi des paiements.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-white/80 md:text-lg">
                Vous gardez une vision précise de votre activité et avancez sereinement, avec des données fiables
                à tout moment.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "Documents et clients alignés",
                  text: "Une seule source de vérité pour vos dossiers et vos échanges.",
                },
                {
                  title: "Paiements et relances maîtrisés",
                  text: "Suivez les encours et déclenchez les relances au bon moment.",
                },
              ].map((card) => (
                <div key={card.title} className="rounded-[30px] border border-white/15 bg-white/5 p-7 shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
                  <p className="text-base font-semibold text-white">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">{card.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="#demo"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Planifier une démo
              </Link>
            </div>
          </div>
        </section>

        <section className="px-6 pb-20 md:pb-28">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Vision claire</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
                Des décisions fiables, sans approximation.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                Vous gardez une vue précise de vos documents, de vos paiements et des priorités du moment.
              </p>
              <div className="mt-8">
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-800 hover:border-slate-400 transition-colors"
                >
                  Commencer maintenant
                </Link>
              </div>
              <div className="mt-10 rounded-[34px] border border-slate-200 bg-white p-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Tableau de bord</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    Temps réel
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    { label: "Relances", value: "6 à envoyer" },
                    { label: "Devis", value: "4 en attente" },
                    { label: "Paiements", value: "3 reçus" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-6">
              {[
                {
                  title: "Relances intelligentes",
                  text: "Préparez les relances et suivez leur statut sans tableurs.",
                  icon: (
                    <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5l3 3" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 0-9 9" />
                    </svg>
                  ),
                },
                {
                  title: "Documents cohérents",
                  text: "Logo, coordonnées et informations légales intégrées partout.",
                  icon: (
                    <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
                    </svg>
                  ),
                },
              ].map((card) => (
                <div key={card.title} className="rounded-[30px] border border-slate-200 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
                    {card.icon}
                  </div>
                  <p className="text-base font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-20 md:pb-28">
          <div className="mx-auto max-w-6xl rounded-[40px] border border-slate-200 bg-white px-8 py-10 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-6 text-sm uppercase tracking-[0.2em] text-slate-400">
              <span>Agences</span>
              <span>Cabinets</span>
              <span>Studios</span>
              <span>PME</span>
              <span>Consultants</span>
              <span>Associations</span>
            </div>
          </div>
        </section>

        <section id="demo" className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl rounded-[56px] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-8 py-14 text-center text-white shadow-[0_32px_90px_rgba(2,6,23,0.45)] md:px-12">
            <h2 className="text-3xl font-semibold md:text-4xl">
              Prêt à reprendre le contrôle de votre administratif ?
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/80 md:text-lg">
              Centralisez vos clients, vos documents et vos paiements pour avancer sereinement.
            </p>
            <div className="mt-8">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 transition-colors"
              >
                Essayer gratuitement
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
