"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const DEFAULT_DRAFT_DEBOUNCE_MS = 400;

export type UseAutoDraftOptions<TData> = {
  store: LocalDraftStore<TData>;
  clubId: string | null | undefined;
  /** Tant que true, pas d’hydratation ni d’autosave. */
  clubLoading?: boolean;
  entityId?: string | null;
  data: TData;
  /**
   * Applique un brouillon restauré depuis localStorage.
   * Appelé uniquement si un brouillon valide existe.
   */
  onRestore: (data: TData) => void;
  /**
   * Appelé au changement de club (ou club vide) quand aucun brouillon.
   * Pour les créations : réinitialiser le formulaire.
   * Pour les éditions : omettre pour conserver les valeurs serveur.
   */
  onEmpty?: () => void;
  debounceMs?: number;
  enabled?: boolean;
};

export type UseAutoDraftResult = {
  draftHydrated: boolean;
  draftSavedAt: string | null;
  /** true uniquement si un brouillon a été chargé depuis le storage. */
  draftRestored: boolean;
  clearDraft: () => void;
  showDraftStatus: boolean;
  draftStatusLabel: string;
};

/**
 * Hydrate un brouillon local avant tout autosave, debounce les saves,
 * reset au changement de club, clear uniquement via clearDraft() (succès confirmé).
 */
export function useAutoDraft<TData>(
  options: UseAutoDraftOptions<TData>
): UseAutoDraftResult {
  const {
    store,
    clubId,
    clubLoading = false,
    entityId = null,
    data,
    onRestore,
    onEmpty,
    debounceMs = DEFAULT_DRAFT_DEBOUNCE_MS,
    enabled = true,
  } = options;

  const [draftHydrated, setDraftHydrated] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeClubIdRef = useRef<string | null>(null);
  const activeEntityIdRef = useRef<string | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;
  const onEmptyRef = useRef(onEmpty);
  onEmptyRef.current = onEmpty;

  const resolvedEntityId =
    typeof entityId === "string" && entityId.trim() ? entityId.trim() : null;

  const clearDraft = useCallback(() => {
    if (!clubId) return;
    store.clear(clubId, resolvedEntityId);
    setDraftSavedAt(null);
    setDraftRestored(false);
  }, [clubId, resolvedEntityId, store]);

  // Hydratation : avant tout autosave, scoped club + entity.
  useEffect(() => {
    if (!enabled) {
      setDraftHydrated(true);
      return;
    }
    if (clubLoading) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (!clubId) {
      activeClubIdRef.current = null;
      activeEntityIdRef.current = null;
      setDraftHydrated(true);
      setDraftRestored(false);
      setDraftSavedAt(null);
      onEmptyRef.current?.();
      return;
    }

    activeClubIdRef.current = clubId;
    activeEntityIdRef.current = resolvedEntityId;
    setDraftHydrated(false);

    const envelope = store.load(clubId, resolvedEntityId);
    if (envelope) {
      onRestoreRef.current(envelope.data);
      setDraftSavedAt(envelope.savedAt);
      setDraftRestored(true);
    } else {
      setDraftSavedAt(null);
      setDraftRestored(false);
      onEmptyRef.current?.();
    }

    setDraftHydrated(true);
  }, [clubId, clubLoading, enabled, resolvedEntityId, store]);

  // Autosave debounced — uniquement après hydratation.
  useEffect(() => {
    if (!enabled || !draftHydrated || !clubId || clubLoading) return;
    if (activeClubIdRef.current !== clubId) return;
    if (activeEntityIdRef.current !== resolvedEntityId) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      if (activeClubIdRef.current !== clubId) return;
      if (activeEntityIdRef.current !== resolvedEntityId) return;
      const result = store.save(clubId, dataRef.current, resolvedEntityId);
      if (result.saved && result.savedAt) {
        setDraftSavedAt(result.savedAt);
      } else if (!result.saved) {
        setDraftSavedAt(null);
        setDraftRestored(false);
      }
    }, debounceMs);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [
    data,
    clubId,
    clubLoading,
    draftHydrated,
    debounceMs,
    enabled,
    resolvedEntityId,
    store,
  ]);

  const showDraftStatus = Boolean(draftSavedAt || draftRestored);
  const draftStatusLabel =
    draftRestored && draftSavedAt
      ? "Brouillon restauré · sauvegarde automatique"
      : "Sauvegardé automatiquement";

  return {
    draftHydrated,
    draftSavedAt,
    draftRestored,
    clearDraft,
    showDraftStatus,
    draftStatusLabel,
  };
}
