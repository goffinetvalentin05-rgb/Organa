import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen text-white relative">
      {/* Header */}
      <header className="relative z-50 w-full border-b border-white/5 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center">
            <Image 
              src="/organa-logo.png" 
              alt="Organa" 
              width={280} 
              height={60}
              className="h-12 md:h-14 w-auto"
              priority
            />
          </Link>
          <nav className="flex items-center gap-8">
            <Link href="#tarifs" className="font-body text-sm text-white/70 hover:text-white transition-colors font-medium">
              Tarifs
            </Link>
            <Link href="/connexion" className="font-body text-sm text-white/70 hover:text-white transition-colors font-medium">
              Se connecter
            </Link>
            <Link href="/inscription" className="btn-primary px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm rounded-lg transition-all shadow-lg shadow-purple-900/20 font-semibold">
              Demander une démo
            </Link>
          </nav>
        </div>
      </header>

      {/* 1️⃣ HERO SECTION */}
      <section className="relative px-6 py-24 md:py-32 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-5xl mx-auto">
            {/* Logo Organa - Très grand et imposant - Logo premium SaaS */}
            <div className="mb-12 md:mb-16 flex justify-center">
              <Image 
                src="/organa-logo.png" 
                alt="Organa" 
                width={800} 
                height={173}
                className="h-24 md:h-32 lg:h-40 w-auto max-w-full drop-shadow-2xl"
                priority
              />
            </div>
            
            {/* Badge de crédibilité */}
            <div className="mb-8 flex justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                <span className="font-body text-sm text-white/80 font-medium">SaaS de gestion nouvelle génération</span>
              </span>
            </div>
            
            {/* ⚠️ SIGNATURE DE MARQUE - NE JAMAIS MODIFIER, RACCOURCIR OU REFORMULER ⚠️ */}
            {/* Ce texte est une signature de marque. Il doit rester visible, lisible et central. */}
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight text-center">
              <span className="block text-white mb-3">Moins d'administratif.</span>
              <span className="block text-white">Plus de temps pour ce qui compte vraiment.</span>
            </h1>
            
            {/* Sous-titre - Signature de marque (ne jamais modifier) */}
            <p className="font-body text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed font-normal text-center">
              Organa automatise la gestion administrative de votre entreprise
              afin que vous puissiez consacrer plus de temps à vos clients,
              à votre activité… et à ce qui compte vraiment pour vous.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link
                href="/inscription"
                className="btn-primary px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-xl shadow-purple-900/40 hover:shadow-2xl hover:shadow-purple-900/50 font-semibold text-base"
              >
                Découvrir Organa
              </Link>
            </div>
            
            {/* Visuel abstrait / Dashboard preview */}
            <div className="mt-16 relative max-w-6xl mx-auto">
              <div className="relative rounded-xl overflow-hidden border border-white/10 backdrop-blur-sm bg-black/30 shadow-2xl">
                <div className="aspect-video bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-blue-900/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                      <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="font-body text-sm text-white/50 font-medium">Dashboard Organa • Vue d'ensemble</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2️⃣ SECTION PROBLÈME */}
      <section className="relative py-20 md:py-28 px-6 z-10 bg-black/10 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="font-body text-xl md:text-2xl text-white/90 mb-8 text-center leading-relaxed font-normal">
            Votre temps est trop précieux pour être perdu dans l'administratif.
            Pourtant, ce sont encore ces tâches qui occupent une place disproportionnée dans votre quotidien.
          </p>
          
          <p className="font-body text-lg md:text-xl text-white/80 mb-8 text-center leading-relaxed">
            Factures, devis, suivi des clients, documents dispersés, outils qui ne communiquent pas entre eux…
            L'administratif s'accumule, ralentit votre activité et devient une charge mentale permanente.
          </p>
          
          <p className="font-body text-lg md:text-xl text-white/80 text-center leading-relaxed">
            Ce temps perdu a un coût réel :
            moins de disponibilité pour vos clients, moins d'énergie pour développer votre entreprise,
            et moins de temps investi là où il crée réellement de la valeur.
          </p>
        </div>
      </section>

      {/* 3️⃣ SECTION SOLUTION – ORGANA */}
      <section id="solution" className="relative py-20 md:py-28 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight max-w-4xl mx-auto">
              Organa : votre solution centrale pour l'administratif
            </h2>
            
            <p className="font-body text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed font-normal">
              Un seul outil qui automatise vos tâches administratives, centralise vos informations 
              et vous donne une <strong className="text-white font-semibold">vision claire de votre activité.</strong>
            </p>
          </div>
          
          {/* Bénéfices clés */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Bénéfice 1 */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-xl p-8 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="w-14 h-14 mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-3">Factures & devis automatisés</h3>
              <p className="font-body text-white/80 leading-relaxed text-sm">
                Créez vos documents en quelques clics. Transformez un devis en facture automatiquement. 
                <strong className="text-white"> Gagnez des heures chaque semaine.</strong>
              </p>
            </div>
            
            {/* Bénéfice 2 */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-xl p-8 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="w-14 h-14 mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-3">Gestion clients centralisée</h3>
              <p className="font-body text-white/80 leading-relaxed text-sm">
                Toutes vos informations clients au même endroit. Historique complet, documents associés. 
                <strong className="text-white"> Plus de doublons, plus de confusion.</strong>
              </p>
            </div>
            
            {/* Bénéfice 3 */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-xl p-8 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="w-14 h-14 mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-3">Gain de temps réel</h3>
              <p className="font-body text-white/80 leading-relaxed text-sm">
                Moins de saisies manuelles, moins d'outils à jongler, moins de stress. 
                <strong className="text-white"> Réinvestissez ce temps dans votre activité.</strong>
              </p>
            </div>
            
            {/* Bénéfice 4 */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-xl p-8 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="w-14 h-14 mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-3">Vision claire de l'activité</h3>
              <p className="font-body text-white/80 leading-relaxed text-sm">
                Dashboard en temps réel : ce qui est payé, ce qui traîne, ce qui est à relancer. 
                <strong className="text-white"> Vous savez toujours où vous en êtes.</strong>
              </p>
            </div>
            
            {/* Bénéfice 5 */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-xl p-8 backdrop-blur-sm hover:border-white/20 transition-all md:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-3">Sérénité garantie</h3>
              <p className="font-body text-white/80 leading-relaxed text-sm">
                Plus d'oublis, plus de stress. Relances automatiques, alertes personnalisées. 
                <strong className="text-white"> L'administratif devient simple et maîtrisé.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4️⃣ SECTION COMMENT ÇA MARCHE */}
      <section className="relative py-20 md:py-28 px-6 z-10 bg-black/10 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-center leading-tight">
            Comment ça marche
          </h2>
          
          <p className="font-body text-lg text-white/80 mb-16 text-center max-w-2xl mx-auto">
            Un processus simple, en 3 étapes, pour reprendre le contrôle
          </p>
          
          <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-3 md:gap-12 max-w-5xl mx-auto">
            {/* Étape 1 */}
            <div className="text-center relative">
              <div className="relative mb-6 flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/40 rounded-2xl flex items-center justify-center relative z-10">
                  <span className="font-heading text-3xl font-bold text-white">1</span>
                </div>
                {/* Flèche vers étape 2 - visible uniquement sur desktop */}
                <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-500/40 to-purple-500/40" style={{ width: 'calc(100% + 3rem)', left: '100%' }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full"></div>
                </div>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-4">Vous centralisez</h3>
              <p className="font-body text-white/80 leading-relaxed text-sm">
                Importez vos clients, ajoutez vos informations d'entreprise, personnalisez vos documents. 
                <strong className="text-white"> Tout au même endroit.</strong>
              </p>
            </div>
            
            {/* Étape 2 */}
            <div className="text-center relative">
              <div className="relative mb-6 flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/40 rounded-2xl flex items-center justify-center relative z-10">
                  <span className="font-heading text-3xl font-bold text-white">2</span>
                </div>
                {/* Flèche vers étape 3 - visible uniquement sur desktop */}
                <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-500/40 to-purple-500/40" style={{ width: 'calc(100% + 3rem)', left: '100%' }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full"></div>
                </div>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-4">Organa automatise</h3>
              <p className="font-body text-white/80 leading-relaxed text-sm">
                Création de documents en un clic, transformation devis → facture automatique, 
                relances programmées. <strong className="text-white"> L'intelligence au service de votre temps.</strong>
              </p>
            </div>
            
            {/* Étape 3 */}
            <div className="text-center relative">
              <div className="relative mb-6 flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/40 rounded-2xl flex items-center justify-center">
                  <span className="font-heading text-3xl font-bold text-white">3</span>
                </div>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-4">Vous gagnez du temps</h3>
              <p className="font-body text-white/80 leading-relaxed text-sm">
                Moins d'administratif, plus de clarté, plus de sérénité. 
                <strong className="text-white"> Vous vous concentrez sur ce qui compte vraiment : votre activité.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5️⃣ SECTION PREUVES / CONFIANCE */}
      <section className="relative py-20 md:py-28 px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-16 text-center">
            Pourquoi nous faire confiance
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Argument 1 - Sécurité */}
            <div className="bg-black/20 border border-white/10 rounded-xl p-8 backdrop-blur-sm text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-heading text-lg font-bold text-white mb-3">Sécurité maximale</h3>
              <p className="font-body text-white/70 text-sm leading-relaxed">
                Vos données sont chiffrées, sauvegardées régulièrement et protégées selon les standards suisses. 
                <strong className="text-white/90"> Votre confidentialité est notre priorité.</strong>
              </p>
            </div>
            
            {/* Argument 2 - Fiabilité */}
            <div className="bg-black/20 border border-white/10 rounded-xl p-8 backdrop-blur-sm text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-heading text-lg font-bold text-white mb-3">Fiabilité garantie</h3>
              <p className="font-body text-white/70 text-sm leading-relaxed">
                Infrastructure robuste, disponibilité 99.9%. Vos outils sont accessibles 
                <strong className="text-white/90"> quand vous en avez besoin, où que vous soyez.</strong>
              </p>
            </div>
            
            {/* Argument 3 - Adapté aux PME */}
            <div className="bg-black/20 border border-white/10 rounded-xl p-8 backdrop-blur-sm text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-heading text-lg font-bold text-white mb-3">Pensé pour les PME</h3>
              <p className="font-body text-white/70 text-sm leading-relaxed">
                Conçu spécifiquement pour les indépendants, artisans et petites entreprises. 
                <strong className="text-white/90"> Simple, efficace, sans complexité inutile.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Tarifs - Ajout optionnel */}
      <section id="tarifs" className="relative py-20 md:py-28 px-6 z-10 bg-black/10 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6 text-center">
            Tarifs simples et transparents
          </h2>
          <p className="font-body text-lg text-white/80 mb-12 text-center max-w-2xl mx-auto">
            Commencez gratuitement, passez à Pro quand vous êtes prêt. Sans engagement, annulation à tout moment.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan Gratuit */}
            <div className="bg-black/20 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
              <h3 className="font-heading text-xl font-bold text-white mb-6">Gratuit</h3>
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
                  <span className="font-body text-white/85 text-sm">3 documents / mois</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-body text-white/85 text-sm">Fonctionnalités de base</span>
                </li>
              </ul>
              <Link
                href="/inscription"
                className="block w-full px-6 py-3 bg-white/5 border border-white/20 text-white font-semibold text-center rounded-lg hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* Plan Pro */}
            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-2 border-blue-500/40 rounded-xl p-8 backdrop-blur-sm relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
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
                  <span className="font-body text-white/85 text-sm">Documents illimités</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-body text-white/85 text-sm">IA + fonctionnalités avancées</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-body text-white/85 text-sm">Support prioritaire</span>
                </li>
              </ul>
              <Link
                href="/inscription"
                className="block w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-center rounded-lg transition-all shadow-xl shadow-purple-900/40"
              >
                Passer à Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6️⃣ SECTION CTA FORTE */}
      <section className="relative py-24 md:py-32 px-6 z-10 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-blue-900/30 border-y border-white/10">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Reprenez le contrôle de votre administratif
          </h2>
          
          <p className="font-body text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
            Lancez votre projet Organa aujourd'hui. 
            <strong className="text-white font-semibold"> Gagnez du temps, retrouvez votre sérénité.</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/inscription"
              className="btn-primary px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-2xl shadow-purple-900/50 hover:shadow-purple-900/60 font-bold text-lg"
            >
              Lancer mon projet
            </Link>
            <Link
              href="/connexion"
              className="btn-secondary px-12 py-5 bg-white/10 hover:bg-white/15 border-2 border-white/30 text-white rounded-lg transition-all duration-200 backdrop-blur-sm hover:border-white/40 font-semibold text-lg"
            >
              Se connecter
            </Link>
          </div>
          
          <p className="mt-8 font-body text-sm text-white/70 font-medium">
            Sans engagement • Essai gratuit • Annulation à tout moment
          </p>
        </div>
      </section>

      {/* 7️⃣ FOOTER */}
      <footer className="relative py-12 px-6 border-t border-white/5 z-10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo et description */}
            <div className="md:col-span-2">
              <Image 
                src="/organa-logo.png" 
                alt="Organa" 
                width={200} 
                height={43}
                className="h-9 w-auto mb-4"
              />
              <p className="font-body text-white/70 text-sm leading-relaxed max-w-md">
                La plateforme de gestion administrative intelligente pour indépendants, PME et artisans. 
                Simplifiez votre quotidien, concentrez-vous sur l'essentiel.
              </p>
            </div>
            
            {/* Liens produits */}
            <div>
              <h4 className="font-heading text-sm font-bold text-white mb-4">Produit</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#solution" className="font-body text-sm text-white/60 hover:text-white transition-colors">
                    Fonctionnalités
                  </Link>
                </li>
                <li>
                  <Link href="#tarifs" className="font-body text-sm text-white/60 hover:text-white transition-colors">
                    Tarifs
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Liens légaux */}
            <div>
              <h4 className="font-heading text-sm font-bold text-white mb-4">Légal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="font-body text-sm text-white/60 hover:text-white transition-colors">
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link href="#" className="font-body text-sm text-white/60 hover:text-white transition-colors">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="#" className="font-body text-sm text-white/60 hover:text-white transition-colors">
                    CGU
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Copyright et contact */}
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-body text-white/60 text-sm text-center md:text-left font-medium">
              © {new Date().getFullYear()} Organa. Développé en Suisse.
            </p>
            
            <div className="flex items-center gap-6">
              <Link href="/connexion" className="font-body text-sm text-white/60 hover:text-white transition-colors font-medium">
                Connexion
              </Link>
              <Link href="/inscription" className="font-body text-sm text-white/60 hover:text-white transition-colors font-medium">
                Inscription
              </Link>
              <Link href="mailto:contact@organa.ch" className="font-body text-sm text-white/60 hover:text-white transition-colors font-medium">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
