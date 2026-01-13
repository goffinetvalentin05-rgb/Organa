"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#03062A]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="group">
          <div className="relative w-10 h-10 md:w-12 md:h-12 transition-transform group-hover:scale-105">
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
            className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200"
          >
            Connexion
          </Link>
          <Link
            href="/inscription"
            className="px-5 py-2.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm hover:bg-white/20 hover:border-white/30 transition-all duration-200"
          >
            Inscription
          </Link>
        </div>
      </div>
    </nav>
  );
}
