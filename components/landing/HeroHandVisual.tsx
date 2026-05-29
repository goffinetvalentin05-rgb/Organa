"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";

/** Main + tuile Obillz — en bas de page, depuis le bord droit. */
export default function HeroHandVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-visible pb-0 pt-6 md:pt-10" aria-hidden>
      <div className="pointer-events-none relative mx-auto w-full max-w-[1400px]">
        <div
          className="absolute bottom-[10%] right-[5%] h-[min(70vw,520px)] w-[min(55vw,420px)] bg-[radial-gradient(ellipse_at_80%_90%,rgba(26,35,255,0.35),transparent_65%)] blur-3xl"
          aria-hidden
        />

        <motion.div
          initial={{ opacity: 0, x: 80, y: 40 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 1, ease: easePremium }}
          className="relative ml-auto w-[min(118vw,1000px)] translate-x-[5%] sm:translate-x-[4%] md:translate-x-[2%] lg:w-[min(105vw,1100px)]"
        >
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <Image
              src="/images/hero-hand-obillz-transparent.png"
              alt=""
              width={1200}
              height={1200}
              className="h-auto w-full select-none object-contain"
              sizes="(max-width: 768px) 118vw, 1100px"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
