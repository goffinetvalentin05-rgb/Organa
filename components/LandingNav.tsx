"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050B1E]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="group">
          <div className="relative w-12 h-12 md:w-14 md:h-14 transition-transform group-hover:scale-105">
            <Image
              src="/organa-logo.png"
              alt="Organa Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
        
        <div className="flex items-center space-x-6">
          <Link
            href="/#tarifs"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 hidden md:block"
          >
            Tarifs
          </Link>
          <Link
            href="/connexion"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-white/5"
          >
            Connexion
          </Link>
          <Link
            href="/inscription"
            className="px-6 py-2.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm hover:bg-white/20 hover:border-white/30 transition-all duration-200"
          >
            Inscription
          </Link>
        </div>
      </div>
    </nav>
  );
}
