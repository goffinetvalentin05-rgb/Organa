"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import HeroAmbient from "@/components/landing/HeroAmbient";
import HeroProductComposition from "@/components/landing/HeroProductComposition";
import { LandingPrimaryButton, LandingSecondaryButton } from "@/components/landing/LandingButtons";
import { staggerContainer, staggerItem } from "@/components/landing/landing-motion";

const trustPoints = [
  "Cotisations & paiements",
  "Membres centralisés",
  "Événements & buvette",
];

export default function HeroSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start end", "end start"],
  });
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 48]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.97]);

  return (
    <section id="hero" className="relative min-h-[100svh] w-full scroll-mt-0">
      <HeroAmbient />

      <div className="relative w-full px-3 pb-4 pt-4 md:px-8 md:pb-8 md:pt-6 lg:px-12">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-30 mx-auto flex max-w-[1100px] items-center justify-between gap-4"
        >
          <Link href="/" className="transition hover:opacity-95">
            <Image src="/logo-obillz.png" alt="Obillz" width={124} height={30} priority />
          </Link>
          <nav className="hidden items-center gap-2 md:flex" aria-label="Navigation principale">
            {[
              { href: "/#probleme", label: "Le problème" },
              { href: "/#fonctionnalites", label: "Fonctionnalités" },
              { href: "/#comment-ca-marche", label: "Comment ça marche" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full border border-white/30 bg-white/[0.08] px-4 py-1.5 text-xs font-semibold text-blue-50 backdrop-blur-sm transition hover:border-white/50 hover:bg-white/15"
              >
                {link.label}
              </a>
            ))}
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
              className="hidden rounded-full bg-white px-5 py-2 text-sm font-bold text-[#1A23FF] shadow-[0_10px_28px_rgba(2,6,23,0.25)] transition hover:-translate-y-0.5 sm:inline-flex"
            >
              Créer mon club
            </Link>
          </div>
        </motion.header>

        <div
          ref={stageRef}
          className="relative mx-auto mt-4 max-w-[1100px] md:mt-8"
        >
          <div
            className="pointer-events-none absolute -inset-x-4 top-0 bottom-0 rounded-[32px] border border-white/15 bg-gradient-to-b from-white/[0.09] via-white/[0.03] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] md:-inset-x-8 md:rounded-[40px]"
            aria-hidden
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="relative z-10 px-3 pb-4 pt-10 sm:px-6 md:px-10 md:pb-6 md:pt-14 lg:pt-16"
          >
            <motion.div variants={staggerItem} className="mx-auto max-w-4xl text-center">
              <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-white/[0.12] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-50 shadow-[0_8px_32px_rgba(2,6,23,0.2)] backdrop-blur-md md:text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                </span>
                Plateforme pour clubs sportifs
              </p>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="mx-auto max-w-4xl text-balance text-center text-[1.85rem] font-black leading-[1.05] tracking-[-0.035em] text-white sm:text-4xl md:text-[3.25rem] lg:text-[3.6rem]"
            >
              Gérer un club sportif
              <br />
              <span className="bg-gradient-to-r from-white via-blue-50 to-blue-200/90 bg-clip-text text-transparent">
                ne devrait pas être un casse-tête administratif.
              </span>
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="mx-auto mt-6 max-w-2xl text-pretty text-center text-sm leading-relaxed text-blue-100/95 md:text-lg md:leading-relaxed"
            >
              Obillz remplace Excel, WhatsApp et la paperasse par une seule plateforme — membres,
              cotisations, factures, événements et buvette, tout au même endroit.
            </motion.p>

            <motion.ul
              variants={staggerItem}
              className="mx-auto mt-7 flex max-w-xl flex-wrap items-center justify-center gap-2"
            >
              {trustPoints.map((point) => (
                <li
                  key={point}
                  className="rounded-full border border-white/22 bg-white/[0.1] px-3.5 py-1.5 text-[11px] font-semibold text-blue-50 shadow-sm backdrop-blur-sm md:text-xs"
                >
                  {point}
                </li>
              ))}
            </motion.ul>

            <motion.div
              variants={staggerItem}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
            >
              <LandingPrimaryButton href="/inscription" className="w-full max-w-md sm:max-w-none">
                Créer mon club gratuitement
              </LandingPrimaryButton>
              <LandingSecondaryButton href="#comparaison" className="w-full max-w-md sm:max-w-none">
                Voir la solution
              </LandingSecondaryButton>
            </motion.div>

            <motion.p
              variants={staggerItem}
              className="mt-4 text-center text-xs text-blue-100/70 md:text-sm"
            >
              Gratuit pour démarrer · configuration en 2 minutes · sans engagement
            </motion.p>
          </motion.div>

          <motion.div style={{ y: mockupY, scale: mockupScale }} className="relative z-10">
            <HeroProductComposition />
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        aria-hidden
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200/60">
          Découvrir
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="h-8 w-5 rounded-full border border-white/30 p-1"
        >
          <div className="mx-auto h-1.5 w-1 rounded-full bg-white/70" />
        </motion.div>
      </motion.div>
    </section>
  );
}
