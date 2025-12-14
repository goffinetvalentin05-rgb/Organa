import "./globals.css";

export const metadata = {
  title: "Organa",
  description: "La gestion simple pour les indépendants",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-black text-white">
        {/* HEADER */}
        <header className="w-full border-b border-white/10">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
            <a href="/" className="text-xl font-bold">
              Organa
            </a>

            <nav className="flex items-center gap-4">
              <a
                href="/connexion"
                className="text-sm text-white/80 hover:text-white"
              >
                Connexion
              </a>
              <a
                href="/inscription"
                className="text-sm bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                Créer un compte
              </a>
            </nav>
          </div>
        </header>

        {/* CONTENU DES PAGES */}
        <main>{children}</main>
      </body>
    </html>
  );
}

