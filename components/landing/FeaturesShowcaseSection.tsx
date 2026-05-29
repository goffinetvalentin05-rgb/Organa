"use client";

import { motion } from "framer-motion";
import LandingSection from "@/components/landing/LandingSection";
import { featureMocks, type FeatureMockId } from "@/components/landing/product-mocks";
import { staggerContainer, staggerItem, viewportOnce } from "@/components/landing/landing-motion";

const features: Array<{
  id: FeatureMockId;
  title: string;
  benefit: string;
}> = [
  {
    id: "membres",
    title: "Membres",
    benefit: "Centralisez joueurs, bénévoles et comité dans une base claire.",
  },
  {
    id: "cotisations",
    title: "Cotisations",
    benefit: "Créez et envoyez des cotisations par membre, équipe ou tout le club.",
  },
  {
    id: "factures",
    title: "Factures",
    benefit: "Générez des factures propres avec les informations de votre club.",
  },
  {
    id: "sponsoring",
    title: "Sponsoring",
    benefit: "Suivez partenariats et encaissements sponsor au même endroit.",
  },
  {
    id: "finances",
    title: "Encaissements",
    benefit: "Entrées, sorties et situation financière lisibles en un coup d'œil.",
  },
  {
    id: "evenements",
    title: "Événements",
    benefit: "Organisez manifestations et bénévoles depuis une interface unique.",
  },
  {
    id: "buvette",
    title: "Buvette",
    benefit: "Permettez de réserver une date depuis une page publique.",
  },
  {
    id: "inscriptions",
    title: "QR codes & inscriptions",
    benefit: "Partagez des liens simples pour événements ou repas.",
  },
  {
    id: "page-publique",
    title: "Page publique du club",
    benefit: "Programme, buvette et inscriptions sur une page pro.",
  },
];

export default function FeaturesShowcaseSection() {
  return (
    <LandingSection
      id="fonctionnalites"
      className="mt-24 md:mt-36"
      glow
      eyebrow="Fonctionnalités"
      title="Les outils essentiels pour gérer votre club."
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 md:mt-14"
      >
        {features.map((feature) => {
          const Mock = featureMocks[feature.id];
          const Icon = Mock.icon;
          return (
            <motion.div key={feature.id} variants={staggerItem}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/18 bg-gradient-to-br from-white/[0.12] via-white/[0.05] to-transparent p-1 shadow-[0_16px_44px_rgba(2,6,23,0.26)] backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-white/30 hover:shadow-[0_24px_56px_rgba(26,35,255,0.22)]">
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#1A23FF]/20 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                />
                <div className="relative p-4 pb-3 md:p-5 md:pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/25 transition group-hover:bg-white/18 group-hover:ring-white/40">
                      <Icon className="h-4 w-4 text-white" strokeWidth={1.75} aria-hidden />
                    </span>
                    <h3 className="text-base font-black text-white">{feature.title}</h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-blue-100/85 md:text-sm">
                    {feature.benefit}
                  </p>
                </div>
                <div className="relative mt-auto px-3 pb-3 pt-0 md:px-4 md:pb-4">
                  <div className="origin-bottom transition duration-300 group-hover:scale-[1.02]">
                    <Mock.render compact />
                  </div>
                </div>
              </article>
            </motion.div>
          );
        })}
      </motion.div>
    </LandingSection>
  );
}
