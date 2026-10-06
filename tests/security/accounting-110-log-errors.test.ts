import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const migration = readFileSync(
  path.resolve(root, "supabase/migrations/110_log_errors_numbers_budget_memberships.sql"),
  "utf8",
);
const reset = readFileSync(path.resolve(root, "scripts/accounting-reset-founder.sql"), "utf8");
const previous = readFileSync(
  path.resolve(root, "supabase/migrations/108_accounting_execute_and_storage.sql"),
  "utf8",
);

describe("110 — numéros, budget, appartenances", () => {
  it("ouvre seulement la lecture des appartenances au rôle authenticated", () => {
    expect(migration).toContain("GRANT SELECT ON TABLE public.club_memberships TO authenticated");
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.club_memberships FROM anon, authenticated");
    expect(migration).not.toContain("GRANT SELECT ON TABLE public.club_memberships TO anon");
    expect(migration).not.toMatch(/SET\s+ROLE/i);
    expect(migration).not.toContain("DISABLE TRIGGER");
  });

  it("laisse fermées les fonctions comptables déjà révoquées", () => {
    expect(previous).toContain("REVOKE ALL ON FUNCTION public.accounting_enqueue");
    expect(migration).not.toContain("accounting_enqueue");
    expect(migration).not.toContain("GRANT EXECUTE ON FUNCTION public.accounting_post_entry");
  });

  it("réserve le numéro sous verrou et au-dessus du maximum déjà utilisé", () => {
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("GREATEST(public.document_number_counters.last_seq, EXCLUDED.last_seq - 1) + 1");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.reserve_document_sequence(UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.reserve_document_sequence(UUID, TEXT, INTEGER) TO service_role");
  });

  it("enregistre le budget dans une seule fonction, sans désactiver l'unicité", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.accounting_save_budget_draft");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.accounting_save_budget_draft(UUID, UUID, UUID, JSONB) TO service_role");
    expect(migration).not.toContain("DROP INDEX");
    expect(migration).toContain("accounting_settings_history_import");
    expect(migration).toContain("'applied'");
  });
});

describe("script de prévisualisation comptable", () => {
  it("reste un refus de prévisualisation et ne contourne aucun verrou", () => {
    expect(reset).toContain("Prévisualisation seulement. Aucune donnée modifiée.");
    expect(reset).not.toContain("DISABLE TRIGGER");
    expect(reset).not.toContain("DELETE FROM");
    expect(reset).not.toContain("SET ROLE");
    expect(reset).not.toMatch(/v_execute\s*:=/);
    expect(reset).not.toMatch(/SELECT\s+id\b/i);
  });
});
