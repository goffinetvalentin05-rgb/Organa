"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import BenefitsSection from "@/components/landing/BenefitsSection";
import FeaturesShowcaseSection from "@/components/landing/FeaturesShowcaseSection";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LandingBackground from "@/components/landing/LandingBackground";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import {
  obillzLandingGridOverlayClass,
  obillzLandingRootClass,
} from "@/components/ui/styles";

const faqItems = [
  {
    question: "À qui s'adresse Obillz ?",
    answer:
      "Obillz est pensé pour les clubs sportifs locaux et leurs comités. La plateforme s'adapte aussi bien aux petits clubs qu'aux structures avec plusieurs équipes.",
  },
  {
    question: "Combien de temps faut-il pour commencer ?",
    answer:
      "La mise en place du club prend seulement quelques minutes. Vous créez votre espace, importez vos membres et vous êtes prêts à gérer votre première cotisation ou votre premier événement.",
  },
  {
    question: "Est-ce facile à utiliser ?",
    answer:
      "Oui. Obillz est conçu pour être simple et rapide à prendre en main par les comités de clubs, même sans compétences techniques particulières.",
  },
  {
    question: "Est-ce que plusieurs personnes peuvent gérer le club ?",
    answer:
      "Oui. Plusieurs membres du comité peuvent accéder à la plateforme et collaborer sur la gestion des membres, des cotisations, des événements ou des factures.",
  },
  {
    question: "Comment fonctionnent les cotisations ?",
    answer:
      "Vous générez les cotisations en quelques clics et elles sont envoyées automatiquement aux membres par email. Vous suivez les paiements en temps réel depuis votre tableau de bord.",
  },
  {
    question: "Comment se passent les inscriptions aux événements ?",
    answer:
      "Vous créez un lien ou un QR code à partager au club. Les membres et participants s'inscrivent en quelques secondes, et toutes les réponses sont centralisées au même endroit.",
  },
  {
    question: "Puis-je créer des factures depuis la plateforme ?",
    answer:
      "Oui. Vous créez des factures propres et professionnelles en quelques secondes et vous pouvez les envoyer directement par email, sans passer par un autre outil.",
  },
  {
    question: "Est-ce accessible sur téléphone ?",
    answer:
      "Oui. La plateforme fonctionne sur ordinateur, tablette et téléphone, pour gérer le club aussi bien depuis le bureau que depuis les vestiaires.",
  },
  {
    question: "Mes données sont-elles en sécurité ?",
    answer:
      "Vos données sont stockées de manière sécurisée. Obillz est un logiciel suisse, développé et hébergé en Suisse, pensé pour respecter la confidentialité des clubs.",
  },
  {
    question: "Y a-t-il un accompagnement si j'ai besoin d'aide ?",
    answer:
      "Oui. Notre équipe répond aux comités qui ont besoin d'un coup de main pour démarrer ou pour configurer leur club au quotidien.",
  },
];

const LANDING_PRICING_SIGNUP_STANDARD = "/inscription";
const LANDING_PRICING_SIGNUP_TEAM = "/inscription?plan=team";
const LANDING_PRICING_ADVICE_MAILTO =
  "mailto:contact@obillz.com?subject=Question%20sur%20les%20formules%20Obillz";

const pricingPlans = [
  {
    id: "standard",
    name: "Obillz Standard",
    yearlyPrice: "CHF 390/an",
    monthlyHint: "ou CHF 39/mois",
    description:
      "Pour les clubs qui souhaitent gérer Obillz avec le compte principal du club.",
    features: [
      "Membres, cotisations et factures",
      "Revenus, charges et encaissements",
      "Événements, plannings et QR codes",
      "Sponsoring et buvette",
      "Utilisation avec le compte principal du club",
    ],
    cta: "Choisir Standard",
    href: LANDING_PRICING_SIGNUP_STANDARD,
    footnote: "Idéal pour démarrer simplement.",
    highlighted: false,
    badge: null as string | null,
  },
  {
    id: "team",
    name: "Obillz Équipe",
    yearlyPrice: "CHF 490/an",
    monthlyHint: "ou CHF 45/mois",
    description:
      "Pour les clubs qui veulent travailler à plusieurs avec des accès sécurisés et des droits personnalisés.",
    features: [
      "Toutes les fonctionnalités Standard",
      "Invitations de plusieurs membres du comité",
      "Accès personnalisés selon les modules",
      "Droits séparés pour président, caissier, secrétaire, responsable buvette, etc.",
      "Plus besoin de partager un seul compte",
      "Meilleure sécurité et meilleure organisation",
    ],
    cta: "Choisir Équipe",
    href: LANDING_PRICING_SIGNUP_TEAM,
    footnote: "Seulement CHF 100/an de plus que Standard.",
    highlighted: true,
    badge: "Accès multiples",
  },
] as const;

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

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className={obillzLandingRootClass}>
      <LandingBackground />
      <div className={obillzLandingGridOverlayClass} aria-hidden />

      <div className="relative z-10">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <FeaturesShowcaseSection />
        <BenefitsSection />

        <section
          id="tarifs"
          className="relative mx-auto mt-24 w-[94%] max-w-[1160px] scroll-mt-24 md:mt-32"
        >
          <div
            className="pointer-events-none absolute inset-x-0 -top-12 h-40 bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,rgba(255,255,255,0.08),transparent)]"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto max-w-[820px] text-center"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200/90">Tarifs</p>
            <h2 className="mt-4 text-balance text-3xl font-black text-white md:text-5xl">
              Des tarifs simples pour tous les clubs
            </h2>
            <p className="mt-5 text-base leading-relaxed text-blue-100/90 md:text-lg">
              Choisissez la formule qui correspond à votre manière de gérer votre club. Une solution
              accessible, claire et sans frais cachés.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto mt-12 grid max-w-[1040px] grid-cols-1 gap-5 md:mt-14 md:grid-cols-2 md:gap-6 lg:gap-8"
          >
            {pricingPlans.map((plan) => (
              <article
                key={plan.id}
                className={`relative flex flex-col overflow-hidden rounded-[1.75rem] border p-6 backdrop-blur-xl transition duration-300 md:p-8 ${
                  plan.highlighted
                    ? "border-white/35 bg-gradient-to-br from-white/[0.14] via-white/[0.08] to-[#1A23FF]/[0.12] shadow-[0_28px_60px_rgba(2,6,23,0.38)] md:-translate-y-1"
                    : "border-white/12 bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-white/[0.02] hover:border-white/22 hover:bg-white/[0.06]"
                }`}
              >
                {plan.badge ? (
                  <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/30 bg-[#1A23FF] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-[0_8px_24px_rgba(26,35,255,0.45)]">
                    {plan.badge}
                  </span>
                ) : null}
                <div className={plan.badge ? "pt-2" : undefined}>
                  <h3 className="text-xl font-black text-white md:text-2xl">{plan.name}</h3>
                  <p className="mt-4 text-3xl font-black tabular-nums tracking-tight text-white md:text-4xl">
                    {plan.yearlyPrice}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-blue-100/80">{plan.monthlyHint}</p>
                  <p className="mt-4 text-sm leading-relaxed text-blue-100/85 md:text-[0.9375rem]">
                    {plan.description}
                  </p>
                </div>
                <ul className="mt-6 flex-1 space-y-3 border-t border-white/10 pt-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-[0.8125rem] leading-snug text-blue-100/90 md:text-sm"
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          plan.highlighted
                            ? "bg-white/15 text-white ring-1 ring-white/25"
                            : "bg-white/10 text-white/90 ring-1 ring-white/15"
                        }`}
                        aria-hidden
                      >
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href={plan.href}
                    className={`inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 md:text-base ${
                      plan.highlighted
                        ? "bg-white text-[#1A23FF] shadow-[0_14px_30px_rgba(15,23,42,0.28)]"
                        : "border border-white/40 text-white hover:bg-white/10"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                  <p className="mt-3 text-center text-xs text-blue-100/70 md:text-[0.8125rem]">
                    {plan.footnote}
                  </p>
                </div>
              </article>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-blue-100/85 md:mt-10 md:text-[0.9375rem]"
          >
            Les deux formules incluent l&apos;accès aux fonctionnalités principales d&apos;Obillz. La
            formule Équipe ajoute la gestion des utilisateurs et des permissions pour les clubs qui
            souhaitent répartir la gestion entre plusieurs personnes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-10 flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.04] px-6 py-6 text-center backdrop-blur-md md:mt-12"
          >
            <p className="text-sm font-semibold text-white md:text-base">
              Vous ne savez pas quelle formule choisir ?
            </p>
            <a
              href={LANDING_PRICING_ADVICE_MAILTO}
              className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/10 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Demander conseil
            </a>
          </motion.div>
        </section>

        <section id="faq" className="mx-auto mt-24 w-[94%] max-w-[1160px] md:mt-32">
          <div className="grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-14 lg:gap-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="md:sticky md:top-28 md:self-start"
            >
              <h2 className="text-balance text-3xl font-black leading-tight text-white md:text-5xl">
                Encore des questions ?
                <br />
                <span className="text-blue-100/80">On a les réponses</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-blue-100/85">
                Vous n&apos;avez pas trouvé votre réponse&nbsp;? Contactez-nous, on est là pour vous
                accompagner dans la mise en place de votre club.
              </p>
            </motion.div>

            <div className="space-y-2.5">
              {faqItems.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <motion.article
                    key={faq.question}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.4,
                      delay: Math.min(index * 0.04, 0.24),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`group overflow-hidden rounded-2xl border backdrop-blur-md transition-colors duration-200 ${
                      isOpen
                        ? "border-white/30 bg-white/[0.08]"
                        : "border-white/12 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.06]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left text-white md:px-7 md:py-6"
                      aria-expanded={isOpen}
                    >
                      <span className="text-[0.95rem] font-semibold leading-snug md:text-base">
                        {faq.question}
                      </span>
                      <span
                        aria-hidden
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                          isOpen
                            ? "border-white/40 bg-white text-[#1A23FF] rotate-45"
                            : "border-white/25 bg-white/5 text-white group-hover:border-white/40 group-hover:bg-white/10"
                        }`}
                      >
                        <Plus className="h-4 w-4" strokeWidth={2.2} />
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="border-t border-white/10 px-5 py-5 text-[0.9375rem] leading-relaxed text-blue-100/90 md:px-7 md:py-6">
                            {faq.answer}
                          </p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="cta-final"
          className="mx-auto mt-28 w-[94%] max-w-[1080px] md:mt-40 lg:mt-48"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-gradient-to-br from-white/[0.14] via-white/[0.06] to-[#1A23FF]/[0.08] p-8 text-center backdrop-blur-xl md:p-16"
          >
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/[0.12] blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-[#1A23FF]/30 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-1/4 -top-px h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
              aria-hidden
            />
            <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-blue-200/90">
              Prêt à essayer ?
            </p>
            <h2 className="relative mt-4 text-3xl font-black text-white md:text-5xl">
              Simplifiez la gestion de votre club dès aujourd&apos;hui.
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-sm text-blue-100/90 md:text-base">
              Rejoignez les clubs qui ont choisi une gestion plus claire, plus rapide et plus
              professionnelle.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/inscription"
                className="hero-cta-button inline-flex w-full max-w-md items-center justify-center rounded-full bg-white px-8 py-4 text-base font-bold text-[#1A23FF] shadow-[0_18px_40px_rgba(2,6,23,0.30)] transition hover:-translate-y-0.5 sm:w-auto"
              >
                Créer mon club gratuitement
              </Link>
              <Link
                href="/connexion"
                className="inline-flex w-full max-w-md items-center justify-center rounded-full border border-white/40 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10 sm:w-auto"
              >
                Connexion
              </Link>
            </div>
          </motion.div>
        </section>
      </div>

      <footer className="relative z-10 mt-24 w-full rounded-t-[2.5rem] border-t border-white/25 bg-white text-slate-900 shadow-[0_-12px_40px_rgba(2,6,23,0.20)] md:mt-32 md:rounded-t-[3rem]">
        <div className="mx-auto max-w-[1240px] px-6 pb-10 pt-12 md:px-10 md:pb-14 md:pt-16 lg:px-14 lg:pt-20">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr] md:gap-12">
            <div>
              <Link href="/" className="inline-flex transition hover:opacity-90">
                <Image src="/logo-obillz.png" alt="Obillz" width={132} height={32} />
              </Link>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Un logiciel simple pour gérer votre club, vos membres, vos cotisations et vos
                documents au même endroit.
              </p>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <Link
                  href="/inscription"
                  className="inline-flex items-center justify-center rounded-full bg-[#1A23FF] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(26,35,255,0.28)] transition hover:-translate-y-0.5"
                >
                  Créer mon club gratuitement
                </Link>
                <Link
                  href="/connexion"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Connexion
                </Link>
              </div>
            </div>

            <nav aria-label="Explorer">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Explorer
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a
                    href="/#probleme"
                    className="text-slate-700 transition hover:text-[#1A23FF]"
                  >
                    Le problème
                  </a>
                </li>
                <li>
                  <a
                    href="/#comment-ca-marche"
                    className="text-slate-700 transition hover:text-[#1A23FF]"
                  >
                    Comment ça marche
                  </a>
                </li>
                <li>
                  <a
                    href="/#fonctionnalites"
                    className="text-slate-700 transition hover:text-[#1A23FF]"
                  >
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <Link
                    href="/inscription"
                    className="text-slate-700 transition hover:text-[#1A23FF]"
                  >
                    Créer mon club
                  </Link>
                </li>
                <li>
                  <Link
                    href="/connexion"
                    className="text-slate-700 transition hover:text-[#1A23FF]"
                  >
                    Connexion
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-label="Légal">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Légal
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link
                    href="/conditions-utilisation"
                    className="text-slate-700 transition hover:text-[#1A23FF]"
                  >
                    Conditions d&apos;utilisation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/politique-confidentialite"
                    className="text-slate-700 transition hover:text-[#1A23FF]"
                  >
                    Politique de confidentialité
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="mt-10 flex flex-col items-start gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:gap-4 md:mt-12">
            <SwissFlag className="h-6 w-6 shrink-0 rounded-[4px]" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Conçu en Suisse</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 md:text-[0.8125rem]">
                Obillz est un logiciel suisse, développé et hébergé en Suisse, pensé pour les clubs
                locaux.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500 sm:flex-row sm:justify-between">
            <span>Obillz · Gestion de clubs sportifs</span>
            <span>© {new Date().getFullYear()} Obillz</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
