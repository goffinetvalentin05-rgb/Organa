"use client";

import Link from "next/link";
import Image from "next/image";

export default function ConditionsUtilisationPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar Obillz */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-md"
        style={{ backgroundColor: "var(--obillz-hero-blue)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 md:px-6">
          <Link
            href="/"
            className="relative flex items-center transition-opacity hover:opacity-90"
            aria-label="Obillz - Accueil"
          >
            <Image
              src="/logo-obillz.png"
              alt="Obillz"
              width={140}
              height={40}
              className="h-9 w-auto object-contain object-left md:h-10"
              priority
            />
          </Link>

          <div className="flex-1" />

          <Link
            href="/connexion"
            className="rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Connexion
          </Link>
        </div>
      </nav>

      {/* Contenu */}
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-12">
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Conditions d&apos;utilisation
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Dernière mise à jour : 6 février 2026.
            </p>

            <div className="mt-10 space-y-10 text-sm leading-relaxed text-slate-600">
              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Objet
                </h2>
                <p className="mt-3">
                  Les présentes conditions régissent l'accès et l'utilisation du
                  service Obillz, destiné aux clubs sportifs pour la gestion de
                  leurs membres, cotisations, événements, plannings et finances.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Création de compte
                </h2>
                <p className="mt-3">
                  L'utilisateur est responsable de l'exactitude des informations
                  fournies, de la confidentialité de ses identifiants et de toute
                  activité effectuée via son compte.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Utilisation acceptable
                </h2>
                <p className="mt-3">
                  L'utilisateur s'engage à utiliser Obillz de manière conforme
                  aux lois applicables, sans tentative d'accès non autorisé, de
                  perturbation du service ou d'usage frauduleux.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Abonnements et paiements
                </h2>
                <p className="mt-3">
                  Certains plans sont payants. Les tarifs, modalités de paiement
                  et conditions de facturation sont indiqués lors de la
                  souscription. En cas de non-paiement, l'accès au service peut
                  être suspendu après notification raisonnable.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Données et confidentialité
                </h2>
                <p className="mt-3">
                  Les données saisies par l'utilisateur (informations du club,
                  membres, cotisations, etc.) restent sa propriété. Obillz
                  traite ces données uniquement pour fournir le service,
                  conformément à la politique de confidentialité.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Propriété intellectuelle
                </h2>
                <p className="mt-3">
                  Obillz et ses contenus (logiciel, interfaces, logos, éléments
                  graphiques) sont protégés. L'utilisateur ne bénéficie d'aucun
                  droit de propriété autre qu'un droit d'usage limité au cadre
                  du service.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Disponibilité et support
                </h2>
                <p className="mt-3">
                  Obillz vise une haute disponibilité, sans garantie d'absence
                  d'interruption. Le support est fourni par email à{" "}
                  <a
                    className="font-medium text-[var(--obillz-hero-blue)] hover:underline"
                    href="mailto:contact@obillz.fr"
                  >
                    contact@obillz.fr
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Responsabilité
                </h2>
                <p className="mt-3">
                  Obillz ne peut être tenu responsable des dommages indirects
                  (perte de données non sauvegardées, interruption d'activité),
                  sous réserve des limitations prévues par la loi. La
                  responsabilité pour faute intentionnelle ou négligence grave
                  n'est pas exclue.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Résiliation
                </h2>
                <p className="mt-3">
                  L'utilisateur peut résilier son compte à tout moment. Obillz
                  peut résilier en cas de violation manifeste des conditions,
                  avec notification préalable dans la mesure du possible.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Droit applicable
                </h2>
                <p className="mt-3">
                  Les présentes conditions sont régies par le droit français.
                  Sous réserve des règles impératives applicables, les tribunaux
                  compétents du siège de l'éditeur sont seuls compétents.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Obillz */}
      <footer className="border-t border-slate-200 bg-white px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-sm text-slate-500 sm:flex-row sm:justify-between">
          <p>Obillz — Logiciel de gestion pour les clubs sportifs</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/connexion" className="hover:text-slate-700">
              Connexion
            </Link>
            <Link href="/#demo" className="hover:text-slate-700">
              Demander une démo
            </Link>
            <Link href="/mentions-legales" className="hover:text-slate-700">
              Mentions légales
            </Link>
            <Link href="/politique-confidentialite" className="hover:text-slate-700">
              Politique de confidentialité
            </Link>
            <Link href="/conditions-utilisation" className="font-medium text-slate-700">
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
