import Image from "next/image";
import Link from "next/link";

const DEBUG_OVERLAY = false;

export default function Home() {
  return (
    <div className="min-h-screen text-white relative">
      {/* Debug Overlay */}
      {DEBUG_OVERLAY && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[9999] pointer-events-none">
          <Image
            src="/reference.png"
            alt="Reference overlay"
            fill
            className="object-contain opacity-35"
            priority
          />
        </div>
      )}

      {/* Header */}
      <header className="relative z-50 w-full border-b border-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-end px-6 py-4">
          <nav className="flex items-center gap-8">
            <Link href="#tarifs" className="font-body text-sm text-white/70 hover:text-white transition-colors font-medium">
              Tarifs
            </Link>
            <Link href="/connexion" className="font-body text-sm text-white/70 hover:text-white transition-colors font-medium">
              Se connecter
            </Link>
            <Link href="/inscription" className="btn-primary px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all shadow-lg shadow-blue-900/20">
              S'inscrire
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-28 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-16 flex justify-center">
              <Image 
                src="/organa-logo.png" 
                alt="Organa" 
                width={700} 
                height={140}
                className="w-[700px] md:w-[600px] sm:w-[400px] h-auto max-w-full"
                priority
              />
            </div>
            
            <p className="font-body text-sm text-white/70 mb-4 font-medium">
              Pensé pour les indépendants et les PME
            </p>
            
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight">
              <span className="block text-white">Moins d'administratif. Plus de temps pour votre activité.</span>
            </h1>
            
            <p className="font-body text-xl md:text-2xl text-white/95 mb-6 max-w-3xl mx-auto leading-relaxed font-normal">
              Devis, factures, clients et tâches réunis dans un seul outil simple, accessible partout, quand vous en avez besoin.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <Link
                href="/inscription"
                className="btn-primary px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-xl shadow-blue-900/40 hover:shadow-2xl hover:shadow-blue-900/50"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="/connexion"
                className="btn-secondary px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-sm hover:border-white/30"
              >
                Se connecter
              </Link>
            </div>
            
            <p className="font-body text-sm text-white/60 mb-12">
              Sans carte • Passez à Pro quand vous voulez
            </p>
          </div>
        </div>
      </section>

      {/* Ligne de preuve sociale */}
      <section className="relative py-8 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="border-t border-white/10 pt-8 pb-8 border-b border-white/10">
          <div className="flex items-center justify-center">
              <span className="font-body text-xs text-white/60 font-medium">Déjà utilisé par des indépendants et PME qui veulent gagner du temps et mieux gérer leur activité.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section Problème */}
      <section className="relative py-20 md:py-24 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-16 text-center leading-tight">
            Vous perdez trop de temps sur l'administratif
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Bloc 1 - Devis */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-8 backdrop-blur-sm">
              <div className="w-12 h-12 mx-auto mb-5 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-body text-white text-base text-center font-semibold">Trop de temps perdu</p>
              <p className="font-body text-white/70 text-sm text-center mt-2">Des heures à préparer chaque devis, facture ou relance manuellement</p>
            </div>
            
            {/* Bloc 2 - Factures */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-8 backdrop-blur-sm">
              <div className="w-12 h-12 mx-auto mb-5 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-body text-white text-base text-center font-semibold">Factures oubliées</p>
              <p className="font-body text-white/70 text-sm text-center mt-2">Relances manuelles oubliées = perte de revenus</p>
            </div>
            
            {/* Bloc 3 - Clients */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-8 backdrop-blur-sm">
              <div className="w-12 h-12 mx-auto mb-5 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="font-body text-white text-base text-center font-semibold">Informations dispersées</p>
              <p className="font-body text-white/70 text-sm text-center mt-2">Clients, commandes, paiements dans plusieurs endroits = confusion</p>
            </div>
            
            {/* Bloc 4 - Organisation */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-8 backdrop-blur-sm">
              <div className="w-12 h-12 mx-auto mb-5 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="font-body text-white text-base text-center font-semibold">Pas de vision claire</p>
              <p className="font-body text-white/70 text-sm text-center mt-2">Impossible de voir rapidement ce qui est payé, ce qui traîne</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Solution Organa */}
      <section className="relative py-20 md:py-24 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Organa : gagnez du temps, récupérez de l'argent
            </h2>
            
            <p className="font-body text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-normal">
              Un seul outil pour centraliser vos clients, créer vos documents en quelques clics, et suivre vos paiements. Moins d'oublis, factures envoyées plus vite, relances automatiques. <strong className="text-white">Réduisez votre temps administratif et augmentez vos revenus.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Section Comment ça marche */}
      <section className="relative py-20 md:py-24 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-16 text-center">
            Comment ça marche
          </h2>
          
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Étape 1 */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-6 md:p-8 backdrop-blur-sm">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-heading text-xl font-semibold text-white">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-lg md:text-xl font-semibold text-white mb-3">Créez vos clients</h3>
                  <p className="font-body text-white/80 leading-relaxed font-normal text-sm md:text-base">
                    Dans l'onglet Clients, vous ajoutez vos clients avec leurs informations : nom, email, téléphone et adresse. Ces données sont ensuite disponibles partout dans la plateforme.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Étape 2 */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-6 md:p-8 backdrop-blur-sm">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-heading text-xl font-semibold text-white">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-lg md:text-xl font-semibold text-white mb-3">Créez vos devis simplement</h3>
                  <p className="font-body text-white/80 leading-relaxed font-normal text-sm md:text-base">
                    Dans l'onglet Devis, vous sélectionnez un client existant. Ses informations sont automatiquement intégrées. Vous ajoutez vos prestations, vos prix, et votre devis est prêt.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Étape 3 */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-6 md:p-8 backdrop-blur-sm">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-heading text-xl font-semibold text-white">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-lg md:text-xl font-semibold text-white mb-3">Transformez vos devis en factures</h3>
                  <p className="font-body text-white/80 leading-relaxed font-normal text-sm md:text-base">
                    Un devis accepté ? Cliquez sur "Transformer en facture". Toutes les informations sont reprises automatiquement, sans ressaisie.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Étape 4 */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-6 md:p-8 backdrop-blur-sm">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-heading text-xl font-semibold text-white">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-lg md:text-xl font-semibold text-white mb-3">Gérez factures et paiements</h3>
                  <p className="font-body text-white/80 leading-relaxed font-normal text-sm md:text-base">
                    Dans l'onglet Factures, vous voyez clairement ce qui est payé, en attente ou en retard. Vous gardez une vision simple et claire de votre trésorerie.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Étape 5 */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-6 md:p-8 backdrop-blur-sm">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-heading text-xl font-semibold text-white">5</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-lg md:text-xl font-semibold text-white mb-3">Organisez votre quotidien</h3>
                  <p className="font-body text-white/80 leading-relaxed font-normal text-sm md:text-base">
                    Grâce à l'onglet Agenda et tâches, vous planifiez vos actions, vos relances et vos priorités sans rien oublier.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Étape 6 */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-6 md:p-8 backdrop-blur-sm">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="font-heading text-xl font-semibold text-white">6</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-lg md:text-xl font-semibold text-white mb-3">Personnalisez votre entreprise</h3>
                  <p className="font-body text-white/80 leading-relaxed font-normal text-sm md:text-base">
                    Dans les Paramètres, vous ajoutez votre logo, vos coordonnées et vos informations bancaires. Tous vos documents sont automatiquement personnalisés.
              </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités clés */}
      <section className="relative py-20 md:py-24 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-16 text-center">
            Fonctionnalités
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Fonctionnalité 1 - Devis & Factures */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold text-white mb-2">Devis et factures rapides</h3>
                  <p className="font-body text-white/80 leading-relaxed font-normal text-sm">
                    Créez et envoyez des documents professionnels en quelques clics, sans ressaisie inutile.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Fonctionnalité 2 - Clients centralisés */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold text-white mb-2">Clients centralisés</h3>
                  <p className="font-body text-white/80 leading-relaxed font-normal text-sm">
                    Toutes les informations clients regroupées au même endroit, sans doublons ni perte de données.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Fonctionnalité 3 - Identité d'entreprise */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold text-white mb-2">Identité de marque intégrée</h3>
                  <p className="font-body text-white/80 leading-relaxed font-normal text-sm">
                    Vos documents intègrent automatiquement votre logo et vos informations professionnelles.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Fonctionnalité 4 - Organisation */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold text-white mb-2">Vue d'ensemble claire</h3>
                  <p className="font-body text-white/80 leading-relaxed font-normal text-sm">
                    Visualisez en un coup d'œil ce qui est payé, en attente ou à relancer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Tarifs */}
      <section id="tarifs" className="relative py-20 md:py-24 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-16 text-center">
            Tarifs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Carte GRATUITE */}
            <div className="relative bg-black/20 border border-white/10 rounded-lg p-8 backdrop-blur-sm">
              <h3 className="font-heading text-xl font-bold text-white mb-6">Gratuite</h3>
              <div className="mb-6 pb-6 border-b border-white/10">
                <div className="font-heading text-4xl font-bold text-white mb-2">0 CHF</div>
                <div className="font-body text-sm text-white/60 font-medium">/ mois</div>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-body text-white/85 text-sm">2 clients maximum</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-body text-white/85 text-sm">3 documents / mois (factures + devis)</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-body text-white/85 text-sm">Agenda & tâches inclus</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-body text-white/85 text-sm">PDF simple</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border border-white/30 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <span className="text-white/40 text-xs font-bold">✗</span>
                  </div>
                  <span className="font-body text-white/50 text-sm">Pas d'IA</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border border-white/30 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <span className="text-white/40 text-xs font-bold">✗</span>
                  </div>
                  <span className="font-body text-white/50 text-sm">Pas d'export</span>
                </li>
              </ul>
              
              <Link
                href="/inscription"
                className="block w-full px-6 py-3 bg-white/5 border border-white/20 text-white font-bold text-center rounded-lg hover:bg-white/10 transition-all backdrop-blur-sm btn-primary"
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* Carte PRO */}
            <div className="relative bg-black/20 border-2 border-white/20 rounded-lg p-8 backdrop-blur-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Recommandé
                </span>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-6">Pro</h3>
              <div className="mb-6 pb-6 border-b border-white/10">
                <div className="font-heading text-4xl font-bold text-white mb-2">29 CHF</div>
                <div className="font-body text-sm text-white/60 font-medium">/ mois</div>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-body text-white/85 text-sm">Clients illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-body text-white/85 text-sm">Factures & devis illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-body text-white/85 text-sm">IA + dictée vocale</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-body text-white/85 text-sm">PDF professionnels</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-body text-white/85 text-sm">Agenda & tâches</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-body text-white/85 text-sm">Export</span>
                </li>
              </ul>
              
              <Link
                href="/inscription"
                className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-center rounded-lg transition-all shadow-xl shadow-blue-900/40 hover:shadow-2xl hover:shadow-blue-900/50 btn-primary"
              >
                Passer à Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section FAQ */}
      <section className="relative py-20 md:py-24 px-6 z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-16 text-center">
            Questions fréquentes
          </h2>
          
          <div className="space-y-4">
            {/* Question 1 */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
              <h3 className="font-heading text-base font-semibold text-white mb-3">Est-ce gratuit ?</h3>
              <p className="font-body text-white/80 leading-relaxed font-normal text-sm">
                Oui, nous proposons un plan gratuit avec 2 clients maximum et 3 documents par mois. 
                Idéal pour tester Organa et gérer une petite activité.
              </p>
            </div>
            
            {/* Question 2 */}
            <div className="bg-black/20 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
              <h3 className="font-heading text-base font-semibold text-white mb-3">Puis-je annuler mon abonnement ?</h3>
              <p className="font-body text-white/80 leading-relaxed font-normal text-sm">
                Oui, sans engagement ni frais cachés. Vous pouvez annuler à tout moment depuis votre espace. 
                Vos données restent accessibles et vous pouvez les exporter à tout moment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/5 z-10 bg-black/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="font-body text-white/60 text-sm text-center md:text-left font-medium">
              Développé en Suisse – Pensé pour les entrepreneurs
            </p>
            
            <div className="flex items-center gap-8">
              <Link href="/connexion" className="font-body text-sm text-white/60 hover:text-white/80 transition-colors font-medium">
                Connexion
              </Link>
              <Link href="/inscription" className="font-body text-sm text-white/60 hover:text-white/80 transition-colors font-medium">
                Inscription
              </Link>
              <Link href="#tarifs" className="font-body text-sm text-white/60 hover:text-white/80 transition-colors font-medium">
                Tarifs
              </Link>
            </div>
            
            {/* Ruban suisse */}
            <div className="relative">
              <Image
                src="/icon-ribbon-ch.png"
                alt="Ruban suisse"
                width={80}
                height={80}
                className="w-20 h-20 opacity-70"
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
