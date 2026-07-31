export type AssociationsNavItem = {
  href: string;
  label: string;
  description: string;
};

export const ASSOCIATIONS_NAV: AssociationsNavItem[] = [
  {
    href: "/associations/espace",
    label: "Tableau de bord",
    description: "Vue d’ensemble de votre association",
  },
  {
    href: "/associations/espace/membres",
    label: "Membres",
    description: "Annuaire et fiches adhérents",
  },
  {
    href: "/associations/espace/cotisations",
    label: "Cotisations",
    description: "Suivi des cotisations et paiements",
  },
  {
    href: "/associations/espace/evenements",
    label: "Événements",
    description: "Organisation et inscriptions",
  },
  {
    href: "/associations/espace/documents",
    label: "Documents",
    description: "Fichiers, PV et archives",
  },
  {
    href: "/associations/espace/communication",
    label: "Communication",
    description: "Messages et annonces",
  },
  {
    href: "/associations/espace/finances",
    label: "Finances",
    description: "Revenus, dépenses et suivi",
  },
  {
    href: "/associations/espace/parametres",
    label: "Paramètres",
    description: "Informations de l’association",
  },
];

export function associationsNavTitle(pathname: string | null): string {
  if (!pathname) return "Espace association";
  const exact = ASSOCIATIONS_NAV.find((item) => item.href === pathname);
  if (exact) return exact.label;
  const nested = ASSOCIATIONS_NAV.find(
    (item) => item.href !== "/associations/espace" && pathname.startsWith(item.href)
  );
  return nested?.label ?? "Espace association";
}
