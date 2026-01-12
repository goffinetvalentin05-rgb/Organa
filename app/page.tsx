"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const observers = sectionRefs.current.map((ref) => {
      if (!ref) return null;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("animate-in");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
      );

      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      {/* Cursor glow effect - bleu foncé/violet */}
      <div 
        className="fixed w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none z-0 transition-all duration-300 ease-out"
        style={{
          left: `${mousePosition.x - 192}px`,
          top: `${mousePosition.y - 192}px`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Navigation Animated */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/organa-logo.png"
              alt="Organa"
              width={120}
              height={40}
              className="h-8 w-auto transition-transform hover:scale-105"
            />
          </div>
          <div className="flex items-center gap-8">
            <Link
              href="/connexion"
              className="text-white/70 hover:text-white transition-all duration-300 text-sm font-medium"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105 text-sm overflow-hidden group"
            >
              <span className="relative z-10">Commencer</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section 
        ref={heroRef} 
        className="min-h-screen flex items-center justify-center px-6 md:px-8 relative overflow-hidden"
      >
        {/* Animated Background - bleu foncé/violet uniquement */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-indigo-950/20 to-black" />
          
          {/* Animated gradients - bleu foncé/violet */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-indigo-900/30 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: '4s' }}
          />
          <div 
            className="absolute top-1/4 right-1/4 w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: '6s', animationDelay: '1s' }}
          />
          <div 
            className="absolute bottom-1/4 left-1/4 w-[900px] h-[900px] bg-indigo-900/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: '5s', animationDelay: '2s' }}
          />

          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
              transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.1}px)`,
            }}
          />

          {/* Floating UI elements */}
          <div className="absolute inset-0 opacity-10">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute border border-white/20 rounded-lg backdrop-blur-sm"
                style={{
                  width: `${150 + i * 50}px`,
                  height: `${100 + i * 30}px`,
                  top: `${15 + i * 15}%`,
                  left: `${10 + i * 12}%`,
                  transform: `translateY(${Math.sin(scrollY / 100 + i) * 20}px) rotate(${i * 5}deg)`,
                  transition: 'transform 0.3s ease-out',
                }}
              />
            ))}
          </div>
        </div>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          {/* Badge animé */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-6 py-2 mb-8 animate-fade-in">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Gestion Administrative • Gain de Temps • Premium</span>
          </div>

          {/* Titre Principal */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.95] tracking-tight mb-8 animate-fade-in-up">
            <span className="block bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent animate-gradient">
              Moins d'administratif.
            </span>
            <span className="block mt-4 text-white/95">
              Plus de temps pour ce qui
            </span>
            <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              compte vraiment.
            </span>
          </h1>

          {/* Sous-texte */}
          <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up-delay">
            Organa automatise votre gestion administrative
            <br className="hidden md:block" />
            pour que vous vous concentriez sur ce qui crée de la valeur.
          </p>

          {/* CTAs Animés */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up-delay-2">
            <Link
              href="/inscription"
              className="group relative inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-5 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-110 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Découvrir Organa
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center border-2 border-white/30 text-white px-10 py-5 rounded-xl font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300 hover:scale-105"
            >
              Voir la démo
            </Link>
          </div>

          {/* Stats animées */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in-up-delay-3">
            {[
              { value: "10x", label: "Plus rapide" },
              { value: "99%", label: "Temps gagné" },
              { value: "24/7", label: "Disponible" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* SECTION PROBLÈME */}
      <section 
        ref={(el) => { sectionRefs.current[0] = el; }}
        className="py-32 md:py-40 px-6 md:px-8 relative opacity-0 transition-opacity duration-1000"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block bg-white/10 border border-white/20 rounded-full px-4 py-1 mb-6">
              <span className="text-white/80 text-sm font-semibold">Le problème</span>
            </div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6">
              L'administratif vous
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                fait perdre du temps
              </span>
            </h2>
          </div>

          {/* Cards problèmes */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { title: "Documents dispersés", desc: "Factures et devis éparpillés partout" },
              { title: "Temps perdu", desc: "Des heures perdues chaque semaine" },
              { title: "Charge mentale", desc: "L'administratif devient un fardeau" }
            ].map((item, i) => (
              <div
                key={i}
                className="group relative bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-default overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-white/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Texte impactant */}
          <div className="text-center text-xl md:text-2xl text-white/80 leading-relaxed max-w-4xl mx-auto space-y-6">
            <p>
              Votre temps est trop précieux pour être perdu dans l'administratif.
            </p>
            <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Ce temps perdu a un coût réel
            </p>
          </div>
        </div>
      </section>

      {/* SECTION SOLUTION */}
      <section 
        ref={(el) => { sectionRefs.current[1] = el; }}
        className="py-32 md:py-40 px-6 md:px-8 relative bg-gradient-to-b from-black via-indigo-950/20 to-black opacity-0 transition-opacity duration-1000"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-1 mb-6">
              <span className="text-indigo-400 text-sm font-semibold">La solution</span>
            </div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Organa automatise
              </span>
              <br />
              votre gestion
            </h2>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {[
              { icon: "⚡", title: "Automatisation complète", desc: "Tous vos documents administratifs gérés automatiquement" },
              { icon: "🎯", title: "Tout centralisé", desc: "Factures, devis, clients au même endroit" },
              { icon: "🚀", title: "10x plus rapide", desc: "Gagnez des heures chaque semaine" },
              { icon: "💎", title: "Premium & Simple", desc: "Interface intuitive pour PME" }
            ].map((item, i) => (
              <div
                key={i}
                className="group relative bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 hover:border-indigo-500/50 hover:bg-gradient-to-br hover:from-indigo-500/20 hover:to-purple-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 cursor-default overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-white/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA central */}
          <div className="text-center">
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-12 py-6 rounded-xl font-bold text-xl hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-110"
            >
              Découvrir la solution
              <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION PROCESS */}
      <section 
        ref={(el) => { sectionRefs.current[2] = el; }}
        className="py-32 md:py-40 px-6 md:px-8 relative opacity-0 transition-opacity duration-1000"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6">
              Comment ça marche
            </h2>
            <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto">
              Un processus simple en 6 étapes pour reprendre le contrôle
            </p>
          </div>

          {/* Timeline visuelle */}
          <div className="space-y-12">
            {[
              { num: "01", title: "Créez vos clients", desc: "Ajoutez vos clients une seule fois. Leurs infos sont réutilisées automatiquement." },
              { num: "02", title: "Créez et envoyez vos devis", desc: "Générez des devis en quelques clics et envoyez-les par email directement." },
              { num: "03", title: "Transformez en factures", desc: "Un clic pour transformer un devis accepté en facture. Zero ressaisie." },
              { num: "04", title: "Personnalisez vos documents", desc: "Logo, couleurs, coordonnées. Vos documents à votre image." },
              { num: "05", title: "Pilotez depuis le dashboard", desc: "Vue d'ensemble en temps réel : statuts, paiements, actions à faire." },
              { num: "06", title: "Suivez tout automatiquement", desc: "Calendrier intégré, rappels automatiques. Vous ne ratez plus rien." }
            ].map((step, i) => (
              <div
                key={i}
                className="group relative grid md:grid-cols-2 gap-12 items-center hover:scale-[1.02] transition-transform duration-500"
              >
                <div className={i % 2 === 0 ? "order-2 md:order-1" : "order-2 md:order-2"}>
                  <div className="inline-block bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-1 mb-4">
                    <span className="text-indigo-400 text-sm font-semibold">ÉTAPE {step.num}</span>
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black mb-6">
                    {step.title}
                  </h3>
                  <p className="text-xl text-white/70 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                <div className={i % 2 === 0 ? "order-1 md:order-2" : "order-1 md:order-1 relative"}>
                  <div className="relative bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl p-8 h-64 flex items-center justify-center overflow-hidden group-hover:border-indigo-400/50 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <div className="text-6xl opacity-50">⚡</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION CONFIANCE */}
      <section 
        ref={(el) => { sectionRefs.current[3] = el; }}
        className="py-32 md:py-40 px-6 md:px-8 relative bg-gradient-to-b from-black via-purple-950/20 to-black opacity-0 transition-opacity duration-1000"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6">
              Pourquoi faire confiance
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                à Organa
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "🔒", title: "Sécurité & Confidentialité", desc: "Infrastructure cloud sécurisée avec chiffrement de bout en bout" },
              { icon: "✅", title: "Fiabilité", desc: "99.9% de disponibilité. Votre activité ne s'arrête jamais." },
              { icon: "💼", title: "Pensé pour les PME", desc: "Interface intuitive, sans complexité. Vous démarrez en 5 minutes." }
            ].map((item, i) => (
              <div
                key={i}
                className="group bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-10 hover:border-indigo-500/50 hover:bg-gradient-to-br hover:from-indigo-500/20 hover:to-purple-500/20 transition-all duration-500 hover:scale-105 hover:-translate-y-2 text-center"
              >
                <div className="text-6xl mb-6">{item.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-white/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION TARIFS */}
      <section 
        ref={(el) => { sectionRefs.current[4] = el; }}
        className="py-32 md:py-40 px-6 md:px-8 relative opacity-0 transition-opacity duration-1000"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6">
              Des tarifs
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                transparents
              </span>
            </h2>
            <p className="text-xl text-white/60">Commencez gratuitement, passez Premium quand vous êtes prêt</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Plan Gratuit */}
            <div className="group relative bg-white/5 border border-white/20 rounded-2xl p-10 hover:border-white/30 transition-all duration-500 hover:scale-105">
              <div className="mb-8">
                <h3 className="text-3xl font-bold mb-4">Gratuit</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black">0</span>
                  <span className="text-2xl text-white/50">CHF</span>
                </div>
                <p className="text-white/60 mt-2">Parfait pour démarrer</p>
              </div>
              
              <div className="space-y-4 mb-10">
                {['Fonctionnalités de base', 'Gestion des clients', 'Devis et factures', 'Support par e-mail'].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Link
                href="/inscription"
                className="block w-full text-center border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 hover:border-white/50 transition-all duration-300"
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* Plan Premium */}
            <div className="group relative bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-indigo-600/20 border-2 border-indigo-500/50 rounded-2xl p-10 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-500 hover:scale-110 md:scale-105">
              {/* Badge "Populaire" */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                Populaire
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-2xl blur-xl opacity-50 -z-10 group-hover:opacity-75 transition-opacity" />
              
              <div className="mb-8">
                <h3 className="text-3xl font-bold mb-4">Premium</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black">29</span>
                  <span className="text-2xl text-white/50">CHF</span>
                </div>
                <div className="text-sm text-white/60 mt-2">/mois • Pour les entreprises en croissance</div>
              </div>
              
              <div className="space-y-4 mb-10">
                {['Tout du plan Gratuit', 'Clients illimités', 'Devis et factures illimités', 'Personnalisation avancée', 'Support prioritaire'].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-white font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Link
                href="/inscription"
                className="block w-full text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
              >
                Commencer maintenant
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-32 md:py-40 px-6 md:px-8 relative bg-gradient-to-b from-black via-indigo-950/30 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8">
            Prêt à gagner
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              du temps ?
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl mx-auto">
            Rejoignez les entreprises qui ont automatisé leur gestion administrative
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-12 py-6 rounded-xl font-bold text-xl hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-110"
            >
              Commencer gratuitement
              <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center border-2 border-white/30 text-white px-12 py-6 rounded-xl font-semibold text-xl hover:bg-white/10 hover:border-white/50 transition-all duration-300 hover:scale-105"
            >
              Voir la démo
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-6 md:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center">
              <Image
                src="/organa-logo.png"
                alt="Organa"
                width={100}
                height={33}
                className="h-7 w-auto opacity-80"
              />
            </div>
            <div className="text-white/40 text-sm">
              <span>© {new Date().getFullYear()} Organa. Tous droits réservés.</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }
        
        .animate-fade-in-up-delay {
          animation: fade-in-up 1s ease-out 0.2s forwards;
          opacity: 0;
        }
        
        .animate-fade-in-up-delay-2 {
          animation: fade-in-up 1s ease-out 0.4s forwards;
          opacity: 0;
        }
        
        .animate-fade-in-up-delay-3 {
          animation: fade-in-up 1s ease-out 0.6s forwards;
          opacity: 0;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .animate-in {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
