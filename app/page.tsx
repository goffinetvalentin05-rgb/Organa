"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import LandingNav from "@/components/LandingNav";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const [activeTab, setActiveTab] = useState("centralisation");

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* FOND CONTINU - STYLE RÉFÉRENCE (violet profond, glow diffus) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Fond de base - violet/noir profond */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0514] via-[#0f0819] to-[#150a1f]"></div>
        
        {/* GLOW VIOLET/MAGENTA DIFFUS DEPUIS LE BAS CENTRE */}
        <motion.div 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[1400px] h-[900px] bg-gradient-to-t from-violet-600/25 via-purple-500/20 via-fuchsia-500/15 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        ></motion.div>

        {/* Mesh gradient violet/magenta subtil */}
        <motion.div 
          className="absolute inset-0 opacity-25"
          style={{
            background: `
              radial-gradient(at 20% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
              radial-gradient(at 80% 70%, rgba(168, 85, 247, 0.12) 0%, transparent 50%),
              radial-gradient(at 50% 50%, rgba(217, 70, 239, 0.10) 0%, transparent 50%),
              radial-gradient(at 70% 20%, rgba(147, 51, 234, 0.08) 0%, transparent 50%)
            `,
            y: backgroundY,
          }}
        ></motion.div>

        {/* Light rays subtils violet/magenta */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-[20%] w-px h-full bg-gradient-to-b from-transparent via-violet-500/8 to-transparent"></div>
          <div className="absolute top-0 right-[30%] w-px h-full bg-gradient-to-b from-transparent via-purple-500/6 to-transparent"></div>
          <div className="absolute top-0 left-[60%] w-px h-full bg-gradient-to-b from-transparent via-fuchsia-500/5 to-transparent"></div>
        </div>

        {/* Glow orbs animés violet/magenta */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-violet-500/6 rounded-full blur-3xl"
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
          className="absolute bottom-1/3 right-1/3 w-[800px] h-[800px] bg-fuchsia-500/5 rounded-full blur-3xl"
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
      
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6 min-h-screen flex flex-col justify-center">
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Tag/Pill centré */}
          <ScrollReveal delay={0}>
            <motion.div 
              className="flex justify-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black/40 backdrop-blur-sm border border-violet-500/30">
                <span className="text-violet-400 font-semibold text-xs">Nouvelle version disponible</span>
              </div>
            </motion.div>
          </ScrollReveal>
          
          {/* Titre principal */}
          <ScrollReveal delay={100}>
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-center mb-8 leading-[1.1] tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <span className="block text-white">Moins d'administratif.</span>
              <span className="block text-white mt-2 md:mt-4">Plus de temps pour ce qui compte vraiment.</span>
            </motion.h1>
          </ScrollReveal>
          
          {/* Sous-titre */}
          <ScrollReveal delay={200}>
            <motion.p 
              className="mt-8 max-w-2xl mx-auto text-center text-lg md:text-xl text-white/70 leading-relaxed font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              Organa simplifie la gestion administrative de votre entreprise afin que vous puissiez consacrer votre temps à vos clients, à votre activité et à ce qui compte vraiment.
            </motion.p>
          </ScrollReveal>

          {/* CTA Button */}
          <ScrollReveal delay={300}>
            <motion.div 
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            >
              <Link href="/inscription">
                <motion.div
                  className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-base relative group overflow-hidden shadow-2xl shadow-violet-500/40"
                  whileHover={{ scale: 1.05, boxShadow: "0 25px 50px rgba(139, 92, 246, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  ></motion.div>
                  <span className="relative z-10">Commencer gratuitement</span>
                </motion.div>
              </Link>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION 1 — LE TEMPS */}
      <section id="temps" className="relative py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16 text-white tracking-tight">
              Le temps
            </h2>
          </ScrollReveal>

          <div className="max-w-4xl mx-auto space-y-8">
            <ScrollReveal delay={0}>
              <motion.p 
                className="text-2xl md:text-3xl text-center text-white leading-relaxed font-light"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                Votre temps est précieux.
              </motion.p>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <motion.p 
                className="text-lg md:text-xl text-center text-white/80 leading-relaxed font-light"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Pourtant, une grande partie de vos journées est absorbée par des tâches administratives.
              </motion.p>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <motion.div 
                className="p-10 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <p className="text-center text-white/70 leading-relaxed font-light mb-4">
                  Créer des devis, gérer des factures, suivre des documents…
                </p>
                <p className="text-center text-white/70 leading-relaxed font-light">
                  Ces actions sont nécessaires, mais elles prennent du temps au quotidien.
                </p>
              </motion.div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <motion.p 
                className="text-lg md:text-xl text-center text-white/80 leading-relaxed font-light max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                En simplifiant la gestion administrative, Organa vous permet de réduire le temps consacré à l'administratif et de le réinvestir là où il compte vraiment : votre activité, vos clients et votre vie personnelle ou familiale.
              </motion.p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 2 — LAYOUT SPLIT AVEC ONGLETS ET DÉMO */}
      <section id="solution" className="relative py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content with tabs */}
            <ScrollReveal delay={0}>
              <div className="space-y-8">
                {/* Tabs */}
                <div className="flex gap-3 border-b border-white/10 pb-4">
                  <button
                    onClick={() => setActiveTab("centralisation")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === "centralisation"
                        ? "bg-white text-black"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Centralisation
                  </button>
                  <button
                    onClick={() => setActiveTab("interface")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === "interface"
                        ? "bg-white text-black"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Interface
                  </button>
                  <button
                    onClick={() => setActiveTab("gain")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === "gain"
                        ? "bg-white text-black"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Gain de temps
                  </button>
                </div>

                {/* Tab content */}
                <div className="space-y-6">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                      {activeTab === "centralisation" && "Organa a été conçu pour simplifier votre gestion administrative."}
                      {activeTab === "interface" && "Une interface claire, des actions simples."}
                      {activeTab === "gain" && "Une organisation pensée pour vous faire gagner du temps, chaque jour."}
                    </h2>
                    
                    {activeTab === "centralisation" && (
                      <div className="space-y-4">
                        <p className="text-white/80 text-lg leading-relaxed font-light">
                          Tous les éléments essentiels sont centralisés au même endroit :
                        </p>
                        <p className="text-white/70 text-lg leading-relaxed font-light">
                          clients, devis, factures et suivi administratif.
                        </p>
                      </div>
                    )}
                    
                    {activeTab === "interface" && (
                      <p className="text-white/80 text-lg leading-relaxed font-light">
                        Des actions simples et une interface pensée pour votre quotidien. Tout est à portée de main, sans complexité inutile.
                      </p>
                    )}
                    
                    {activeTab === "gain" && (
                      <p className="text-white/80 text-lg leading-relaxed font-light">
                        Chaque fonctionnalité a été conçue pour vous faire gagner du temps. Moins de clics, moins de ressaisie, plus d'efficacité.
                      </p>
                    )}
                  </motion.div>
                </div>

                {/* CTA */}
                <Link href="/inscription">
                  <motion.div
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 font-semibold text-sm hover:bg-violet-600/30 hover:border-violet-500/50 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Essayer gratuitement
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </Link>
              </div>
            </ScrollReveal>

            {/* Right side - Interface demo */}
            <ScrollReveal delay={150}>
              <motion.div 
                className="rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-2xl"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                {/* Window bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-black/40 border-b border-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-white/50 text-xs">organa.app</span>
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-1">Vue d'ensemble</h3>
                    <p className="text-white/50 text-xs">Tous vos éléments en un coup d'œil</p>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-white/50 text-xs mb-1">Clients</div>
                      <div className="text-2xl font-bold text-white">24</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-white/50 text-xs mb-1">Factures</div>
                      <div className="text-2xl font-bold text-white">48</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-white/50 text-xs mb-1">Devis</div>
                      <div className="text-2xl font-bold text-white">32</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-white/50 text-xs mb-1">Revenus</div>
                      <div className="text-2xl font-bold text-white">12.5k</div>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="space-y-2">
                    <div className="px-4 py-3 rounded-lg bg-violet-600/20 border border-violet-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium">Clients</span>
                        <span className="text-violet-400 text-xs">24</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Devis</span>
                        <span className="text-white/50 text-xs">32</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">Factures</span>
                        <span className="text-white/50 text-xs">48</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION COMMENT ÇA SE PASSE — PLUS VISUELLE */}
      <section id="comment-ca-marche" className="relative py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-400 text-xs font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Fonctionnement
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4 text-white tracking-tight">
              Comment ça se passe
            </h2>
            <p className="text-lg md:text-xl text-center text-white/70 mb-16 max-w-2xl mx-auto font-light">
              Une prise en main simple, au rythme de votre activité.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { 
                title: "Créez vos clients", 
                text: "Les informations sont enregistrées une seule fois et réutilisées automatiquement.",
                icon: "👥"
              },
              { 
                title: "Créez et envoyez vos devis", 
                text: "En quelques clics, depuis une interface claire.",
                icon: "📄"
              },
              { 
                title: "Transformez vos devis en factures", 
                text: "Sans ressaisie, sans perte d'information.",
                icon: "💰"
              },
              { 
                title: "Personnalisez vos documents", 
                text: "Logo, coordonnées, informations bancaires : tout est prêt, partout.",
                icon: "🎨"
              },
              { 
                title: "Gardez une vue d'ensemble", 
                text: "Un dashboard clair pour suivre vos documents et votre activité.",
                icon: "📊"
              },
              { 
                title: "Suivez paiements et tâches", 
                text: "Statuts, échéances et organisation, au même endroit.",
                icon: "✅"
              },
            ].map((step, index) => (
              <ScrollReveal key={index} delay={index * 80}>
                <motion.div 
                  className="p-6 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-500 group relative overflow-hidden h-full"
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex items-start gap-4 mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl relative z-10 flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="text-3xl relative z-10">{step.icon}</div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white relative z-10">{step.title}</h3>
                  <p className="text-gray-300 leading-relaxed text-sm font-light relative z-10">
                    {step.text}
                  </p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — FIABILITÉ */}
      <section id="fiabilite" className="relative py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16 text-white tracking-tight">
              Fiabilité
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <ScrollReveal delay={0}>
              <motion.div 
                className="p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-500 group relative overflow-hidden"
                whileHover={{ y: -5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="text-xl font-semibold mb-4 text-white relative z-10">Vos données, en sécurité</h3>
                <p className="text-gray-300 leading-relaxed text-sm font-light relative z-10">
                  Infrastructure cloud sécurisée, accès contrôlés et bonnes pratiques techniques.
                </p>
              </motion.div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <motion.div 
                className="p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-500 group relative overflow-hidden"
                whileHover={{ y: -5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="text-xl font-semibold mb-4 text-white relative z-10">Disponible quand vous en avez besoin</h3>
                <p className="text-gray-300 leading-relaxed text-sm font-light relative z-10">
                  Vos outils restent accessibles à tout moment, où que vous soyez.
                </p>
              </motion.div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <motion.div 
                className="p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-500 group relative overflow-hidden"
                whileHover={{ y: -5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="text-xl font-semibold mb-4 text-white relative z-10">Pensé pour les indépendants et les PME</h3>
                <p className="text-gray-300 leading-relaxed text-sm font-light relative z-10">
                  Pas de complexité inutile. Juste ce dont vous avez besoin.
                </p>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION TARIFS */}
      <section id="tarifs" className="relative py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16 text-white tracking-tight">
              Tarifs
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan Gratuit */}
            <ScrollReveal delay={0}>
              <motion.div 
                className="p-10 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-500 group relative overflow-hidden"
                whileHover={{ y: -5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="text-2xl font-bold mb-2 text-white relative z-10">Gratuit</h3>
                <p className="text-gray-400 mb-8 relative z-10 font-light text-sm">pour démarrer</p>
                <div className="mb-8 relative z-10">
                  <span className="text-6xl font-bold text-white">0</span>
                  <span className="text-gray-400 ml-2 text-xl font-light">CHF</span>
                </div>
                <ul className="space-y-3 mb-8 text-gray-300 relative z-10 text-sm">
                  <li className="flex items-start">
                    <span className="mr-2 text-violet-400">•</span>
                    <span>Jusqu'à 2 clients</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-violet-400">•</span>
                    <span>Jusqu'à 3 documents par mois</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-violet-400">•</span>
                    <span>Fonctionnalités essentielles</span>
                  </li>
                </ul>
                <Link href="/inscription">
                  <motion.div
                    className="block w-full text-center px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 hover:border-white/30 transition-all duration-300 relative z-10 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Commencer
                  </motion.div>
                </Link>
              </motion.div>
            </ScrollReveal>

            {/* Plan Pro */}
            <ScrollReveal delay={150}>
              <motion.div 
                className="p-10 rounded-2xl bg-gradient-to-br from-violet-600/20 via-purple-500/15 to-transparent backdrop-blur-xl border-2 border-violet-500/40 hover:border-violet-500/60 transition-all duration-500 relative overflow-hidden group"
                whileHover={{ y: -8 }}
              >
                <motion.div 
                  className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-violet-500/30 border border-violet-400/40 text-violet-200 text-xs font-bold backdrop-blur-sm"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  Populaire
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="text-2xl font-bold mb-2 text-white relative z-10">Pro</h3>
                <p className="text-gray-300 mb-8 relative z-10 font-light text-sm">pour aller plus loin</p>
                <div className="mb-8 relative z-10">
                  <span className="text-6xl font-bold text-white">29</span>
                  <span className="text-gray-400 ml-2 text-xl font-light">CHF</span>
                  <span className="text-gray-500 text-sm ml-1 font-light">/mois</span>
                </div>
                <ul className="space-y-3 mb-8 text-gray-300 relative z-10 text-sm">
                  <li className="flex items-start">
                    <span className="mr-2 text-violet-400">•</span>
                    <span>Clients illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-violet-400">•</span>
                    <span>Documents illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-violet-400">•</span>
                    <span>Support prioritaire</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-violet-400">•</span>
                    <span>Toutes les fonctionnalités</span>
                  </li>
                </ul>
                <Link href="/inscription">
                  <motion.div
                    className="block w-full text-center px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/95 transition-all duration-300 shadow-xl hover:shadow-2xl relative z-10 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Choisir Pro
                  </motion.div>
                </Link>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-500 mb-6">
            <p className="font-light text-sm">© 2026 Organa — Développé en Suisse</p>
          </div>
          <div className="flex justify-center gap-6">
            <Link href="/connexion" className="text-sm text-white/60 hover:text-white transition-colors">
              Connexion
            </Link>
            <Link href="/inscription" className="text-sm text-white/60 hover:text-white transition-colors">
              Inscription
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
