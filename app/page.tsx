export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950/30 to-slate-950 text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 md:py-32">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span className="block text-white">Organa</span>
            <span className="block text-blue-400 mt-3 text-3xl md:text-4xl lg:text-5xl font-semibold">
              La gestion simple pour les indépendants
            </span>
          </h1>

          <p className="mt-10 mb-12 max-w-3xl mx-auto text-lg md:text-xl text-white/80 leading-relaxed">
            Créez des devis et factures professionnels, transformez vos devis en factures,
            gérez vos clients, planifiez vos rendez-vous et modifiez tout manuellement,
            sans dépendre d'une IA.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 backdrop-blur-sm hover:border-white/20 transition-all">
              <p className="text-white/90 font-medium text-sm md:text-base">📄 Devis → Factures en 1 clic</p>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 backdrop-blur-sm hover:border-white/20 transition-all">
              <p className="text-white/90 font-medium text-sm md:text-base">🧾 Documents A4 professionnels (PDF)</p>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 backdrop-blur-sm hover:border-white/20 transition-all">
              <p className="text-white/90 font-medium text-sm md:text-base">✏️ Modification totale par l'entreprise</p>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 backdrop-blur-sm hover:border-white/20 transition-all">
              <p className="text-white/90 font-medium text-sm md:text-base">📅 Calendrier intégré</p>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-5 backdrop-blur-sm hover:border-white/20 transition-all md:col-span-2 lg:col-span-1">
              <p className="text-white/90 font-medium text-sm md:text-base">💳 Abonnements mensuel & annuel</p>
            </div>
          </div>

          <a
            href="/inscription"
            className="inline-block rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-10 py-4 text-white font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-xl shadow-blue-900/40 hover:shadow-2xl hover:shadow-blue-900/50"
          >
            Essayez Organa gratuitement
          </a>
        </div>
      </section>

      {/* Section : Pourquoi faire confiance à Organa */}
      <section className="relative py-20 md:py-32 px-6 bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-20 text-center leading-tight">
            Pourquoi faire confiance à Organa
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* BLOC 1 — Sécurité et confidentialité des données */}
            <div className="bg-gradient-to-br from-black/60 to-blue-950/30 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-900/20">
              <div className="w-16 h-16 mb-6 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-white mb-6 leading-tight">Sécurité et confidentialité des données</h3>
              <div className="space-y-4">
                <p className="font-body text-white/80 leading-relaxed text-sm md:text-base">
                  Vos données sont hébergées sur une infrastructure cloud sécurisée
                  et protégées par des mécanismes d'accès stricts.
                </p>
                <p className="font-body text-white/80 leading-relaxed text-sm md:text-base">
                  Organa met en œuvre les bonnes pratiques techniques
                  pour garantir la confidentialité et l'intégrité de vos informations,
                  tout en s'appuyant sur des solutions reconnues et fiables.
                </p>
                <p className="font-body text-white font-semibold leading-relaxed text-sm md:text-base pt-2 border-t border-white/10">
                  Votre administratif est stocké dans un environnement sécurisé.
                </p>
              </div>
            </div>
            
            {/* BLOC 2 — Fiabilité et continuité */}
            <div className="bg-gradient-to-br from-black/60 to-purple-950/30 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-purple-900/20">
              <div className="w-16 h-16 mb-6 bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/10">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-white mb-6 leading-tight">Une plateforme fiable, accessible quand vous en avez besoin</h3>
              <div className="space-y-4">
                <p className="font-body text-white/80 leading-relaxed text-sm md:text-base">
                  Organa repose sur une infrastructure robuste, conçue pour être stable
                  et disponible au quotidien.
                </p>
                <p className="font-body text-white/80 leading-relaxed text-sm md:text-base">
                  Vos outils restent accessibles à tout moment, où que vous soyez,
                  afin que votre gestion ne soit jamais interrompue.
                </p>
                <p className="font-body text-white font-semibold leading-relaxed text-sm md:text-base pt-2 border-t border-white/10">
                  Vous travaillez sereinement, sans dépendre d'imprévus techniques.
                </p>
              </div>
            </div>
            
            {/* BLOC 3 — Pensé pour les PME et indépendants */}
            <div className="bg-gradient-to-br from-black/60 to-blue-950/30 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-900/20">
              <div className="w-16 h-16 mb-6 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl md:text-2xl font-bold text-white mb-6 leading-tight">Conçu pour les indépendants et les PME</h3>
              <div className="space-y-4">
                <p className="font-body text-white/80 leading-relaxed text-sm md:text-base">
                  Organa a été pensé pour répondre aux besoins concrets
                  des petites entreprises et des indépendants.
                </p>
                <p className="font-body text-white/80 leading-relaxed text-sm md:text-base">
                  Une interface claire, des actions simples,
                  sans complexité inutile ni fonctionnalités superflues.
                </p>
                <p className="font-body text-white font-semibold leading-relaxed text-sm md:text-base pt-2 border-t border-white/10">
                  Un outil pensé pour le terrain, pas pour compliquer votre quotidien.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
