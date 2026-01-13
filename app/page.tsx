"use client";

import Link from "next/link";
import Image from "next/image";
import LandingNav from "@/components/LandingNav";
import { ScrollReveal } from "@/components/ScrollReveal";

// Icônes premium SVG
const SecurityIcon = () => (
  <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ReliabilityIcon = () => (
  <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#03062A] via-[#050A3A] to-[#0A1A5E] relative overflow-hidden">
      {/* Effets visuels AI subtils - fond */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/3 rounded-full blur-3xl"></div>
      </div>

      {/* Lignes abstraites */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <line x1="0" y1="20%" x2="100%" y2="25%" stroke="url(#lineGradient)" strokeWidth="1" />
          <line x1="0" y1="60%" x2="100%" y2="65%" stroke="url(#lineGradient)" strokeWidth="1" />
          <line x1="0" y1="80%" x2="100%" y2="85%" stroke="url(#lineGradient)" strokeWidth="1" />
        </svg>
      </div>

      <LandingNav />
      
      {/* HERO SECTION */}
      <section className="relative pt-48 pb-32 md:pt-56 md:pb-40 px-6">
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <div className="flex justify-center mb-16">
              <div className="relative w-32 h-32 md:w-40 md:h-40 group">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all duration-500"></div>
                <div className="relative">
                  <Image
                    src="/organa-logo.png"
                    alt="Organa Logo"
                    width={160}
                    height={160}
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-center mb-12 leading-[1.1] tracking-tight">
              <span className="block text-white drop-shadow-lg">Moins d'administratif.</span>
              <span className="block text-white/95 mt-6 drop-shadow-lg">
                Plus de temps pour ce qui compte vraiment.
              </span>
            </h1>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <p className="mt-12 max-w-3xl mx-auto text-center text-xl md:text-2xl text-gray-300 leading-relaxed">
              Organa automatise la gestion administrative de votre entreprise afin que vous puissiez consacrer plus de temps à vos clients, à votre activité… et à ce qui compte vraiment pour vous.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="mt-16 text-center">
              <Link
                href="/inscription"
                className="inline-block px-12 py-5 rounded-lg bg-white text-[#03062A] font-semibold text-lg hover:bg-white/95 transition-all duration-300 hover:scale-[1.03] shadow-2xl hover:shadow-blue-500/20 hover:shadow-2xl relative group"
              >
                <span className="relative z-10">Découvrir Organa</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION LE PROBLÈME - Layout différencié */}
      <section id="probleme" className="relative py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-5xl md:text-6xl font-bold text-center mb-20 text-white">
              Le problème
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <ScrollReveal delay={0}>
              <div className="p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-md border border-white/15 hover:border-blue-500/40 hover:from-white/12 hover:to-white/5 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/10 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <p className="text-xl text-center text-white leading-relaxed relative z-10">
                  Votre temps est trop précieux pour être perdu dans l'administratif. Pourtant, ce sont encore ces tâches qui occupent une place disproportionnée dans votre quotidien.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-md border border-white/15 hover:border-blue-500/40 hover:from-white/12 hover:to-white/5 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/10 group relative overflow-hidden md:mt-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <p className="text-lg text-center text-gray-300 leading-relaxed relative z-10">
                  Factures, devis, suivi des clients, documents dispersés, outils qui ne communiquent pas entre eux… L'administratif s'accumule, ralentit votre activité et devient une charge mentale permanente.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-md border border-white/15 hover:border-blue-500/40 hover:from-white/12 hover:to-white/5 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/10 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <p className="text-lg text-center text-gray-300 leading-relaxed relative z-10">
                  Ce temps perdu a un coût réel : moins de disponibilité pour vos clients, moins d'énergie pour développer votre entreprise, et moins de temps investi là où il crée réellement de la valeur.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION LA SOLUTION ORGANA - Layout différencié */}
      <section id="solution" className="relative py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-5xl md:text-6xl font-bold text-center mb-20 text-white">
              La solution Organa
            </h2>
          </ScrollReveal>

          <div className="max-w-4xl mx-auto space-y-8">
            <ScrollReveal delay={0}>
              <div className="p-12 rounded-2xl bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-transparent backdrop-blur-md border-2 border-blue-500/30 hover:border-blue-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <p className="text-2xl md:text-3xl text-center text-white leading-relaxed relative z-10 font-semibold">
                  Organa a été conçu pour reprendre le contrôle de votre administratif.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-6">
              <ScrollReveal delay={100}>
                <div className="p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-md border border-white/15 hover:border-blue-500/30 hover:from-white/12 hover:to-white/5 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
                  <p className="text-lg text-center text-gray-300 leading-relaxed">
                    La plateforme centralise les éléments essentiels de votre gestion : factures, devis, clients et suivi administratif, au même endroit.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <div className="p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-md border border-white/15 hover:border-blue-500/30 hover:from-white/12 hover:to-white/5 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
                  <p className="text-lg text-center text-gray-300 leading-relaxed">
                    En simplifiant et en structurant vos tâches administratives, Organa vous permet de gérer plus efficacement votre activité et de vous concentrer sur ce qui fait réellement avancer votre entreprise.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION COMMENT ÇA MARCHE - Numéros style néon */}
      <section id="comment-ca-marche" className="relative py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-5xl md:text-6xl font-bold text-center mb-6 text-white">
              Comment ça marche
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="text-xl md:text-2xl text-center text-gray-300 mb-20 max-w-3xl mx-auto">
              Un fonctionnement simple, pensé pour votre gestion quotidienne.
            </p>
          </ScrollReveal>

          <div className="space-y-6">
            <ScrollReveal delay={0}>
              <div className="flex flex-col md:flex-row items-start gap-10 p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-md border border-white/15 hover:border-blue-500/40 hover:from-white/12 hover:to-white/5 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 group">
                <div className="flex-shrink-0 relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/50 relative">
                    <span className="relative z-10">1</span>
                    <div className="absolute inset-0 rounded-full bg-blue-400 blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-white">Créez vos clients</h3>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    Vous commencez par créer vos clients dans Organa. Leurs informations sont automatiquement réutilisées pour vos devis et factures.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="flex flex-col md:flex-row items-start gap-10 p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-md border border-white/15 hover:border-blue-500/40 hover:from-white/12 hover:to-white/5 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 group">
                <div className="flex-shrink-0 relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/50 relative">
                    <span className="relative z-10">2</span>
                    <div className="absolute inset-0 rounded-full bg-blue-400 blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-white">Créez et envoyez vos devis</h3>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    À partir d'un client, vous créez un devis en quelques clics. Vous pouvez l'envoyer par e-mail depuis Organa ou le télécharger.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="flex flex-col md:flex-row items-start gap-10 p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-md border border-white/15 hover:border-blue-500/40 hover:from-white/12 hover:to-white/5 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 group">
                <div className="flex-shrink-0 relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/50 relative">
                    <span className="relative z-10">3</span>
                    <div className="absolute inset-0 rounded-full bg-blue-400 blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-white">Transformez vos devis en factures</h3>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    Une fois le devis validé, vous le transformez instantanément en facture, sans ressaisie ni perte d'information.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="flex flex-col md:flex-row items-start gap-10 p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-md border border-white/15 hover:border-blue-500/40 hover:from-white/12 hover:to-white/5 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 group">
                <div className="flex-shrink-0 relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/50 relative">
                    <span className="relative z-10">4</span>
                    <div className="absolute inset-0 rounded-full bg-blue-400 blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-white">Personnalisez vos documents</h3>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    Vous configurez vos paramètres : logo, en-tête, coordonnées, informations bancaires. Tous vos documents reflètent automatiquement votre identité.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="flex flex-col md:flex-row items-start gap-10 p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-md border border-white/15 hover:border-blue-500/40 hover:from-white/12 hover:to-white/5 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 group">
                <div className="flex-shrink-0 relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/50 relative">
                    <span className="relative z-10">5</span>
                    <div className="absolute inset-0 rounded-full bg-blue-400 blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-white">Pilotez votre activité depuis le dashboard</h3>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    Le dashboard vous offre une vue claire sur votre activité : documents en cours, factures payées ou en attente, actions à effectuer.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={500}>
              <div className="flex flex-col md:flex-row items-start gap-10 p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-md border border-white/15 hover:border-blue-500/40 hover:from-white/12 hover:to-white/5 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 group">
                <div className="flex-shrink-0 relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/50 relative">
                    <span className="relative z-10">6</span>
                    <div className="absolute inset-0 rounded-full bg-blue-400 blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-white">Suivez vos paiements et vos tâches</h3>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    Vous suivez l'état de vos documents (brouillon, envoyé, validé, payé) et organisez vos tâches grâce au calendrier intégré.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION POURQUOI FAIRE CONFIANCE */}
      <section id="confiance" className="relative py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-5xl md:text-6xl font-bold text-center mb-20 text-white">
              Pourquoi faire confiance à Organa
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <ScrollReveal delay={0}>
              <div className="p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-md border border-white/15 hover:border-blue-500/40 hover:from-white/12 hover:to-white/5 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/20 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="mb-8 relative z-10">
                  <SecurityIcon />
                </div>
                <h3 className="text-xl font-semibold mb-6 text-white relative z-10">Sécurité et confidentialité des données</h3>
                <p className="text-gray-300 leading-relaxed mb-4 relative z-10">
                  Vos données sont hébergées sur une infrastructure cloud sécurisée et protégées par des mécanismes d'accès stricts.
                </p>
                <p className="text-gray-400 leading-relaxed mb-4 relative z-10">
                  Organa met en œuvre les bonnes pratiques techniques pour garantir la confidentialité et l'intégrité de vos informations, tout en s'appuyant sur des solutions reconnues et fiables.
                </p>
                <p className="text-gray-400 leading-relaxed relative z-10">
                  Votre administratif est stocké dans un environnement sécurisé.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-md border border-white/15 hover:border-blue-500/40 hover:from-white/12 hover:to-white/5 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/20 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="mb-8 relative z-10">
                  <ReliabilityIcon />
                </div>
                <h3 className="text-xl font-semibold mb-6 text-white relative z-10">Une plateforme fiable, accessible quand vous en avez besoin</h3>
                <p className="text-gray-300 leading-relaxed mb-4 relative z-10">
                  Organa repose sur une infrastructure robuste, conçue pour être stable et disponible au quotidien.
                </p>
                <p className="text-gray-400 leading-relaxed mb-4 relative z-10">
                  Vos outils restent accessibles à tout moment, où que vous soyez, afin que votre gestion ne soit jamais interrompue.
                </p>
                <p className="text-gray-400 leading-relaxed relative z-10">
                  Vous travaillez sereinement, sans dépendre d'imprévus techniques.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-md border border-white/15 hover:border-blue-500/40 hover:from-white/12 hover:to-white/5 transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/20 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="mb-8 relative z-10">
                  <TargetIcon />
                </div>
                <h3 className="text-xl font-semibold mb-6 text-white relative z-10">Conçu pour les indépendants et les PME</h3>
                <p className="text-gray-300 leading-relaxed mb-4 relative z-10">
                  Organa a été pensé pour répondre aux besoins concrets des petites entreprises et des indépendants.
                </p>
                <p className="text-gray-400 leading-relaxed mb-4 relative z-10">
                  Une interface claire, des actions simples, sans complexité inutile ni fonctionnalités superflues.
                </p>
                <p className="text-gray-400 leading-relaxed relative z-10">
                  Un outil pensé pour le terrain, pas pour compliquer votre quotidien.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION TARIFS */}
      <section id="tarifs" className="relative py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-5xl md:text-6xl font-bold text-center mb-20 text-white">
              Tarifs
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan Gratuit */}
            <ScrollReveal delay={0}>
              <div className="p-10 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-md border border-white/15 hover:border-white/30 hover:from-white/12 hover:to-white/5 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl">
                <h3 className="text-2xl font-bold mb-3 text-white">Plan Gratuit</h3>
                <p className="text-gray-400 mb-8">Idéal pour démarrer</p>
                <div className="mb-10">
                  <span className="text-6xl font-bold text-white">0</span>
                  <span className="text-gray-400 ml-3 text-xl">CHF</span>
                </div>
                <ul className="space-y-4 mb-10 text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-3 text-blue-400 text-xl">•</span>
                    <span className="text-lg">Maximum 2 clients</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-blue-400 text-xl">•</span>
                    <span className="text-lg">Maximum 3 documents par mois</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-blue-400 text-xl">•</span>
                    <span className="text-lg">Toutes les fonctionnalités de base</span>
                  </li>
                </ul>
                <Link
                  href="/inscription"
                  className="block w-full text-center px-6 py-4 rounded-lg bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
                >
                  Commencer gratuitement
                </Link>
              </div>
            </ScrollReveal>

            {/* Plan Pro */}
            <ScrollReveal delay={100}>
              <div className="p-10 rounded-2xl bg-gradient-to-br from-blue-600/25 via-blue-500/15 to-transparent backdrop-blur-md border-2 border-blue-500/50 hover:border-blue-500/70 transition-all duration-500 hover:scale-[1.05] hover:shadow-2xl hover:shadow-blue-500/30 relative overflow-hidden group">
                <div className="absolute top-6 right-6 px-4 py-2 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200 text-sm font-bold backdrop-blur-sm">
                  POPULAIRE
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="text-2xl font-bold mb-3 text-white relative z-10">Plan Pro</h3>
                <p className="text-gray-300 mb-8 relative z-10">Accès illimité</p>
                <div className="mb-10 relative z-10">
                  <span className="text-6xl font-bold text-white">29</span>
                  <span className="text-gray-400 ml-3 text-xl">CHF</span>
                  <span className="text-gray-500 text-base ml-2">/mois</span>
                </div>
                <ul className="space-y-4 mb-10 text-gray-300 relative z-10">
                  <li className="flex items-start">
                    <span className="mr-3 text-blue-400 text-xl">•</span>
                    <span className="text-lg">Clients illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-blue-400 text-xl">•</span>
                    <span className="text-lg">Documents illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-blue-400 text-xl">•</span>
                    <span className="text-lg">Support prioritaire</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-blue-400 text-xl">•</span>
                    <span className="text-lg">Toutes les fonctionnalités</span>
                  </li>
                </ul>
                <Link
                  href="/inscription"
                  className="block w-full text-center px-6 py-4 rounded-lg bg-white text-[#03062A] font-semibold hover:bg-white/95 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl relative z-10"
                >
                  Passer au plan Pro
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>© 2026 Organa. Développé en Suisse.</p>
        </div>
      </footer>
    </div>
  );
}
