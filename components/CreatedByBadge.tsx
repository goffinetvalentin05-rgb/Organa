"use client";

import { useEffect, useState } from "react";

interface MemberLite {
  userId: string | null;
  name: string | null;
  email: string | null;
}

interface CreatedByBadgeProps {
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  /** Préfixe (par défaut : "Créé par"). Surchargé pour "Importé par", "Ajoutée par", etc. */
  createdLabel?: string;
  /** Idem pour la modification. */
  updatedLabel?: string;
  /** Active l'affichage de la modification si createdBy !== updatedBy. */
  showUpdated?: boolean;
  className?: string;
}

// ============================================
// Cache global (par session) pour éviter de refetch
// la liste des membres à chaque badge.
// ============================================
let cache: Map<string, MemberLite> | null = null;
let cachePromise: Promise<Map<string, MemberLite>> | null = null;

async function getMembersMap(): Promise<Map<string, MemberLite>> {
  if (cache) return cache;
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    try {
      const res = await fetch("/api/club/members", { cache: "no-store" });
      if (!res.ok) return new Map();
      const data = await res.json();
      const map = new Map<string, MemberLite>();
      for (const m of data.members ?? []) {
        if (m.userId) {
          map.set(m.userId, {
            userId: m.userId,
            name: m.name ?? null,
            email: m.email ?? null,
          });
        }
      }
      cache = map;
      return map;
    } catch {
      return new Map();
    } finally {
      cachePromise = null;
    }
  })();
  return cachePromise;
}

/**
 * Force un refresh du cache (ex: après modification d'un membre dans
 * Paramètres → Utilisateurs).
 */
export function invalidateMembersCache() {
  cache = null;
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("fr-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

/**
 * Petit badge discret affichant "Créé par X" et optionnellement
 * "Modifié par Y le ..." quand l'auteur de la modification est différent.
 */
export default function CreatedByBadge({
  createdBy,
  updatedBy,
  createdAt,
  updatedAt,
  createdLabel = "Créé par",
  updatedLabel = "Modifié par",
  showUpdated = true,
  className = "",
}: CreatedByBadgeProps) {
  const [members, setMembers] = useState<Map<string, MemberLite>>(
    () => cache ?? new Map()
  );

  useEffect(() => {
    if (!cache) {
      let cancelled = false;
      getMembersMap().then((m) => {
        if (!cancelled) setMembers(m);
      });
      return () => {
        cancelled = true;
      };
    }
  }, []);

  const resolveName = (uid?: string | null): string => {
    if (!uid) return "Utilisateur";
    const m = members.get(uid);
    if (m?.name) return m.name;
    if (m?.email) return m.email.split("@")[0];
    return "Utilisateur";
  };

  if (!createdBy && !updatedBy) return null;

  const createdName = createdBy ? resolveName(createdBy) : null;
  const updatedName = updatedBy ? resolveName(updatedBy) : null;
  const createdDate = formatDate(createdAt);
  const updatedDate = formatDate(updatedAt);

  const showUpdatedLine =
    showUpdated &&
    updatedBy &&
    (updatedBy !== createdBy ||
      (updatedDate && createdDate && updatedDate !== createdDate));

  return (
    <div
      className={`text-xs text-slate-400 leading-relaxed ${className}`}
      title={
        createdAt
          ? `Création : ${new Date(createdAt).toLocaleString("fr-CH")}`
          : undefined
      }
    >
      {createdName && (
        <span>
          {createdLabel} <span className="font-medium text-slate-500">{createdName}</span>
          {createdDate ? ` · ${createdDate}` : ""}
        </span>
      )}
      {showUpdatedLine && (
        <>
          <span className="mx-1.5 text-slate-300">·</span>
          <span>
            {updatedLabel}{" "}
            <span className="font-medium text-slate-500">{updatedName}</span>
            {updatedDate ? ` · ${updatedDate}` : ""}
          </span>
        </>
      )}
    </div>
  );
}
