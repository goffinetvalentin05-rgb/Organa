"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LandingPrimaryButton } from "@/components/landing/LandingButtons";
import { easePremium, scrollReveal, viewportOnce } from "@/components/landing/landing-motion";

const steps = [
  {
    num: "01",
    title: "Créez votre club",
    description: "Quelques minutes pour configurer votre espace.",
  },
  {
    num: "02",
    title: "Ajoutez vos membres",
    description:
      "Import ou saisie quand vous le souhaitez — vous pouvez démarrer sans liste complète.",
  },
  {
    num: "03",
    title: "Activez ce dont vous avez besoin",
    description:
      "Cotisations, événements, buvette, factures, page publique, campagnes… activez les modules utiles à votre club.",
  },
  {
    num: "04",
    title: "Pilotez au quotidien",
    description:
      "Envoyez, suivez, communiquez et encaissez depuis un seul tableau de bord, sur ordinateur ou mobile.",
  },
];

export default function HowItWorksSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="comment-ca-marche" className="relative scroll-mt-24 py-16 md:py-24">
      <div
        className="pointer-events-none absolute inset-x-[15%] top-1/2 h-64 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(26,35,255,0.14),transparent_70%)] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-[94%] max-w-[920px]">
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80">
            Comment ça marche
          </p>
          <h2 className="mt-3 text-2xl font-black text-white md:text-4xl">Simple à mettre en place.</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-blue-100/70 md:text-base">
            Pas besoin de tout configurer d&apos;un coup — avancez à votre rythme, module par module.
          </p>
        </motion.div>

        <div className="relative mt-12 md:mt-16">
          <div
            className="absolute left-6 top-6 bottom-6 w-px md:left-1/2 md:-translate-x-px"
            aria-hidden
          >
            <div className="h-full w-full bg-gradient-to-b from-transparent via-blue-500/25 to-transparent" />
            {!reduceMotion ? (
              <motion.div
                className="absolute left-0 top-0 w-full bg-gradient-to-b from-[#1A23FF] via-[#93c5fd] to-[#1A23FF] opacity-60"
                initial={{ height: "0%" }}
                whileInView={{ height: "100%" }}
                viewport={{ once: true, margin: "-20%" }}
                transition={{ duration: 1.8, ease: easePremium }}
              />
            ) : null}
          </div>

          <div className="space-y-10 md:space-y-12">
            {steps.map((step, i) => (
              <StepRow key={step.num} step={step} index={i} reduceMotion={!!reduceMotion} />
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

function StepRow({
  step,
  index,
  reduceMotion,
}: {
  step: (typeof steps)[number];
  index: number;
  reduceMotion: boolean;
}) {
  const isEven = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: isEven ? -28 : 28 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.6, delay: index * 0.08, ease: easePremium }}
      className={`relative flex gap-6 md:gap-10 ${isEven ? "" : "md:flex-row-reverse"}`}
    >
      <motion.div
        className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-400/45 bg-[#0a0f24] text-sm font-black text-blue-200 shadow-[0_0_28px_rgba(26,35,255,0.45)] md:absolute md:left-1/2 md:-translate-x-1/2"
        animate={
          reduceMotion
            ? undefined
            : { boxShadow: ["0 0 20px rgba(26,35,255,0.35)", "0 0 32px rgba(147,197,253,0.5)", "0 0 20px rgba(26,35,255,0.35)"] }
        }
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
      >
        {step.num}
      </motion.div>

      <motion.article
        whileHover={reduceMotion ? undefined : { y: -3 }}
        className={`group flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-md transition-[border-color,box-shadow] duration-300 hover:border-blue-400/30 hover:shadow-[0_0_40px_rgba(26,35,255,0.18)] md:max-w-[calc(50%-3.25rem)] ${
          isEven ? "md:mr-auto md:pr-16 md:text-right" : "md:ml-auto md:pl-16 md:text-left"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
            isEven ? "" : ""
          }`}
          aria-hidden
        />
        <h3 className="text-lg font-bold text-white">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-blue-100/70">{step.description}</p>
      </motion.article>
    </motion.div>
  );
}
