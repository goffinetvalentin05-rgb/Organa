"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import HeroProductPreview from "@/components/landing/HeroProductPreview";
import { heroProductWidgets } from "@/components/landing/hero-widgets";
import {
  HeroFloatingWidget,
  ProductWidgetCard,
} from "@/components/landing/ProductWidget";

export default function HeroSection() {
  const mobileWidgets = heroProductWidgets.slice(0, 6);

  return (
    <section className="mt-0 w-full">
      <div className="w-full px-3 pb-6 pt-4 md:px-8 md:pb-8 md:pt-6 lg:px-12">
        <header className="mx-auto flex max-w-[1040px] items-center justify-between gap-4">
          <Link href="/" className="transition hover:opacity-95">
            <Image src="/logo-obillz.png" alt="Obillz" width={124} height={30} priority />
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <a
              href="/#fonctionnalites"
              className="rounded-full border border-white/35 bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-50 transition hover:bg-white/20"
            >
              Fonctions
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
              className="hidden rounded-full border border-white/60 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/10 sm:inline-flex"
            >
              Créer mon club gratuitement
            </Link>
          </div>
        </header>

        <div className="relative mt-4 p-4 pb-8 sm:p-5 md:mt-6 md:pb-20 lg:pb-24">
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,0.11)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.11)_1px,transparent_1px)] [background-size:36px_36px]" />
          <div className="pointer-events-none absolute inset-0 rounded-t-[26px] border border-b-0 border-white/25" />

          <div className="relative z-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 text-center md:mt-14 lg:mt-16"
            >
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100 backdrop-blur-sm md:text-xs">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
                Plateforme pour clubs sportifs
              </p>
              <h1 className="text-balance text-3xl font-black uppercase leading-[1.05] md:text-5xl lg:text-6xl">
                GÉRER UN CLUB SPORTIF
                <br />
                NE DEVRAIT PAS ÊTRE COMPLIQUÉ.
              </h1>
              <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-blue-100 md:text-lg">
                Simplifiez l&apos;administration de votre club, gagnez du temps et offrez une
                organisation claire et professionnelle à votre comité.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/inscription"
                  className="hero-cta-button inline-flex w-full max-w-md items-center justify-center rounded-full bg-white px-7 py-3.5 text-base font-bold text-[#1A23FF] shadow-[0_14px_30px_rgba(15,23,42,0.28)] transition hover:-translate-y-0.5 sm:w-auto"
                >
                  Créer mon club gratuitement
                </Link>
                <a
                  href="#comparaison"
                  className="inline-flex w-full max-w-md items-center justify-center rounded-full border border-white/45 px-7 py-3.5 text-base font-bold text-white transition hover:bg-white/10 sm:w-auto"
                >
                  Voir comment ça fonctionne
                </a>
              </div>
              <p className="mt-3 text-xs text-blue-100/80 md:text-sm">
                Configuration en quelques minutes · sans engagement
              </p>
            </motion.div>

            <div className="relative mx-auto max-w-[920px]">
              {heroProductWidgets.map((widget) => (
                <HeroFloatingWidget key={widget.id} widget={widget} />
              ))}
              <HeroProductPreview />
            </div>

            <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
              {mobileWidgets.map((widget) => (
                <ProductWidgetCard key={widget.id} {...widget} icon={widget.icon} compact />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
