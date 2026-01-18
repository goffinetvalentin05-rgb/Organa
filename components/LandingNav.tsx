import Link from "next/link";
import Image from "next/image";

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white px-6 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-14 w-14">
              <Image
                src="/organa-logo.png"
                alt="Organa Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-semibold text-slate-900">Organa</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/connexion"
              className="hidden sm:inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Découvrir Organa
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
