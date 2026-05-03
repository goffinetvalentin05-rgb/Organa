/**
 * Catalogue des permissions et helpers PURS (sans dépendance serveur).
 *
 * Ce fichier peut être importé depuis du code client (composants React)
 * comme depuis du code serveur (API routes).
 *
 * Pour les helpers serveur (requirePermission, getMyPermissions, etc.),
 * voir `lib/auth/permissions.ts`.
 */

export const PERMISSIONS = {
  VIEW_MEMBERS: "view_members",
  MANAGE_MEMBERS: "manage_members",
  DELETE_MEMBERS: "delete_members",

  VIEW_EXPENSES: "view_expenses",
  MANAGE_EXPENSES: "manage_expenses",
  DELETE_EXPENSES: "delete_expenses",

  VIEW_INVOICES: "view_invoices",
  MANAGE_INVOICES: "manage_invoices",
  DELETE_INVOICES: "delete_invoices",

  VIEW_DOCUMENTS: "view_documents",
  MANAGE_DOCUMENTS: "manage_documents",
  DELETE_DOCUMENTS: "delete_documents",

  VIEW_PLANNINGS: "view_plannings",
  MANAGE_PLANNINGS: "manage_plannings",

  ACCESS_SETTINGS: "access_settings",
  MANAGE_USERS: "manage_users",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_members: "Voir les membres",
  manage_members: "Ajouter / modifier les membres",
  delete_members: "Supprimer des membres",
  view_expenses: "Voir les dépenses",
  manage_expenses: "Ajouter / modifier les dépenses",
  delete_expenses: "Supprimer des dépenses",
  view_invoices: "Voir les factures",
  manage_invoices: "Créer / modifier les factures",
  delete_invoices: "Supprimer des factures",
  view_documents: "Voir les documents",
  manage_documents: "Ajouter / modifier les documents",
  delete_documents: "Supprimer des documents",
  view_plannings: "Voir les plannings",
  manage_plannings: "Modifier les plannings",
  access_settings: "Accéder aux paramètres",
  manage_users: "Gérer les utilisateurs / accès",
};

export const PERMISSION_GROUPS: Array<{
  title: string;
  permissions: Permission[];
}> = [
  {
    title: "Membres",
    permissions: [
      PERMISSIONS.VIEW_MEMBERS,
      PERMISSIONS.MANAGE_MEMBERS,
      PERMISSIONS.DELETE_MEMBERS,
    ],
  },
  {
    title: "Dépenses",
    permissions: [
      PERMISSIONS.VIEW_EXPENSES,
      PERMISSIONS.MANAGE_EXPENSES,
      PERMISSIONS.DELETE_EXPENSES,
    ],
  },
  {
    title: "Factures / cotisations",
    permissions: [
      PERMISSIONS.VIEW_INVOICES,
      PERMISSIONS.MANAGE_INVOICES,
      PERMISSIONS.DELETE_INVOICES,
    ],
  },
  {
    title: "Documents",
    permissions: [
      PERMISSIONS.VIEW_DOCUMENTS,
      PERMISSIONS.MANAGE_DOCUMENTS,
      PERMISSIONS.DELETE_DOCUMENTS,
    ],
  },
  {
    title: "Plannings",
    permissions: [PERMISSIONS.VIEW_PLANNINGS, PERMISSIONS.MANAGE_PLANNINGS],
  },
  {
    title: "Paramètres",
    permissions: [PERMISSIONS.ACCESS_SETTINGS, PERMISSIONS.MANAGE_USERS],
  },
];

export function fullPermissionMap(): Record<Permission, boolean> {
  return ALL_PERMISSIONS.reduce(
    (acc, p) => {
      acc[p] = true;
      return acc;
    },
    {} as Record<Permission, boolean>
  );
}

export function emptyPermissionMap(): Record<Permission, boolean> {
  return ALL_PERMISSIONS.reduce(
    (acc, p) => {
      acc[p] = false;
      return acc;
    },
    {} as Record<Permission, boolean>
  );
}

export function suggestedDefaultPermissions(): Record<Permission, boolean> {
  const map = emptyPermissionMap();
  map.view_members = true;
  map.view_expenses = true;
  map.view_invoices = true;
  map.view_documents = true;
  map.view_plannings = true;
  return map;
}

export function sanitizePermissions(
  input: unknown
): Record<Permission, boolean> {
  const out = emptyPermissionMap();
  if (!input || typeof input !== "object") return out;
  const obj = input as Record<string, unknown>;
  for (const p of ALL_PERMISSIONS) {
    out[p] = obj[p] === true || obj[p] === "true";
  }
  return out;
}
