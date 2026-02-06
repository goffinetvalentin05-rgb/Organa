"use client";

import Link from "next/link";
import Image from "next/image";

export default function MentionsLegalesPage() {
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

          <div className="hidden flex-1 justify-center gap-8 md:flex">
            <Link
              href="/#demo"
              className="text-sm font-medium text-white/90 hover:text-white"
            >
              Démo
            </Link>
          </div>

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
              Mentions légales
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Dernière mise à jour : 6 février 2026.
            </p>

            <div className="mt-10 space-y-10 text-sm leading-relaxed text-slate-600">
              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Éditeur du service
                </h2>
                <p className="mt-3">
                  Obillz est un service SaaS de gestion pour clubs sportifs.
                  Les informations d'identification complètes (raison sociale,
                  adresse du siège et numéro d'enregistrement) sont
                  communiquées sur demande légitime à l'adresse de contact.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Contact
                </h2>
                <p className="mt-3">
                  Email :{" "}
                  <a
                    className="font-medium text-[var(--obillz-hero-blue)] hover:underline"
                    href="mailto:contact@obillz.fr"
                  >
                    contact@obillz.fr
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Hébergement
                </h2>
                <p className="mt-3">
                  Le service est hébergé sur une infrastructure cloud sécurisée,
                  avec des standards élevés de disponibilité et de protection
                  des données, située en Europe.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Propriété intellectuelle
                </h2>
                <p className="mt-3">
                  L'ensemble des contenus, marques, logos, interfaces et éléments
                  visuels liés à Obillz sont protégés par le droit de la
                  propriété intellectuelle. Toute reproduction non autorisée est
                  interdite.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Responsabilité
                </h2>
                <p className="mt-3">
                  Obillz met tout en œuvre pour fournir un service fiable et
                  sécurisé. La responsabilité ne saurait être engagée en cas de
                  perturbation temporaire, d'indisponibilité ou de dommages
                  indirects, sous réserve des dispositions légales impératives
                  applicables.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Signalement d'abus
                </h2>
                <p className="mt-3">
                  Pour signaler un contenu illicite ou un usage abusif du
                  service, veuillez contacter{" "}
                  <a
                    className="font-medium text-[var(--obillz-hero-blue)] hover:underline"
                    href="mailto:contact@obillz.fr"
                  >
                    contact@obillz.fr
                  </a>
                  .
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
            <Link href="/mentions-legales" className="font-medium text-slate-700">
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
