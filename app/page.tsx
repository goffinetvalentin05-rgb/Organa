// SAVE CHECK – landing stable
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import LandingNav from "@/components/LandingNav";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* FOND - DÉGRADÉ BLEU NOIR */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: "linear-gradient(180deg, #0a0e2e 0%, #080b1f 40%, #050616 70%, #000000 100%)",
        }}
      ></div>
      
      {/* Overlay très léger pour la lisibilité du texte */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-black/20"></div>

      {/* Grille subtile en arrière-plan */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      <div className="flex min-h-screen relative">
        {/* COLONNE PRINCIPALE - GAUCHE */}
        <div className="flex-1 relative z-10">
          <LandingNav />
          
          {/* HERO SECTION */}
          <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Logo Organa - au-dessus du titre */}
          <ScrollReveal delay={0}>
            <motion.div 
              className="flex justify-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative group">
                {/* Halo subtil autour du logo */}
                <motion.div 
                  className="absolute inset-0 -inset-4 bg-blue-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0, 0.3, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <div className="relative w-32 h-32 md:w-40 md:h-40">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Image
                      src="/organa-logo.png"
                      alt="Organa Logo"
                      width={160}
                      height={160}
                      className="object-contain drop-shadow-2xl"
                      priority
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </ScrollReveal>
          
          {/* Titre principal */}
          <ScrollReveal delay={100}>
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-center mb-6 leading-[1.1] tracking-tight relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Ligne fine décorative au-dessus */}
              <motion.div 
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent opacity-0"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, delay: 1, repeat: Infinity, repeatDelay: 3 }}
              />
              <motion.span 
                className="block text-white relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                Moins d'administratif.
              </motion.span>
              <motion.span 
                className="block text-white mt-2 md:mt-4 relative"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                Plus de temps pour ce qui compte vraiment.
              </motion.span>
            </motion.h1>
          </ScrollReveal>
          
          {/* Sous-titre */}
          <ScrollReveal delay={100}>
            <motion.p 
              className="mt-6 max-w-3xl mx-auto text-center text-lg md:text-xl text-white/70 leading-relaxed font-light mb-8 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, delay: 1.1 }}
              >
                Organa simplifie la gestion administrative de votre entreprise afin que vous puissiez consacrer plus de temps à vos clients, à votre activité… et à ce qui compte vraiment pour vous.
              </motion.span>
            </motion.p>
          </ScrollReveal>

          {/* CTA Button */}
          <ScrollReveal delay={200}>
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href="/inscription">
                <motion.div
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-base relative group overflow-hidden shadow-2xl shadow-blue-500/50"
                  whileHover={{ 
                    scale: 1.05, 
                    boxShadow: "0 25px 60px rgba(59, 130, 246, 0.6)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Glow néon au hover - amélioré */}
                  <motion.div 
                    className="absolute inset-0 bg-blue-400/40 blur-3xl opacity-0 group-hover:opacity-100 -z-10"
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  {/* Halo pulsant subtil */}
                  <motion.div 
                    className="absolute inset-0 bg-blue-500/20 blur-2xl -z-10"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  {/* Shine effect - plus lent et premium */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full"
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                  {/* Bordure lumineuse */}
                  <motion.div 
                    className="absolute inset-0 rounded-xl border border-blue-400/0 group-hover:border-blue-400/50"
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative z-10">Commencer</span>
                  <motion.svg 
                    className="w-5 h-5 relative z-10" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </motion.svg>
                </motion.div>
              </Link>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION LE TEMPS PERDU */}
      <section className="relative py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16 text-white tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              Votre temps vaut mieux que ça
            </motion.h2>
          </ScrollReveal>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <ScrollReveal delay={0}>
                <motion.div
                  className="p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all duration-500 group relative overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <p className="text-white/80 text-base leading-relaxed relative z-10">
                    Vos journées sont déjà bien remplies.
                    <br /><br />
                    Pourtant, une part importante de votre temps est absorbée par l'administratif.
                    <br /><br />
                    Créer des devis, gérer des factures, suivre des clients, retrouver des documents…
                    <br /><br />
                    Pris séparément, ces tâches paraissent simples.
                    Additionnées, elles finissent par prendre une place disproportionnée dans votre quotidien.
                  </p>
                </motion.div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <motion.div
                  className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent backdrop-blur-xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-500 group relative overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                  <div className="text-2xl font-bold text-white mb-4 relative z-10">Le coût réel</div>
                  <p className="text-white/90 text-base leading-relaxed relative z-10">
                    Ce temps passé sur l'administratif n'est pas neutre.
                    <br /><br />
                    C'est du temps en moins pour vos clients, pour développer votre activité, ou simplement pour avancer sur ce qui crée réellement de la valeur.
                  </p>
                </motion.div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION LE PROBLÈME */}
      <section className="relative py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="text-xl md:text-2xl text-white/70 mb-4 font-light">
                Si l'administratif prend autant de place, ce n'est pas par manque de volonté.
              </p>
              <p className="text-2xl md:text-3xl font-bold text-white">
                C'est souvent une question d'organisation.
              </p>
            </motion.div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
            {[
              {
                title: "Informations dispersées",
                text: "Les informations sont dispersées.",
                icon: (
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )
              },
              {
                title: "Outils isolés",
                text: "Les outils ne communiquent pas entre eux.",
                icon: (
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.645-5.963-1.74A10.07 10.07 0 017.228 15.5m12.01 0a10.07 10.07 0 00-1.74-3.962M15.75 15.5a10.07 10.07 0 01-3.962 1.74M15.75 15.5l-3-3m3 3l3-3M9.75 9.75l3 3m-3-3l-3 3" />
                  </svg>
                )
              },
              {
                title: "Ressaisies multiples",
                text: "Certaines données doivent être ressaisies plusieurs fois.",
                icon: (
                  <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                )
              },
            ].map((item, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <motion.div
                  className="p-6 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all duration-500 group relative overflow-hidden"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="mb-4 relative z-10">{item.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-3 relative z-10">{item.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed relative z-10">{item.text}</p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={300}>
            <motion.div
              className="max-w-3xl mx-auto p-8 rounded-2xl bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
              <div className="text-center relative z-10">
                <div className="text-2xl font-bold text-white mb-4">Résultat :</div>
                <p className="text-lg text-white/80 leading-relaxed">
                  on perd du temps à gérer, à vérifier, à chercher…
                  <br />
                  et l'administratif devient une charge permanente, difficile à maîtriser.
                </p>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION LA SOLUTION */}
      <section className="relative py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16 text-white tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              Tout au même endroit, enfin
            </motion.h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <ScrollReveal delay={0}>
              <motion.div
                className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent backdrop-blur-xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-500 group relative overflow-hidden"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                <div className="text-3xl font-bold text-white mb-4 relative z-10">Organa</div>
                <p className="text-white/80 text-lg leading-relaxed relative z-10">
                  Organa a été conçu pour remettre de la clarté dans votre gestion administrative.
                </p>
              </motion.div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <motion.div
                className="p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all duration-500 group relative overflow-hidden"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="text-xl font-semibold text-white mb-4 relative z-10">Centralisation</div>
                <p className="text-white/80 text-base leading-relaxed mb-4 relative z-10">
                  La plateforme centralise l'essentiel de votre activité au même endroit :
                </p>
                <div className="flex flex-wrap gap-2 relative z-10">
                  {["Clients", "Devis", "Factures", "Suivi"].map((item, i) => (
                    <span key={i} className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium">
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={200}>
            <motion.div
              className="max-w-4xl mx-auto mt-12 p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="text-center">
                <p className="text-xl text-white/90 leading-relaxed">
                  En structurant simplement vos tâches du quotidien, Organa vous aide à mieux vous organiser, à réduire le temps passé sur l'administratif et à vous concentrer sur ce qui fait avancer votre entreprise.
                </p>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* DASHBOARD PREVIEW SECTION */}
      <section className="relative py-12 md:py-20 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <motion.div 
              className="rounded-2xl bg-[#0f1419]/90 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-2xl max-w-6xl mx-auto group/dashboard hover:border-blue-500/30 transition-all duration-700 relative"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.01, y: -5 }}
            >
              {/* Halo subtil autour du dashboard */}
              <motion.div 
                className="absolute -inset-1 bg-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover/dashboard:opacity-100 transition-opacity duration-1000 -z-10"
              />
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/dashboard:opacity-100 blur-2xl transition-opacity duration-700"></div>
              {/* Ligne fine lumineuse en haut */}
              <motion.div 
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover/dashboard:opacity-100"
                transition={{ duration: 0.8 }}
              />
              {/* Dashboard Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#151a20]/50 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="relative w-6 h-6">
                    <Image
                      src="/organa-logo.png"
                      alt="Organa"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-white font-semibold text-sm">Organa</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white/50 text-xs">Tableau de bord / Dashboard</span>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                      type="text" 
                      placeholder="Rechercher..." 
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/70 text-xs w-32 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left Sidebar */}
                  <div className="w-full md:w-64 space-y-2">
                    <div className="px-4 py-3 rounded-lg bg-blue-600/20 border border-blue-500/30">
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-blue-400 font-medium text-sm">Tableau de bord</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-white/60 font-medium text-sm">Clients</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-white/60 font-medium text-sm">Devis</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                        </svg>
                        <span className="text-white/60 font-medium text-sm">Factures</span>
                      </div>
                    </div>
                    <div className="px-4 py-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-white/60 font-medium text-sm">Calendrier</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">Vue d'ensemble</h3>
                      <p className="text-white/50 text-sm">Derniers 30 jours</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {[
                        { label: "Clients", value: "24", change: "+12%" },
                        { label: "Factures", value: "48", change: "+8%" },
                        { label: "Devis", value: "32", change: "+15%" },
                        { label: "Revenus", value: "12.5k", change: "CHF" },
                      ].map((stat, index) => (
                        <motion.div 
                          key={index}
                          className="p-4 rounded-xl bg-white/5 border border-white/10 group/stat hover:border-blue-500/30 hover:bg-white/[0.08] transition-all duration-500 relative overflow-hidden"
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                          whileHover={{ y: -3, scale: 1.02 }}
                        >
                          {/* Glow subtil au hover */}
                          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/stat:opacity-100 blur-xl transition-opacity duration-500" />
                          <div className="text-white/50 text-xs mb-1 relative z-10">{stat.label}</div>
                          <div className="text-2xl font-bold text-white relative z-10">{stat.value}</div>
                          <div className="text-blue-400 text-xs mt-1 relative z-10">{stat.change}</div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Recent Activity */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-white/70 text-sm mb-3 font-medium">Activité récente</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">Facture #1234 envoyée</span>
                          <span className="text-white/30">Il y a 2h</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">Nouveau client ajouté</span>
                          <span className="text-white/30">Il y a 5h</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">Devis #5678 validé</span>
                          <span className="text-white/30">Hier</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION COMMENT ÇA SE PASSE */}
      <section id="comment-ca-marche" className="relative py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Fonctionnement
              </span>
            </div>
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4 text-white tracking-tight relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Ligne décorative */}
              <motion.div 
                className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
              />
              COMMENT ÇA SE PASSE AU QUOTIDIEN
            </motion.h2>
            <motion.p 
              className="text-lg md:text-xl text-center text-white/70 mb-16 max-w-2xl mx-auto font-light"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              Un fonctionnement simple, pensé pour votre gestion quotidienne.
            </motion.p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { 
                title: "Créez vos clients", 
                text: "Vous enregistrez les informations une seule fois. Elles sont automatiquement réutilisées pour vos devis et factures.",
                icon: (
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                )
              },
              { 
                title: "Créez et envoyez vos devis", 
                text: "À partir d'un client, vous créez un devis en quelques clics. Vous pouvez l'envoyer par e-mail ou le télécharger.",
                icon: (
                  <div className="relative">
                    <svg className="w-6 h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                )
              },
              { 
                title: "Transformez vos devis en factures", 
                text: "Une fois le devis validé, vous le transformez instantanément en facture, sans ressaisie ni perte d'information.",
                icon: (
                  <div className="relative">
                    <svg className="w-6 h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  </div>
                )
              },
              { 
                title: "Personnalisez vos documents", 
                text: "Logo, en-tête, coordonnées, informations bancaires : vos documents reflètent automatiquement votre identité.",
                icon: (
                  <div className="relative">
                    <svg className="w-6 h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )
              },
              { 
                title: "Pilotez votre activité depuis le dashboard", 
                text: "Vous disposez d'une vue claire sur votre activité : documents en cours, factures payées ou en attente, actions à effectuer.",
                icon: (
                  <div className="relative">
                    <svg className="w-6 h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                )
              },
              { 
                title: "Suivez vos paiements et vos tâches", 
                text: "Vous suivez l'état de vos documents (brouillon, envoyé, validé, payé) et organisez vos tâches grâce au calendrier intégré.",
                icon: (
                  <div className="relative">
                    <svg className="w-6 h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-2.952M13 10.5h3.75m-3.75 3h3.75m-3.75 3h3.75M9.75 9.75h3.75m-3.75 3h3.75m-3.75 3h3.75M9.75 9.75V6.75m0 3h3.75m-3.75 3v3m0 0h3.75m-3.75 0h3.75" />
                    </svg>
                  </div>
                )
              },
            ].map((step, index) => (
              <ScrollReveal key={index} delay={index * 80}>
                <motion.div 
                  className="p-6 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-blue-500/50 hover:bg-white/[0.04] transition-all duration-700 group relative overflow-hidden h-full"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  {/* Halo autour de la carte */}
                  <motion.div 
                    className="absolute -inset-1 bg-blue-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-1000"></div>
                  {/* Ligne fine en haut au hover */}
                  <motion.div 
                    className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent opacity-0 group-hover:opacity-100"
                    transition={{ duration: 0.6 }}
                  />
                  <div className="flex items-start gap-4 mb-4 relative z-10">
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm relative z-10 flex-shrink-0 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/60 transition-shadow duration-700"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {/* Glow autour du numéro */}
                      <motion.div 
                        className="absolute inset-0 bg-blue-400/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      />
                      <span className="relative z-10">{index + 1}</span>
                    </motion.div>
                    <motion.div 
                      className="relative z-10 flex items-center group-hover:scale-110 transition-transform duration-300"
                      whileHover={{ scale: 1.1 }}
                    >
                      <div className="relative">
                        {step.icon}
                        <div className="absolute inset-0 bg-blue-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </div>
                    </motion.div>
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

      {/* SECTION TÉMOIGNAGES CLIENTS */}
      <section className="relative py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4 text-white tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              Ils nous font confiance
            </motion.h2>
            <motion.p 
              className="text-lg md:text-xl text-center text-white/70 mb-16 max-w-2xl mx-auto font-light"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              Découvrez comment Organa transforme la gestion administrative de nos utilisateurs.
            </motion.p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: "Organa a transformé ma gestion administrative. Je gagne plusieurs heures par semaine et je peux me concentrer sur ce qui compte vraiment pour mon activité.",
                name: "Sophie Martin",
                role: "Consultante indépendante",
                initials: "SM"
              },
              {
                quote: "La centralisation de tous mes documents au même endroit a changé ma façon de travailler. Plus besoin de chercher, tout est organisé et accessible en quelques clics.",
                name: "Thomas Dubois",
                role: "Graphiste freelance",
                initials: "TD"
              },
              {
                quote: "L'interface est claire et intuitive. En quelques minutes, j'ai créé mes premiers devis. La transformation en facture est instantanée, c'est un gain de temps énorme.",
                name: "Marie Lefebvre",
                role: "Architecte d'intérieur",
                initials: "ML"
              },
              {
                quote: "En tant que petite entreprise, nous avions besoin d'une solution simple et efficace. Organa répond parfaitement à nos besoins sans complexité inutile.",
                name: "Pierre Moreau",
                role: "Fondateur, TechStart",
                initials: "PM"
              },
            ].map((testimonial, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <motion.div
                  className="p-6 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-blue-500/40 hover:bg-white/[0.04] transition-all duration-700 group relative overflow-hidden h-full"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-1000"></div>
                  
                  {/* Quote icon */}
                  <div className="mb-4 relative z-10">
                    <svg className="w-8 h-8 text-blue-400/50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>

                  <p className="text-white/80 text-base leading-relaxed mb-6 relative z-10 italic">
                    "{testimonial.quote}"
                  </p>

                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {testimonial.initials}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{testimonial.name}</div>
                      <div className="text-white/50 text-xs">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION CONFIANCE */}
      <section className="relative py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16 text-white tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              Fiable, sécurisé, pensé pour vous
            </motion.h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                title: "Sécurité et confidentialité",
                highlight: "Infrastructure cloud sécurisée",
                text: "Vos données sont hébergées sur une infrastructure cloud sécurisée, avec des mécanismes d'accès stricts.",
                icon: (
                  <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-2.952M13 10.5h3.75m-3.75 3h3.75m-3.75 3h3.75M9.75 9.75h3.75m-3.75 3h3.75m-3.75 3h3.75M9.75 9.75V6.75m0 3h3.75m-3.75 3v3m0 0h3.75m-3.75 0h3.75" />
                  </svg>
                )
              },
              {
                title: "Disponibilité",
                highlight: "Accessible au quotidien",
                text: "Organa repose sur une infrastructure robuste, conçue pour être stable et accessible au quotidien.",
                icon: (
                  <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                )
              },
              {
                title: "Simplicité",
                highlight: "Interface claire",
                text: "Une interface claire, des actions simples, sans complexité inutile.",
                icon: (
                  <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                )
              },
            ].map((item, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <motion.div
                  className="p-8 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-blue-500/40 hover:bg-white/[0.04] transition-all duration-700 group relative overflow-hidden h-full"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-1000"></div>
                  <div className="mb-6 relative z-10">{item.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-white relative z-10">{item.title}</h3>
                  <div className="text-blue-400 text-sm font-medium mb-4 relative z-10">{item.highlight}</div>
                  <p className="text-gray-300 leading-relaxed text-sm font-light relative z-10">
                    {item.text}
                  </p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION TARIFS */}
      <section id="tarifs" className="relative py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <motion.h2 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-16 text-white tracking-tight relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Ligne décorative */}
              <motion.div 
                className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
              />
              Tarifs
            </motion.h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan Gratuit */}
            <ScrollReveal delay={0}>
              <motion.div 
                className="p-10 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-blue-500/40 hover:bg-white/[0.04] transition-all duration-700 group relative overflow-hidden"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                {/* Halo autour */}
                <motion.div 
                  className="absolute -inset-1 bg-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-1000"></div>
                {/* Ligne fine en haut */}
                <motion.div 
                  className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.6 }}
                />
                <h3 className="text-2xl font-bold mb-2 text-white relative z-10">Plan Gratuit — Idéal pour démarrer</h3>
                <div className="mb-8 relative z-10">
                  <span className="text-6xl font-bold text-white">0</span>
                  <span className="text-gray-400 ml-2 text-xl font-light">CHF</span>
                </div>
                <ul className="space-y-3 mb-8 text-gray-300 relative z-10 text-sm">
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-400">•</span>
                    <span>Jusqu'à 2 clients</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-400">•</span>
                    <span>Jusqu'à 3 documents par mois</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-400">•</span>
                    <span>Fonctionnalités essentielles</span>
                  </li>
                </ul>
                <Link href="/inscription">
                  <motion.div
                    className="block w-full text-center px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 hover:border-blue-500/50 transition-all duration-500 relative z-10 text-sm group/btn overflow-hidden"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <motion.div 
                      className="absolute inset-0 bg-blue-500/15 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                    />
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"
                    />
                    <span className="relative z-10">Commencer</span>
                  </motion.div>
                </Link>
              </motion.div>
            </ScrollReveal>

            {/* Plan Pro */}
            <ScrollReveal delay={150}>
              <motion.div 
                className="p-10 rounded-2xl bg-gradient-to-br from-blue-600/20 via-blue-500/15 to-transparent backdrop-blur-xl border-2 border-blue-500/40 hover:border-blue-500/70 transition-all duration-700 relative overflow-hidden group"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                {/* Halo pulsant pour le plan Pro */}
                <motion.div 
                  className="absolute -inset-2 bg-blue-500/20 rounded-2xl blur-2xl"
                  animate={{
                    opacity: [0.3, 0.5, 0.3],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* Ligne lumineuse en haut */}
                <motion.div 
                  className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent"
                />
                <motion.div 
                  className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-bold backdrop-blur-sm"
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
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="text-2xl font-bold mb-2 text-white relative z-10">Plan Pro — Accès illimité</h3>
                <div className="mb-8 relative z-10">
                  <span className="text-6xl font-bold text-white">29</span>
                  <span className="text-gray-400 ml-2 text-xl font-light">CHF</span>
                  <span className="text-gray-500 text-sm ml-1 font-light">/mois</span>
                </div>
                <ul className="space-y-3 mb-8 text-gray-300 relative z-10 text-sm">
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-400">•</span>
                    <span>Clients illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-400">•</span>
                    <span>Documents illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-400">•</span>
                    <span>Support prioritaire</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-blue-400">•</span>
                    <span>Toutes les fonctionnalités</span>
                  </li>
                </ul>
                <Link href="/inscription">
                  <motion.div
                    className="block w-full text-center px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/95 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-blue-500/40 relative z-10 text-sm group/btn overflow-hidden"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* Glow autour du bouton */}
                    <motion.div 
                      className="absolute -inset-1 bg-blue-500/30 rounded-xl blur-lg opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 -z-10"
                    />
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                    />
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"
                    />
                    <span className="relative z-10">Choisir Pro</span>
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

        {/* Overlay pour fermer le sidebar */}
        {sidebarOpen && (
          <motion.div
            className="hidden lg:block fixed inset-0 bg-black/40 backdrop-blur-sm z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR - DROITE */}
        {sidebarOpen && (
          <motion.div
            className="hidden lg:block w-96 xl:w-[420px] fixed right-0 top-0 h-screen overflow-y-auto z-20 border-l border-white/5 bg-black/30 backdrop-blur-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Top Bar Sidebar */}
            <div className="sticky top-0 z-30 bg-black/40 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  <Image
                    src="/organa-logo.png"
                    alt="Organa"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/inscription"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 transition-all duration-300"
                >
                  S'inscrire
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors duration-200 text-white/70 hover:text-white"
                  aria-label="Fermer le panneau"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

          <div className="px-6 py-8 space-y-8">
            {/* Hero Section Sidebar */}
            <ScrollReveal delay={0}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-4">
                  <span className="text-xs text-blue-400 font-medium">✨ BIENVENUE SUR ORGANA</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                  Simplifiez votre gestion administrative en quelques minutes
                </h2>
                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                  Organa centralise l'essentiel de votre activité au même endroit : clients, devis, factures et suivi administratif.
                </p>
                <div className="flex flex-col gap-3">
                  <Link href="/inscription">
                    <motion.div
                      className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-sm text-center relative group overflow-hidden"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div 
                        className="absolute inset-0 bg-blue-400/30 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
                      />
                      <span className="relative z-10">Commencer gratuitement</span>
                    </motion.div>
                  </Link>
                </div>
              </motion.div>
            </ScrollReveal>

            {/* Dashboard Preview Sidebar */}
            <ScrollReveal delay={100}>
              <motion.div
                className="rounded-xl bg-[#0f1419]/90 backdrop-blur-xl border border-white/10 overflow-hidden group hover:border-blue-500/30 transition-all duration-500"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="p-4 bg-[#151a20]/50 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="relative w-4 h-4">
                      <Image
                        src="/organa-logo.png"
                        alt="Organa"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-white font-semibold text-xs">Dashboard</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-white/50 text-xs mb-1">Clients</div>
                      <div className="text-lg font-bold text-white">24</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-white/50 text-xs mb-1">Factures</div>
                      <div className="text-lg font-bold text-white">48</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-white/50 text-xs mb-2">Revenus</div>
                    <div className="text-2xl font-bold text-white">12.5k</div>
                    <div className="text-blue-400 text-xs mt-1">CHF</div>
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>

            {/* Témoignage Sidebar */}
            <ScrollReveal delay={200}>
              <motion.div
                className="rounded-xl bg-white/[0.02] backdrop-blur-xl border border-white/5 p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div className="mb-3">
                  <span className="text-xs text-blue-400 font-medium">TÉMOIGNAGE CLIENT</span>
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-4 italic">
                  "Organa a transformé ma gestion administrative. Je gagne plusieurs heures par semaine et je peux me concentrer sur ce qui compte vraiment pour mon activité."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    JD
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Jean Dupont</div>
                    <div className="text-white/50 text-xs">Indépendant</div>
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>

            {/* CTA Card Sidebar */}
            <ScrollReveal delay={300}>
              <motion.div
                className="rounded-xl bg-gradient-to-br from-blue-600/30 via-blue-500/20 to-transparent backdrop-blur-xl border border-blue-500/30 p-6 relative overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
              >
                <motion.div 
                  className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500"
                />
                <h3 className="text-lg font-bold text-white mb-2 relative z-10">
                  Maximisez votre productivité
                </h3>
                <p className="text-white/70 text-sm mb-4 leading-relaxed relative z-10">
                  Réduisez le temps passé sur l'administratif et concentrez-vous sur ce qui fait avancer votre entreprise.
                </p>
                <Link href="/inscription">
                  <motion.div
                    className="w-full px-4 py-2.5 rounded-lg bg-white text-black font-semibold text-sm text-center relative z-10"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Essayer gratuitement
                  </motion.div>
                </Link>
              </motion.div>
            </ScrollReveal>
          </div>
        </motion.div>
        )}
      </div>
    </div>
  );
}
