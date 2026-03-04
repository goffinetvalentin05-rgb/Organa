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
    <header className="sticky top-0 z-50 overflow-hidden border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-24 md:w-36 lg:w-52 xl:w-64"
        style={{ backgroundColor: "var(--obillz-hero-blue)" }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-40 opacity-35 sm:w-56 md:w-80 lg:w-[28rem]"
        style={{
          background:
            "linear-gradient(90deg, rgba(26,35,255,0.42) 0%, rgba(26,35,255,0.16) 42%, rgba(26,35,255,0) 100%)",
        }}
      />
      <div className="relative mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="transition hover:opacity-90">
          <Image src="/logo-obillz.png" alt="Obillz" width={145} height={38} priority />
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/connexion"
            className="rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-100 md:hidden"
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
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 space-y-2">
            <Link
              href="/connexion"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full rounded-full border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
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
  );
}
