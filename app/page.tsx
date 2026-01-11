import LandingNav from "@/components/LandingNav";

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
        {/* Background sobre */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10 pt-20 md:pt-32">
          {/* Badge premium */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 mb-12 md:mb-16">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-sm md:text-base text-white/90 font-medium">Gestion administrative simplifiée</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold mb-12 md:mb-16 leading-[1.05] tracking-[-0.04em] text-white">
            Moins d'administratif.
            <br />
            Plus de temps pour ce qui compte vraiment.
          </h1>

          <p className="mb-16 md:mb-20 max-w-2xl mx-auto text-xl md:text-2xl text-white/70 leading-relaxed">
            Organa automatise la gestion administrative de votre entreprise
            afin que vous puissiez consacrer plus de temps à vos clients,
            à votre activité… et à ce qui compte vraiment pour vous.
          </p>

          <a
            href="/inscription"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
          >
            Découvrir Organa
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>

      {/* SECTION 2 — LE PROBLÈME */}
      <section className="relative py-24 md:py-40 px-6 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-16 md:mb-24 text-left leading-[1.05] tracking-[-0.04em]">
            Le problème
          </h2>
          
          <div className="space-y-6 md:space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 md:p-12">
              <p className="text-xl md:text-2xl text-white leading-relaxed">
                Votre temps est trop précieux pour être perdu dans l'administratif.
                Pourtant, ce sont encore ces tâches qui occupent une place disproportionnée dans votre quotidien.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 md:p-12">
              <p className="text-lg md:text-xl text-white/80 leading-relaxed">
                Factures, devis, suivi des clients, documents dispersés, outils qui ne communiquent pas entre eux…
                L'administratif s'accumule, ralentit votre activité et devient une charge mentale permanente.
              </p>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-10 md:p-12">
              <p className="text-lg md:text-xl text-white leading-relaxed font-medium">
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
      <section className="relative py-24 md:py-40 px-6 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-16 md:mb-24 text-left leading-[1.05] tracking-[-0.04em]">
            La solution Organa
          </h2>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10 md:p-14 mb-12 md:mb-16">
            <p className="text-2xl md:text-3xl lg:text-4xl text-white font-semibold leading-relaxed">
              Organa a été conçu pour reprendre le contrôle de votre administratif.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 md:p-12">
              <p className="text-lg md:text-xl text-white/80 leading-relaxed">
                La plateforme centralise les éléments essentiels de votre gestion :
                factures, devis, clients et suivi administratif, au même endroit.
              </p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 md:p-12">
              <p className="text-lg md:text-xl text-white/80 leading-relaxed">
                En simplifiant et en structurant vos tâches administratives,
                Organa vous permet de gérer plus efficacement votre activité
                et de vous concentrer sur ce qui fait réellement avancer votre entreprise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — COMMENT ÇA MARCHE */}
      <section className="relative py-24 md:py-40 px-6 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 md:mb-10 text-left leading-[1.05] tracking-[-0.04em]">
            Comment ça marche
          </h2>
          
          <p className="text-xl md:text-2xl text-white/70 mb-16 md:mb-20 leading-relaxed max-w-3xl">
            Un fonctionnement simple, pensé pour votre gestion quotidienne.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Étape 1 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
              <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl md:text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4 leading-tight">Créez vos clients</h3>
              <p className="text-white/70 leading-relaxed text-base md:text-lg">
                Vous commencez par créer vos clients dans Organa.
                Leurs informations sont automatiquement réutilisées pour vos devis et factures.
              </p>
            </div>
            
            {/* Étape 2 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
              <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl md:text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4 leading-tight">Créez et envoyez vos devis</h3>
              <p className="text-white/70 leading-relaxed text-base md:text-lg">
                À partir d'un client, vous créez un devis en quelques clics.
                Vous pouvez l'envoyer par e-mail depuis Organa ou le télécharger.
              </p>
            </div>
            
            {/* Étape 3 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
              <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl md:text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4 leading-tight">Transformez vos devis en factures</h3>
              <p className="text-white/70 leading-relaxed text-base md:text-lg">
                Une fois le devis validé, vous le transformez instantanément en facture,
                sans ressaisie ni perte d'information.
              </p>
            </div>
            
            {/* Étape 4 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
              <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl md:text-3xl font-bold text-white">4</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4 leading-tight">Personnalisez vos documents</h3>
              <p className="text-white/70 leading-relaxed text-base md:text-lg">
                Vous configurez vos paramètres :
                logo, en-tête, coordonnées, informations bancaires.
                Tous vos documents reflètent automatiquement votre identité.
              </p>
            </div>
            
            {/* Étape 5 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
              <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl md:text-3xl font-bold text-white">5</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4 leading-tight">Pilotez votre activité depuis le dashboard</h3>
              <p className="text-white/70 leading-relaxed text-base md:text-lg">
                Le dashboard vous offre une vue claire sur votre activité :
                documents en cours, factures payées ou en attente, actions à effectuer.
              </p>
            </div>
            
            {/* Étape 6 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
              <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl md:text-3xl font-bold text-white">6</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4 leading-tight">Suivez vos paiements et vos tâches</h3>
              <p className="text-white/70 leading-relaxed text-base md:text-lg">
                Vous suivez l'état de vos documents (brouillon, envoyé, validé, payé)
                et organisez vos tâches grâce au calendrier intégré.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — POURQUOI FAIRE CONFIANCE À ORGANA */}
      <section className="relative py-24 md:py-40 px-6 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-16 md:mb-24 text-left leading-[1.05] tracking-[-0.04em]">
            Pourquoi faire confiance à Organa
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* BLOC 1 — Sécurité et confidentialité des données */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
              <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-6 leading-tight">Sécurité et confidentialité des données</h3>
              <div className="space-y-4">
                <p className="text-white/70 leading-relaxed text-base">
                  Vos données sont hébergées sur une infrastructure cloud sécurisée
                  et protégées par des mécanismes d'accès stricts.
                </p>
                <p className="text-white/70 leading-relaxed text-base">
                  Organa met en œuvre les bonnes pratiques techniques
                  pour garantir la confidentialité et l'intégrité de vos informations,
                  tout en s'appuyant sur des solutions reconnues et fiables.
                </p>
                <p className="text-white font-medium leading-relaxed text-base pt-4 border-t border-white/10">
                  Votre administratif est stocké dans un environnement sécurisé.
                </p>
              </div>
            </div>
            
            {/* BLOC 2 — Une plateforme fiable, accessible quand vous en avez besoin */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
              <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-6 leading-tight">Une plateforme fiable, accessible quand vous en avez besoin</h3>
              <div className="space-y-4">
                <p className="text-white/70 leading-relaxed text-base">
                  Organa repose sur une infrastructure robuste, conçue pour être stable
                  et disponible au quotidien.
                </p>
                <p className="text-white/70 leading-relaxed text-base">
                  Vos outils restent accessibles à tout moment, où que vous soyez,
                  afin que votre gestion ne soit jamais interrompue.
                </p>
                <p className="text-white font-medium leading-relaxed text-base pt-4 border-t border-white/10">
                  Vous travaillez sereinement, sans dépendre d'imprévus techniques.
                </p>
              </div>
            </div>
            
            {/* BLOC 3 — Conçu pour les indépendants et les PME */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
              <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-6 leading-tight">Conçu pour les indépendants et les PME</h3>
              <div className="space-y-4">
                <p className="text-white/70 leading-relaxed text-base">
                  Organa a été pensé pour répondre aux besoins concrets
                  des petites entreprises et des indépendants.
                </p>
                <p className="text-white/70 leading-relaxed text-base">
                  Une interface claire, des actions simples,
                  sans complexité inutile ni fonctionnalités superflues.
                </p>
                <p className="text-white font-medium leading-relaxed text-base pt-4 border-t border-white/10">
                  Un outil pensé pour le terrain, pas pour compliquer votre quotidien.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — TARIFS */}
      <section id="tarifs" className="relative py-24 md:py-40 px-6 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-16 md:mb-24 text-left leading-[1.05] tracking-[-0.04em]">
            Tarifs
          </h2>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Plan Gratuit */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 md:p-12">
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Plan Gratuit</h2>
              </div>
              <p className="text-white/70 mb-8 text-lg">Idéal pour démarrer</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white/90 text-base">Maximum 2 clients</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white/90 text-base">Maximum 3 documents par mois</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white/90 text-base">Toutes les fonctionnalités de base</span>
                </li>
              </ul>
            </div>

            {/* Plan Pro */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-10 md:p-12">
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Plan Pro</h2>
              </div>
              <p className="text-white/90 mb-8 text-lg font-medium">Accès illimité</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white text-base">Clients illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white text-base">Documents illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white text-base">Support prioritaire</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white text-base">Toutes les fonctionnalités</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 md:py-20 px-6 bg-black/40 border-t border-white/10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto opacity-0 animate-fade-in-up">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-white/50 text-sm text-center md:text-left">
              © {new Date().getFullYear()} Organa. Développé en Suisse.
            </p>
            <div className="flex items-center gap-6">
              <a href="/connexion" className="text-white/50 hover:text-white/80 text-sm transition-colors duration-200">
                Connexion
              </a>
              <a href="/inscription" className="text-white/50 hover:text-white/80 text-sm transition-colors duration-200">
                Inscription
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
