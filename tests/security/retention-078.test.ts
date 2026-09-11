import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NEVER_AUTO_PURGED_TABLES } from "@/lib/retention/policy";

const sql = readFileSync(
  path.join(process.cwd(), "supabase/migrations/078_retention_purge_and_legal_acceptances.sql"),
  "utf8"
);

function extractFn(src: string, name: string) {
  const start = src.indexOf(`CREATE OR REPLACE FUNCTION public.${name}`);
  expect(start).toBeGreaterThanOrEqual(0);
  const nextCreate = src.indexOf("CREATE OR REPLACE FUNCTION", start + 10);
  const nextRevoke = src.indexOf("REVOKE ALL ON FUNCTION", start + 10);
  let end = src.length;
  if (nextCreate >= 0) end = Math.min(end, nextCreate);
  if (nextRevoke >= 0 && nextRevoke < end) end = nextRevoke;
  return src.slice(start, end);
}

describe("078 — purge opérationnelle + legal_acceptances", () => {
  it("RPC service_role uniquement", () => {
    const fn = extractFn(sql, "purge_operational_data");
    expect(fn).toContain("SECURITY DEFINER");
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.purge_operational_data() FROM PUBLIC"
    );
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.purge_operational_data() FROM anon"
    );
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.purge_operational_data() FROM authenticated"
    );
    expect(sql).toContain(
      "GRANT EXECUTE ON FUNCTION public.purge_operational_data() TO service_role"
    );
  });

  it("durées documentées dans le SQL", () => {
    const fn = extractFn(sql, "purge_operational_data");
    expect(fn).toContain("INTERVAL '90 days'");
    expect(fn).toContain("INTERVAL '30 days'");
    expect(fn).toContain("INTERVAL '12 months'");
    expect(fn).toContain("CURRENT_DATE - 90");
    expect(fn).toContain("status = 'expired'");
    expect(fn).toContain("idempotency_keys");
    expect(fn).toContain("audit_logs");
    expect(fn).toContain("email_history");
    expect(fn).toContain("public_planning_links");
    expect(fn).toContain("active = FALSE");
  });

  it("ne supprime pas documents / factures / commandes / membres", () => {
    const fn = extractFn(sql, "purge_operational_data");
    const deletes = [...fn.matchAll(/DELETE\s+FROM\s+(?:public\.)?([a-z_]+)/gi)].map(
      (m) => m[1]
    );
    for (const table of NEVER_AUTO_PURGED_TABLES) {
      expect(deletes).not.toContain(table);
      expect(fn).not.toMatch(new RegExp(`DELETE\\s+FROM\\s+(public\\.)?${table}\\b`, "i"));
    }
  });

  it("legal_acceptances : pas de backfill, pas d’insert JWT", () => {
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.legal_acceptances");
    expect(sql).toContain("terms_version");
    expect(sql).toContain("dpa_version");
    expect(sql.toLowerCase()).toContain("aucun backfill");
    expect(sql).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.legal_acceptances FROM authenticated"
    );
  });
});
