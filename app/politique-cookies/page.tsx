"use client";

import Link from "next/link";
import Image from "next/image";

export default function PolitiqueCookiesPage() {
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
              Politique de cookies
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Dernière mise à jour : 6 février 2026.
            </p>

            <div className="mt-10 space-y-10 text-sm leading-relaxed text-slate-600">
              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Vue d&apos;ensemble
                </h2>
                <p className="mt-3">
                  Obillz utilise des cookies strictement nécessaires au
                  fonctionnement du service de gestion pour clubs sportifs.
                  Aucun cookie de suivi publicitaire n'est installé par défaut.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Cookies essentiels
                </h2>
                <p className="mt-3">
                  Ces cookies permettent notamment la connexion sécurisée, la
                  gestion de session et la prévention des usages frauduleux.
                  Ils sont indispensables au bon fonctionnement du service.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Mesure d&apos;audience
                </h2>
                <p className="mt-3">
                  Si des statistiques d'usage basiques sont activées, elles
                  servent uniquement à améliorer le service (performance,
                  stabilité, compréhension des parcours). Ces mesures sont
                  limitées et ne visent pas à vous profiler à des fins
                  publicitaires.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Gestion des cookies
                </h2>
                <p className="mt-3">
                  Vous pouvez gérer ou supprimer les cookies via les paramètres
                  de votre navigateur. Le refus des cookies essentiels peut
                  empêcher l'accès au service ou en dégrader le fonctionnement.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Durée de conservation
                </h2>
                <p className="mt-3">
                  Les cookies essentiels sont conservés pour la durée de la
                  session ou selon une durée limitée afin d'assurer la sécurité
                  et la continuité du service.
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
            <Link href="/conditions-utilisation" className="hover:text-slate-700">
              Conditions d&apos;utilisation
            </Link>
            <Link href="/politique-cookies" className="font-medium text-slate-700">
              Cookies
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
