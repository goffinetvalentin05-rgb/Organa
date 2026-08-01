"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, HeartHandshake, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import ProductSwitcher from "@/components/ProductSwitcher";
import type { AssociationFeature } from "@/lib/associations";
import {
  ASSOCIATIONS_PUBLIC_LAUNCH_ENABLED,
  ASSOCIATIONS_WAITLIST_HREF,
} from "@/lib/associations/public-launch";
import styles from "./associations.module.css";

export default function AssociationFeaturePage({ feature }: { feature: AssociationFeature }) {
  const reduceMotion = useReducedMotion();
  const transition = { duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <main className={`${styles.page} relative min-h-screen`}>
      <div className={styles.noise} />
      <nav className="relative z-20 mx-auto flex h-24 max-w-[1180px] items-center justify-between px-5">
        <Link href="/associations" className="flex items-center gap-2.5 text-base font-black tracking-[-.045em]">
          <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px] bg-[#17211d] text-sm text-white">
            <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-[#ed7059]" />O
          </span>
          obillz <span className="hidden font-semibold text-[#ed7059] sm:inline">associations</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block"><ProductSwitcher current="associations" theme="light" align="right" /></div>
          <Link href="/associations#fonctionnalites" className="flex h-10 items-center gap-2 rounded-full border border-[#17211d]/10 bg-white px-4 text-xs font-extrabold shadow-sm transition hover:-translate-y-0.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Toutes les fonctionnalités
          </Link>
        </div>
      </nav>

      <section className="relative px-5 pb-24 pt-16 sm:pb-32 sm:pt-24">
        <div className="pointer-events-none absolute right-[-12rem] top-[-8rem] h-[38rem] w-[38rem] rounded-full blur-3xl" style={{ backgroundColor: `${feature.accent}18` }} />
        <div className="relative mx-auto grid max-w-[1100px] items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={transition}>
            <div className="mb-7 flex flex-wrap items-center gap-2">
              {!ASSOCIATIONS_PUBLIC_LAUNCH_ENABLED ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#17211d]/10 bg-[#17211d] px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-[#ed7059]" />
                  Bientôt disponible
                </span>
              ) : null}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#17211d]/10 bg-white/70 px-4 py-2 text-xs font-extrabold shadow-sm">
                <Sparkles className="h-3.5 w-3.5" style={{ color: feature.accent }} /> Obillz Associations
              </div>
            </div>
            <h1 className={styles.display}>{feature.title}</h1>
            <p className="mt-8 max-w-2xl text-lg font-medium leading-relaxed text-[#65716b] sm:text-xl">{feature.description}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {ASSOCIATIONS_PUBLIC_LAUNCH_ENABLED ? (
                <>
                  <Link href="/associations/inscription" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#17211d] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5">
                    Créer un compte <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/associations/connexion" className="inline-flex items-center justify-center rounded-full border border-[#17211d]/15 bg-white px-6 py-3.5 text-sm font-extrabold">
                    Connexion
                  </Link>
                </>
              ) : (
                <a
                  href={ASSOCIATIONS_WAITLIST_HREF}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#17211d] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5"
                >
                  Rejoindre la liste d’attente <ArrowRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ ...transition, delay: 0.12 }} className="relative">
            <div className="absolute -inset-8 rounded-full blur-3xl" style={{ backgroundColor: `${feature.accent}16` }} />
            <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white/85 p-7 shadow-[0_30px_90px_rgba(42,52,47,.14)] backdrop-blur-xl sm:p-9">
              <div className="flex items-center justify-between border-b border-[#17211d]/[0.07] pb-6">
                <div><p className="text-[10px] font-black uppercase tracking-[.17em] text-[#87918c]">Votre association</p><p className="mt-1 text-xl font-extrabold tracking-tight">{feature.title}</p></div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: feature.accent }}><HeartHandshake className="h-5 w-5" /></span>
              </div>
              <div className="mt-7 space-y-3">
                {feature.highlights.map((highlight, index) => (
                  <motion.div key={highlight} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ ...transition, delay: 0.3 + index * 0.08 }} className="flex items-center gap-4 rounded-2xl border border-[#17211d]/[0.07] bg-[#fbfaf6] p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${feature.accent}18`, color: feature.accent }}><Check className="h-4 w-4" strokeWidth={3} /></span>
                    <span className="text-sm font-extrabold">{highlight}</span>
                  </motion.div>
                ))}
              </div>
              <p className="mt-7 text-xs font-semibold leading-relaxed text-[#7b8780]">Une expérience claire et accessible, pensée pour les personnes qui donnent déjà beaucoup de leur temps.</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative bg-[#17211d] px-5 py-20 text-center text-white">
        <div className={styles.noise} style={{ opacity: 0.08, mixBlendMode: "screen" }} />
        <div className="relative mx-auto max-w-3xl">
          <h2 className="text-3xl font-extrabold tracking-[-.045em] sm:text-5xl">Une gestion plus simple commence ici.</h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/55">
            {ASSOCIATIONS_PUBLIC_LAUNCH_ENABLED
              ? "Parlez-nous de votre association et découvrez une solution adaptée à votre quotidien."
              : "Obillz Associations arrive prochainement. Inscrivez-vous pour être informé du lancement."}
          </p>
          {ASSOCIATIONS_PUBLIC_LAUNCH_ENABLED ? (
            <Link href="/associations/inscription" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#ed7059] px-7 py-3.5 text-sm font-extrabold shadow-lg transition hover:-translate-y-0.5">
              Créer un compte <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <a
              href={ASSOCIATIONS_WAITLIST_HREF}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#ed7059] px-7 py-3.5 text-sm font-extrabold shadow-lg transition hover:-translate-y-0.5"
            >
              Rejoindre la liste d’attente <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
