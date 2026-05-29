"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import LandingCta from "@/components/landing/LandingCta";
import LandingSection, { LandingSectionHeader } from "@/components/landing/LandingSection";
import { featureMocks, type FeatureMockId } from "@/components/landing/product-mocks";
import ScrollReveal from "@/components/landing/ScrollReveal";

const features: Array<{
  id: FeatureMockId;
  title: string;
  description: string;
  highlights: [string, string, string];
}> = [
  {
    id: "membres",
    title: "Membres",
    description:
      "Centralisez les fiches membres, les équipes et toutes les informations utiles dans une seule base claire.",
    highlights: ["Fiches et équipes au même endroit", "Coordonnées à jour", "Recherche rapide"],
  },
  {
    id: "cotisations",
    title: "Cotisations",
    description:
      "Générez les cotisations en quelques clics et envoyez-les automatiquement aux membres par email.",
    highlights: ["Génération en un clic", "Envoi automatique", "Suivi des paiements"],
  },
  {
    id: "factures",
    title: "Factures",
    description: "Créez des factures propres et professionnelles, envoyées par email en quelques secondes.",
    highlights: ["Modèles professionnels", "Envoi intégré", "Création rapide"],
  },
  {
    id: "sponsoring",
    title: "Sponsoring",
    description: "Suivez vos partenariats et encaissements sponsor au même endroit que le reste du club.",
    highlights: ["Partenariats structurés", "Paiements suivis", "Vue claire"],
  },
  {
    id: "evenements",
    title: "Événements",
    description: "Créez les événements du club et organisez les bénévoles depuis une seule interface.",
    highlights: ["Calendrier unifié", "Bénévoles simplifiés", "Lien partageable"],
  },
  {
    id: "buvette",
    title: "Buvette",
    description: "Gérez les réservations de la buvette avec un calendrier simple et une facturation automatique.",
    highlights: ["Créneaux clairs", "Facture à la validation", "Moins de gestion manuelle"],
  },
  {
    id: "finances",
    title: "Encaissements",
    description: "Suivez les entrées et sorties d'argent du club dans une vue claire et structurée.",
    highlights: ["Entrées / sorties", "Vue d'ensemble", "Situation en direct"],
  },
  {
    id: "inscriptions",
    title: "QR codes & inscriptions",
    description: "Lien ou QR code pour inscrire les participants — réponses centralisées pour le comité.",
    highlights: ["QR code ou lien", "Réponses centralisées", "Moins de relances"],
  },
  {
    id: "page-publique",
    title: "Page publique",
    description: "Partagez programme, buvette et inscriptions via une page publique professionnelle du club.",
    highlights: ["Liens publics", "Image pro", "Partage en un clic"],
  },
];

export default function FeaturesShowcaseSection() {
  const [activeId, setActiveId] = useState<FeatureMockId>("membres");
  const active = features.find((f) => f.id === activeId) ?? features[0];
  const Mock = featureMocks[activeId];

  return (
    <LandingSection id="fonctionnalites" className="mt-24 md:mt-32" glow>
      <LandingSectionHeader
        eyebrow="Fonctionnalités"
        title="Tous les outils pour gérer votre club"
        subtitle="Chaque module est pensé pour le quotidien du comité — avec un aperçu concret du produit, pas seulement une liste à puces."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10 lg:items-start">
        <ScrollReveal className="space-y-2" y={16}>
          {features.map((feature) => (
            <FeatureTab
              key={feature.id}
              feature={feature}
              active={activeId === feature.id}
              onSelect={() => setActiveId(feature.id)}
            />
          ))}
        </ScrollReveal>

        <ScrollReveal className="lg:sticky lg:top-28" y={20} delay={0.08}>
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/20 bg-gradient-to-br from-white/[0.12] via-white/[0.05] to-transparent p-1.5 backdrop-blur-xl">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#1A23FF]/25 blur-3xl"
              aria-hidden
            />
            <div className="relative rounded-[1.25rem] bg-white/[0.04] p-4 md:p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeId}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-black text-white md:text-2xl">{active.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-blue-100/90">{active.description}</p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {active.highlights.map((line) => (
                        <li
                          key={line}
                          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-blue-50"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Mock.render />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <LandingCta
        compact
        title="Découvrez tout ce qu'Obillz peut faire pour votre club"
        secondaryLabel="Commencer gratuitement"
        secondaryHref="/inscription"
      />
    </LandingSection>
  );
}

function FeatureTab({
  feature,
  active,
  onSelect,
}: {
  feature: (typeof features)[number];
  active: boolean;
  onSelect: () => void;
}) {
  const Icon: LucideIcon = featureMocks[feature.id].icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition duration-200 md:px-5 md:py-4 ${
        active
          ? "border-white/35 bg-white/[0.12] shadow-[0_12px_32px_rgba(2,6,23,0.25)]"
          : "border-white/10 bg-white/[0.04] hover:border-white/22 hover:bg-white/[0.08]"
      }`}
      aria-pressed={active}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 transition ${
          active ? "bg-white/15 ring-white/30" : "bg-white/10 ring-white/15 group-hover:bg-white/15"
        }`}
      >
        <Icon className="h-5 w-5 text-white" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black text-white md:text-base">{feature.title}</span>
        <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-blue-100/75 md:text-[0.8125rem]">
          {feature.description}
        </span>
      </span>
    </button>
  );
}
