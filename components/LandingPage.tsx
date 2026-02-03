"use client";

import Link from "next/link";

function SectionTitle({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-900 md:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-slate-50/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="text-xl font-semibold text-slate-900">
            Obillz
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/connexion"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="#demo"
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Demander une démo
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* 1. Hero */}
        <section className="px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              Logiciel de gestion pour les clubs sportifs
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Obillz centralise les joueurs, les membres, les cotisations, les
              manifestations, les calendriers, les dépenses, les recettes et la
              communication par e-mail. Tout est dans un seul outil.
            </p>
            <div className="mt-8">
              <Link
                href="#demo"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                Demander une démo
              </Link>
            </div>
          </div>
        </section>

        {/* 2. Ce que permet Obillz */}
        <section className="border-t border-slate-200 bg-white px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-5xl">
            <SectionTitle
              label="Fonctionnalités"
              title="Ce que permet Obillz"
              description="Un seul logiciel pour gérer l’ensemble des activités du club."
            />
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Joueurs et membres dans une base unique",
                "Cotisations créées et envoyées par e-mail",
                "Suivi des paiements (payé / non payé)",
                "Manifestations (matchs, événements, fêtes, tournois)",
                "Calendriers liés à chaque manifestation",
                "Plages horaires et affectation des personnes",
                "E-mail automatique aux personnes assignées (date, heure, lieu, rôle)",
                "Dépenses et recettes enregistrées",
                "Lien dépense ↔ manifestation ou activité",
                "Vue du coût et du revenu par manifestation",
                "Tri des membres et campagnes e-mail",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm text-slate-700"
                >
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. Joueurs & Membres */}
        <section className="border-t border-slate-200 px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <SectionTitle
                  label="Base unique"
                  title="Joueurs & membres"
                  description="Tous les joueurs et membres sont dans une seule base, avec leurs e-mails et numéros de téléphone. Le club dispose d’une liste à jour pour les affectations et la communication."
                />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Exemple
                </p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p>• Fiche par personne : nom, prénom, e-mail, téléphone</p>
                  <p>• Filtres et tri pour retrouver rapidement un membre ou un joueur</p>
                  <p>• Données utilisées pour les cotisations, les plages horaires et les e-mails</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Cotisations */}
        <section className="border-t border-slate-200 bg-white px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div className="order-2 md:order-1 rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  En pratique
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>• Création des cotisations dans l’outil</li>
                  <li>• Envoi des cotisations par e-mail aux membres</li>
                  <li>• Suivi clair : qui a payé, qui n’a pas encore payé</li>
                </ul>
              </div>
              <div className="order-1 md:order-2">
                <SectionTitle
                  label="Suivi des paiements"
                  title="Cotisations"
                  description="Le club peut créer des cotisations, les envoyer par e-mail et suivre qui a payé ou non. Plus besoin de tableaux séparés ou de relances manuelles sans vue d’ensemble."
                />
              </div>
            </div>
          </div>
        </section>

        {/* 5. Manifestations & Calendriers */}
        <section className="border-t border-slate-200 px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-5xl">
            <SectionTitle
              label="Événements"
              title="Manifestations & calendriers"
              description="Chaque manifestation (match, événement, fête, tournoi) est liée à un calendrier. Vous créez des plages horaires et vous assignez joueurs ou bénévoles à une plage précise."
            />
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
              <p className="text-sm font-medium text-slate-900">
                Notification automatique
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Dès qu’une personne est ajoutée à une plage horaire, un e-mail
                automatique lui est envoyé avec les informations : date, heure,
                lieu et rôle. Elle reçoit tout sans relance manuelle.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Dépenses & Recettes */}
        <section className="border-t border-slate-200 bg-white px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <SectionTitle
                  label="Compta & trésorerie"
                  title="Dépenses & recettes"
                  description="Le club enregistre les dépenses et les recettes. Chaque dépense peut être liée à une manifestation ou à une activité précise. Vous voyez clairement ce que chaque manifestation coûte et rapporte."
                />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Résultat
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  Vue par manifestation : coûts et revenus associés. Idéal pour
                  équilibrer les événements et préparer les bilans.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Communication */}
        <section className="border-t border-slate-200 px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-5xl">
            <SectionTitle
              label="E-mail"
              title="Communication"
              description="Les membres sont triables et filtrables. Le club utilise leurs e-mails pour communiquer ou envoyer des campagnes (annonces, rappels, informations) directement depuis Obillz."
            />
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              <p>
                Exemple : envoyer un message à tous les bénévoles, aux joueurs
                d’une équipe, ou à ceux qui n’ont pas encore payé leur
                cotisation. Les coordonnées sont déjà dans la base.
              </p>
            </div>
          </div>
        </section>

        {/* 8. Avantages concrets */}
        <section className="border-t border-slate-200 bg-slate-100/80 px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-5xl">
            <SectionTitle
              label="Bénéfices"
              title="Avantages concrets"
              description="Un outil unique, des données à jour et une vue claire sur les activités et les finances."
            />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="font-medium text-slate-900">Centralisation</p>
                <p className="mt-2 text-sm text-slate-600">
                  Joueurs, membres, cotisations, manifestations, dépenses et
                  recettes dans un seul logiciel. Plus de fichiers éparpillés.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="font-medium text-slate-900">Clarté</p>
                <p className="mt-2 text-sm text-slate-600">
                  Suivi des paiements, coût et revenu par manifestation, et
                  affectations aux plages horaires. Les informations sont
                  structurées et accessibles.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 sm:col-span-2 lg:col-span-1">
                <p className="font-medium text-slate-900">Organisation</p>
                <p className="mt-2 text-sm text-slate-600">
                  Calendriers liés aux manifestations, e-mails automatiques aux
                  personnes assignées, et campagnes ciblées à partir de la base.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 9. CTA final */}
        <section
          id="demo"
          className="border-t border-slate-200 bg-white px-4 py-16 md:px-6 md:py-24"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">
              Demander une démo
            </h2>
            <p className="mt-4 text-slate-600">
              Vous souhaitez voir Obillz en fonctionnement ? Contactez-nous pour
              organiser une démonstration adaptée à votre club.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="mailto:contact@obis.fr?subject=Demande%20de%20d%C3%A9mo%20Obillz"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                Nous contacter
              </a>
              <Link
                href="/inscription"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-3 text-sm font-medium text-slate-700 hover:border-slate-400 transition-colors"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-sm text-slate-500 sm:flex-row sm:justify-between">
          <p>Obillz — Logiciel de gestion pour les clubs sportifs</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/connexion" className="hover:text-slate-700">
              Connexion
            </Link>
            <Link href="#demo" className="hover:text-slate-700">
              Demander une démo
            </Link>
            <Link href="/mentions-legales" className="hover:text-slate-700">
              Mentions légales
            </Link>
            <Link href="/politique-confidentialite" className="hover:text-slate-700">
              Politique de confidentialité
            </Link>
            <Link href="/conditions-utilisation" className="hover:text-slate-700">
              Conditions d&apos;utilisation
            </Link>
            <Link href="/politique-cookies" className="hover:text-slate-700">
              Cookies
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
