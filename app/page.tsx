"use client";

import Link from "next/link";
import Image from "next/image";
import LandingNav from "@/components/LandingNav";
import { ScrollReveal } from "@/components/ScrollReveal";

// Icônes premium SVG
const SecurityIcon = () => (
  <svg className="w-14 h-14 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-2.952M13 10.5h3.75m-3.75 3h3.75m-3.75 3h3.75M9.75 9.75h3.75m-3.75 3h3.75m-3.75 3h3.75M9.75 9.75V6.75m0 3h3.75m-3.75 3v3m0 0h3.75m-3.75 0h3.75" />
  </svg>
);

const ReliabilityIcon = () => (
  <svg className="w-14 h-14 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-14 h-14 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.311-.06m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050B1E] via-[#070F2B] to-[#0A1A3A] relative overflow-hidden">
      {/* Effets visuels premium - Particules et light beams */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Particules/stars comme dans Sync */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.15), transparent),
                           radial-gradient(2px 2px at 60% 70%, rgba(255,255,255,0.1), transparent),
                           radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.2), transparent),
                           radial-gradient(1px 1px at 80% 10%, rgba(255,255,255,0.15), transparent),
                           radial-gradient(2px 2px at 90% 60%, rgba(255,255,255,0.1), transparent),
                           radial-gradient(1px 1px at 33% 85%, rgba(255,255,255,0.1), transparent),
                           radial-gradient(2px 2px at 10% 40%, rgba(255,255,255,0.1), transparent)`,
          backgroundSize: '200% 200%',
        }}></div>
        
        {/* Light beams subtils */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/8 to-transparent"></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-blue-400/6 to-transparent"></div>
        <div className="absolute top-0 left-2/3 w-px h-full bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"></div>
        
        {/* Glow orbs subtils et animés */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-blue-400/2 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-600/2 rounded-full blur-3xl"></div>
        
        {/* Glow depuis le bas droit (comme Sync) */}
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-blue-500/4 rounded-full blur-3xl"></div>
      </div>

      <LandingNav />
      
      {/* HERO SECTION */}
      <section className="relative pt-64 pb-48 md:pt-72 md:pb-56 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <div className="flex justify-center mb-24">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/15 rounded-full blur-3xl group-hover:bg-blue-500/25 transition-all duration-700 scale-150"></div>
                <div className="relative w-40 h-40 md:w-48 md:h-48">
                  <Image
                    src="/organa-logo.png"
                    alt="Organa Logo"
                    width={192}
                    height={192}
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <h1 className="text-8xl md:text-9xl lg:text-[10rem] font-bold text-center mb-16 leading-[1.05] tracking-tight">
              <span className="block text-white drop-shadow-2xl">Moins d'administratif.</span>
              <span className="block text-white/95 mt-10 drop-shadow-2xl">
                Plus de temps pour ce qui compte vraiment.
              </span>
            </h1>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <p className="mt-20 max-w-4xl mx-auto text-center text-2xl md:text-3xl text-gray-300 leading-relaxed font-light">
              Organa automatise la gestion administrative de votre entreprise afin que vous puissiez consacrer plus de temps à vos clients, à votre activité… et à ce qui compte vraiment pour vous.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="mt-24 text-center">
              <Link
                href="/inscription"
                className="inline-block px-16 py-6 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 text-white font-semibold text-xl hover:from-blue-400 hover:via-blue-500 hover:to-blue-400 transition-all duration-500 hover:scale-[1.03] shadow-2xl hover:shadow-blue-500/40 relative group overflow-hidden"
              >
                <span className="relative z-10">Découvrir Organa</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="absolute inset-0 bg-blue-400/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION LE PROBLÈME - Layout premium avec glassmorphism */}
      <section id="probleme" className="relative py-40 md:py-48 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-7xl md:text-8xl font-bold text-center mb-32 text-white tracking-tight">
              Le problème
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <ScrollReveal delay={0}>
              <div className="p-12 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.06] transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <p className="text-2xl md:text-3xl text-center text-white leading-relaxed relative z-10 font-light">
                  Votre temps est trop précieux pour être perdu dans l'administratif. Pourtant, ce sont encore ces tâches qui occupent une place disproportionnée dans votre quotidien.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="p-12 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.06] transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 group relative overflow-hidden md:mt-16">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <p className="text-lg md:text-xl text-center text-gray-300 leading-relaxed relative z-10 font-light">
                  Factures, devis, suivi des clients, documents dispersés, outils qui ne communiquent pas entre eux… L'administratif s'accumule, ralentit votre activité et devient une charge mentale permanente.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="p-12 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.06] transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <p className="text-lg md:text-xl text-center text-gray-300 leading-relaxed relative z-10 font-light">
                  Ce temps perdu a un coût réel : moins de disponibilité pour vos clients, moins d'énergie pour développer votre entreprise, et moins de temps investi là où il crée réellement de la valeur.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION LA SOLUTION ORGANA */}
      <section id="solution" className="relative py-40 md:py-48 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-7xl md:text-8xl font-bold text-center mb-32 text-white tracking-tight">
              La solution Organa
            </h2>
          </ScrollReveal>

          <div className="max-w-5xl mx-auto space-y-12">
            <ScrollReveal delay={0}>
              <div className="p-16 rounded-3xl bg-gradient-to-br from-blue-600/15 via-blue-500/8 to-transparent backdrop-blur-2xl border-2 border-blue-500/20 hover:border-blue-500/40 transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/20 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <p className="text-3xl md:text-4xl text-center text-white leading-relaxed relative z-10 font-medium">
                  Organa a été conçu pour reprendre le contrôle de votre administratif.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-8">
              <ScrollReveal delay={150}>
                <div className="p-14 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.06] transition-all duration-700 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/8 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <p className="text-lg md:text-xl text-center text-gray-300 leading-relaxed relative z-10 font-light">
                    La plateforme centralise les éléments essentiels de votre gestion : factures, devis, clients et suivi administratif, au même endroit.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <div className="p-14 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.06] transition-all duration-700 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/8 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <p className="text-lg md:text-xl text-center text-gray-300 leading-relaxed relative z-10 font-light">
                    En simplifiant et en structurant vos tâches administratives, Organa vous permet de gérer plus efficacement votre activité et de vous concentrer sur ce qui fait réellement avancer votre entreprise.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche" className="relative py-40 md:py-48 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-7xl md:text-8xl font-bold text-center mb-12 text-white tracking-tight">
              Comment ça marche
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="text-2xl md:text-3xl text-center text-gray-300 mb-32 max-w-3xl mx-auto font-light">
              Un fonctionnement simple, pensé pour votre gestion quotidienne.
            </p>
          </ScrollReveal>

          <div className="space-y-8">
            <ScrollReveal delay={0}>
              <div className="flex flex-col md:flex-row items-start gap-14 p-14 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 group">
                <div className="flex-shrink-0 relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-blue-500/50 relative">
                    <span className="relative z-10">1</span>
                    <div className="absolute inset-0 rounded-full bg-blue-400 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400/30"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-4xl md:text-5xl font-semibold mb-6 text-white">Créez vos clients</h3>
                  <p className="text-gray-300 leading-relaxed text-xl font-light">
                    Vous commencez par créer vos clients dans Organa. Leurs informations sont automatiquement réutilisées pour vos devis et factures.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="flex flex-col md:flex-row items-start gap-14 p-14 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 group">
                <div className="flex-shrink-0 relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-blue-500/50 relative">
                    <span className="relative z-10">2</span>
                    <div className="absolute inset-0 rounded-full bg-blue-400 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400/30"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-4xl md:text-5xl font-semibold mb-6 text-white">Créez et envoyez vos devis</h3>
                  <p className="text-gray-300 leading-relaxed text-xl font-light">
                    À partir d'un client, vous créez un devis en quelques clics. Vous pouvez l'envoyer par e-mail depuis Organa ou le télécharger.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="flex flex-col md:flex-row items-start gap-14 p-14 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 group">
                <div className="flex-shrink-0 relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-blue-500/50 relative">
                    <span className="relative z-10">3</span>
                    <div className="absolute inset-0 rounded-full bg-blue-400 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400/30"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-4xl md:text-5xl font-semibold mb-6 text-white">Transformez vos devis en factures</h3>
                  <p className="text-gray-300 leading-relaxed text-xl font-light">
                    Une fois le devis validé, vous le transformez instantanément en facture, sans ressaisie ni perte d'information.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="flex flex-col md:flex-row items-start gap-14 p-14 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 group">
                <div className="flex-shrink-0 relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-blue-500/50 relative">
                    <span className="relative z-10">4</span>
                    <div className="absolute inset-0 rounded-full bg-blue-400 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400/30"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-4xl md:text-5xl font-semibold mb-6 text-white">Personnalisez vos documents</h3>
                  <p className="text-gray-300 leading-relaxed text-xl font-light">
                    Vous configurez vos paramètres : logo, en-tête, coordonnées, informations bancaires. Tous vos documents reflètent automatiquement votre identité.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="flex flex-col md:flex-row items-start gap-14 p-14 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 group">
                <div className="flex-shrink-0 relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-blue-500/50 relative">
                    <span className="relative z-10">5</span>
                    <div className="absolute inset-0 rounded-full bg-blue-400 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400/30"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-4xl md:text-5xl font-semibold mb-6 text-white">Pilotez votre activité depuis le dashboard</h3>
                  <p className="text-gray-300 leading-relaxed text-xl font-light">
                    Le dashboard vous offre une vue claire sur votre activité : documents en cours, factures payées ou en attente, actions à effectuer.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={500}>
              <div className="flex flex-col md:flex-row items-start gap-14 p-14 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl hover:shadow-blue-500/10 group">
                <div className="flex-shrink-0 relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-blue-500/50 relative">
                    <span className="relative z-10">6</span>
                    <div className="absolute inset-0 rounded-full bg-blue-400 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400/30"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-4xl md:text-5xl font-semibold mb-6 text-white">Suivez vos paiements et vos tâches</h3>
                  <p className="text-gray-300 leading-relaxed text-xl font-light">
                    Vous suivez l'état de vos documents (brouillon, envoyé, validé, payé) et organisez vos tâches grâce au calendrier intégré.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION POURQUOI FAIRE CONFIANCE */}
      <section id="confiance" className="relative py-40 md:py-48 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-7xl md:text-8xl font-bold text-center mb-32 text-white tracking-tight">
              Pourquoi faire confiance à Organa
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <ScrollReveal delay={0}>
              <div className="p-14 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all duration-700 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/20 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="mb-10 relative z-10">
                  <SecurityIcon />
                </div>
                <h3 className="text-xl font-semibold mb-8 text-white relative z-10">Sécurité et confidentialité des données</h3>
                <p className="text-gray-300 leading-relaxed mb-5 relative z-10 font-light">
                  Vos données sont hébergées sur une infrastructure cloud sécurisée et protégées par des mécanismes d'accès stricts.
                </p>
                <p className="text-gray-400 leading-relaxed mb-5 relative z-10 font-light">
                  Organa met en œuvre les bonnes pratiques techniques pour garantir la confidentialité et l'intégrité de vos informations, tout en s'appuyant sur des solutions reconnues et fiables.
                </p>
                <p className="text-gray-400 leading-relaxed relative z-10 font-light">
                  Votre administratif est stocké dans un environnement sécurisé.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="p-14 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all duration-700 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/20 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="mb-10 relative z-10">
                  <ReliabilityIcon />
                </div>
                <h3 className="text-xl font-semibold mb-8 text-white relative z-10">Une plateforme fiable, accessible quand vous en avez besoin</h3>
                <p className="text-gray-300 leading-relaxed mb-5 relative z-10 font-light">
                  Organa repose sur une infrastructure robuste, conçue pour être stable et disponible au quotidien.
                </p>
                <p className="text-gray-400 leading-relaxed mb-5 relative z-10 font-light">
                  Vos outils restent accessibles à tout moment, où que vous soyez, afin que votre gestion ne soit jamais interrompue.
                </p>
                <p className="text-gray-400 leading-relaxed relative z-10 font-light">
                  Vous travaillez sereinement, sans dépendre d'imprévus techniques.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="p-14 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all duration-700 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/20 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="mb-10 relative z-10">
                  <TargetIcon />
                </div>
                <h3 className="text-xl font-semibold mb-8 text-white relative z-10">Conçu pour les indépendants et les PME</h3>
                <p className="text-gray-300 leading-relaxed mb-5 relative z-10 font-light">
                  Organa a été pensé pour répondre aux besoins concrets des petites entreprises et des indépendants.
                </p>
                <p className="text-gray-400 leading-relaxed mb-5 relative z-10 font-light">
                  Une interface claire, des actions simples, sans complexité inutile ni fonctionnalités superflues.
                </p>
                <p className="text-gray-400 leading-relaxed relative z-10 font-light">
                  Un outil pensé pour le terrain, pas pour compliquer votre quotidien.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION TARIFS */}
      <section id="tarifs" className="relative py-40 md:py-48 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-7xl md:text-8xl font-bold text-center mb-32 text-white tracking-tight">
              Tarifs
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {/* Plan Gratuit */}
            <ScrollReveal delay={0}>
              <div className="p-14 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-white/30 hover:bg-white/[0.06] transition-all duration-700 hover:scale-[1.02] hover:shadow-xl group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/8 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <h3 className="text-3xl font-bold mb-5 text-white relative z-10">Plan Gratuit</h3>
                <p className="text-gray-400 mb-12 relative z-10 font-light">Idéal pour démarrer</p>
                <div className="mb-14 relative z-10">
                  <span className="text-8xl font-bold text-white">0</span>
                  <span className="text-gray-400 ml-4 text-3xl font-light">CHF</span>
                </div>
                <ul className="space-y-5 mb-14 text-gray-300 relative z-10">
                  <li className="flex items-start">
                    <span className="mr-4 text-blue-400 text-2xl">•</span>
                    <span className="text-xl font-light">Maximum 2 clients</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-4 text-blue-400 text-2xl">•</span>
                    <span className="text-xl font-light">Maximum 3 documents par mois</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-4 text-blue-400 text-2xl">•</span>
                    <span className="text-xl font-light">Toutes les fonctionnalités de base</span>
                  </li>
                </ul>
                <Link
                  href="/inscription"
                  className="block w-full text-center px-6 py-5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105 relative z-10"
                >
                  Commencer gratuitement
                </Link>
              </div>
            </ScrollReveal>

            {/* Plan Pro */}
            <ScrollReveal delay={150}>
              <div className="p-14 rounded-3xl bg-gradient-to-br from-blue-600/20 via-blue-500/12 to-transparent backdrop-blur-2xl border-2 border-blue-500/40 hover:border-blue-500/60 transition-all duration-700 hover:scale-[1.05] hover:shadow-2xl hover:shadow-blue-500/30 relative overflow-hidden group">
                <div className="absolute top-10 right-10 px-5 py-2.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200 text-sm font-bold backdrop-blur-sm">
                  POPULAIRE
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <h3 className="text-3xl font-bold mb-5 text-white relative z-10">Plan Pro</h3>
                <p className="text-gray-300 mb-12 relative z-10 font-light">Accès illimité</p>
                <div className="mb-14 relative z-10">
                  <span className="text-8xl font-bold text-white">29</span>
                  <span className="text-gray-400 ml-4 text-3xl font-light">CHF</span>
                  <span className="text-gray-500 text-lg ml-3 font-light">/mois</span>
                </div>
                <ul className="space-y-5 mb-14 text-gray-300 relative z-10">
                  <li className="flex items-start">
                    <span className="mr-4 text-blue-400 text-2xl">•</span>
                    <span className="text-xl font-light">Clients illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-4 text-blue-400 text-2xl">•</span>
                    <span className="text-xl font-light">Documents illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-4 text-blue-400 text-2xl">•</span>
                    <span className="text-xl font-light">Support prioritaire</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-4 text-blue-400 text-2xl">•</span>
                    <span className="text-xl font-light">Toutes les fonctionnalités</span>
                  </li>
                </ul>
                <Link
                  href="/inscription"
                  className="block w-full text-center px-6 py-5 rounded-xl bg-white text-[#050B1E] font-semibold hover:bg-white/95 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl relative z-10"
                >
                  Passer au plan Pro
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative py-20 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p className="font-light text-lg">© 2026 Organa. Développé en Suisse.</p>
        </div>
      </footer>
    </div>
  );
}
