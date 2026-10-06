import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.resolve(__dirname, "../../supabase/migrations/108_accounting_execute_and_storage.sql"),
  "utf8",
);
const dropOpen = readFileSync(
  path.resolve(__dirname, "../../supabase/migrations/109_expenses_drop_open_storage_policies.sql"),
  "utf8",
);
const route = readFileSync(path.resolve(__dirname, "../../app/api/accounting/route.ts"), "utf8");

const FUNCTIONS = [
  "public.accounting_enqueue(UUID, TEXT, UUID, TEXT, TEXT, NUMERIC, NUMERIC, DATE, TEXT, TEXT, TEXT, TEXT)",
  "public.accounting_place_entry_number(UUID, TEXT, INTEGER, UUID, BOOLEAN, INTEGER)",
  "public.accounting_compact_entry_numbers(UUID, UUID)",
  "public.accounting_seed_period_numbers(UUID)",
  "public.accounting_resolve_payout_bank(UUID)",
  "public.accounting_post_pending_payouts(UUID, UUID)",
];

describe("108 — EXECUTE et storage comptable", () => {
  it("retire EXECUTE à PUBLIC, anon et authenticated, et le laisse à service_role", () => {
    for (const signature of FUNCTIONS) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature} FROM PUBLIC`);
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature} FROM anon`);
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature} FROM authenticated`);
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION ${signature} TO service_role`);
    }
    expect(migration).not.toContain("auth.uid()");
  });

  it("retire le préfixe accounting des policies membres et staff", () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "expenses_select_member"');
    expect(migration).toContain("lower(split_part(name, '/', 2)) IS DISTINCT FROM 'accounting'");
    expect(migration).toContain('CREATE POLICY "expenses_accounting_select"');
    expect(migration).toContain("has_club_permission(public.storage_path_club_id(name), 'view_accounting')");
    expect(migration).toContain('CREATE POLICY "expenses_accounting_insert"');
    expect(migration).toContain("has_club_permission(public.storage_path_club_id(name), 'manage_accounting')");
    expect(migration).toContain("public.is_club_member(public.storage_path_club_id(name))");
    expect(migration).toContain("public.is_club_staff(public.storage_path_club_id(name))");
  });

  it("retire les policies ouvertes expenses1301vyz constatées en base", () => {
    expect(dropOpen).toContain('DROP POLICY IF EXISTS "expenses1301vyz" ON storage.objects');
    expect(dropOpen).toContain('DROP POLICY IF EXISTS "expenses1301vyz_1" ON storage.objects');
    expect(dropOpen).toContain("pg_policy");
    expect(dropOpen).toContain("ILIKE '%auth.role()%'");
    expect(dropOpen).toContain("NOT ILIKE '%storage_path_club_id%'");
    expect(dropOpen).not.toMatch(/SET\s+(LOCAL\s+)?ROLE/i);
  });

  it("vérifie l'écriture du club avant d'envoyer le fichier", () => {
    const upload = route.indexOf("supabase.storage.from(\"expenses\").upload");
    const check = route.indexOf("await assertEntryInClub(guard.clubId, entryId)");
    expect(check).toBeGreaterThan(0);
    expect(upload).toBeGreaterThan(check);
  });
});
