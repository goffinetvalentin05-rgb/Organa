/**
 * Limiteur de débit en mémoire (token bucket simple).
 *
 * ⚠ Cette implémentation est volontairement minimale et NON distribuée.
 * Elle protège efficacement les routes publiques sur une seule instance Node
 * (Vercel preview, dev local, ou un seul lambda). Pour un déploiement
 * multi-régions / multi-instances, remplacer par Upstash Redis ou Vercel KV.
 *
 * Cas d'usage : routes publiques sans authentification où on veut éviter le
 * bourrage (formulaire d'inscription QR code, demande de buvette publique,
 * désinscription marketing, etc.).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const STORE = new Map<string, Bucket>();

// Garbage collection périodique pour éviter de garder des entrées mortes
let lastGc = Date.now();
const GC_INTERVAL_MS = 60_000;

function gcIfNeeded() {
  const now = Date.now();
  if (now - lastGc < GC_INTERVAL_MS) return;
  lastGc = now;
  for (const [k, v] of STORE) {
    if (v.resetAt < now) STORE.delete(k);
  }
}

export interface RateLimitOptions {
  /** Identifiant logique du bucket (ex: "buvette:request"). */
  key: string;
  /** Nombre max d'opérations dans la fenêtre. */
  limit: number;
  /** Fenêtre en millisecondes. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * Vérifie/incrémente le compteur pour la clé donnée.
 */
export function checkRateLimit(opts: RateLimitOptions): RateLimitResult {
  gcIfNeeded();
  const now = Date.now();
  const existing = STORE.get(opts.key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + opts.windowMs;
    STORE.set(opts.key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: opts.limit - 1,
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= opts.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, opts.limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Construit une clé de rate-limit à partir d'une Request entrante,
 * combinant l'IP (via X-Forwarded-For ou X-Real-IP) et un préfixe logique.
 */
export function buildRateKeyFromRequest(
  request: Request,
  prefix: string,
  extra?: string
): string {
  const xff = request.headers.get("x-forwarded-for");
  const ip =
    xff?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return extra ? `${prefix}:${ip}:${extra}` : `${prefix}:${ip}`;
}

/**
 * Helper combiné : vérifie le rate-limit pour une Request, et retourne
 * directement une Response 429 si dépassé.
 */
export function rateLimitGuard(
  request: Request,
  prefix: string,
  limits: { limit: number; windowMs: number },
  extraKey?: string
): { ok: true } | { ok: false; response: Response } {
  const key = buildRateKeyFromRequest(request, prefix, extraKey);
  const result = checkRateLimit({
    key,
    limit: limits.limit,
    windowMs: limits.windowMs,
  });
  if (result.allowed) return { ok: true };
  return {
    ok: false,
    response: new Response(
      JSON.stringify({
        error: "Trop de requêtes, veuillez réessayer plus tard.",
        retryAfterSeconds: result.retryAfterSeconds,
      }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(result.retryAfterSeconds),
        },
      }
    ),
  };
}
