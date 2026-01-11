"use client";

import { useEffect, useState } from "react";

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-black/60 backdrop-blur-xl border-b border-white/20 shadow-lg" 
          : "bg-black/20 backdrop-blur-xl border-b border-white/10"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-xl font-bold text-white hover:text-blue-400 transition-colors duration-200">
          Organa
        </a>
        <div className="flex items-center gap-6">
          <a href="#tarifs" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
            Tarifs
          </a>
          <a href="/connexion" className="text-white/70 hover:text-white text-sm transition-colors duration-200">
            Connexion
          </a>
          <a 
            href="/inscription" 
            className="rounded-lg bg-blue-500 hover:bg-blue-600 px-4 py-2 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105"
          >
            Commencer
          </a>
        </div>
      </div>
    </nav>
  );
}

