const SENSITIVE_KEY =
  /^(avs|iban|email|telephone|phone|address|adresse|password|secret|token|api[_-]?key|resend|content_html|html|body)$/i;

const EMAIL_RE = /\S+@\S+/gi;

export function redactEmails(value: string): string {
  return value.replace(EMAIL_RE, "[redacted]");
}

/**
 * Copie un payload de log en masquant les champs sensibles.
 * Ne jamais y mettre AVS, IBAN, corps d’email, secrets.
 */
export function redactToolPayload(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 400) return `${redactEmails(value.slice(0, 400))}…`;
    return redactEmails(value);
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => redactToolPayload(item, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY.test(key)) {
        if (typeof nested === "string") {
          out[key] = nested.length === 0 ? "" : `[redacted, len=${nested.length}]`;
        } else if (nested == null) {
          out[key] = nested;
        } else {
          out[key] = "[redacted]";
        }
        continue;
      }
      out[key] = redactToolPayload(nested, depth + 1);
    }
    return out;
  }
  return String(value);
}
