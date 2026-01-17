import Link from "next/link";
import LandingNav from "@/components/LandingNav";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <LandingNav />
      <main className="pt-28">
        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[60px] bg-gradient-to-b from-blue-950 via-blue-950 to-indigo-950 shadow-[0_28px_90px_rgba(15,23,42,0.35)]">
            <div className="absolute inset-0 opacity-30" />
            <div className="grid gap-12 px-8 py-12 md:px-14 md:py-16 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="text-white">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/80">
                  Gestion administrative
                </div>
                <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
                  Moins d'administratif.
                  <br />
                  Plus de temps pour ce qui compte.
                </h1>
                <p className="mt-5 text-lg text-white/80">
                  Organisez vos clients, devis et factures dans une plateforme claire. Suivi,
                  documents et relances réunis dans un seul flux.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-7 py-3 text-sm font-semibold text-blue-950 shadow-[0_14px_32px_rgba(34,211,238,0.35)] hover:bg-cyan-300 transition-colors"
                  >
                    Découvrir Organa
                  </Link>
                  <Link
                    href="#tarifs"
                    className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-7 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                  >
                    Tarifs
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-6 top-12 h-64 w-64 rounded-full bg-cyan-500/30 blur-3xl" />
                <div className="absolute -right-10 bottom-4 h-56 w-56 rounded-full bg-indigo-400/30 blur-3xl" />

                <div className="relative grid gap-6">
                  <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 text-white shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-widest text-white/60">Dashboard</p>
                      <span className="rounded-full bg-cyan-400/20 px-2 py-1 text-[10px] text-cyan-100">
                        30 jours
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        { label: "Clients", value: "24" },
                        { label: "Devis", value: "32" },
                        { label: "Factures", value: "48" },
                        { label: "Encours", value: "12.5k CHF" },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-xl bg-white/10 px-3 py-3">
                          <p className="text-[11px] text-white/60">{stat.label}</p>
                          <p className="text-sm font-semibold text-white">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 text-white shadow-[0_16px_36px_rgba(0,0,0,0.3)]">
                      <p className="text-xs uppercase tracking-widest text-white/60">Facture</p>
                      <p className="mt-2 text-lg font-semibold">#1284</p>
                      <p className="mt-1 text-xs text-white/70">Envoyée · 2 450 CHF</p>
                      <div className="mt-4 h-2 w-full rounded-full bg-white/10">
                        <div className="h-2 w-4/5 rounded-full bg-cyan-300" />
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 text-white shadow-[0_16px_36px_rgba(0,0,0,0.3)]">
                      <p className="text-xs uppercase tracking-widest text-white/60">Clients</p>
                      <p className="mt-2 text-lg font-semibold">3 nouveaux</p>
                      <p className="mt-1 text-xs text-white/70">Cette semaine</p>
                      <div className="mt-4 flex gap-2">
                        {["AR", "NL", "MH"].map((item) => (
                          <span
                            key={item}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/15 bg-white/10 p-4 text-white shadow-[0_16px_36px_rgba(0,0,0,0.3)]">
                    <p className="text-xs uppercase tracking-widest text-white/60">Suivi</p>
                    <div className="mt-3 grid gap-2 text-xs text-white/80 md:grid-cols-3">
                      <div className="rounded-lg bg-white/10 px-3 py-2">Devis validé</div>
                      <div className="rounded-lg bg-white/10 px-3 py-2">Facture payée</div>
                      <div className="rounded-lg bg-white/10 px-3 py-2">Relance envoyée</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-t-[40px] bg-slate-50 px-8 py-10 md:px-14">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Fonctionnalités
                </p>
                <h2 className="mt-3 text-3xl md:text-4xl font-semibold text-slate-900">
                  Une gestion structurée, simple et fiable.
                </h2>
                <p className="mt-4 text-base text-slate-600">
                  Des modules clairs pour chaque étape, sans surcharge ni complexité inutile.
                </p>
              </div>
              <div className="mt-10 grid gap-6 md:grid-cols-4">
                {[
                  {
                    title: "Devis rapides",
                    text: "Créer un devis, l’envoyer, puis le convertir en facture.",
                    icon: (
                      <svg className="h-5 w-5 text-cyan-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6" />
                      </svg>
                    ),
                  },
                  {
                    title: "Factures propres",
                    text: "Générer des factures PDF et suivre les paiements.",
                    icon: (
                      <svg className="h-5 w-5 text-cyan-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h6M9 9h6M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1V3z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Clients centralisés",
                    text: "Fiches clients uniques avec historique des documents.",
                    icon: (
                      <svg className="h-5 w-5 text-cyan-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 20v-2a4 4 0 0 0-3-3.87" />
                      </svg>
                    ),
                  },
                  {
                    title: "Suivi clair",
                    text: "Voir payé, en attente ou en retard d’un coup d’œil.",
                    icon: (
                      <svg className="h-5 w-5 text-cyan-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 15l4-4 3 3 5-6" />
                      </svg>
                    ),
                  },
                ].map((card) => (
                  <div key={card.title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 ring-1 ring-cyan-200">
                      {card.icon}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{card.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {[
                  {
                    title: "Relances automatiques",
                    text: "Rappels intégrés pour factures en attente.",
                    icon: (
                      <svg className="h-5 w-5 text-indigo-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 1 0-12 0v4l-2 2h16l-2-2V8z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Documents personnalisés",
                    text: "Logo, entête, coordonnées et IBAN intégrés.",
                    icon: (
                      <svg className="h-5 w-5 text-indigo-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Calendrier intégré",
                    text: "Tâches, échéances et relances au même endroit.",
                    icon: (
                      <svg className="h-5 w-5 text-indigo-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                    ),
                  },
                ].map((card) => (
                  <div key={card.title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 ring-1 ring-indigo-200">
                      {card.icon}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{card.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1fr_1.1fr] items-start">
            <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Process</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold text-slate-900">
                Des étapes nettes, sans frictions.
              </h2>
              <p className="mt-4 text-base text-slate-600">
                Chaque action est pensée pour avancer vite et rester aligné avec vos clients.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {[
                { title: "Clients", text: "Fiche client unique, réutilisée sur chaque document." },
                { title: "Devis", text: "Créer, envoyer, puis valider sans double saisie." },
                { title: "Factures", text: "Générer la facture et suivre le paiement." },
                { title: "Identité", text: "Logo, entête et coordonnées intégrés." },
                { title: "Dashboard", text: "Voir immédiatement payé, en attente ou en retard." },
                { title: "Suivi", text: "Tâches, relances et échéances centralisées." },
              ].map((card, index) => (
                <div key={card.title} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-950 text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                      <p className="mt-2 text-sm text-slate-600">{card.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-16 md:pb-24">
          <div className="mx-auto max-w-6xl rounded-[44px] border border-slate-200 bg-white p-8 shadow-[0_18px_46px_rgba(15,23,42,0.06)] md:p-10">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Bénéfices</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold text-slate-900">
                Des gains concrets, visibles dès la première semaine.
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Temps gagné",
                  text: "Moins de ressaisies et de relances manuelles.",
                },
                {
                  title: "Suivi fiable",
                  text: "Encours, paiements et retards visibles immédiatement.",
                },
                {
                  title: "Documents cohérents",
                  text: "Même structure, même identité, à chaque envoi.",
                },
              ].map((card) => (
                <div key={card.title} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 ring-1 ring-cyan-200">
                    <svg className="h-5 w-5 text-cyan-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-16 md:pb-24">
          <div className="mx-auto max-w-6xl rounded-[44px] border border-slate-200 bg-white p-8 shadow-[0_18px_46px_rgba(15,23,42,0.06)] md:p-10">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">FAQ</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold text-slate-900">
                Réponses rapides aux questions clés.
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {[
                {
                  question: "À qui s’adresse Organa ?",
                  answer: "Aux indépendants et PME qui veulent structurer leur administratif.",
                },
                {
                  question: "Puis-je commencer gratuitement ?",
                  answer: "Oui, un plan gratuit permet de tester les bases du produit.",
                },
                {
                  question: "Mes données sont-elles sécurisées ?",
                  answer: "Oui, elles sont hébergées sur une infrastructure cloud sécurisée.",
                },
                {
                  question: "Est-ce adapté aux PME ?",
                  answer: "Oui, Organa est conçu pour des équipes petites à moyennes.",
                },
              ].map((item) => (
                <div key={item.question} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm font-semibold text-slate-900">{item.question}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tarifs" className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-5xl rounded-[44px] border border-slate-200 bg-white p-8 md:p-10">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Tarifs</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold text-slate-900">
                Des plans clairs, sans surcharge.
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-8 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                <p className="text-lg font-semibold text-slate-900">Plan Gratuit</p>
                <p className="mt-2 text-sm text-slate-600">Idéal pour démarrer.</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li>2 clients maximum</li>
                  <li>3 documents par mois</li>
                  <li>Fonctionnalités essentielles</li>
                </ul>
              </div>
              <div className="rounded-[32px] border border-cyan-200 bg-white p-8 shadow-[0_20px_48px_rgba(15,23,42,0.12)]">
                <p className="text-lg font-semibold text-slate-900">Plan Pro</p>
                <p className="mt-2 text-sm text-slate-600">Accès illimité.</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li>Clients illimités</li>
                  <li>Documents illimités</li>
                  <li>Support prioritaire</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl rounded-[52px] border border-slate-200 bg-gradient-to-br from-cyan-500 via-cyan-500 to-teal-400 px-8 py-12 text-center shadow-[0_28px_80px_rgba(14,116,144,0.25)] md:px-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-white">
              Prêt à structurer votre gestion ?
            </h2>
            <p className="mt-4 text-base text-white/80">
              Passez à une organisation claire et des documents maîtrisés.
            </p>
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
