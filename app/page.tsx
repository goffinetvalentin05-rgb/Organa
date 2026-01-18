import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import SiteFooter from "@/components/SiteFooter";
import FaqAccordion from "@/components/FaqAccordion";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LandingNav />
      <main className="pt-32">
        <section className="px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[64px] bg-premium-gradient shadow-[0_36px_110px_rgba(2,6,23,0.45)]">
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
                    href="#comment-ca-marche"
                    className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-8 py-3 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
                  >
                    Comment ça marche
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

        <section className="px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div className="grid gap-6">
              {[
                {
                  title: "Documents dispersés",
                  text: "Factures, devis, suivi des clients et documents éparpillés.",
                  icon: (
                    <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6" />
                    </svg>
                  ),
                },
                {
                  title: "Outils isolés",
                  text: "Des outils qui ne communiquent pas entre eux et un suivi difficile.",
                  icon: (
                    <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="3" y="6" width="18" height="12" rx="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10h4M7 14h6" />
                    </svg>
                  ),
                },
                {
                  title: "Charge mentale",
                  text: "L’administratif s’accumule et ralentit l’activité au quotidien.",
                  icon: (
                    <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5l3 3" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 0-9 9" />
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
            <div className="rounded-[36px] border border-slate-200 bg-white p-11 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Le problème</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
                Votre temps est trop précieux pour être perdu dans l’administratif.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                Factures, devis, suivi des clients, documents dispersés, outils qui ne communiquent pas entre
                eux… l’administratif s’accumule, ralentit votre activité et devient une charge mentale permanente.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                Ce temps perdu a un coût réel&nbsp;: moins de disponibilité pour vos clients, moins d’énergie pour
                développer votre entreprise, et moins de temps investi là où il crée réellement de la valeur.
              </p>
              <div className="mt-8">
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  Découvrir Organa
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="comment-ca-marche" className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[56px] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-8 py-14 text-white shadow-[0_32px_90px_rgba(2,6,23,0.45)] md:px-12">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">La solution Organa</p>
              <h2 className="mt-4 text-3xl font-semibold md:text-4xl">
                Centraliser l’essentiel de votre activité, au même endroit.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-white/80 md:text-lg">
                Organa a été conçu pour centraliser les éléments essentiels de votre activité&nbsp;: factures,
                devis, clients, suivi administratif et gestion des tâches, au même endroit.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "Organisation claire",
                  text: "Un seul espace pour rassembler les documents et le suivi administratif.",
                },
                {
                  title: "Vision précise",
                  text: "Une vue fiable de l’activité pour avancer sereinement.",
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
                href="/inscription"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Découvrir Organa
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Comment ça marche</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
                Un fonctionnement simple, pensé pour votre gestion quotidienne.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                En simplifiant et en structurant vos tâches administratives, ainsi que leur suivi dans le temps,
                Organa vous permet de gérer plus efficacement votre activité.
              </p>
              <div className="mt-8">
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-semibold text-slate-800 hover:border-slate-400 transition-colors"
                >
                  Découvrir Organa
                </Link>
              </div>
              <div className="mt-10 rounded-[34px] border border-slate-200 bg-white p-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Étapes clés</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    Temps réel
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    { label: "1", value: "Créez vos clients" },
                    { label: "2", value: "Créez et envoyez vos devis" },
                    { label: "3", value: "Transformez vos devis en factures" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    { label: "4", value: "Personnalisez vos documents" },
                    { label: "5", value: "Pilotez votre activité depuis le dashboard" },
                    { label: "6", value: "Suivez vos paiements, vos tâches et votre planning" },
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
                  title: "Devis et factures",
                  text: "Créez des devis, envoyez-les, puis transformez-les en factures.",
                  icon: (
                    <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 17h6" />
                    </svg>
                  ),
                },
                {
                  title: "Tâches et échéances",
                  text: "Associez des tâches à vos devis ou factures et suivez-les dans le temps.",
                  icon: (
                    <svg className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5l3 3" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 0-9 9" />
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

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[40px] border border-slate-200 bg-white px-8 py-10 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Gestion des tâches & calendrier
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
                Suivre les actions dans le temps, simplement.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
                Organa ne se limite pas à la création de documents. Chaque devis, facture ou client peut être
                associé à des tâches et à des échéances. Grâce au calendrier intégré, vous pouvez planifier vos
                rendez-vous, organiser vos relances et garder une vue claire sur ce qui doit être fait, aujourd’hui
                comme demain.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[40px] border border-slate-200 bg-white px-8 py-10 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Pourquoi Organa</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
                Pourquoi les entreprises font confiance à Organa
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Sécurité & données",
                  text: "Hébergement fiable, confidentialité respectée et accès sécurisé aux informations.",
                },
                {
                  title: "Gain de temps & clarté",
                  text: "Centralisation des documents et visibilité immédiate sur ce qui est envoyé ou payé.",
                },
                {
                  title: "Organisation & suivi",
                  text: "Suivi des documents, paiements, tâches et calendrier pour une gestion structurée.",
                },
              ].map((card) => (
                <div key={card.title} className="rounded-[28px] border border-slate-200 bg-slate-50 p-7">
                  <p className="text-base font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[40px] border border-slate-200 bg-white px-8 py-10 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Avis utilisateurs</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
                Retours concrets sur l’usage réel.
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {[
                {
                  text: "Je gère mes devis et factures dans Organa, et je vois tout de suite ce qui est envoyé, payé ou à relancer. Le suivi est devenu plus clair.",
                  author: "Camille — Indépendante",
                },
                {
                  text: "On a enfin un seul endroit pour les clients, les documents et le suivi des paiements. Tout est centralisé.",
                  author: "Marc — PME",
                },
                {
                  text: "Les tâches liées aux devis et factures sont simples à suivre, et le calendrier nous aide à organiser les échéances.",
                  author: "Julie — Cabinet",
                },
                {
                  text: "Le dashboard nous donne une vue d’ensemble fiable. On sait ce qui est validé, payé, en attente ou à relancer.",
                  author: "Nadia — Petite entreprise",
                },
              ].map((item) => (
                <div key={item.author} className="rounded-[28px] border border-slate-200 bg-slate-50 p-7">
                  <p className="text-base leading-relaxed text-slate-800">“{item.text}”</p>
                  <p className="mt-5 text-sm font-semibold text-slate-600">{item.author}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[40px] border border-slate-200 bg-white px-8 py-10 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">FAQ</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
                Réponses aux questions principales.
              </h2>
            </div>
            <div className="mt-10">
              <FaqAccordion
                items={[
                  {
                    question: "À qui s’adresse Organa ?",
                    answer:
                      "Aux indépendants et aux PME qui veulent une gestion claire, structurée et simple à suivre.",
                  },
                  {
                    question: "Y a-t-il une version gratuite ?",
                    answer: "Oui, Organa propose un plan gratuit pour démarrer.",
                  },
                  {
                    question: "Mes données sont-elles sécurisées ?",
                    answer: "Oui, la sécurité et la confidentialité des données sont prioritaires.",
                  },
                  {
                    question: "Est-ce simple à prendre en main ?",
                    answer:
                      "Oui, l’outil est conçu pour être clair, sans fonctionnalités superflues.",
                  },
                ]}
              />
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-7xl rounded-[40px] border border-slate-200 bg-white px-8 py-10 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tarifs</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
                Plan Gratuit et Plan Pro.
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-7">
                <p className="text-base font-semibold text-slate-900">Plan Gratuit</p>
                <p className="mt-2 text-sm text-slate-600">
                  Pour démarrer et centraliser vos documents essentiels.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  <li>Clients, devis et factures au même endroit</li>
                  <li>Suivi des paiements et des statuts</li>
                  <li>Gestion simple des tâches</li>
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
              <div className="relative rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                <span className="absolute -top-3 right-6 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  Recommandé
                </span>
                <p className="text-base font-semibold text-slate-900">Plan Pro</p>
                <p className="mt-2 text-sm text-slate-600">
                  Pour piloter l’administratif avec un suivi complet.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  <li>Devis, factures et documents personnalisés</li>
                  <li>Suivi des paiements et relances</li>
                  <li>Gestion des tâches et calendrier intégré</li>
                </ul>
                <div className="mt-6">
                  <Link
                    href="/inscription"
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    Découvrir le plan Pro
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-7xl rounded-[56px] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-8 py-14 text-center text-white shadow-[0_32px_90px_rgba(2,6,23,0.45)] md:px-12">
            <h2 className="text-3xl font-semibold md:text-4xl">
              Prêt à réduire votre charge administrative ?
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/80 md:text-lg">
              Découvrez Organa et concentrez-vous sur ce qui compte vraiment.
            </p>
            <div className="mt-8">
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 transition-colors"
              >
                Découvrir Organa
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
