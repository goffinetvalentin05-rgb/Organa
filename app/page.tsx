import Link from "next/link";
import LandingNav from "@/components/LandingNav";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <LandingNav />
      <main className="pt-28">
        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[60px] bg-gradient-to-br from-cyan-500 via-teal-500 to-sky-500 shadow-[0_28px_90px_rgba(14,116,144,0.35)]">
            <div className="grid gap-12 px-8 py-12 md:px-14 md:py-16 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="text-white">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/85">
                  Gestion administrative B2B
                </div>
                <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
                  Pilotez clients, devis et factures
                  <br />
                  depuis un seul espace.
                </h1>
                <p className="mt-5 text-lg text-white/85">
                  Organa centralise vos actions clés pour garder un suivi clair des documents et des paiements.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-cyan-900 shadow-[0_14px_32px_rgba(255,255,255,0.25)] hover:bg-cyan-50 transition-colors"
                  >
                    Commencer
                  </Link>
                  <Link
                    href="#demo"
                    className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-7 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                  >
                    Voir la démo
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-6 top-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
                <div className="absolute -right-10 bottom-6 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
                <div className="relative grid gap-6">
                  <div className="rounded-[28px] border border-white/20 bg-white/10 p-5 text-white shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-widest text-white/70">Vue d'ensemble</p>
                      <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] text-white/90">
                        Semaine
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
                          <p className="text-[11px] text-white/70">{stat.label}</p>
                          <p className="text-sm font-semibold text-white">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] border border-white/20 bg-white/10 p-4 text-white shadow-[0_16px_36px_rgba(0,0,0,0.25)]">
                      <p className="text-xs uppercase tracking-widest text-white/70">Devis</p>
                      <p className="mt-2 text-lg font-semibold">#2041</p>
                      <p className="mt-1 text-xs text-white/80">Validé · 3 200 CHF</p>
                      <div className="mt-4 h-2 w-full rounded-full bg-white/15">
                        <div className="h-2 w-3/4 rounded-full bg-white" />
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-white/20 bg-white/10 p-4 text-white shadow-[0_16px_36px_rgba(0,0,0,0.25)]">
                      <p className="text-xs uppercase tracking-widest text-white/70">Paiements</p>
                      <p className="mt-2 text-lg font-semibold">4 reçus</p>
                      <p className="mt-1 text-xs text-white/80">Cette semaine</p>
                      <div className="mt-4 grid gap-2">
                        {["Payé", "À relancer", "En attente"].map((item) => (
                          <span key={item} className="rounded-full bg-white/15 px-3 py-1 text-[11px]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-white/20 bg-white/10 p-4 text-white shadow-[0_16px_36px_rgba(0,0,0,0.25)]">
                    <p className="text-xs uppercase tracking-widest text-white/70">Suivi client</p>
                    <div className="mt-3 grid gap-2 text-xs text-white/85 md:grid-cols-3">
                      <div className="rounded-lg bg-white/15 px-3 py-2">Email envoyé</div>
                      <div className="rounded-lg bg-white/15 px-3 py-2">Relance planifiée</div>
                      <div className="rounded-lg bg-white/15 px-3 py-2">Paiement reçu</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div className="grid gap-4">
              {[
                {
                  title: "Clients centralisés",
                  text: "Une fiche unique pour chaque client, réutilisée partout.",
                  icon: (
                    <svg className="h-5 w-5 text-cyan-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                    </svg>
                  ),
                },
                {
                  title: "Devis et factures",
                  text: "Création rapide, envoi direct et conversion sans ressaisie.",
                  icon: (
                    <svg className="h-5 w-5 text-cyan-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6" />
                    </svg>
                  ),
                },
                {
                  title: "Paiements suivis",
                  text: "Statut clair des paiements et relances activables.",
                  icon: (
                    <svg className="h-5 w-5 text-cyan-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="3" y="6" width="18" height="12" rx="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10h4M7 14h6" />
                    </svg>
                  ),
                },
              ].map((card) => (
                <div key={card.title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 ring-1 ring-cyan-200">
                    {card.icon}
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Pourquoi Organa</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">
                Une base claire pour vos flux administratifs.
              </h2>
              <p className="mt-4 text-base text-slate-600">
                Chaque étape est structurée pour éviter les oublis et garder une vision nette des dossiers.
              </p>
              <div className="mt-6">
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Explorer les fonctionnalités
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-16 md:pb-24">
          <div className="mx-auto max-w-6xl rounded-[52px] bg-gradient-to-br from-cyan-500 via-teal-500 to-sky-500 px-8 py-12 text-white shadow-[0_28px_80px_rgba(14,116,144,0.3)] md:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Suite administrative</p>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">
                Des outils puissants pour les équipes multi-activités.
              </h2>
              <p className="mt-4 text-base text-white/85">
                Coordonnez les accès, centralisez les documents et suivez les paiements sans friction.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Accès par rôles",
                  text: "Invitez votre équipe et contrôlez ce que chacun peut voir.",
                },
                {
                  title: "Dossiers partagés",
                  text: "Clients, devis et factures accessibles au bon moment.",
                },
                {
                  title: "Paiements sécurisés",
                  text: "Statuts fiables et relances déclenchées en un clic.",
                },
              ].map((card) => (
                <div key={card.title} className="rounded-[28px] border border-white/20 bg-white/10 p-6 shadow-[0_14px_30px_rgba(15,23,42,0.2)]">
                  <p className="text-sm font-semibold text-white">{card.title}</p>
                  <p className="mt-2 text-sm text-white/85">{card.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="#demo"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-cyan-900 hover:bg-cyan-50 transition-colors"
              >
                Planifier une démo
              </Link>
            </div>
          </div>
        </section>

        <section className="px-6 pb-16 md:pb-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Pilotage</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">
                Des décisions rapides avec un suivi net.
              </h2>
              <p className="mt-4 text-base text-slate-600">
                Repérez immédiatement les encours, les factures à relancer et les clients prioritaires.
              </p>
              <div className="mt-6">
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 hover:border-slate-400 transition-colors"
                >
                  Commencer maintenant
                </Link>
              </div>
              <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Vue 360°</p>
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
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
                      <p className="text-xs text-slate-500">{item.label}</p>
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
                    <svg className="h-5 w-5 text-cyan-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5l3 3" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 0-9 9" />
                    </svg>
                  ),
                },
                {
                  title: "Documents cohérents",
                  text: "Logo, coordonnées et informations légales intégrées partout.",
                  icon: (
                    <svg className="h-5 w-5 text-cyan-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
                    </svg>
                  ),
                },
              ].map((card) => (
                <div key={card.title} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 ring-1 ring-cyan-200">
                    {card.icon}
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-16 md:pb-24">
          <div className="mx-auto max-w-6xl rounded-[36px] border border-slate-200 bg-white px-6 py-8 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-6 text-sm uppercase tracking-widest text-slate-400">
              <span>Agences</span>
              <span>Cabinets</span>
              <span>Studios</span>
              <span>PME</span>
              <span>Consultants</span>
              <span>Associations</span>
            </div>
          </div>
        </section>

        <section id="demo" className="px-6 py-16 md:py-24">
          <div className="mx-auto max-w-6xl rounded-[52px] bg-gradient-to-br from-cyan-500 via-teal-500 to-sky-500 px-8 py-12 text-center text-white shadow-[0_28px_80px_rgba(14,116,144,0.25)] md:px-12">
            <h2 className="text-3xl font-semibold md:text-4xl">
              Prêt à simplifier votre gestion administrative ?
            </h2>
            <p className="mt-4 text-base text-white/85">
              Lancez Organa et gardez vos clients, documents et paiements alignés.
            </p>
            <div className="mt-6">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-cyan-900 shadow-sm hover:bg-cyan-50 transition-colors"
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
