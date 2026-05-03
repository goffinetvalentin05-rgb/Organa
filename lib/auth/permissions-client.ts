"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ALL_PERMISSIONS,
  type Permission,
} from "@/lib/auth/permissions-shared";

/**
 * État renvoyé par /api/me/permissions et exposé via le hook.
 */
export interface MyPermissionsState {
  loading: boolean;
  error: string | null;
  clubId: string | null;
  role: string | null;
  isOwner: boolean;
  permissions: Record<Permission, boolean>;
  /** Helper pratique pour `if (has('manage_invoices')) { ... }`. */
  has: (perm: Permission) => boolean;
  /** Forcer un reload (utile après que l'owner change ses permissions). */
  reload: () => Promise<void>;
}

const emptyMap = (): Record<Permission, boolean> =>
  ALL_PERMISSIONS.reduce(
    (acc, p) => {
      acc[p] = false;
      return acc;
    },
    {} as Record<Permission, boolean>
  );

/**
 * Hook React : récupère les permissions effectives de l'utilisateur courant.
 *
 *   const perms = usePermissions();
 *   if (!perms.loading && perms.has("manage_invoices")) {
 *     // ...
 *   }
 *
 * Le résultat est mis en cache dans le state du composant. Pour partager
 * la valeur dans plusieurs endroits sans refaire un fetch, encapsuler
 * dans un Provider applicatif si besoin.
 */
export function usePermissions(): MyPermissionsState {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    clubId: string | null;
    role: string | null;
    isOwner: boolean;
    permissions: Record<Permission, boolean>;
  }>({
    loading: true,
    error: null,
    clubId: null,
    role: null,
    isOwner: false,
    permissions: emptyMap(),
  });

  const fetchPerms = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/me/permissions", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          setState({
            loading: false,
            error: null,
            clubId: null,
            role: null,
            isOwner: false,
            permissions: emptyMap(),
          });
          return;
        }
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      const data = await res.json();
      const safeMap = emptyMap();
      for (const p of ALL_PERMISSIONS) {
        safeMap[p] = data?.permissions?.[p] === true;
      }
      setState({
        loading: false,
        error: null,
        clubId: data.clubId ?? null,
        role: data.role ?? null,
        isOwner: !!data.isOwner,
        permissions: safeMap,
      });
    } catch (e: any) {
      console.error("[usePermissions] fetch KO:", e);
      setState({
        loading: false,
        error: e?.message ?? "Erreur",
        clubId: null,
        role: null,
        isOwner: false,
        permissions: emptyMap(),
      });
    }
  }, []);

  useEffect(() => {
    fetchPerms();
  }, [fetchPerms]);

  const has = useCallback(
    (perm: Permission) => state.permissions[perm] === true,
    [state.permissions]
  );

  return { ...state, has, reload: fetchPerms };
}
