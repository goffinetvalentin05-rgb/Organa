"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const navItems = [
  { label: "Fonctionnalités", href: "/#apercu-plateforme" },
  { label: "Ressources", href: "/#hero-obillz" },
  { label: "Tarifs", href: "/tarifs" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 px-2 sm:px-3">
      <header className="mx-auto w-full max-w-[1200px] overflow-hidden rounded-b-2xl border border-blue-300/25 bg-[rgba(26,35,255,0.92)] shadow-[0_12px_34px_rgba(15,23,42,0.3)] backdrop-blur">
        <div className="relative flex h-20 items-center justify-between px-4 md:px-7">
          <Link href="/" className="transition hover:opacity-90">
            <Image src="/logo-obillz.png" alt="Obillz" width={145} height={38} priority />
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-blue-100 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/connexion"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Connexion
            </Link>
            <Link
              href="/connexion?demo=1"
              className="rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(37,99,235,0.35)]"
            >
              Demander une démo
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white/15 md:hidden"
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
          <div className="border-t border-white/15 bg-[rgba(17,28,214,0.98)] px-4 pb-5 pt-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 space-y-2">
              <Link
                href="/connexion"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full rounded-full border border-white/25 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Connexion
              </Link>
              <Link
                href="/connexion?demo=1"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-[0_10px_25px_rgba(37,99,235,0.3)]"
              >
                Demander une démo
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
