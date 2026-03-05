"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative z-50 bg-[linear-gradient(180deg,#1A23FF_0%,#1B2CF0_60%,#1A2BE6_100%)] px-2 pb-2 pt-5 sm:px-3">
      <header className="mx-auto w-[95%] overflow-hidden rounded-[40px] bg-[linear-gradient(180deg,#1A23FF_0%,#1B2CF0_60%,#1A2BE6_100%)] md:w-[85%]">
        <div className="mx-auto w-full max-w-[1200px]">
        <div className="relative flex h-20 items-center justify-between px-4 md:px-7">
          <Link href="/" className="transition hover:opacity-90">
            <Image src="/logo-obillz.png" alt="Obillz" width={145} height={38} priority />
          </Link>

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
          <div className="border-t border-white/15 bg-[linear-gradient(180deg,#1A23FF_0%,#1B2CF0_60%,#1A2BE6_100%)] px-4 pb-5 pt-3 md:hidden">
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
        </div>
      </header>
    </div>
  );
}
