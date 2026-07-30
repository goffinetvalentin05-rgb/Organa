export type AssociationFeature = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  highlights: string[];
  accent: string;
};

export const associationFeatures: AssociationFeature[] = [
  {
    slug: "gestion-des-membres",
    title: "Gestion des membres",
    shortDescription: "Une base claire, toujours à jour, accessible au comité.",
    description:
      "Centralisez les coordonnées, statuts, rôles et informations utiles de chaque membre sans multiplier les fichiers.",
    highlights: ["Fiches membres complètes", "Import simple", "Groupes et statuts"],
    accent: "#6d5efc",
  },
  {
    slug: "cotisations",
    title: "Cotisations",
    shortDescription: "Suivez les paiements sans relances improvisées.",
    description:
      "Gardez une vue nette sur les cotisations dues, reçues ou en retard et simplifiez le suivi du trésorier.",
    highlights: ["Échéances personnalisées", "Suivi des paiements", "Relances ciblées"],
    accent: "#ec6f5b",
  },
  {
    slug: "evenements",
    title: "Événements",
    shortDescription: "Organisez répétitions, spectacles, sorties et assemblées.",
    description:
      "Planifiez tous les rendez-vous de l’association et partagez les informations pratiques au bon moment.",
    highlights: ["Calendrier partagé", "Inscriptions", "Informations pratiques"],
    accent: "#24a887",
  },
  {
    slug: "communication",
    title: "Communication",
    shortDescription: "La bonne information, aux bonnes personnes.",
    description:
      "Communiquez avec l’ensemble de l’association ou avec un groupe précis depuis un point central.",
    highlights: ["Listes intelligentes", "Messages ciblés", "Historique partagé"],
    accent: "#e99a32",
  },
  {
    slug: "documents",
    title: "Documents",
    shortDescription: "Statuts, procès-verbaux et formulaires enfin regroupés.",
    description:
      "Conservez les documents importants dans un espace organisé que les bonnes personnes peuvent retrouver.",
    highlights: ["Dossiers partagés", "Accès maîtrisés", "Recherche rapide"],
    accent: "#5b8def",
  },
  {
    slug: "comite",
    title: "Comité",
    shortDescription: "Des responsabilités claires et un travail mieux partagé.",
    description:
      "Donnez à chaque membre du comité les accès et informations nécessaires à sa mission.",
    highlights: ["Rôles personnalisés", "Accès sécurisés", "Vue commune"],
    accent: "#a05fe4",
  },
  {
    slug: "materiel",
    title: "Gestion du matériel",
    shortDescription: "Instruments, costumes et équipements sous contrôle.",
    description:
      "Répertoriez le matériel de l’association, son état, son emplacement et la personne qui l’utilise.",
    highlights: ["Inventaire", "Attributions", "Suivi de l’état"],
    accent: "#df6f92",
  },
  {
    slug: "locaux",
    title: "Gestion des locaux",
    shortDescription: "Réservations et accès, sans conflits de planning.",
    description:
      "Coordonnez l’utilisation des salles de répétition, locaux et espaces partagés.",
    highlights: ["Planning des salles", "Règles d’accès", "Vue des disponibilités"],
    accent: "#31a0ad",
  },
  {
    slug: "finances",
    title: "Finances",
    shortDescription: "Une vision simple pour piloter sereinement.",
    description:
      "Suivez les entrées, dépenses et budgets avec une lecture accessible à tout le comité.",
    highlights: ["Budgets", "Recettes et dépenses", "Vue synthétique"],
    accent: "#3ba971",
  },
  {
    slug: "presences",
    title: "Présences",
    shortDescription: "Sachez qui participe, sans feuilles volantes.",
    description:
      "Suivez les présences aux répétitions, réunions et événements pour mieux vous organiser.",
    highlights: ["Listes de présence", "Confirmations", "Historique"],
    accent: "#ee8358",
  },
];

export function getAssociationFeature(slug: string) {
  return associationFeatures.find((feature) => feature.slug === slug);
}
