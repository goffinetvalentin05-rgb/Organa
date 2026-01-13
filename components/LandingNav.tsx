"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo à gauche */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:scale-105">
            <Image
              src="/organa-logo.png"
              alt="Organa Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-white font-semibold text-lg hidden sm:block">Organa</span>
        </Link>
        
        {/* Liens au centre */}
        <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
          <Link
            href="/#fonctionnalites"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200"
          >
            Fonctionnalités
          </Link>
          <Link
            href="/#comment-ca-marche"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200"
          >
            Comment ça marche
          </Link>
          <Link
            href="/#tarifs"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200"
          >
            Tarifs
          </Link>
        </div>
        
        {/* CTA à droite */}
        <div className="flex items-center space-x-4">
          <Link
            href="/connexion"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200"
          >
            Connexion
          </Link>
          <Link
            href="/inscription"
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-all duration-200 border border-blue-500/30"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </nav>
  );
}
