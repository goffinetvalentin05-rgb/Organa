import Link from "next/link";

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-3">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white px-7 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(79,70,229,0.35)]">
              OZ
            </div>
            <span className="text-sm font-semibold text-slate-900">OBILLZ</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/connexion"
              className="hidden sm:inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
