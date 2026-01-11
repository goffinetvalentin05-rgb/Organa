"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 w-full z-50 bg-slate-900/60 backdrop-blur-md backdrop-saturate-150 border-b border-white/10 transition-all duration-500 ${
        scrolled 
          ? "bg-slate-900/80 shadow-2xl shadow-black/50 border-white/20" 
          : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-5 flex items-center justify-between">
        <a href="/" className="group">
          <div className="relative w-14 h-14 md:w-16 md:h-16 transition-transform duration-300 group-hover:scale-110">
            <Image 
              src="/organa-logo.png" 
              alt="Organa" 
              fill
              className="object-contain"
              priority
            />
          </div>
        </a>
        <div className="flex items-center gap-4 md:gap-8">
          <a href="#tarifs" className="text-white/80 hover:text-white text-sm md:text-base font-medium transition-colors duration-300 relative group">
            Tarifs
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a href="/connexion" className="text-white/80 hover:text-white text-sm md:text-base font-medium transition-colors duration-300 relative group">
            Connexion
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a 
            href="/inscription" 
            className="relative rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 px-6 py-2.5 text-white text-sm md:text-base font-semibold transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 overflow-hidden group"
          >
            <span className="relative z-10">Commencer</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </a>
        </div>
      </div>
    </nav>
  );
}

