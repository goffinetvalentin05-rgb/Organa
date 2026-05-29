"use client";

import { motion } from "framer-motion";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
import { easePremium, scrollReveal, viewportOnce } from "@/components/landing/landing-motion";

const steps = [
  { num: "01", title: "Créez votre club", description: "Quelques minutes pour configurer votre espace." },
  {
    num: "02",
    title: "Ajoutez vos membres et cotisations",
    description: "Import ou saisie — tout est centralisé.",
  },
  {
    num: "03",
    title: "Envoyez, suivez et encaissez",
    description: "Factures, relances et paiements au même endroit.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="comment-ca-marche" className="relative scroll-mt-24 py-16 md:py-24">
      <div className="relative mx-auto w-[94%] max-w-[900px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center"
        >
          <h2 className="text-2xl font-black text-white md:text-4xl">Simple à mettre en place.</h2>
        </motion.div>

        <div className="relative mt-12 md:mt-16">
          <div
            className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-blue-500/50 to-transparent md:left-1/2 md:-translate-x-px"
            aria-hidden
          />

          <div className="space-y-10 md:space-y-14">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.6, delay: i * 0.1, ease: easePremium }}
                className={`relative flex gap-6 md:gap-10 ${
                  i % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-400/40 bg-[#0a0f24] text-sm font-black text-blue-300 shadow-[0_0_24px_rgba(26,35,255,0.4)] md:absolute md:left-1/2 md:-translate-x-1/2">
                  {step.num}
                </div>
                <div
                  className={`flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-md md:max-w-[calc(50%-3rem)] ${
                    i % 2 === 0 ? "md:mr-auto md:pr-16 md:text-right" : "md:ml-auto md:pl-16 md:text-left"
                  }`}
                >
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-blue-100/70">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, ease: easePremium }}
          className="mt-12 flex justify-center md:mt-14"
        >
          <LandingPrimaryButton href="/inscription">Tester Obillz gratuitement</LandingPrimaryButton>
        </motion.div>
      </div>
    </section>
  );
}
