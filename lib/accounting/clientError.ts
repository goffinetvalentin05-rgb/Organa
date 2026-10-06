/**
 * Message renvoyé au navigateur.
 * Les phrases métier restent. Une exception SQL ou un détail d'infrastructure non.
 */

const TECHNICAL = /SQLSTATE|syntax error|violates |duplicate key|permission denied|PGRST\d|schema cache|Could not find the function|does not exist|JWT|ECONN|TypeError:|SELECT |INSERT INTO |UPDATE public\.|DELETE FROM |stack|function public\./i;

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

export function accountingClientMessage(error: unknown, fallback: string): string {
  const line = errorText(error).split("\n")[0]?.trim() ?? "";
  if (!line || line.length > 400 || TECHNICAL.test(line)) return fallback;
  return line;
}

/** Première ligne et code, sans corps de requête ni montants. */
export function logAccountingFailure(scope: string, error: unknown): void {
  const code = typeof error === "object" && error && "code" in error
    ? String((error as { code: unknown }).code)
    : undefined;
  const message = errorText(error).split("\n")[0]?.slice(0, 300) || "erreur";
  console.error(`[API][accounting][${scope}]`, code ? { code, message } : { message });
}
