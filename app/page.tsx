export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6">
      <h1 className="text-4xl md:text-5xl font-bold text-center">
        Organa
        <span className="block text-primary mt-2">
          La gestion simple pour les indépendants
        </span>
      </h1>

      <p className="mt-6 max-w-2xl text-center text-lg text-gray-300">
        Créez des devis et factures professionnels, transformez vos devis en factures,
        gérez vos clients, planifiez vos rendez-vous et modifiez tout manuellement,
        sans dépendre d’une IA.
      </p>

      <ul className="mt-6 space-y-2 text-gray-300">
        <li>📄 Devis → Factures en 1 clic</li>
        <li>🧾 Documents A4 professionnels (PDF)</li>
        <li>✏️ Modification totale par l’entreprise</li>
        <li>📅 Calendrier intégré</li>
        <li>💳 Abonnements mensuel & annuel</li>
      </ul>

      <a
        href="/inscription"
        className="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-black font-semibold hover:bg-gray-200 transition"
      >
        Essayez Organa gratuitement
      </a>
    </main>
  );
}
