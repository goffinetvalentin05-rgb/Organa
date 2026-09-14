import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/083_purge_skip_missing_email_history.sql"
  ),
  "utf8"
);

describe("083 — purge_operational_data ignore email_history absente", () => {
  it("ne crée pas la table email_history", () => {
    expect(sql).not.toMatch(/CREATE TABLE/i);
    expect(sql).not.toMatch(/GRANT ALL ON .*email_history/i);
  });

  it("purge email_history seulement si la relation existe", () => {
    expect(sql).toContain("to_regclass('public.email_history')");
    expect(sql).toContain("DELETE FROM public.email_history");
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain(
      "GRANT EXECUTE ON FUNCTION public.purge_operational_data() TO service_role"
    );
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.purge_operational_data() FROM authenticated"
    );
    expect(sql).toContain(
      "REVOKE ALL ON FUNCTION public.purge_operational_data() FROM anon"
    );
  });

  it("conserve le reste de la purge opérationnelle", () => {
    expect(sql).toContain("DELETE FROM public.club_invitations");
    expect(sql).toContain("DELETE FROM public.idempotency_keys");
    expect(sql).toContain("DELETE FROM public.audit_logs");
    expect(sql).toContain("public.public_planning_links");
    expect(sql).not.toMatch(/DELETE\s+FROM\s+(public\.)?profiles\b/i);
    expect(sql).not.toMatch(/DELETE\s+FROM\s+(public\.)?documents\b/i);
    expect(sql).not.toMatch(/DELETE\s+FROM\s+(public\.)?clients\b/i);
  });
});
