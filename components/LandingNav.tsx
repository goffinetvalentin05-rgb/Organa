import Link from "next/link";
import Image from "next/image";

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo à gauche */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative w-10 h-10 md:w-11 md:h-11">
            <Image
              src="/organa-logo.png"
              alt="Organa Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-sm font-semibold text-slate-900">Organa</span>
        </Link>
        
        {/* Liens au centre */}
        <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
          {[
            { href: "/#fonctionnalites", label: "Fonctionnalités" },
            { href: "/#avantages", label: "Avantages" },
            { href: "/#temoignages", label: "Témoignages" },
          ].map((link, index) => (
            <Link
              key={`${link.href}-${index}`}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
        
        {/* CTA à droite */}
        <div className="flex items-center space-x-4">
          <Link
            href="/connexion"
            className="hidden sm:inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/inscription"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Commencer
          </Link>
        </div>
      </div>
    </nav>
  );
}
