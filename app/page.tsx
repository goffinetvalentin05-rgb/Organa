"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import LandingNav from "@/components/LandingNav";
import { ScrollReveal } from "@/components/ScrollReveal";

// Icônes premium SVG redessinées
const SecurityIcon = () => (
  <svg className="w-16 h-16 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-2.952M13 10.5h3.75m-3.75 3h3.75m-3.75 3h3.75M9.75 9.75h3.75m-3.75 3h3.75m-3.75 3h3.75M9.75 9.75V6.75m0 3h3.75m-3.75 3v3m0 0h3.75m-3.75 0h3.75" />
  </svg>
);

const ReliabilityIcon = () => (
  <svg className="w-16 h-16 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-16 h-16 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.311-.06m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

export default function Home() {
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

  return (
    <div className="min-h-screen bg-[#020418] relative overflow-hidden">
      {/* FOND CONTINU PREMIUM - UN SEUL FOND SUR TOUTE LA PAGE */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Gradient de base - bleu nuit très profond */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020418] via-[#03062A] to-[#050A3A]"></div>
        
        {/* Mesh gradient animé */}
        <motion.div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(at 20% 30%, rgba(37, 99, 235, 0.15) 0%, transparent 50%),
              radial-gradient(at 80% 70%, rgba(59, 130, 246, 0.12) 0%, transparent 50%),
              radial-gradient(at 50% 50%, rgba(96, 165, 250, 0.08) 0%, transparent 50%)
            `,
            y: backgroundY,
          }}
        ></motion.div>

        {/* Light rays subtils */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-[15%] w-px h-full bg-gradient-to-b from-transparent via-cyan-500/8 to-transparent"></div>
          <div className="absolute top-0 right-[25%] w-px h-full bg-gradient-to-b from-transparent via-blue-500/6 to-transparent"></div>
          <div className="absolute top-0 left-[60%] w-px h-full bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent"></div>
        </div>

        {/* Glow orbs animés et subtils */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-blue-500/4 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[900px] h-[900px] bg-cyan-500/3 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        ></motion.div>
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-600/2 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        ></motion.div>

        {/* Noise texture subtile */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <LandingNav />
      
      {/* HERO SECTION - IMMERSIF ET CINÉMATIQUE */}
      <section className="relative pt-80 pb-64 md:pt-96 md:pb-80 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Logo Organa GRAND et centré */}
          <ScrollReveal delay={0}>
            <motion.div 
              className="flex justify-center mb-20"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="relative group">
                <motion.div 
                  className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                ></motion.div>
                <div className="relative w-48 h-48 md:w-56 md:h-56">
                  <Image
                    src="/organa-logo.png"
                    alt="Organa Logo"
                    width={224}
                    height={224}
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </ScrollReveal>
          
          {/* Titre principal TRÈS LARGE et RESPIRANT */}
          <ScrollReveal delay={100}>
            <motion.h1 
              className="text-7xl md:text-8xl lg:text-[11rem] xl:text-[12rem] font-bold text-center mb-20 leading-[0.95] tracking-tighter"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            >
              <span className="block text-white drop-shadow-2xl">Moins d'administratif.</span>
              <span className="block text-white/90 mt-8 md:mt-12 drop-shadow-2xl">
                Plus de temps pour ce qui compte vraiment.
              </span>
            </motion.h1>
          </ScrollReveal>
          
          {/* Sous-titre DISCRET et bien espacé */}
          <ScrollReveal delay={200}>
            <motion.p 
              className="mt-24 max-w-4xl mx-auto text-center text-xl md:text-2xl text-gray-400 leading-relaxed font-light"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            >
              Organa automatise la gestion administrative de votre entreprise afin que vous puissiez consacrer plus de temps à vos clients, à votre activité… et à ce qui compte vraiment pour vous.
            </motion.p>
          </ScrollReveal>

          {/* CTA PREMIUM avec glow et micro animations */}
          <ScrollReveal delay={300}>
            <motion.div 
              className="mt-32 text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            >
              <Link href="/inscription">
                <motion.div
                  className="inline-block px-20 py-7 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 text-white font-semibold text-xl relative group overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Glow effect */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 blur-2xl opacity-0 group-hover:opacity-60"
                    animate={{
                      opacity: [0, 0.3, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  ></motion.div>
                  
                  {/* Shine effect */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  ></motion.div>
                  
                  <span className="relative z-10">Découvrir Organa</span>
                </motion.div>
              </Link>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION LE PROBLÈME - STORYTELLING VISUEL */}
      <section id="probleme" className="relative py-48 md:py-56 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-center mb-40 text-white tracking-tighter">
              Le problème
            </h2>
          </ScrollReveal>

          {/* Layout asymétrique et décalé */}
          <div className="space-y-12 max-w-6xl mx-auto">
            <ScrollReveal delay={0}>
              <motion.div 
                className="p-16 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl hover:shadow-cyan-500/10 group relative overflow-hidden"
                whileHover={{ y: -5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/6 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <p className="text-2xl md:text-3xl text-center text-white leading-relaxed relative z-10 font-light">
                  Votre temps est trop précieux pour être perdu dans l'administratif. Pourtant, ce sont encore ces tâches qui occupent une place disproportionnée dans votre quotidien.
                </p>
              </motion.div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              <ScrollReveal delay={150}>
                <motion.div 
                  className="p-14 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl hover:shadow-cyan-500/10 group relative overflow-hidden md:mt-20"
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute top-0 right-0 w-56 h-56 bg-cyan-500/6 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <p className="text-lg md:text-xl text-gray-300 leading-relaxed relative z-10 font-light">
                    Factures, devis, suivi des clients, documents dispersés, outils qui ne communiquent pas entre eux… L'administratif s'accumule, ralentit votre activité et devient une charge mentale permanente.
                  </p>
                </motion.div>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <motion.div 
                  className="p-14 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl hover:shadow-cyan-500/10 group relative overflow-hidden"
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute top-0 right-0 w-56 h-56 bg-cyan-500/6 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <p className="text-lg md:text-xl text-gray-300 leading-relaxed relative z-10 font-light">
                    Ce temps perdu a un coût réel : moins de disponibilité pour vos clients, moins d'énergie pour développer votre entreprise, et moins de temps investi là où il crée réellement de la valeur.
                  </p>
                </motion.div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION LA SOLUTION ORGANA - MISE EN SCÈNE MARKETING */}
      <section id="solution" className="relative py-48 md:py-56 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-center mb-40 text-white tracking-tighter">
              La solution Organa
            </h2>
          </ScrollReveal>

          <div className="max-w-5xl mx-auto space-y-16">
            {/* Carte principale mise en avant */}
            <ScrollReveal delay={0}>
              <motion.div 
                className="p-20 rounded-3xl bg-gradient-to-br from-cyan-600/15 via-blue-500/10 to-transparent backdrop-blur-2xl border-2 border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl hover:shadow-cyan-500/20 group relative overflow-hidden"
                whileHover={{ y: -8 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <p className="text-3xl md:text-4xl text-center text-white leading-relaxed relative z-10 font-medium">
                  Organa a été conçu pour reprendre le contrôle de votre administratif.
                </p>
              </motion.div>
            </ScrollReveal>

            {/* Deux colonnes décalées */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              <ScrollReveal delay={150}>
                <motion.div 
                  className="p-16 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all duration-700 hover:scale-[1.01] hover:shadow-xl hover:shadow-cyan-500/10 group relative overflow-hidden"
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/6 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <p className="text-lg md:text-xl text-gray-300 leading-relaxed relative z-10 font-light">
                    La plateforme centralise les éléments essentiels de votre gestion : factures, devis, clients et suivi administratif, au même endroit.
                  </p>
                </motion.div>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <motion.div 
                  className="p-16 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all duration-700 hover:scale-[1.01] hover:shadow-xl hover:shadow-cyan-500/10 group relative overflow-hidden md:mt-16"
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/6 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <p className="text-lg md:text-xl text-gray-300 leading-relaxed relative z-10 font-light">
                    En simplifiant et en structurant vos tâches administratives, Organa vous permet de gérer plus efficacement votre activité et de vous concentrer sur ce qui fait réellement avancer votre entreprise.
                  </p>
                </motion.div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION COMMENT ÇA MARCHE - NUMÉROS STYLÉS NÉON */}
      <section id="comment-ca-marche" className="relative py-48 md:py-56 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-center mb-12 text-white tracking-tighter">
              Comment ça marche
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="text-2xl md:text-3xl text-center text-gray-400 mb-40 max-w-3xl mx-auto font-light">
              Un fonctionnement simple, pensé pour votre gestion quotidienne.
            </p>
          </ScrollReveal>

          <div className="space-y-10">
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
                  className="flex flex-col md:flex-row items-start gap-16 p-16 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/5 hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all duration-700 hover:scale-[1.01] hover:shadow-2xl hover:shadow-cyan-500/10 group"
                  whileHover={{ y: -5 }}
                >
                  {/* Numéro stylé avec effet néon/glow */}
                  <div className="flex-shrink-0 relative">
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-cyan-600 flex items-center justify-center text-5xl font-bold text-white shadow-2xl shadow-cyan-500/50 relative border border-cyan-400/30">
                      <span className="relative z-10">{step.num}</span>
                      <motion.div 
                        className="absolute inset-0 rounded-2xl bg-cyan-400 blur-2xl opacity-60"
                        animate={{
                          opacity: [0.4, 0.8, 0.4],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      ></motion.div>
                      <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/40"></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-4xl md:text-5xl font-semibold mb-6 text-white">{step.title}</h3>
                    <p className="text-gray-300 leading-relaxed text-xl font-light">
                      {step.text}
                    </p>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION POURQUOI FAIRE CONFIANCE - GLASSMORPHISM PREMIUM */}
      <section id="confiance" className="relative py-48 md:py-56 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-center mb-40 text-white tracking-tighter">
              Pourquoi faire confiance à Organa
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <ScrollReveal delay={0}>
              <motion.div 
                className="p-16 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/5 hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all duration-700 hover:scale-[1.03] hover:shadow-2xl hover:shadow-cyan-500/20 group relative overflow-hidden"
                whileHover={{ y: -8 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="mb-12 relative z-10">
                  <SecurityIcon />
                </div>
                <h3 className="text-2xl font-semibold mb-8 text-white relative z-10">Sécurité et confidentialité des données</h3>
                <p className="text-gray-300 leading-relaxed mb-5 relative z-10 font-light">
                  Vos données sont hébergées sur une infrastructure cloud sécurisée et protégées par des mécanismes d'accès stricts.
                </p>
                <p className="text-gray-400 leading-relaxed mb-5 relative z-10 font-light">
                  Organa met en œuvre les bonnes pratiques techniques pour garantir la confidentialité et l'intégrité de vos informations, tout en s'appuyant sur des solutions reconnues et fiables.
                </p>
                <p className="text-gray-400 leading-relaxed relative z-10 font-light">
                  Votre administratif est stocké dans un environnement sécurisé.
                </p>
              </motion.div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <motion.div 
                className="p-16 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/5 hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all duration-700 hover:scale-[1.03] hover:shadow-2xl hover:shadow-cyan-500/20 group relative overflow-hidden"
                whileHover={{ y: -8 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="mb-12 relative z-10">
                  <ReliabilityIcon />
                </div>
                <h3 className="text-2xl font-semibold mb-8 text-white relative z-10">Une plateforme fiable, accessible quand vous en avez besoin</h3>
                <p className="text-gray-300 leading-relaxed mb-5 relative z-10 font-light">
                  Organa repose sur une infrastructure robuste, conçue pour être stable et disponible au quotidien.
                </p>
                <p className="text-gray-400 leading-relaxed mb-5 relative z-10 font-light">
                  Vos outils restent accessibles à tout moment, où que vous soyez, afin que votre gestion ne soit jamais interrompue.
                </p>
                <p className="text-gray-400 leading-relaxed relative z-10 font-light">
                  Vous travaillez sereinement, sans dépendre d'imprévus techniques.
                </p>
              </motion.div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <motion.div 
                className="p-16 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/5 hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all duration-700 hover:scale-[1.03] hover:shadow-2xl hover:shadow-cyan-500/20 group relative overflow-hidden"
                whileHover={{ y: -8 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/8 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="mb-12 relative z-10">
                  <TargetIcon />
                </div>
                <h3 className="text-2xl font-semibold mb-8 text-white relative z-10">Conçu pour les indépendants et les PME</h3>
                <p className="text-gray-300 leading-relaxed mb-5 relative z-10 font-light">
                  Organa a été pensé pour répondre aux besoins concrets des petites entreprises et des indépendants.
                </p>
                <p className="text-gray-400 leading-relaxed mb-5 relative z-10 font-light">
                  Une interface claire, des actions simples, sans complexité inutile ni fonctionnalités superflues.
                </p>
                <p className="text-gray-400 leading-relaxed relative z-10 font-light">
                  Un outil pensé pour le terrain, pas pour compliquer votre quotidien.
                </p>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION TARIFS - CARTES TRÈS PREMIUM */}
      <section id="tarifs" className="relative py-48 md:py-56 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-center mb-40 text-white tracking-tighter">
              Tarifs
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {/* Plan Gratuit */}
            <ScrollReveal delay={0}>
              <motion.div 
                className="p-16 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-700 hover:scale-[1.02] hover:shadow-xl group relative overflow-hidden"
                whileHover={{ y: -5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/6 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <h3 className="text-3xl font-bold mb-5 text-white relative z-10">Plan Gratuit</h3>
                <p className="text-gray-400 mb-12 relative z-10 font-light">Idéal pour démarrer</p>
                <div className="mb-14 relative z-10">
                  <span className="text-8xl font-bold text-white">0</span>
                  <span className="text-gray-400 ml-4 text-3xl font-light">CHF</span>
                </div>
                <ul className="space-y-5 mb-14 text-gray-300 relative z-10">
                  <li className="flex items-start">
                    <span className="mr-4 text-cyan-400 text-2xl">•</span>
                    <span className="text-xl font-light">Maximum 2 clients</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-4 text-cyan-400 text-2xl">•</span>
                    <span className="text-xl font-light">Maximum 3 documents par mois</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-4 text-cyan-400 text-2xl">•</span>
                    <span className="text-xl font-light">Toutes les fonctionnalités de base</span>
                  </li>
                </ul>
                <Link href="/inscription">
                  <motion.div
                    className="block w-full text-center px-6 py-5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 hover:border-white/30 transition-all duration-300 relative z-10"
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
                className="p-16 rounded-3xl bg-gradient-to-br from-cyan-600/20 via-blue-500/15 to-transparent backdrop-blur-2xl border-2 border-cyan-500/40 hover:border-cyan-500/60 transition-all duration-700 hover:scale-[1.05] hover:shadow-2xl hover:shadow-cyan-500/30 relative overflow-hidden group"
                whileHover={{ y: -10 }}
              >
                <motion.div 
                  className="absolute top-10 right-10 px-6 py-3 rounded-full bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-sm font-bold backdrop-blur-sm"
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
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <h3 className="text-3xl font-bold mb-5 text-white relative z-10">Plan Pro</h3>
                <p className="text-gray-300 mb-12 relative z-10 font-light">Accès illimité</p>
                <div className="mb-14 relative z-10">
                  <span className="text-8xl font-bold text-white">29</span>
                  <span className="text-gray-400 ml-4 text-3xl font-light">CHF</span>
                  <span className="text-gray-500 text-lg ml-3 font-light">/mois</span>
                </div>
                <ul className="space-y-5 mb-14 text-gray-300 relative z-10">
                  <li className="flex items-start">
                    <span className="mr-4 text-cyan-400 text-2xl">•</span>
                    <span className="text-xl font-light">Clients illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-4 text-cyan-400 text-2xl">•</span>
                    <span className="text-xl font-light">Documents illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-4 text-cyan-400 text-2xl">•</span>
                    <span className="text-xl font-light">Support prioritaire</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-4 text-cyan-400 text-2xl">•</span>
                    <span className="text-xl font-light">Toutes les fonctionnalités</span>
                  </li>
                </ul>
                <Link href="/inscription">
                  <motion.div
                    className="block w-full text-center px-6 py-5 rounded-xl bg-white text-[#020418] font-semibold hover:bg-white/95 transition-all duration-300 shadow-xl hover:shadow-2xl relative z-10"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 blur-xl opacity-0 group-hover:opacity-30"
                      animate={{
                        opacity: [0, 0.2, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    ></motion.div>
                    <span className="relative z-10">Passer au plan Pro</span>
                  </motion.div>
                </Link>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center text-gray-500">
          <p className="font-light text-lg">© 2026 Organa. Développé en Suisse.</p>
        </div>
      </footer>
    </div>
  );
}
