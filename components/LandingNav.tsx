import Link from "next/link";

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-white">
          Organa
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/connexion"
            className="text-white/80 hover:text-white transition-colors duration-200"
          >
            Connexion
          </Link>
          <Link
            href="/inscription"
            className="rounded-xl bg-blue-500 hover:bg-blue-600 px-6 py-2 text-white font-semibold transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
          >
            Inscription
          </Link>
        </div>
      </div>
    </nav>
  );
}
