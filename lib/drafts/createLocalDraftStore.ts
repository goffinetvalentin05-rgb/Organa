/**
 * Store de brouillon local (localStorage) générique — côté client uniquement.
 * Aucun token / secret / File.
 */

/** TTL par défaut : 72 h. */
export const DEFAULT_LOCAL_DRAFT_TTL_MS = 72 * 60 * 60 * 1000;

export type LocalDraftEnvelope<TData> = {
  version: number;
  savedAt: string;
  clubId: string;
  product: string;
  formType: string;
  entityId?: string | null;
  data: TData;
};

export type CreateLocalDraftStoreConfig<TData> = {
  version: number;
  product: string;
  formType: string;
  isMeaningful: (data: TData) => boolean;
  /** Retourne null si les données brutes sont inutilisables. */
  normalize: (raw: unknown) => TData | null;
  /** Retire secrets (AVS, IBAN, etc.) avant persist / restore. */
  sanitize?: (data: TData) => TData;
  /**
   * Override de clé (ex. legacy planning).
   * Par défaut : obillz:draft:{product}:{formType}:{clubId}[:{entityId}]
   */
  buildStorageKey?: (clubId: string, entityId?: string | null) => string;
  /**
   * Si true, accepte les envelopes sans formType (migration legacy).
   * @default false
   */
  allowMissingFormType?: boolean;
  /** Durée de vie du brouillon. @default DEFAULT_LOCAL_DRAFT_TTL_MS */
  ttlMs?: number;
};

export type LocalDraftStore<TData> = {
  version: number;
  product: string;
  formType: string;
  isMeaningful: (data: TData) => boolean;
  normalize: (raw: unknown) => TData | null;
  storageKey: (clubId: string, entityId?: string | null) => string;
  parse: (
    raw: string,
    expectedClubId: string,
    entityId?: string | null
  ) => LocalDraftEnvelope<TData> | null;
  load: (
    clubId: string,
    entityId?: string | null
  ) => LocalDraftEnvelope<TData> | null;
  save: (
    clubId: string,
    data: TData,
    entityId?: string | null
  ) => { saved: boolean; savedAt: string | null };
  clear: (clubId: string, entityId?: string | null) => void;
};

export function buildLocalDraftStorageKey(opts: {
  product: string;
  formType: string;
  clubId: string;
  entityId?: string | null;
}): string {
  const base = `obillz:draft:${opts.product}:${opts.formType}:${opts.clubId}`;
  if (opts.entityId) return `${base}:${opts.entityId}`;
  return base;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function entityIdsMatch(
  envelopeEntityId: unknown,
  expected: string | null | undefined
): boolean {
  const expectedNorm =
    typeof expected === "string" && expected.trim() ? expected.trim() : null;
  const raw =
    typeof envelopeEntityId === "string" && envelopeEntityId.trim()
      ? envelopeEntityId.trim()
      : null;
  return raw === expectedNorm;
}

export function isLocalDraftExpired(
  savedAt: unknown,
  ttlMs: number = DEFAULT_LOCAL_DRAFT_TTL_MS,
  nowMs: number = Date.now()
): boolean {
  if (typeof savedAt !== "string" || !savedAt) return true;
  const t = Date.parse(savedAt);
  if (Number.isNaN(t)) return true;
  return nowMs - t > ttlMs;
}

export function createLocalDraftStore<TData>(
  config: CreateLocalDraftStoreConfig<TData>
): LocalDraftStore<TData> {
  const {
    version,
    product,
    formType,
    isMeaningful,
    normalize,
    sanitize = (data: TData) => data,
    allowMissingFormType = false,
    ttlMs = DEFAULT_LOCAL_DRAFT_TTL_MS,
  } = config;

  function storageKey(clubId: string, entityId?: string | null): string {
    if (config.buildStorageKey) {
      return config.buildStorageKey(clubId, entityId);
    }
    return buildLocalDraftStorageKey({ product, formType, clubId, entityId });
  }

  function parse(
    raw: string,
    expectedClubId: string,
    entityId?: string | null
  ): LocalDraftEnvelope<TData> | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }

    if (!parsed || typeof parsed !== "object") return null;
    const env = parsed as Record<string, unknown>;

    if (env.version !== version) return null;
    if (typeof env.clubId !== "string" || env.clubId !== expectedClubId) return null;
    if (env.product != null && env.product !== product) return null;

    if (env.formType != null) {
      if (env.formType !== formType) return null;
    } else if (!allowMissingFormType) {
      return null;
    }

    if (!entityIdsMatch(env.entityId, entityId)) return null;
    if (!env.data || typeof env.data !== "object") return null;

    if (isLocalDraftExpired(env.savedAt, ttlMs)) return null;

    const data = normalize(env.data);
    if (!data) return null;
    const sanitized = sanitize(data);
    if (!isMeaningful(sanitized)) return null;

    const resolvedEntityId =
      typeof entityId === "string" && entityId.trim() ? entityId.trim() : null;

    return {
      version,
      savedAt:
        typeof env.savedAt === "string" ? env.savedAt : new Date(0).toISOString(),
      clubId: expectedClubId,
      product,
      formType,
      entityId: resolvedEntityId,
      data: sanitized,
    };
  }

  function load(
    clubId: string,
    entityId?: string | null
  ): LocalDraftEnvelope<TData> | null {
    if (!isBrowser() || !clubId) return null;
    try {
      const key = storageKey(clubId, entityId);
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const loaded = parse(raw, clubId, entityId);
      if (loaded) return loaded;
      try {
        const env = JSON.parse(raw) as { savedAt?: unknown };
        if (isLocalDraftExpired(env?.savedAt, ttlMs)) {
          window.localStorage.removeItem(key);
        }
      } catch {
        // envelope illisible : on ne touche pas
      }
      return null;
    } catch {
      return null;
    }
  }

  function clear(clubId: string, entityId?: string | null): void {
    if (!isBrowser() || !clubId) return;
    try {
      window.localStorage.removeItem(storageKey(clubId, entityId));
    } catch {
      // ignore quota / private mode
    }
  }

  function save(
    clubId: string,
    data: TData,
    entityId?: string | null
  ): { saved: boolean; savedAt: string | null } {
    if (!isBrowser() || !clubId) {
      return { saved: false, savedAt: null };
    }

    const sanitized = sanitize(data);
    if (!isMeaningful(sanitized)) {
      clear(clubId, entityId);
      return { saved: false, savedAt: null };
    }

    const resolvedEntityId =
      typeof entityId === "string" && entityId.trim() ? entityId.trim() : null;
    const savedAt = new Date().toISOString();
    const envelope: LocalDraftEnvelope<TData> = {
      version,
      savedAt,
      clubId,
      product,
      formType,
      entityId: resolvedEntityId,
      data: sanitized,
    };

    try {
      window.localStorage.setItem(
        storageKey(clubId, entityId),
        JSON.stringify(envelope)
      );
      return { saved: true, savedAt };
    } catch {
      return { saved: false, savedAt: null };
    }
  }

  return {
    version,
    product,
    formType,
    isMeaningful,
    normalize,
    storageKey,
    parse,
    load,
    save,
    clear,
  };
}
