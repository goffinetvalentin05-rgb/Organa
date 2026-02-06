"use client";

import Link from "next/link";
import Image from "next/image";

export default function PolitiqueConfidentialitePage() {
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
              Politique de confidentialité (RGPD)
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Dernière mise à jour : 6 février 2026.
            </p>

            <div className="mt-10 space-y-10 text-sm leading-relaxed text-slate-600">
              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Responsable du traitement
                </h2>
                <p className="mt-3">
                  Les données personnelles collectées via Obillz sont traitées
                  par la société éditrice du service. Pour toute question
                  relative à la protection des données, vous pouvez nous
                  contacter à{" "}
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
                  Données traitées
                </h2>
                <p className="mt-3">
                  Obillz collecte uniquement les données nécessaires au
                  fonctionnement du service de gestion pour clubs sportifs,
                  notamment : informations de compte (nom, email, identifiants),
                  informations relatives au club (membres, cotisations,
                  événements, finances), ainsi que des données techniques
                  d'accès (logs, sécurité, métriques de performance).
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Finalités
                </h2>
                <p className="mt-3">
                  Les données sont utilisées pour : fournir et opérer le service
                  de gestion de club, gérer les comptes et les abonnements,
                  sécuriser l'accès, assurer la maintenance, améliorer
                  l'expérience utilisateur et répondre aux demandes
                  d'assistance.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Base légale
                </h2>
                <p className="mt-3">
                  Les traitements reposent sur l'exécution du contrat (fourniture
                  du service), le respect d'obligations légales, et l'intérêt
                  légitime à sécuriser et améliorer la plateforme.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Destinataires et sous-traitants
                </h2>
                <p className="mt-3">
                  Les données sont accessibles aux équipes Obillz habilitées et
                  à des prestataires techniques agissant comme sous-traitants
                  (hébergement cloud sécurisé, email transactionnel, support,
                  paiement). Aucun usage publicitaire n'est réalisé et aucun
                  partage à des fins de prospection n'est effectué.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Transferts internationaux
                </h2>
                <p className="mt-3">
                  Obillz privilégie un hébergement en Europe. Si un transfert
                  hors de l'UE devait intervenir, il serait encadré par des
                  garanties appropriées (clauses contractuelles types ou
                  mécanismes équivalents) conformément au RGPD.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Durées de conservation
                </h2>
                <p className="mt-3">
                  Les données sont conservées pendant la durée de la relation
                  contractuelle. Certaines données peuvent être conservées plus
                  longtemps pour répondre à des obligations légales (notamment
                  comptables et fiscales). Les comptes inactifs sont supprimés
                  ou anonymisés après une période raisonnable.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Sécurité
                </h2>
                <p className="mt-3">
                  Obillz met en place des mesures techniques et organisationnelles
                  adaptées afin de protéger les données contre la perte, l'accès
                  non autorisé ou l'altération (contrôles d'accès, chiffrement
                  en transit, sauvegardes).
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Vos droits
                </h2>
                <p className="mt-3">
                  Conformément au RGPD, vous disposez de droits d'accès, de
                  rectification, d'effacement, de limitation, d'opposition et de
                  portabilité. Vous pouvez exercer vos droits en nous contactant
                  à{" "}
                  <a
                    className="font-medium text-[var(--obillz-hero-blue)] hover:underline"
                    href="mailto:contact@obillz.fr"
                  >
                    contact@obillz.fr
                  </a>
                  . Vous pouvez également déposer une réclamation auprès de
                  l'autorité de protection des données compétente (CNIL en
                  France ou autorité locale au sein de l'UE).
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
            <Link href="/politique-confidentialite" className="font-medium text-slate-700">
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
