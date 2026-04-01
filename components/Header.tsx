"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="sticky top-5 z-[100] mx-auto w-[92%] max-w-[1240px]">
      <header className="overflow-hidden rounded-[38px] border border-white/35 bg-white/80 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-md">
        <div className="mx-auto w-full max-w-[1220px]">
        <div className="relative flex h-20 items-center justify-between px-4 md:px-7">
          <Link href="/" className="transition hover:opacity-90">
            <Image src="/logo-obillz-bleu.png" alt="Obillz" width={145} height={38} priority />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex">
            <a href="/#fonctionnalites" className="transition hover:text-slate-900">
              Fonctionnalités
            </a>
            <a href="/#comparaison" className="transition hover:text-slate-900">
              Comment ça marche
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/connexion"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Connexion
            </Link>
            <a
              href="/inscription"
              className="rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(37,99,235,0.35)]"
            >
              Créer mon club gratuitement
            </a>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-50 md:hidden"
            aria-expanded={isMenuOpen}
            aria-label="Ouvrir le menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
              <path
                d={isMenuOpen ? "M6 6L18 18M6 18L18 6" : "M4 7h16M4 12h16M4 17h16"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 md:hidden">
            <div className="mt-2 space-y-1 text-sm font-medium text-slate-700">
              <a href="/#fonctionnalites" onClick={() => setIsMenuOpen(false)} className="block px-2 py-2">
                Fonctionnalités
              </a>
              <a href="/#comparaison" onClick={() => setIsMenuOpen(false)} className="block px-2 py-2">
                Comment ça marche
              </a>
            </div>
            <div className="mt-4 space-y-2">
              <Link
                href="/connexion"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full rounded-full border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Connexion
              </Link>
              <a
                href="/inscription"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-[0_10px_25px_rgba(37,99,235,0.3)]"
              >
                Créer mon club gratuitement
              </a>
            </div>
          </div>
        )}
        </div>
      </header>
    </div>
  );
}
