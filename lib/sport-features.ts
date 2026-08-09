import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Coffee,
  CreditCard,
  FilePlus,
  Globe,
  Handshake,
  LayoutDashboard,
  Mail,
  QrCode,
  Receipt,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

export type SportFeatureId =
  | "statistiques"
  | "membres"
  | "cotisations"
  | "factures"
  | "encaissements"
  | "revenus"
  | "charges"
  | "sponsors"
  | "evenements"
  | "buvette"
  | "plannings"
  | "pv"
  | "qrcodes"
  | "communication"
  | "pagePublique"
  | "parametres";

export type SportFeature = {
  id: SportFeatureId;
  slug: string;
  title: string;
  description: string;
  highlights: string[];
  accent: string;
};

/** Accents bleus Obillz — variations autour de la DA Sport. */
const BLUE = {
  primary: "#1A23FF",
  deep: "#2438E8",
  sky: "#2563EB",
  cyan: "#0EA5E9",
  indigo: "#4338CA",
  navy: "#1E3A8A",
  electric: "#3B82F6",
  cobalt: "#1D4ED8",
} as const;

export const sportFeatures: SportFeature[] = [
  {
    id: "statistiques",
    slug: "statistiques",
    title: "Dashboard",
    description:
      "Visualisez d’un coup d’œil l’état de votre club : membres, cotisations, événements et trésorerie.",
    highlights: ["Indicateurs clés", "Vue comité", "Données à jour"],
    accent: BLUE.primary,
  },
  {
    id: "membres",
    slug: "membres",
    title: "Membres",
    description:
      "Centralisez toutes les fiches membres au même endroit, accessibles aux bonnes personnes du comité.",
    highlights: ["Fiches complètes", "Import simple", "Toujours à jour"],
    accent: BLUE.sky,
  },
  {
    id: "cotisations",
    slug: "cotisations",
    title: "Cotisations",
    description:
      "Créez vos cotisations, envoyez-les en quelques clics et suivez les paiements sans tableur.",
    highlights: ["Envoi groupé", "Suivi des paiements", "Relances claires"],
    accent: BLUE.deep,
  },
  {
    id: "factures",
    slug: "factures",
    title: "Factures",
    description:
      "Créez, envoyez et suivez vos factures club sans friction ni documents égarés.",
    highlights: ["Création rapide", "Statuts visibles", "Export propre"],
    accent: BLUE.cobalt,
  },
  {
    id: "encaissements",
    slug: "encaissements",
    title: "Encaissements",
    description:
      "Suivez clairement ce qui a été encaissé : cotisations, buvette, événements — une vue unique.",
    highlights: ["Vue unifiée", "Filtres utiles", "Trésorerie lisible"],
    accent: BLUE.indigo,
  },
  {
    id: "revenus",
    slug: "revenus",
    title: "Revenus",
    description:
      "Suivez les produits et revenus annexes du club : maillots, tombolas, repas et plus.",
    highlights: ["Produits du club", "Saisie simple", "Vision claire"],
    accent: BLUE.electric,
  },
  {
    id: "charges",
    slug: "charges",
    title: "Charges",
    description:
      "Gardez le contrôle sur les dépenses du club à côté des recettes, sans fin de mois chaotique.",
    highlights: ["Justificatifs", "Classement", "Vue d’ensemble"],
    accent: BLUE.navy,
  },
  {
    id: "sponsors",
    slug: "sponsoring",
    title: "Sponsoring",
    description:
      "Suivez partenaires, contrats et renouvellements pour ne plus rater une échéance importante.",
    highlights: ["Contrats", "Échéances", "Renouvellements"],
    accent: BLUE.primary,
  },
  {
    id: "evenements",
    slug: "evenements",
    title: "Événements",
    description:
      "Organisez vos manifestations sans tableau Excel : inscriptions, équipes et suivi en temps réel.",
    highlights: ["Inscriptions", "Suivi live", "Organisation claire"],
    accent: BLUE.sky,
  },
  {
    id: "buvette",
    slug: "buvette",
    title: "Buvette",
    description:
      "Gérez les créneaux et demandes de buvette simplement, visibles de tout le comité.",
    highlights: ["Créneaux", "Demandes", "Jour du match"],
    accent: BLUE.cyan,
  },
  {
    id: "plannings",
    slug: "plannings",
    title: "Plannings",
    description:
      "Créez vos plannings en quelques clics et laissez vos membres s’inscrire eux-mêmes.",
    highlights: ["Création rapide", "Inscription par lien", "Suivi en temps réel"],
    accent: BLUE.deep,
  },
  {
    id: "pv",
    slug: "pv-de-seances",
    title: "PV de séances",
    description:
      "Rédigez et partagez vos procès-verbaux rapidement, prêts à exporter en PDF.",
    highlights: ["Structure claire", "Export PDF", "Partage rapide"],
    accent: BLUE.cobalt,
  },
  {
    id: "qrcodes",
    slug: "qr-codes",
    title: "QR Codes",
    description:
      "Créez des liens et QR codes pour inscriptions et actions rapides, sans paperasse.",
    highlights: ["Génération 1 clic", "Inscriptions", "Partage facile"],
    accent: BLUE.indigo,
  },
  {
    id: "communication",
    slug: "communication",
    title: "Communication",
    description:
      "Envoyez des campagnes ciblées à vos membres depuis un point central.",
    highlights: ["Audiences", "Campagnes", "Historique"],
    accent: BLUE.electric,
  },
  {
    id: "pagePublique",
    slug: "page-publique",
    title: "Page publique",
    description:
      "Présentez votre club en ligne simplement : programme, buvette, inscriptions.",
    highlights: ["Vitrine club", "Infos pratiques", "Sans site complexe"],
    accent: BLUE.sky,
  },
  {
    id: "parametres",
    slug: "parametres",
    title: "Paramètres",
    description:
      "Configurez le club et attribuez les accès adaptés à chaque rôle du comité.",
    highlights: ["Rôles", "Droits d’accès", "Collaboration"],
    accent: BLUE.navy,
  },
];

export const sportFeatureIcons: Record<SportFeatureId, LucideIcon> = {
  statistiques: LayoutDashboard,
  membres: Users,
  cotisations: Wallet,
  factures: Receipt,
  encaissements: CreditCard,
  revenus: ShoppingBag,
  charges: Building2,
  sponsors: Handshake,
  evenements: CalendarDays,
  buvette: Coffee,
  plannings: ClipboardList,
  pv: FilePlus,
  qrcodes: QrCode,
  communication: Mail,
  pagePublique: Globe,
  parametres: Settings,
};

export const SPORT_FEATURE_ORDER: SportFeatureId[] = sportFeatures.map((f) => f.id);

export function getSportFeature(slug: string) {
  return sportFeatures.find((feature) => feature.slug === slug);
}

export function getSportFeatureById(id: SportFeatureId) {
  return sportFeatures.find((feature) => feature.id === id);
}
