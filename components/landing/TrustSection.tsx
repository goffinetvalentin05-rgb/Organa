"use client";

import { motion } from "framer-motion";
import { scrollReveal, viewportOnce } from "@/components/landing/landing-motion";

function SwissFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Drapeau suisse"
      role="img"
    >
      <rect width="32" height="32" fill="#DA291C" />
      <path d="M13.5 7h5v5.5H24v5h-5.5V23h-5v-5.5H8v-5h5.5z" fill="#FFFFFF" />
    </svg>
  );
}

export default function TrustSection() {
  return (
    <section id="confiance" className="relative py-14 md:py-20">
      <motion.div
        variants={scrollReveal}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="mx-auto w-[94%] max-w-[720px] rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-8 text-center backdrop-blur-md md:px-10 md:py-10"
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-5">
          <SwissFlag className="h-9 w-9 shrink-0 rounded-[5px] shadow-md" />
          <p className="text-sm leading-relaxed text-blue-100/85 md:text-base">
            Déjà utilisé par des clubs de la région. Construit en Suisse, pour les réalités des
            associations sportives.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
