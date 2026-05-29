"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
import { scrollReveal, viewportOnce } from "@/components/landing/landing-motion";

export default function FinalCtaSection() {
  return (
    <section id="cta-final" className="relative scroll-mt-24 pb-20 pt-8 md:pb-28">
      <motion.div
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="relative mx-auto w-[94%] max-w-[900px] overflow-hidden rounded-[1.75rem] border border-blue-400/25 bg-gradient-to-b from-[#1A23FF]/20 via-white/[0.06] to-transparent p-8 text-center shadow-[0_0_80px_rgba(26,35,255,0.25)] md:rounded-[2rem] md:p-14"
      >
        <motion.div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-[20%] top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
          aria-hidden
        />

        <h2 className="relative text-2xl font-black text-white md:text-4xl">
          Votre club mérite mieux qu&apos;un fichier Excel.
        </h2>
        <p className="relative mx-auto mt-4 max-w-md text-sm text-blue-100/80 md:text-base">
          Centralisez votre gestion et gagnez du temps dès maintenant.
        </p>
        <div className="relative mt-8 flex justify-center">
          <LandingPrimaryButton href="/inscription">Tester Obillz gratuitement</LandingPrimaryButton>
        </div>
        <p className="relative mt-5 text-xs text-blue-200/55">
          <Link href="/connexion" className="underline-offset-2 hover:text-white hover:underline">
            Déjà un compte ? Connexion
          </Link>
        </p>
      </motion.div>
    </section>
  );
}
