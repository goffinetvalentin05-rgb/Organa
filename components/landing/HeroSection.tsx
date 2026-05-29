"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import HeroAmbient from "@/components/landing/HeroAmbient";
import HeroProductScene from "@/components/landing/HeroProductScene";
import { LandingPrimaryButton, LandingSecondaryButton } from "@/components/landing/LandingButtons";
import { easePremium, staggerContainer, staggerItem } from "@/components/landing/landing-motion";

const titleBefore = "Gérer un club sportif";
const titleHighlight = "ne devrait pas être compliqué.";

export default function HeroSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start end", "end start"],
  });
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 72]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.94]);

  return (
    <section id="hero" className="relative min-h-[100svh] w-full scroll-mt-0 pb-8 md:pb-14">
      <HeroAmbient />

      <div className="relative w-full px-3 pt-4 md:px-8 md:pt-6 lg:px-12">
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easePremium }}
          className="relative z-30 mx-auto flex max-w-[1160px] items-center justify-between gap-4"
        >
          <Link href="/" className="transition hover:opacity-95">
            <Image src="/logo-obillz.png" alt="Obillz" width={124} height={30} priority />
          </Link>
          <nav className="hidden items-center gap-2 md:flex" aria-label="Navigation principale">
            {[
              { href: "/#probleme", label: "Le problème" },
              { href: "/#centralise", label: "La solution" },
              { href: "/#fonctionnalites", label: "Fonctionnalités" },
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

        <div ref={stageRef} className="relative mx-auto mt-8 max-w-[1160px] md:mt-12 lg:mt-14">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="relative z-10 px-1 text-center sm:px-4 md:px-8"
          >
            <motion.div variants={staggerItem} className="mx-auto max-w-4xl">
              <p className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-white/35 bg-white/[0.14] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-50 shadow-[0_8px_32px_rgba(2,6,23,0.25)] backdrop-blur-md md:text-xs">
                <span className="relative flex h-2 w-2">
                  {!reduceMotion ? (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-300 opacity-50" />
                  ) : null}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-200 shadow-[0_0_10px_rgba(191,219,254,0.9)]" />
                </span>
                Plateforme pour clubs sportifs
              </p>
            </motion.div>

            <motion.h1
              variants={staggerContainer}
              className="mx-auto max-w-4xl text-balance"
            >
              <motion.span
                variants={staggerItem}
                className="block text-[1.85rem] font-black leading-[1.05] tracking-[-0.035em] text-white sm:text-4xl md:text-[3.15rem] lg:text-[3.5rem]"
              >
                {titleBefore}
              </motion.span>
              <motion.span
                variants={staggerItem}
                className="mt-2 inline-block"
              >
                <span className="relative inline-block rounded-xl border border-white/40 bg-white/[0.08] px-3 py-1 text-[1.85rem] font-black leading-[1.05] tracking-[-0.035em] text-white shadow-[0_0_40px_rgba(255,255,255,0.12)] sm:text-4xl md:rounded-2xl md:px-4 md:py-1.5 md:text-[3.15rem] lg:text-[3.5rem]">
                  {titleHighlight}
                </span>
              </motion.span>
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="mx-auto mt-6 max-w-2xl text-pretty text-sm leading-relaxed text-blue-100/95 md:text-lg"
            >
              Obillz centralise les membres, cotisations, factures, événements, buvette et plus
              encore, pour simplifier l&apos;administration du club.
            </motion.p>

            <motion.div
              variants={staggerItem}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 md:mt-10"
            >
              <LandingPrimaryButton href="/inscription" className="w-full max-w-md sm:max-w-none">
                Créer mon club gratuitement
              </LandingPrimaryButton>
              <LandingSecondaryButton
                href="#comment-ca-marche"
                className="w-full max-w-md sm:max-w-none"
              >
                Voir comment ça marche
              </LandingSecondaryButton>
            </motion.div>

            <motion.p
              variants={staggerItem}
              className="mt-5 text-center text-[11px] font-medium tracking-wide text-blue-100/80 md:text-sm"
            >
              Gratuit pour démarrer · Configuration en quelques minutes · Sans engagement
            </motion.p>
          </motion.div>

          <motion.div
            style={reduceMotion ? undefined : { y: mockupY, scale: mockupScale }}
            className="relative z-10 mt-12 md:mt-14 lg:mt-16"
          >
            <HeroProductScene />
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
        aria-hidden
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200/55">
          Découvrir
        </span>
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, 7, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-8 w-5 rounded-full border border-white/30 p-1"
        >
          <div className="mx-auto h-1.5 w-1 rounded-full bg-white/70" />
        </motion.div>
      </motion.div>
    </section>
  );
}
