"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import LandingNav from "@/components/LandingNav";
import { ScrollReveal } from "@/components/ScrollReveal";

// Icônes premium SVG avec couleurs violet
const SecurityIcon = () => (
  <svg className="w-16 h-16 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-2.952M13 10.5h3.75m-3.75 3h3.75m-3.75 3h3.75M9.75 9.75h3.75m-3.75 3h3.75m-3.75 3h3.75M9.75 9.75V6.75m0 3h3.75m-3.75 3v3m0 0h3.75m-3.75 0h3.75" />
  </svg>
);

const ReliabilityIcon = () => (
  <svg className="w-16 h-16 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-16 h-16 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.311-.06m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

export default function Home() {
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* FOND CONTINU - GLOW VIOLET DIFFUS DEPUIS LE BAS CENTRE */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Fond de base - noir profond */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0f] to-[#050510]"></div>
        
        {/* GLOW VIOLET DIFFUS DEPUIS LE BAS CENTRE (comme la référence) */}
        <motion.div 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[1200px] h-[800px] bg-gradient-to-t from-violet-600/20 via-purple-500/15 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        ></motion.div>

        {/* Mesh gradient violet subtil */}
        <motion.div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `
              radial-gradient(at 20% 30%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
              radial-gradient(at 80% 70%, rgba(168, 85, 247, 0.10) 0%, transparent 50%),
              radial-gradient(at 50% 50%, rgba(147, 51, 234, 0.08) 0%, transparent 50%)
            `,
            y: backgroundY,
          }}
        ></motion.div>

        {/* Light rays subtils violet */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-[15%] w-px h-full bg-gradient-to-b from-transparent via-violet-500/6 to-transparent"></div>
          <div className="absolute top-0 right-[25%] w-px h-full bg-gradient-to-b from-transparent via-purple-500/5 to-transparent"></div>
          <div className="absolute top-0 left-[60%] w-px h-full bg-gradient-to-b from-transparent via-violet-400/4 to-transparent"></div>
        </div>

        {/* Glow orbs animés violet */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-1/3 right-1/3 w-[700px] h-[700px] bg-purple-500/4 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        ></motion.div>

        {/* Noise texture subtile */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <LandingNav />
      
      {/* HERO SECTION - STRUCTURE IDENTIQUE À LA RÉFÉRENCE */}
      <section className="relative pt-40 pb-32 md:pt-48 md:pb-40 px-6 min-h-screen flex flex-col justify-center">
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Tag/Pill centré (comme "2025 Explore Our Journey") */}
          <ScrollReveal delay={0}>
            <motion.div 
              className="flex justify-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
                <span className="text-violet-400 font-semibold text-sm">2025</span>
                <span className="text-white/80 text-sm font-medium">Découvrez Organa</span>
              </div>
            </motion.div>
          </ScrollReveal>
          
          {/* TITRE PRINCIPAL - TEXTE VERROUILLÉ */}
          <ScrollReveal delay={100}>
            <motion.h1 
              className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-center mb-12 leading-[1.05] tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <span className="block text-white">Moins d'administratif.</span>
              <span className="block text-white mt-4 md:mt-6">
                Plus de temps pour ce qui compte vraiment.
              </span>
            </motion.h1>
          </ScrollReveal>
          
          {/* Sous-titre centré */}
          <ScrollReveal delay={200}>
            <motion.p 
              className="mt-12 max-w-3xl mx-auto text-center text-lg md:text-xl text-white/70 leading-relaxed font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              Organa automatise la gestion administrative de votre entreprise afin que vous puissiez consacrer plus de temps à vos clients, à votre activité… et à ce qui compte vraiment pour vous.
            </motion.p>
          </ScrollReveal>

          {/* CTA Button centré avec gradient violet */}
          <ScrollReveal delay={300}>
            <motion.div 
              className="mt-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            >
              <Link href="/inscription">
                <motion.div
                  className="inline-block px-10 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-lg relative group overflow-hidden shadow-2xl shadow-violet-500/30"
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(139, 92, 246, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Shine effect */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  ></motion.div>
                  
                  <span className="relative z-10">Découvrir Organa</span>
                </motion.div>
              </Link>
            </motion.div>
          </ScrollReveal>

          {/* Image floutée en bas pour profondeur (comme la référence) */}
          <ScrollReveal delay={400}>
            <motion.div 
              className="mt-24 flex justify-center"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
            >
              <div className="relative w-full max-w-4xl h-64 md:h-80 rounded-2xl overflow-hidden blur-sm opacity-30">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-purple-900/20 to-black/40"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-2xl"></div>
                </div>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION LE PROBLÈME */}
      <section id="probleme" className="relative py-32 md:py-40 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-24 text-white tracking-tight">
              Le problème
            </h2>
          </ScrollReveal>

          <div className="space-y-10 max-w-5xl mx-auto">
            <ScrollReveal delay={0}>
              <motion.div 
                className="p-12 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-500 hover:scale-[1.01] hover:shadow-xl hover:shadow-violet-500/10 group relative overflow-hidden"
                whileHover={{ y: -5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <p className="text-xl md:text-2xl text-center text-white leading-relaxed relative z-10 font-light">
                  Votre temps est trop précieux pour être perdu dans l'administratif. Pourtant, ce sont encore ces tâches qui occupent une place disproportionnée dans votre quotidien.
                </p>
              </motion.div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-8">
              <ScrollReveal delay={150}>
                <motion.div 
                  className="p-10 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-500 hover:scale-[1.01] hover:shadow-xl hover:shadow-violet-500/10 group relative overflow-hidden"
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <p className="text-lg text-gray-300 leading-relaxed relative z-10 font-light">
                    Factures, devis, suivi des clients, documents dispersés, outils qui ne communiquent pas entre eux… L'administratif s'accumule, ralentit votre activité et devient une charge mentale permanente.
                  </p>
                </motion.div>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <motion.div 
                  className="p-10 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-500 hover:scale-[1.01] hover:shadow-xl hover:shadow-violet-500/10 group relative overflow-hidden"
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <p className="text-lg text-gray-300 leading-relaxed relative z-10 font-light">
                    Ce temps perdu a un coût réel : moins de disponibilité pour vos clients, moins d'énergie pour développer votre entreprise, et moins de temps investi là où il crée réellement de la valeur.
                  </p>
                </motion.div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION LA SOLUTION ORGANA */}
      <section id="solution" className="relative py-32 md:py-40 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-24 text-white tracking-tight">
              La solution Organa
            </h2>
          </ScrollReveal>

          <div className="max-w-5xl mx-auto space-y-12">
            <ScrollReveal delay={0}>
              <motion.div 
                className="p-16 rounded-2xl bg-gradient-to-br from-violet-600/15 via-purple-500/10 to-transparent backdrop-blur-xl border-2 border-violet-500/20 hover:border-violet-500/40 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl hover:shadow-violet-500/20 group relative overflow-hidden"
                whileHover={{ y: -8 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <p className="text-2xl md:text-3xl text-center text-white leading-relaxed relative z-10 font-medium">
                  Organa a été conçu pour reprendre le contrôle de votre administratif.
                </p>
              </motion.div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-8">
              <ScrollReveal delay={150}>
                <motion.div 
                  className="p-12 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-500 hover:scale-[1.01] hover:shadow-xl hover:shadow-violet-500/10 group relative overflow-hidden"
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <p className="text-lg text-gray-300 leading-relaxed relative z-10 font-light">
                    La plateforme centralise les éléments essentiels de votre gestion : factures, devis, clients et suivi administratif, au même endroit.
                  </p>
                </motion.div>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <motion.div 
                  className="p-12 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-500 hover:scale-[1.01] hover:shadow-xl hover:shadow-violet-500/10 group relative overflow-hidden"
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <p className="text-lg text-gray-300 leading-relaxed relative z-10 font-light">
                    En simplifiant et en structurant vos tâches administratives, Organa vous permet de gérer plus efficacement votre activité et de vous concentrer sur ce qui fait réellement avancer votre entreprise.
                  </p>
                </motion.div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche" className="relative py-32 md:py-40 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-12 text-white tracking-tight">
              Comment ça marche
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="text-xl md:text-2xl text-center text-white/70 mb-32 max-w-3xl mx-auto font-light">
              Un fonctionnement simple, pensé pour votre gestion quotidienne.
            </p>
          </ScrollReveal>

          <div className="space-y-8">
            {[
              { num: "1", title: "Créez vos clients", text: "Vous commencez par créer vos clients dans Organa. Leurs informations sont automatiquement réutilisées pour vos devis et factures." },
              { num: "2", title: "Créez et envoyez vos devis", text: "À partir d'un client, vous créez un devis en quelques clics. Vous pouvez l'envoyer par e-mail depuis Organa ou le télécharger." },
              { num: "3", title: "Transformez vos devis en factures", text: "Une fois le devis validé, vous le transformez instantanément en facture, sans ressaisie ni perte d'information." },
              { num: "4", title: "Personnalisez vos documents", text: "Vous configurez vos paramètres : logo, en-tête, coordonnées, informations bancaires. Tous vos documents reflètent automatiquement votre identité." },
              { num: "5", title: "Pilotez votre activité depuis le dashboard", text: "Le dashboard vous offre une vue claire sur votre activité : documents en cours, factures payées ou en attente, actions à effectuer." },
              { num: "6", title: "Suivez vos paiements et vos tâches", text: "Vous suivez l'état de vos documents (brouillon, envoyé, validé, payé) et organisez vos tâches grâce au calendrier intégré." },
            ].map((step, index) => (
              <ScrollReveal key={step.num} delay={index * 100}>
                <motion.div 
                  className="flex flex-col md:flex-row items-start gap-12 p-12 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-violet-500/40 hover:bg-white/[0.04] transition-all duration-500 hover:scale-[1.01] hover:shadow-xl hover:shadow-violet-500/10 group"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex-shrink-0 relative">
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-violet-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-violet-500/50 relative border border-violet-400/30">
                      <span className="relative z-10">{step.num}</span>
                      <motion.div 
                        className="absolute inset-0 rounded-xl bg-violet-400 blur-xl opacity-50"
                        animate={{
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      ></motion.div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl md:text-4xl font-semibold mb-4 text-white">{step.title}</h3>
                    <p className="text-gray-300 leading-relaxed text-lg font-light">
                      {step.text}
                    </p>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION POURQUOI FAIRE CONFIANCE */}
      <section id="confiance" className="relative py-32 md:py-40 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-32 text-white tracking-tight">
              Pourquoi faire confiance à Organa
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <ScrollReveal delay={0}>
              <motion.div 
                className="p-12 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-violet-500/40 hover:bg-white/[0.04] transition-all duration-500 hover:scale-[1.03] hover:shadow-xl hover:shadow-violet-500/20 group relative overflow-hidden"
                whileHover={{ y: -8 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="mb-10 relative z-10">
                  <SecurityIcon />
                </div>
                <h3 className="text-xl font-semibold mb-6 text-white relative z-10">Sécurité et confidentialité des données</h3>
                <p className="text-gray-300 leading-relaxed mb-4 relative z-10 font-light text-sm">
                  Vos données sont hébergées sur une infrastructure cloud sécurisée et protégées par des mécanismes d'accès stricts.
                </p>
                <p className="text-gray-400 leading-relaxed mb-4 relative z-10 font-light text-sm">
                  Organa met en œuvre les bonnes pratiques techniques pour garantir la confidentialité et l'intégrité de vos informations, tout en s'appuyant sur des solutions reconnues et fiables.
                </p>
                <p className="text-gray-400 leading-relaxed relative z-10 font-light text-sm">
                  Votre administratif est stocké dans un environnement sécurisé.
                </p>
              </motion.div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <motion.div 
                className="p-12 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-violet-500/40 hover:bg-white/[0.04] transition-all duration-500 hover:scale-[1.03] hover:shadow-xl hover:shadow-violet-500/20 group relative overflow-hidden"
                whileHover={{ y: -8 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="mb-10 relative z-10">
                  <ReliabilityIcon />
                </div>
                <h3 className="text-xl font-semibold mb-6 text-white relative z-10">Une plateforme fiable, accessible quand vous en avez besoin</h3>
                <p className="text-gray-300 leading-relaxed mb-4 relative z-10 font-light text-sm">
                  Organa repose sur une infrastructure robuste, conçue pour être stable et disponible au quotidien.
                </p>
                <p className="text-gray-400 leading-relaxed mb-4 relative z-10 font-light text-sm">
                  Vos outils restent accessibles à tout moment, où que vous soyez, afin que votre gestion ne soit jamais interrompue.
                </p>
                <p className="text-gray-400 leading-relaxed relative z-10 font-light text-sm">
                  Vous travaillez sereinement, sans dépendre d'imprévus techniques.
                </p>
              </motion.div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <motion.div 
                className="p-12 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-violet-500/40 hover:bg-white/[0.04] transition-all duration-500 hover:scale-[1.03] hover:shadow-xl hover:shadow-violet-500/20 group relative overflow-hidden"
                whileHover={{ y: -8 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="mb-10 relative z-10">
                  <TargetIcon />
                </div>
                <h3 className="text-xl font-semibold mb-6 text-white relative z-10">Conçu pour les indépendants et les PME</h3>
                <p className="text-gray-300 leading-relaxed mb-4 relative z-10 font-light text-sm">
                  Organa a été pensé pour répondre aux besoins concrets des petites entreprises et des indépendants.
                </p>
                <p className="text-gray-400 leading-relaxed mb-4 relative z-10 font-light text-sm">
                  Une interface claire, des actions simples, sans complexité inutile ni fonctionnalités superflues.
                </p>
                <p className="text-gray-400 leading-relaxed relative z-10 font-light text-sm">
                  Un outil pensé pour le terrain, pas pour compliquer votre quotidien.
                </p>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION TARIFS */}
      <section id="tarifs" className="relative py-32 md:py-40 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-32 text-white tracking-tight">
              Tarifs
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {/* Plan Gratuit */}
            <ScrollReveal delay={0}>
              <motion.div 
                className="p-12 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-500 hover:scale-[1.02] hover:shadow-xl group relative overflow-hidden"
                whileHover={{ y: -5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="text-2xl font-bold mb-4 text-white relative z-10">Plan Gratuit</h3>
                <p className="text-gray-400 mb-10 relative z-10 font-light">Idéal pour démarrer</p>
                <div className="mb-12 relative z-10">
                  <span className="text-7xl font-bold text-white">0</span>
                  <span className="text-gray-400 ml-3 text-2xl font-light">CHF</span>
                </div>
                <ul className="space-y-4 mb-12 text-gray-300 relative z-10">
                  <li className="flex items-start">
                    <span className="mr-3 text-violet-400 text-xl">•</span>
                    <span className="text-lg font-light">Maximum 2 clients</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-violet-400 text-xl">•</span>
                    <span className="text-lg font-light">Maximum 3 documents par mois</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-violet-400 text-xl">•</span>
                    <span className="text-lg font-light">Toutes les fonctionnalités de base</span>
                  </li>
                </ul>
                <Link href="/inscription">
                  <motion.div
                    className="block w-full text-center px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 hover:border-white/30 transition-all duration-300 relative z-10"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Commencer gratuitement
                  </motion.div>
                </Link>
              </motion.div>
            </ScrollReveal>

            {/* Plan Pro - MIS EN AVANT */}
            <ScrollReveal delay={150}>
              <motion.div 
                className="p-12 rounded-2xl bg-gradient-to-br from-violet-600/20 via-purple-500/15 to-transparent backdrop-blur-xl border-2 border-violet-500/40 hover:border-violet-500/60 transition-all duration-500 hover:scale-[1.05] hover:shadow-2xl hover:shadow-violet-500/30 relative overflow-hidden group"
                whileHover={{ y: -10 }}
              >
                <motion.div 
                  className="absolute top-8 right-8 px-5 py-2 rounded-full bg-violet-500/30 border border-violet-400/40 text-violet-200 text-xs font-bold backdrop-blur-sm"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  POPULAIRE
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="text-2xl font-bold mb-4 text-white relative z-10">Plan Pro</h3>
                <p className="text-gray-300 mb-10 relative z-10 font-light">Accès illimité</p>
                <div className="mb-12 relative z-10">
                  <span className="text-7xl font-bold text-white">29</span>
                  <span className="text-gray-400 ml-3 text-2xl font-light">CHF</span>
                  <span className="text-gray-500 text-base ml-2 font-light">/mois</span>
                </div>
                <ul className="space-y-4 mb-12 text-gray-300 relative z-10">
                  <li className="flex items-start">
                    <span className="mr-3 text-violet-400 text-xl">•</span>
                    <span className="text-lg font-light">Clients illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-violet-400 text-xl">•</span>
                    <span className="text-lg font-light">Documents illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-violet-400 text-xl">•</span>
                    <span className="text-lg font-light">Support prioritaire</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 text-violet-400 text-xl">•</span>
                    <span className="text-lg font-light">Toutes les fonctionnalités</span>
                  </li>
                </ul>
                <Link href="/inscription">
                  <motion.div
                    className="block w-full text-center px-6 py-4 rounded-xl bg-white text-black font-semibold hover:bg-white/95 transition-all duration-300 shadow-xl hover:shadow-2xl relative z-10"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Passer au plan Pro
                  </motion.div>
                </Link>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative py-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center text-gray-500">
          <p className="font-light">© 2026 Organa. Développé en Suisse.</p>
        </div>
      </footer>
    </div>
  );
}
