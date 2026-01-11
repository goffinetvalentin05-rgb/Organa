export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/30 to-slate-950 text-white">
      {/* 1️⃣ Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24 md:py-32">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.1] tracking-tight">
            <span className="block text-white">Organa</span>
            <span className="block text-blue-400 mt-4 text-4xl md:text-5xl lg:text-6xl font-semibold">
              La gestion simple pour les indépendants
            </span>
          </h1>

          <p className="mt-12 mb-16 max-w-3xl mx-auto text-xl md:text-2xl text-white/80 leading-relaxed font-normal">
            Créez des devis et factures professionnels, transformez vos devis en factures,
            gérez vos clients, planifiez vos rendez-vous et modifiez tout manuellement,
            sans dépendre d'une IA.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto mb-16">
            <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <p className="text-white/90 font-medium text-base">📄 Devis → Factures en 1 clic</p>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <p className="text-white/90 font-medium text-base">🧾 Documents A4 professionnels (PDF)</p>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <p className="text-white/90 font-medium text-base">✏️ Modification totale par l'entreprise</p>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <p className="text-white/90 font-medium text-base">📅 Calendrier intégré</p>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all md:col-span-2 lg:col-span-1">
              <p className="text-white/90 font-medium text-base">💳 Abonnements mensuel & annuel</p>
            </div>
          </div>

          <a
            href="/inscription"
            className="inline-block rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-12 py-5 text-white font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-xl shadow-blue-900/40 hover:shadow-2xl hover:shadow-blue-900/50"
          >
            Essayez Organa gratuitement
          </a>
        </div>
      </section>

      {/* 2️⃣ SECTION PROBLÈME */}
      <section className="relative py-24 md:py-32 px-6 bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-16 text-left leading-tight">
            Le problème
          </h2>
          
          <div className="space-y-8">
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed font-normal">
              Votre temps est trop précieux pour être perdu dans l'administratif.
              Pourtant, ce sont encore ces tâches qui occupent une place disproportionnée dans votre quotidien.
            </p>
            
            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
              Factures, devis, suivi des clients, documents dispersés, outils qui ne communiquent pas entre eux…
              L'administratif s'accumule, ralentit votre activité et devient une charge mentale permanente.
            </p>
            
            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
              Ce temps perdu a un coût réel :
              moins de disponibilité pour vos clients, moins d'énergie pour développer votre entreprise,
              et moins de temps investi là où il crée réellement de la valeur.
            </p>
          </div>
        </div>
      </section>

      {/* 3️⃣ SECTION SOLUTION – ORGANA */}
      <section id="solution" className="relative py-24 md:py-32 px-6 bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-16 text-left leading-tight">
            La solution Organa
          </h2>
          
          <div className="bg-gradient-to-br from-black/50 to-blue-950/30 border border-white/10 rounded-2xl p-10 md:p-12 backdrop-blur-sm mb-8">
            <p className="text-xl md:text-2xl text-white font-semibold leading-relaxed">
              <strong className="text-white font-bold">Organa</strong> a été conçu pour reprendre le contrôle de votre administratif.
            </p>
          </div>
          
          <div className="space-y-6">
            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
              La plateforme centralise les éléments essentiels de votre gestion :
              factures, devis, clients et suivi administratif, au même endroit.
            </p>
            
            <p className="text-lg md:text-xl text-white/80 leading-relaxed">
              En automatisant les tâches chronophages et répétitives,
              <strong className="text-white font-semibold"> Organa</strong> vous fait gagner du temps au quotidien
              et vous permet de vous concentrer sur ce qui fait réellement avancer votre entreprise.
            </p>
          </div>
        </div>
      </section>

      {/* 4️⃣ SECTION COMMENT ÇA MARCHE */}
      <section className="relative py-24 md:py-32 px-6 bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 text-left leading-tight">
            Comment ça marche
          </h2>
          
          <p className="text-xl md:text-2xl text-white/80 mb-16 leading-relaxed font-normal">
            Une gestion claire, structurée et sous contrôle.
          </p>
          
          <div className="space-y-6">
            {/* Étape 1 */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-8 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/40 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">1</span>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Centralisez vos clients</h3>
                  <p className="text-white/80 leading-relaxed text-base md:text-lg">
                    Vous créez vos clients une seule fois.
                    Leurs informations sont automatiquement utilisées pour vos devis et factures,
                    évitant les ressaisies et les erreurs.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Étape 2 */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-8 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/40 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">2</span>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Créez, envoyez et suivez vos devis</h3>
                  <p className="text-white/80 leading-relaxed text-base md:text-lg">
                    À partir d'un client, vous créez un devis en quelques clics.
                    Vous l'envoyez directement par e-mail depuis Organa
                    ou le téléchargez selon vos besoins.
                    Chaque devis est suivi : brouillon, envoyé, validé.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Étape 3 */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-8 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/40 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">3</span>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Transformez vos devis en factures</h3>
                  <p className="text-white/80 leading-relaxed text-base md:text-lg">
                    Une fois le devis accepté, vous le transformez instantanément en facture.
                    Aucun doublon, aucune perte d'information.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Étape 4 */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-8 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/40 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">4</span>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Personnalisez vos documents à votre image</h3>
                  <p className="text-white/80 leading-relaxed text-base md:text-lg">
                    Vous configurez vos paramètres : logo, en-tête, coordonnées,
                    informations bancaires et mentions.
                    Tous vos documents sont générés automatiquement avec votre identité.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Étape 5 - Dashboard - Point central mis en valeur */}
            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-2 border-blue-500/40 rounded-xl p-8 backdrop-blur-sm shadow-xl">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-2 border-blue-400/50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">5</span>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Pilotez votre activité depuis le dashboard</h3>
                  <p className="text-white/90 leading-relaxed text-base md:text-lg">
                    Le dashboard vous offre une vue d'ensemble claire :
                    documents en cours, factures payées ou en attente,
                    actions à effectuer, relances à prévoir.
                    Vous savez immédiatement où vous en êtes.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Étape 6 */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-8 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/40 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">6</span>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Suivez vos paiements et vos tâches</h3>
                  <p className="text-white/80 leading-relaxed text-base md:text-lg">
                    Chaque facture peut être marquée comme payée, en attente ou brouillon.
                    Des raccourcis vous permettent de relancer et de garder le contrôle.
                    Un calendrier intégré vous aide à organiser vos tâches et échéances.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5️⃣ Section : Pourquoi faire confiance à Organa */}
      <section className="relative py-24 md:py-32 px-6 bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-16 text-left leading-tight">
            Pourquoi faire confiance à Organa
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* BLOC 1 — Sécurité et confidentialité des données */}
            <div className="bg-gradient-to-br from-black/60 to-blue-950/30 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="w-14 h-14 mb-6 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-6 leading-tight">Sécurité et confidentialité des données</h3>
              <div className="space-y-5">
                <p className="text-white/80 leading-relaxed text-base">
                  Vos données sont hébergées sur une infrastructure cloud sécurisée
                  et protégées par des mécanismes d'accès stricts.
                </p>
                <p className="text-white/80 leading-relaxed text-base">
                  Organa met en œuvre les bonnes pratiques techniques
                  pour garantir la confidentialité et l'intégrité de vos informations,
                  tout en s'appuyant sur des solutions reconnues et fiables.
                </p>
                <p className="text-white font-semibold leading-relaxed text-base pt-4 border-t border-white/10">
                  Votre administratif est stocké dans un environnement sécurisé.
                </p>
              </div>
            </div>
            
            {/* BLOC 2 — Fiabilité et continuité */}
            <div className="bg-gradient-to-br from-black/60 to-purple-950/30 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="w-14 h-14 mb-6 bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-6 leading-tight">Une plateforme fiable, accessible quand vous en avez besoin</h3>
              <div className="space-y-5">
                <p className="text-white/80 leading-relaxed text-base">
                  Organa repose sur une infrastructure robuste, conçue pour être stable
                  et disponible au quotidien.
                </p>
                <p className="text-white/80 leading-relaxed text-base">
                  Vos outils restent accessibles à tout moment, où que vous soyez,
                  afin que votre gestion ne soit jamais interrompue.
                </p>
                <p className="text-white font-semibold leading-relaxed text-base pt-4 border-t border-white/10">
                  Vous travaillez sereinement, sans dépendre d'imprévus techniques.
                </p>
              </div>
            </div>
            
            {/* BLOC 3 — Pensé pour les PME et indépendants */}
            <div className="bg-gradient-to-br from-black/60 to-blue-950/30 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="w-14 h-14 mb-6 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-6 leading-tight">Conçu pour les indépendants et les PME</h3>
              <div className="space-y-5">
                <p className="text-white/80 leading-relaxed text-base">
                  Organa a été pensé pour répondre aux besoins concrets
                  des petites entreprises et des indépendants.
                </p>
                <p className="text-white/80 leading-relaxed text-base">
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

      {/* 6️⃣ Section Tarifs */}
      <section id="tarifs" className="relative py-24 md:py-32 px-6 bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-16 text-left leading-tight">
            Tarifs
          </h2>
          <div className="max-w-4xl">
            <p className="text-white/60 text-base">
              [TEXTE À FOURNIR - Section tarifs]
            </p>
          </div>
        </div>
      </section>

      {/* 7️⃣ Footer */}
      <footer className="relative py-16 px-6 bg-black/40 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-white/60 text-sm text-center md:text-left">
              © {new Date().getFullYear()} Organa. Développé en Suisse.
            </p>
            <div className="flex items-center gap-6">
              <a href="/connexion" className="text-white/60 hover:text-white text-sm transition-colors">
                Connexion
              </a>
              <a href="/inscription" className="text-white/60 hover:text-white text-sm transition-colors">
                Inscription
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
