"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import HeroProductComposition from "@/components/landing/HeroProductComposition";

const trustPoints = [
  "Cotisations & paiements",
  "Membres centralisés",
  "Événements & buvette",
];

export default function HeroSection() {
  return (
    <section id="hero" className="relative mt-0 w-full scroll-mt-0">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[min(70vh,640px)] bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(255,255,255,0.14),transparent_62%)]" aria-hidden />

      <div className="relative w-full px-3 pb-8 pt-4 md:px-8 md:pb-12 md:pt-6 lg:px-12">
        <header className="relative z-30 mx-auto flex max-w-[1040px] items-center justify-between gap-4">
          <Link href="/" className="transition hover:opacity-95">
            <Image src="/logo-obillz.png" alt="Obillz" width={124} height={30} priority />
          </Link>
          <nav className="hidden items-center gap-2 md:flex" aria-label="Navigation principale">
            <a
              href="/#probleme"
              className="rounded-full border border-white/35 bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-50 transition hover:bg-white/20"
            >
              Le problème
            </a>
            <a
              href="/#fonctionnalites"
              className="rounded-full border border-white/35 bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-50 transition hover:bg-white/20"
            >
              Fonctionnalités
            </a>
            <a
              href="/#comment-ca-marche"
              className="rounded-full border border-white/35 bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-50 transition hover:bg-white/20"
            >
              Comment ça marche
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/connexion"
              className="rounded-full border border-white/45 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 md:px-5"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="hidden rounded-full bg-white px-5 py-2 text-sm font-bold text-[#1A23FF] shadow-[0_10px_24px_rgba(2,6,23,0.22)] transition hover:-translate-y-0.5 sm:inline-flex"
            >
              Créer mon club gratuitement
            </Link>
          </div>
        </header>

        <div className="relative mx-auto mt-6 max-w-[1040px] md:mt-10">
          <div className="pointer-events-none absolute inset-0 rounded-t-[28px] border border-b-0 border-white/20 bg-gradient-to-b from-white/[0.06] to-transparent" aria-hidden />
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:40px_40px] rounded-t-[28px]" aria-hidden />

          <div className="relative z-10 px-2 pb-6 pt-8 sm:px-4 md:px-6 md:pb-10 md:pt-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-4xl text-center"
            >
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100 backdrop-blur-sm md:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" aria-hidden />
                Plateforme pour clubs sportifs
              </p>

              <h1 className="text-balance text-[1.75rem] font-black leading-[1.06] tracking-[-0.03em] text-white sm:text-4xl md:text-5xl lg:text-[3.35rem]">
                Gérer un club sportif
                <br className="hidden sm:block" />
                <span className="text-blue-100/95"> ne devrait pas être un casse-tête administratif.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-blue-100/95 md:text-lg">
                Obillz centralise membres, cotisations, factures, événements et buvette — pour que le
                comité arrête de jongler entre Excel, WhatsApp et la paperasse.
              </p>

              <ul className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-2">
                {trustPoints.map((point) => (
                  <li
                    key={point}
                    className="rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold text-blue-50 backdrop-blur-sm md:text-xs"
                  >
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/inscription"
                  className="hero-cta-button inline-flex w-full max-w-md items-center justify-center rounded-full bg-white px-7 py-3.5 text-base font-bold text-[#1A23FF] shadow-[0_14px_30px_rgba(15,23,42,0.28)] transition hover:-translate-y-0.5 sm:w-auto"
                >
                  Créer mon club gratuitement
                </Link>
                <a
                  href="#comparaison"
                  className="inline-flex w-full max-w-md items-center justify-center rounded-full border border-white/45 bg-white/[0.06] px-7 py-3.5 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/12 sm:w-auto"
                >
                  Voir la solution
                </a>
              </div>
              <p className="mt-3 text-xs text-blue-100/75 md:text-sm">
                Configuration en quelques minutes · sans engagement
              </p>
            </motion.div>

            <HeroProductComposition />
          </div>
        </div>
      </div>
    </section>
  );
}
