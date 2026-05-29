"use client";

import { motion } from "framer-motion";
import LandingSection from "@/components/landing/LandingSection";
import { featureMocks, type FeatureMockId } from "@/components/landing/product-mocks";
import { easePremium, staggerContainer, staggerItem, viewportOnce } from "@/components/landing/landing-motion";

const features: Array<{
  id: FeatureMockId;
  title: string;
  benefit: string;
  /** bento : large ou highlight */
  span?: "large" | "wide";
}> = [
  {
    id: "membres",
    title: "Membres",
    benefit: "Centralisez joueurs, bénévoles et comité.",
    span: "large",
  },
  {
    id: "cotisations",
    title: "Cotisations",
    benefit: "Créez et envoyez en quelques clics.",
  },
  {
    id: "factures",
    title: "Factures",
    benefit: "Factures propres, envoyées par email.",
  },
  {
    id: "sponsoring",
    title: "Sponsoring",
    benefit: "Partenariats et encaissements au même endroit.",
  },
  {
    id: "finances",
    title: "Encaissements",
    benefit: "Situation financière lisible en un coup d'œil.",
    span: "wide",
  },
  {
    id: "evenements",
    title: "Événements",
    benefit: "Manifestations et bénévoles organisés simplement.",
  },
  {
    id: "buvette",
    title: "Buvette",
    benefit: "Réservations depuis une page publique.",
  },
  {
    id: "inscriptions",
    title: "QR codes & inscriptions",
    benefit: "Liens simples pour événements ou repas.",
  },
  {
    id: "page-publique",
    title: "Page publique du club",
    benefit: "Programme, buvette et inscriptions pro.",
    span: "large",
  },
];

export default function FeaturesShowcaseSection() {
  return (
    <LandingSection
      id="fonctionnalites"
      className="mt-24 md:mt-36"
      glow
      eyebrow="Fonctionnalités"
      title="Tout ce dont votre comité a besoin."
      subtitle="Chaque module est pensé pour le quotidien d'un club sportif — sans complexité inutile."
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="mt-12 grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 md:mt-14"
      >
        {features.map((feature) => {
          const Mock = featureMocks[feature.id];
          const Icon = Mock.icon;
          const spanClass =
            feature.span === "large"
              ? "sm:col-span-2 lg:col-span-1 lg:row-span-2"
              : feature.span === "wide"
                ? "sm:col-span-2"
                : "";

          return (
            <motion.div
              key={feature.id}
              variants={staggerItem}
              className={spanClass}
            >
              <FeatureCard feature={feature} Mock={Mock} Icon={Icon} large={feature.span === "large"} />
            </motion.div>
          );
        })}
      </motion.div>
    </LandingSection>
  );
}

function FeatureCard({
  feature,
  Mock,
  Icon,
  large,
}: {
  feature: (typeof features)[number];
  Mock: (typeof featureMocks)[FeatureMockId];
  Icon: typeof featureMocks.membres.icon;
  large?: boolean;
}) {
  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/18 bg-gradient-to-br from-white/[0.12] via-white/[0.05] to-transparent p-1 shadow-[0_16px_44px_rgba(2,6,23,0.26)] backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-white/30 hover:shadow-[0_24px_56px_rgba(26,35,255,0.22)] ${
        large ? "min-h-[320px] lg:min-h-[380px]" : ""
      }`}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#1A23FF]/25 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div className={`relative flex flex-1 flex-col ${large ? "p-5 md:p-6" : "p-4 md:p-5"}`}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/25 transition group-hover:bg-white/18 group-hover:ring-white/40">
            <Icon className="h-4 w-4 text-white" strokeWidth={1.75} aria-hidden />
          </span>
          <h3 className={`font-black text-white ${large ? "text-lg md:text-xl" : "text-base"}`}>
            {feature.title}
          </h3>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-blue-100/85 md:text-sm">{feature.benefit}</p>
        <div
          className={`relative mt-auto pt-4 ${large ? "min-h-[180px]" : ""}`}
        >
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.3, ease: easePremium }}
            className="origin-bottom"
          >
            <Mock.render compact />
          </motion.div>
        </div>
      </div>
    </article>
  );
}
