export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          Organa
          <span className="block text-primary mt-2">
            La gestion simple pour les indépendants
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-center text-lg text-gray-300">
          Créez des devis et factures professionnels, transformez vos devis en factures,
          gérez vos clients, planifiez vos rendez-vous et modifiez tout manuellement,
          sans dépendre d'une IA.
        </p>

        <ul className="mt-6 space-y-2 text-gray-300">
          <li>📄 Devis → Factures en 1 clic</li>
          <li>🧾 Documents A4 professionnels (PDF)</li>
          <li>✏️ Modification totale par l'entreprise</li>
          <li>📅 Calendrier intégré</li>
          <li>💳 Abonnements mensuel & annuel</li>
        </ul>

        <a
          href="/inscription"
          className="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-black font-semibold hover:bg-gray-200 transition"
        >
          Essayez Organa gratuitement
        </a>
      </div>

      {/* Section : Pourquoi faire confiance à Organa */}
      <section className="relative py-20 md:py-28 px-6 bg-gradient-to-b from-black via-blue-950/20 to-black border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-16 text-center">
            Pourquoi faire confiance à Organa
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* BLOC 1 — Sécurité et confidentialité des données */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
              <div className="w-14 h-14 mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-4">Sécurité et confidentialité des données</h3>
              <p className="font-body text-white/80 leading-relaxed text-sm mb-4">
                Vos données sont hébergées sur une infrastructure cloud sécurisée
                et protégées par des mécanismes d'accès stricts.
              </p>
              <p className="font-body text-white/80 leading-relaxed text-sm mb-4">
                Organa met en œuvre les bonnes pratiques techniques
                pour garantir la confidentialité et l'intégrité de vos informations,
                tout en s'appuyant sur des solutions reconnues et fiables.
              </p>
              <p className="font-body text-white/90 leading-relaxed text-sm font-medium">
                Votre administratif est stocké dans un environnement sécurisé.
              </p>
            </div>
            
            {/* BLOC 2 — Fiabilité et continuité */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
              <div className="w-14 h-14 mb-6 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-4">Une plateforme fiable, accessible quand vous en avez besoin</h3>
              <p className="font-body text-white/80 leading-relaxed text-sm mb-4">
                Organa repose sur une infrastructure robuste, conçue pour être stable
                et disponible au quotidien.
              </p>
              <p className="font-body text-white/80 leading-relaxed text-sm mb-4">
                Vos outils restent accessibles à tout moment, où que vous soyez,
                afin que votre gestion ne soit jamais interrompue.
              </p>
              <p className="font-body text-white/90 leading-relaxed text-sm font-medium">
                Vous travaillez sereinement, sans dépendre d'imprévus techniques.
              </p>
            </div>
            
            {/* BLOC 3 — Pensé pour les PME et indépendants */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
              <div className="w-14 h-14 mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold text-white mb-4">Conçu pour les indépendants et les PME</h3>
              <p className="font-body text-white/80 leading-relaxed text-sm mb-4">
                Organa a été pensé pour répondre aux besoins concrets
                des petites entreprises et des indépendants.
              </p>
              <p className="font-body text-white/80 leading-relaxed text-sm mb-4">
                Une interface claire, des actions simples,
                sans complexité inutile ni fonctionnalités superflues.
              </p>
              <p className="font-body text-white/90 leading-relaxed text-sm font-medium">
                Un outil pensé pour le terrain, pas pour compliquer votre quotidien.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
