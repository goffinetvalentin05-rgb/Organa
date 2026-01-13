"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#03062A]/95 via-[#050A3A]/95 to-transparent backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative w-10 h-10 md:w-12 md:h-12 transition-transform group-hover:scale-105">
            <Image
              src="/organa-logo.png"
              alt="Organa Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Organa
          </span>
        </Link>
        
        <div className="flex items-center space-x-6">
          <Link
            href="/#tarifs"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden md:block"
          >
            Tarifs
          </Link>
          <Link
            href="/connexion"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/inscription"
            className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Découvrir Organa
          </Link>
        </div>
      </div>
    </nav>
  );
}
