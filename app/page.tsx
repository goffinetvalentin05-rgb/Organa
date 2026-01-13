"use client";

import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#03062A] via-[#050A3A] to-[#0A1A5E]">
      <LandingNav />
      
      {/* HERO SECTION */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal delay={0}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-center mb-6 leading-tight">
              <span className="block text-white">Moins d'administratif.</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 mt-4">
                Plus de temps pour ce qui compte vraiment.
              </span>
            </h1>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <p className="mt-8 max-w-3xl mx-auto text-center text-lg md:text-xl text-gray-300 leading-relaxed">
              Organa automatise la gestion administrative de votre entreprise afin que vous puissiez consacrer plus de temps à vos clients, à votre activité… et à ce qui compte vraiment pour vous.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-12 text-center">
              <Link
                href="/inscription"
                className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 transform"
              >
                Découvrir Organa
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION LE PROBLÈME */}
      <section id="probleme" className="py-20 md:py-32 px-6 bg-gradient-to-b from-[#0A1A5E] via-[#050A3A] to-[#03062A]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal delay={0}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">
              Le problème
            </h2>
          </ScrollReveal>

          <div className="space-y-8 max-w-4xl mx-auto">
            <ScrollReveal delay={0}>
              <p className="text-xl md:text-2xl text-center text-gray-300 leading-relaxed">
                Votre temps est trop précieux pour être perdu dans l'administratif. Pourtant, ce sont encore ces tâches qui occupent une place disproportionnée dans votre quotidien.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <p className="text-lg md:text-xl text-center text-gray-400 leading-relaxed">
                Factures, devis, suivi des clients, documents dispersés, outils qui ne communiquent pas entre eux… L'administratif s'accumule, ralentit votre activité et devient une charge mentale permanente.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="text-lg md:text-xl text-center text-gray-400 leading-relaxed">
                Ce temps perdu a un coût réel : moins de disponibilité pour vos clients, moins d'énergie pour développer votre entreprise, et moins de temps investi là où il crée réellement de la valeur.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION LA SOLUTION ORGANA */}
      <section id="solution" className="py-20 md:py-32 px-6 bg-gradient-to-b from-[#03062A] via-[#050A3A] to-[#0A1A5E]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal delay={0}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-8 text-white">
              La solution Organa
            </h2>
          </ScrollReveal>

          <div className="space-y-8 max-w-4xl mx-auto">
            <ScrollReveal delay={0}>
              <p className="text-xl md:text-2xl text-center text-gray-300 leading-relaxed">
                Organa a été conçu pour reprendre le contrôle de votre administratif.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <p className="text-lg md:text-xl text-center text-gray-400 leading-relaxed">
                La plateforme centralise les éléments essentiels de votre gestion : factures, devis, clients et suivi administratif, au même endroit.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="text-lg md:text-xl text-center text-gray-400 leading-relaxed">
                En simplifiant et en structurant vos tâches administratives, Organa vous permet de gérer plus efficacement votre activité et de vous concentrer sur ce qui fait réellement avancer votre entreprise.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche" className="py-20 md:py-32 px-6 bg-gradient-to-b from-[#0A1A5E] via-[#050A3A] to-[#03062A]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal delay={0}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-white">
              Comment ça marche
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="text-xl text-center text-gray-300 mb-16 max-w-3xl mx-auto">
              Un fonctionnement simple, pensé pour votre gestion quotidienne.
            </p>
          </ScrollReveal>

          <div className="space-y-12">
            <ScrollReveal delay={0}>
              <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-white">Créez vos clients</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Vous commencez par créer vos clients dans Organa. Leurs informations sont automatiquement réutilisées pour vos devis et factures.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-white">Créez et envoyez vos devis</h3>
                  <p className="text-gray-300 leading-relaxed">
                    À partir d'un client, vous créez un devis en quelques clics. Vous pouvez l'envoyer par e-mail depuis Organa ou le télécharger.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-white">Transformez vos devis en factures</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Une fois le devis validé, vous le transformez instantanément en facture, sans ressaisie ni perte d'information.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-white">Personnalisez vos documents</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Vous configurez vos paramètres : logo, en-tête, coordonnées, informations bancaires. Tous vos documents reflètent automatiquement votre identité.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  5
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-white">Pilotez votre activité depuis le dashboard</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Le dashboard vous offre une vue claire sur votre activité : documents en cours, factures payées ou en attente, actions à effectuer.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={500}>
              <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  6
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-white">Suivez vos paiements et vos tâches</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Vous suivez l'état de vos documents (brouillon, envoyé, validé, payé) et organisez vos tâches grâce au calendrier intégré.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION POURQUOI FAIRE CONFIANCE */}
      <section id="confiance" className="py-20 md:py-32 px-6 bg-gradient-to-b from-[#03062A] via-[#050A3A] to-[#0A1A5E]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal delay={0}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">
              Pourquoi faire confiance à Organa
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <ScrollReveal delay={0}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
                <h3 className="text-xl font-semibold mb-4 text-white">Sécurité et confidentialité des données</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Vos données sont hébergées sur une infrastructure cloud sécurisée et protégées par des mécanismes d'accès stricts.
                </p>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Organa met en œuvre les bonnes pratiques techniques pour garantir la confidentialité et l'intégrité de vos informations, tout en s'appuyant sur des solutions reconnues et fiables.
                </p>
                <p className="text-gray-400 leading-relaxed">
                  Votre administratif est stocké dans un environnement sécurisé.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10">
                <h3 className="text-xl font-semibold mb-4 text-white">Une plateforme fiable, accessible quand vous en avez besoin</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Organa repose sur une infrastructure robuste, conçue pour être stable et disponible au quotidien.
                </p>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Vos outils restent accessibles à tout moment, où que vous soyez, afin que votre gestion ne soit jamais interrompue.
                </p>
                <p className="text-gray-400 leading-relaxed">
                  Vous travaillez sereinement, sans dépendre d'imprévus techniques.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
                <h3 className="text-xl font-semibold mb-4 text-white">Conçu pour les indépendants et les PME</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Organa a été pensé pour répondre aux besoins concrets des petites entreprises et des indépendants.
                </p>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Une interface claire, des actions simples, sans complexité inutile ni fonctionnalités superflues.
                </p>
                <p className="text-gray-400 leading-relaxed">
                  Un outil pensé pour le terrain, pas pour compliquer votre quotidien.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION TARIFS */}
      <section id="tarifs" className="py-20 md:py-32 px-6 bg-gradient-to-b from-[#0A1A5E] via-[#050A3A] to-[#03062A]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal delay={0}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">
              Tarifs
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan Gratuit */}
            <ScrollReveal delay={0}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                <h3 className="text-2xl font-bold mb-2 text-white">Plan Gratuit</h3>
                <p className="text-gray-400 mb-6">Idéal pour démarrer</p>
                <ul className="space-y-3 mb-8 text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Maximum 2 clients</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Maximum 3 documents par mois</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Toutes les fonctionnalités de base</span>
                  </li>
                </ul>
                <Link
                  href="/inscription"
                  className="block w-full text-center px-6 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-all duration-300 hover:scale-105"
                >
                  Découvrir le plan gratuit
                </Link>
              </div>
            </ScrollReveal>

            {/* Plan Pro */}
            <ScrollReveal delay={100}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-transparent backdrop-blur-sm border-2 border-blue-500/40 hover:border-blue-500/60 transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl hover:shadow-blue-500/30 relative overflow-hidden">
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold">
                  POPULAIRE
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">Plan Pro</h3>
                <p className="text-gray-300 mb-6">Accès illimité</p>
                <ul className="space-y-3 mb-8 text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Clients illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Documents illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Support prioritaire</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Toutes les fonctionnalités</span>
                  </li>
                </ul>
                <Link
                  href="/inscription"
                  className="block w-full text-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/50"
                >
                  Passer au plan Pro
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-white/10 bg-gradient-to-b from-[#03062A] to-black">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>© 2026 Organa. Développé en Suisse.</p>
        </div>
      </footer>
    </div>
  );
}
