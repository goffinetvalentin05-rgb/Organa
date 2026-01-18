import Link from "next/link";
import Image from "next/image";

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white px-7 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <div className="rounded-full bg-slate-900 p-2 shadow-[0_10px_24px_rgba(15,23,42,0.25)]">
              <div className="relative h-12 w-12">
              <Image
                src="/organa-logo.png"
                alt="Organa Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            </div>
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
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Découvrir Organa
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
