"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { SportFeature } from "@/lib/sport-features";
import { sportFeatureIcons } from "@/lib/sport-features";

export default function SportFeaturePage({ feature }: { feature: SportFeature }) {
  const reduceMotion = useReducedMotion();
  const transition = { duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] as const };
  const Icon = sportFeatureIcons[feature.id];

  return (
    <main className="sport-feature-page relative min-h-screen overflow-hidden bg-[#F7F9FC] text-[#0F172A]">
      <div className="sport-feature-page__noise" aria-hidden />
      <nav className="relative z-20 mx-auto flex h-24 max-w-[1180px] items-center justify-between px-5">
        <Link href="/" className="flex items-center transition hover:opacity-90" aria-label="Obillz">
          <Image
            src="/obillz-logo.png"
            alt="Obillz"
            width={200}
            height={48}
            priority
            className="landing-nav-logo--on-light h-8 w-auto max-w-[140px] object-contain object-left sm:h-9 sm:max-w-none"
          />
        </Link>
        <Link
          href="/#modules"
          className="flex h-10 items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 text-xs font-extrabold text-[#0F172A] shadow-sm transition hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Toutes les fonctionnalités
        </Link>
      </nav>

      <section className="relative px-5 pb-24 pt-16 sm:pb-32 sm:pt-24">
        <div
          className="pointer-events-none absolute right-[-12rem] top-[-8rem] h-[38rem] w-[38rem] rounded-full blur-3xl"
          style={{ backgroundColor: `${feature.accent}18` }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-[1100px] items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
          >
            <h1 className="sport-feature-page__title">{feature.title}</h1>
            <p className="mt-8 max-w-2xl text-lg font-medium leading-relaxed text-slate-500 sm:text-xl">
              {feature.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ ...transition, delay: 0.12 }}
            className="relative"
          >
            <div
              className="absolute -inset-8 rounded-full blur-3xl"
              style={{ backgroundColor: `${feature.accent}16` }}
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white/90 p-7 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-9">
              <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.17em] text-slate-400">
                    Votre club
                  </p>
                  <p className="mt-1 text-xl font-extrabold tracking-tight">{feature.title}</p>
                </div>
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                  style={{ backgroundColor: feature.accent }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.9} />
                </span>
              </div>
              <div className="mt-7 space-y-3">
                {feature.highlights.map((highlight, index) => (
                  <motion.div
                    key={highlight}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...transition, delay: 0.3 + index * 0.08 }}
                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-[#F7F9FC] p-4"
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${feature.accent}18`,
                        color: feature.accent,
                      }}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                    <span className="text-sm font-extrabold">{highlight}</span>
                  </motion.div>
                ))}
              </div>
              <p className="mt-7 text-xs font-semibold leading-relaxed text-slate-400">
                Une expérience claire, pensée pour les clubs qui veulent gagner du temps sans
                perdre le contrôle.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="sport-feature-cta" aria-labelledby="sport-feature-cta-title">
        <div className="sport-feature-cta__surface" aria-hidden>
          <span className="sport-feature-cta__glow" />
          <span className="sport-feature-cta__grid" />
        </div>
        <div className="sport-feature-cta__inner">
          <h2 id="sport-feature-cta-title" className="sport-feature-cta__title">
            Une gestion plus simple commence ici.
          </h2>
          <p className="sport-feature-cta__subtitle">
            Testez Obillz gratuitement et centralisez la gestion de votre club dès aujourd’hui.
          </p>
          <Link href="/inscription" className="sport-feature-cta__btn">
            Tester gratuitement <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
