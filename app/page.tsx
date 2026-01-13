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

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* FOND CONTINU - BLEU FONCÉ/NOIR */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Fond de base - bleu foncé/noir */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0f1419] to-[#151a20]"></div>
        
        {/* GLOW BLEU DIFFUS DEPUIS LE BAS CENTRE */}
        <motion.div 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[1400px] h-[900px] bg-gradient-to-t from-blue-600/20 via-blue-500/15 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        ></motion.div>

        {/* Mesh gradient bleu subtil */}
        <motion.div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `
              radial-gradient(at 20% 30%, rgba(37, 99, 235, 0.12) 0%, transparent 50%),
              radial-gradient(at 80% 70%, rgba(59, 130, 246, 0.10) 0%, transparent 50%),
              radial-gradient(at 50% 50%, rgba(96, 165, 250, 0.08) 0%, transparent 50%)
            `,
            y: backgroundY,
          }}
        ></motion.div>

        {/* Light rays subtils bleu */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-[20%] w-px h-full bg-gradient-to-b from-transparent via-blue-500/6 to-transparent"></div>
          <div className="absolute top-0 right-[30%] w-px h-full bg-gradient-to-b from-transparent via-blue-400/5 to-transparent"></div>
          <div className="absolute top-0 left-[60%] w-px h-full bg-gradient-to-b from-transparent via-cyan-500/4 to-transparent"></div>
        </div>

        {/* Glow orbs animés bleu */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-blue-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-1/3 right-1/3 w-[800px] h-[800px] bg-cyan-500/4 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
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
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Titre principal */}
          <ScrollReveal delay={0}>
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-center mb-6 leading-[1.1] tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              <span className="block text-white">Simplifiez votre</span>
              <span className="block text-white mt-2 md:mt-4">gestion administrative</span>
            </motion.h1>
          </ScrollReveal>
          
          {/* Sous-titre */}
          <ScrollReveal delay={100}>
            <motion.p 
              className="mt-6 max-w-3xl mx-auto text-center text-lg md:text-xl text-white/70 leading-relaxed font-light mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              Organa offre une expérience fluide et sécurisée pour gérer votre activité administrative. Factures, devis, clients et suivi, au même endroit.
            </motion.p>
          </ScrollReveal>

          {/* CTA Button */}
          <ScrollReveal delay={200}>
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            >
              <Link href="/inscription">
                <motion.div
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold text-base relative group overflow-hidden shadow-2xl shadow-blue-500/40"
                  whileHover={{ scale: 1.05, boxShadow: "0 25px 50px rgba(37, 99, 235, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10">Commencer</span>
                  <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.div>
              </Link>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* DASHBOARD PREVIEW SECTION */}
      <section className="relative py-12 md:py-20 px-6">
        <div className="max-w-7xl mx-auto relative z-10">
          <ScrollReveal delay={0}>
            <motion.div 
              className="rounded-2xl bg-[#0f1419]/90 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-2xl max-w-6xl mx-auto"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
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
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-white/50 text-xs mb-1">Clients</div>
                        <div className="text-2xl font-bold text-white">24</div>
                        <div className="text-blue-400 text-xs mt-1">+12%</div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-white/50 text-xs mb-1">Factures</div>
                        <div className="text-2xl font-bold text-white">48</div>
                        <div className="text-blue-400 text-xs mt-1">+8%</div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-white/50 text-xs mb-1">Devis</div>
                        <div className="text-2xl font-bold text-white">32</div>
                        <div className="text-blue-400 text-xs mt-1">+15%</div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-white/50 text-xs mb-1">Revenus</div>
                        <div className="text-2xl font-bold text-white">12.5k</div>
                        <div className="text-blue-400 text-xs mt-1">CHF</div>
                      </div>
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
                icon: (
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                )
              },
              { 
                title: "Créez et envoyez vos devis", 
                text: "En quelques clics, depuis une interface claire.",
                icon: (
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                )
              },
              { 
                title: "Transformez vos devis en factures", 
                text: "Sans ressaisie, sans perte d'information.",
                icon: (
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                )
              },
              { 
                title: "Personnalisez vos documents", 
                text: "Logo, coordonnées, informations bancaires : tout est prêt, partout.",
                icon: (
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )
              },
              { 
                title: "Gardez une vue d'ensemble", 
                text: "Un dashboard clair pour suivre vos documents et votre activité.",
                icon: (
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                )
              },
              { 
                title: "Suivez paiements et tâches", 
                text: "Statuts, échéances et organisation, au même endroit.",
                icon: (
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-2.952M13 10.5h3.75m-3.75 3h3.75m-3.75 3h3.75M9.75 9.75h3.75m-3.75 3h3.75m-3.75 3h3.75M9.75 9.75V6.75m0 3h3.75m-3.75 3v3m0 0h3.75m-3.75 0h3.75" />
                  </svg>
                )
              },
            ].map((step, index) => (
              <ScrollReveal key={index} delay={index * 80}>
                <motion.div 
                  className="p-6 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all duration-500 group relative overflow-hidden h-full"
                  whileHover={{ y: -5 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex items-start gap-4 mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm relative z-10 flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="relative z-10 flex items-center">{step.icon}</div>
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
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="text-2xl font-bold mb-2 text-white relative z-10">Gratuit</h3>
                <p className="text-gray-400 mb-8 relative z-10 font-light text-sm">pour démarrer</p>
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
                className="p-10 rounded-2xl bg-gradient-to-br from-blue-600/20 via-blue-500/15 to-transparent backdrop-blur-xl border-2 border-blue-500/40 hover:border-blue-500/60 transition-all duration-500 relative overflow-hidden group"
                whileHover={{ y: -8 }}
              >
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
                <h3 className="text-2xl font-bold mb-2 text-white relative z-10">Pro</h3>
                <p className="text-gray-300 mb-8 relative z-10 font-light text-sm">pour aller plus loin</p>
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
