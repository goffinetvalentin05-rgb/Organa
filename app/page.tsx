import LandingNav from "@/components/LandingNav";
import Image from "next/image";

// Configuration pour forcer le rendu dynamique et éviter le cache statique
// Cela garantit que les modifications de la landing page sont visibles immédiatement en production
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Page d'accueil (landing page) - Route: /
// Cette page est la landing page principale du site Organa
export default function Home() {
  return (
    <main className="w-full bg-slate-950 text-white overflow-x-hidden">
      {/* NAVIGATION FIXE */}
      <LandingNav />

      {/* SECTION 1 — HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-32 md:py-48 overflow-hidden">
        {/* Background dynamique avec gradients et formes */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950"></div>
        
        {/* Formes géométriques animées en arrière-plan */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Grille de fond subtile */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10 pt-20 md:pt-32">
          {/* Logo Organa dans le hero */}
          <div className="flex justify-center mb-8 md:mb-12">
            <div className="relative w-24 h-24 md:w-32 md:h-32">
              <Image 
                src="/organa-logo.png" 
                alt="Organa" 
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Badge premium avec effet glow */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-xl border border-blue-400/30 rounded-full px-6 py-3 mb-12 md:mb-16 shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300">
            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
            <span className="text-sm md:text-base text-white font-semibold">Gestion administrative simplifiée</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold mb-12 md:mb-16 leading-[1.05] tracking-[-0.04em] text-white drop-shadow-2xl">
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Moins d'administratif.
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-300 via-white to-blue-300 bg-clip-text text-transparent">
              Plus de temps pour ce qui compte vraiment.
            </span>
          </h1>

          <p className="mb-16 md:mb-20 max-w-3xl mx-auto text-xl md:text-2xl text-white/80 leading-relaxed font-medium">
            Organa automatise la gestion administrative de votre entreprise
            afin que vous puissiez consacrer plus de temps à vos clients,
            à votre activité… et à ce qui compte vraiment pour vous.
          </p>

          <a
            href="/inscription"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 hover:from-blue-400 hover:via-blue-500 hover:to-blue-400 text-white font-bold text-lg md:text-xl px-10 py-5 rounded-2xl transition-all duration-300 shadow-2xl shadow-blue-500/40 hover:shadow-3xl hover:shadow-blue-500/50 hover:scale-105 relative overflow-hidden"
          >
            <span className="relative z-10">Découvrir Organa</span>
            <svg className="w-6 h-6 relative z-10 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </a>
        </div>

        {/* Ligne de séparation décorative */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </section>

      {/* SECTION 2 — LE PROBLÈME */}
      <section className="relative py-32 md:py-48 px-6 overflow-hidden">
        {/* Background avec gradient et texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="mb-20 md:mb-32">
            <h2 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 text-left leading-[1.05] tracking-[-0.04em]">
              <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Le problème
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full"></div>
          </div>
          
          <div className="space-y-8 md:space-y-10">
            <div className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-10 md:p-14 shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent rounded-3xl transition-all duration-500"></div>
              <p className="text-xl md:text-2xl lg:text-3xl text-white leading-relaxed font-semibold relative z-10">
                Votre temps est trop précieux pour être perdu dans l'administratif.
                Pourtant, ce sont encore ces tâches qui occupent une place disproportionnée dans votre quotidien.
              </p>
            </div>

            <div className="group relative bg-gradient-to-br from-white/8 via-white/4 to-white/4 backdrop-blur-xl border border-white/15 rounded-3xl p-10 md:p-14 shadow-xl hover:shadow-2xl hover:border-white/25 transition-all duration-500">
              <p className="text-lg md:text-xl lg:text-2xl text-white/85 leading-relaxed relative z-10">
                Factures, devis, suivi des clients, documents dispersés, outils qui ne communiquent pas entre eux…
                L'administratif s'accumule, ralentit votre activité et devient une charge mentale permanente.
              </p>
            </div>
            
            <div className="group relative bg-gradient-to-br from-blue-500/20 via-blue-500/15 to-blue-500/10 backdrop-blur-xl border-2 border-blue-500/30 rounded-3xl p-10 md:p-14 shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:border-blue-500/40 transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
              <p className="text-lg md:text-xl lg:text-2xl text-white leading-relaxed font-semibold relative z-10">
                Ce temps perdu a un coût réel :
                moins de disponibilité pour vos clients,
                moins d'énergie pour développer votre entreprise,
                et moins de temps investi là où il crée réellement de la valeur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — LA SOLUTION ORGANA */}
      <section className="relative py-32 md:py-48 px-6 overflow-hidden">
        {/* Background avec effet de lumière */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_70%)]"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="mb-20 md:mb-32">
            <h2 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 text-left leading-[1.05] tracking-[-0.04em]">
              <span className="bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent">
                La solution Organa
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full"></div>
          </div>
          
          <div className="group relative bg-gradient-to-br from-blue-500/25 via-blue-500/20 to-blue-500/15 backdrop-blur-xl border-2 border-blue-400/40 rounded-3xl p-12 md:p-16 mb-16 md:mb-20 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
            <p className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white font-bold leading-relaxed relative z-10">
              Organa a été conçu pour reprendre le contrôle de votre administratif.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            <div className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-10 md:p-12 shadow-xl hover:shadow-2xl hover:border-blue-500/30 transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent rounded-3xl transition-all duration-500"></div>
              <p className="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed relative z-10">
                La plateforme centralise les éléments essentiels de votre gestion :
                factures, devis, clients et suivi administratif, au même endroit.
              </p>
            </div>
            
            <div className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-10 md:p-12 shadow-xl hover:shadow-2xl hover:border-blue-500/30 transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent rounded-3xl transition-all duration-500"></div>
              <p className="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed relative z-10">
                En simplifiant et en structurant vos tâches administratives,
                Organa vous permet de gérer plus efficacement votre activité
                et de vous concentrer sur ce qui fait réellement avancer votre entreprise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — COMMENT ÇA MARCHE */}
      <section className="relative py-32 md:py-48 px-6 overflow-hidden">
        {/* Background avec pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-16 md:mb-24">
            <h2 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 text-left leading-[1.05] tracking-[-0.04em]">
              <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Comment ça marche
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full mb-6"></div>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/75 leading-relaxed max-w-4xl font-medium">
              Un fonctionnement simple, pensé pour votre gestion quotidienne.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {/* Étape 1 */}
            <div className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-transparent rounded-3xl transition-all duration-500"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-2 border-blue-400/40 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-blue-500/20">
                <span className="text-3xl md:text-4xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight relative z-10">Créez vos clients</h3>
              <p className="text-white/75 leading-relaxed text-base md:text-lg relative z-10">
                Vous commencez par créer vos clients dans Organa.
                Leurs informations sont automatiquement réutilisées pour vos devis et factures.
              </p>
            </div>
            
            {/* Étape 2 */}
            <div className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-transparent rounded-3xl transition-all duration-500"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-2 border-blue-400/40 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-blue-500/20">
                <span className="text-3xl md:text-4xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight relative z-10">Créez et envoyez vos devis</h3>
              <p className="text-white/75 leading-relaxed text-base md:text-lg relative z-10">
                À partir d'un client, vous créez un devis en quelques clics.
                Vous pouvez l'envoyer par e-mail depuis Organa ou le télécharger.
              </p>
            </div>
            
            {/* Étape 3 */}
            <div className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-transparent rounded-3xl transition-all duration-500"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-2 border-blue-400/40 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-blue-500/20">
                <span className="text-3xl md:text-4xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight relative z-10">Transformez vos devis en factures</h3>
              <p className="text-white/75 leading-relaxed text-base md:text-lg relative z-10">
                Une fois le devis validé, vous le transformez instantanément en facture,
                sans ressaisie ni perte d'information.
              </p>
            </div>
            
            {/* Étape 4 */}
            <div className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-transparent rounded-3xl transition-all duration-500"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-2 border-blue-400/40 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-blue-500/20">
                <span className="text-3xl md:text-4xl font-bold text-white">4</span>
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight relative z-10">Personnalisez vos documents</h3>
              <p className="text-white/75 leading-relaxed text-base md:text-lg relative z-10">
                Vous configurez vos paramètres :
                logo, en-tête, coordonnées, informations bancaires.
                Tous vos documents reflètent automatiquement votre identité.
              </p>
            </div>
            
            {/* Étape 5 */}
            <div className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-transparent rounded-3xl transition-all duration-500"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-2 border-blue-400/40 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-blue-500/20">
                <span className="text-3xl md:text-4xl font-bold text-white">5</span>
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight relative z-10">Pilotez votre activité depuis le dashboard</h3>
              <p className="text-white/75 leading-relaxed text-base md:text-lg relative z-10">
                Le dashboard vous offre une vue claire sur votre activité :
                documents en cours, factures payées ou en attente, actions à effectuer.
              </p>
            </div>
            
            {/* Étape 6 */}
            <div className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-transparent rounded-3xl transition-all duration-500"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-2 border-blue-400/40 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-blue-500/20">
                <span className="text-3xl md:text-4xl font-bold text-white">6</span>
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight relative z-10">Suivez vos paiements et vos tâches</h3>
              <p className="text-white/75 leading-relaxed text-base md:text-lg relative z-10">
                Vous suivez l'état de vos documents (brouillon, envoyé, validé, payé)
                et organisez vos tâches grâce au calendrier intégré.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — POURQUOI FAIRE CONFIANCE À ORGANA */}
      <section className="relative py-32 md:py-48 px-6 overflow-hidden">
        {/* Background avec effet radial */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.15),transparent_50%)]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-20 md:mb-32">
            <h2 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 text-left leading-[1.05] tracking-[-0.04em]">
              <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Pourquoi faire confiance à Organa
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {/* BLOC 1 — Sécurité et confidentialité des données */}
            <div className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-transparent rounded-3xl transition-all duration-500"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-2 border-blue-400/40 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-blue-500/20">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-6 leading-tight relative z-10">Sécurité et confidentialité des données</h3>
              <div className="space-y-4 relative z-10">
                <p className="text-white/75 leading-relaxed text-base">
                  Vos données sont hébergées sur une infrastructure cloud sécurisée
                  et protégées par des mécanismes d'accès stricts.
                </p>
                <p className="text-white/75 leading-relaxed text-base">
                  Organa met en œuvre les bonnes pratiques techniques
                  pour garantir la confidentialité et l'intégrité de vos informations,
                  tout en s'appuyant sur des solutions reconnues et fiables.
                </p>
                <p className="text-white font-semibold leading-relaxed text-base pt-4 border-t border-white/10">
                  Votre administratif est stocké dans un environnement sécurisé.
                </p>
              </div>
            </div>
            
            {/* BLOC 2 — Une plateforme fiable, accessible quand vous en avez besoin */}
            <div className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-transparent rounded-3xl transition-all duration-500"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-2 border-blue-400/40 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-blue-500/20">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-6 leading-tight relative z-10">Une plateforme fiable, accessible quand vous en avez besoin</h3>
              <div className="space-y-4 relative z-10">
                <p className="text-white/75 leading-relaxed text-base">
                  Organa repose sur une infrastructure robuste, conçue pour être stable
                  et disponible au quotidien.
                </p>
                <p className="text-white/75 leading-relaxed text-base">
                  Vos outils restent accessibles à tout moment, où que vous soyez,
                  afin que votre gestion ne soit jamais interrompue.
                </p>
                <p className="text-white font-semibold leading-relaxed text-base pt-4 border-t border-white/10">
                  Vous travaillez sereinement, sans dépendre d'imprévus techniques.
                </p>
              </div>
            </div>
            
            {/* BLOC 3 — Conçu pour les indépendants et les PME */}
            <div className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-10 shadow-xl hover:shadow-2xl hover:border-blue-500/40 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-transparent rounded-3xl transition-all duration-500"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-blue-600/20 border-2 border-blue-400/40 rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-blue-500/20">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-6 leading-tight relative z-10">Conçu pour les indépendants et les PME</h3>
              <div className="space-y-4 relative z-10">
                <p className="text-white/75 leading-relaxed text-base">
                  Organa a été pensé pour répondre aux besoins concrets
                  des petites entreprises et des indépendants.
                </p>
                <p className="text-white/75 leading-relaxed text-base">
                  Une interface claire, des actions simples,
                  sans complexité inutile ni fonctionnalités superflues.
                </p>
                <p className="text-white font-semibold leading-relaxed text-base pt-4 border-t border-white/10">
                  Un outil pensé pour le terrain, pas pour compliquer votre quotidien.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — TARIFS */}
      <section id="tarifs" className="relative py-32 md:py-48 px-6 overflow-hidden">
        {/* Background avec gradient fort */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.2),transparent_70%)]"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="mb-20 md:mb-32">
            <h2 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 text-left leading-[1.05] tracking-[-0.04em]">
              <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Tarifs
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            {/* Plan Gratuit */}
            <div className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-10 md:p-12 shadow-xl hover:shadow-2xl hover:border-white/30 transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent rounded-3xl transition-all duration-500"></div>
              <div className="mb-6 relative z-10">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">Plan Gratuit</h2>
              </div>
              <p className="text-white/70 mb-8 text-lg md:text-xl relative z-10">Idéal pour démarrer</p>
              <ul className="space-y-4 relative z-10">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white/90 text-base md:text-lg">Maximum 2 clients</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white/90 text-base md:text-lg">Maximum 3 documents par mois</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white/90 text-base md:text-lg">Toutes les fonctionnalités de base</span>
                </li>
              </ul>
            </div>

            {/* Plan Pro */}
            <div className="group relative bg-gradient-to-br from-blue-500/25 via-blue-500/20 to-blue-500/15 backdrop-blur-xl border-2 border-blue-400/40 rounded-3xl p-10 md:p-12 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
              <div className="mb-6 relative z-10">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">Plan Pro</h2>
              </div>
              <p className="text-white/95 mb-8 text-lg md:text-xl font-semibold relative z-10">Accès illimité</p>
              <ul className="space-y-4 relative z-10">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white text-base md:text-lg font-medium">Clients illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white text-base md:text-lg font-medium">Documents illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white text-base md:text-lg font-medium">Support prioritaire</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white text-base md:text-lg font-medium">Toutes les fonctionnalités</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 md:py-20 px-6 bg-gradient-to-b from-slate-950 via-black/60 to-black border-t border-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <Image 
                  src="/organa-logo.png" 
                  alt="Organa" 
                  fill
                  className="object-contain opacity-80"
                />
              </div>
              <p className="text-white/50 text-sm md:text-base">
                © {new Date().getFullYear()} Organa. Développé en Suisse.
              </p>
            </div>
            <div className="flex items-center gap-6 md:gap-8">
              <a href="/connexion" className="text-white/50 hover:text-white/80 text-sm md:text-base font-medium transition-colors duration-300 relative group">
                Connexion
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="/inscription" className="text-white/50 hover:text-white/80 text-sm md:text-base font-medium transition-colors duration-300 relative group">
                Inscription
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
