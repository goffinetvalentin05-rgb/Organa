export default function TableauDeBordPage() {
    return (
      <main className="min-h-[calc(100vh-72px)] bg-black text-white px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="mt-2 text-white/70">
            Bienvenue sur Organa. Votre espace est vierge : aucun client, aucun devis, aucune facture.
          </p>
  
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/clients"
              className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
            >
              <div className="text-lg font-semibold">Clients</div>
              <div className="mt-1 text-sm text-white/70">0 client</div>
            </a>
  
            <a
              href="/devis"
              className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
            >
              <div className="text-lg font-semibold">Devis</div>
              <div className="mt-1 text-sm text-white/70">0 devis</div>
            </a>
  
            <a
              href="/factures"
              className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
            >
              <div className="text-lg font-semibold">Factures</div>
              <div className="mt-1 text-sm text-white/70">0 facture</div>
            </a>
  
            <a
              href="/calendrier"
              className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
            >
              <div className="text-lg font-semibold">Calendrier</div>
              <div className="mt-1 text-sm text-white/70">0 événement</div>
            </a>
          </div>
  
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Prochaine étape</h2>
            <p className="mt-2 text-white/70">
              On va rendre l’inscription et la connexion fonctionnelles (base de données + session),
              puis on branchera : clients, devis, factures, calendrier.
            </p>
          </div>
        </div>
      </main>
    );
  }
  