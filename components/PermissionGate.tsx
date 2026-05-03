"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/lib/auth/permissions-client";
import type { Permission } from "@/lib/auth/permissions-shared";

interface PermissionGateProps {
  /** Permission requise pour afficher les enfants. */
  permission: Permission;
  /** Optionnel : à afficher si la permission n'est pas accordée. */
  fallback?: ReactNode;
  /** Optionnel : affichage pendant le chargement. Défaut : rien. */
  loadingFallback?: ReactNode;
  children: ReactNode;
}

/**
 * <PermissionGate permission="manage_invoices">
 *   <button>Créer une facture</button>
 * </PermissionGate>
 *
 * IMPORTANT : ce composant est purement cosmétique. Il MASQUE l'élément
 * dans l'UI mais NE PROTÈGE PAS les données. Toute action sensible doit
 * EN PLUS être validée côté API route via requirePermission().
 */
export default function PermissionGate({
  permission,
  fallback = null,
  loadingFallback = null,
  children,
}: PermissionGateProps) {
  const perms = usePermissions();

  if (perms.loading) {
    return <>{loadingFallback}</>;
  }

  if (!perms.has(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
