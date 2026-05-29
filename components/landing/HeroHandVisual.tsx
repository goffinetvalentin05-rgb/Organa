"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";

/**
 * Main + tuile Obillz — pleine largeur viewport, collée au bord droit et bas.
 * Le PNG contient un peu de marge transparente : léger décalage vers la droite.
 */
export default function HeroHandVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="relative left-1/2 z-0 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden pb-0 pt-6 md:pt-10"
      aria-hidden
    >
      <div className="relative h-[min(78vw,640px)] sm:h-[min(68vw,700px)] md:h-[min(60vw,760px)] lg:h-[min(54vw,820px)]">
        <div
          className="pointer-events-none absolute bottom-[8%] right-0 h-[min(72vw,540px)] w-[min(58vw,460px)] bg-[radial-gradient(ellipse_at_100%_90%,rgba(26,35,255,0.38),transparent_68%)] blur-3xl"
          aria-hidden
        />

        <motion.div
          initial={{ opacity: 0, x: 48, y: 36 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 1, ease: easePremium }}
          className="absolute bottom-0 right-0 w-[min(128vw,1380px)] max-w-none translate-x-[7vw] sm:translate-x-[6vw] md:translate-x-[5vw] lg:translate-x-[4vw] xl:translate-x-[3.25vw] 2xl:translate-x-[2.75vw]"
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
              className="block h-auto w-full select-none object-contain object-right-bottom"
              sizes="(max-width: 640px) 128vw, (max-width: 1280px) 120vw, 1380px"
              priority={false}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
