import { randomBytes } from "crypto";

/** Token opaque, long, non séquentiel, généré côté serveur. */
export function createSupporterToken(): string {
  return randomBytes(32).toString("base64url");
}
