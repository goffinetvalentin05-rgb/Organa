import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { normalizedClientToApiListItem } from "@/lib/clients/normalizeDbRow";
import { maskAvsNumber } from "@/lib/member-fields/types";

const ROOT = path.resolve(__dirname, "../..");

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

type ClubRole = "owner" | "admin" | "committee" | "member";

/** Policy 068 : SELECT table clients = is_club_staff + deleted_at IS NULL. */
function canSelectClientsTable(role: ClubRole, status: "active" | "disabled") {
  if (status !== "active") return false;
  return role === "owner" || role === "admin" || role === "committee";
}

function extractGetHandler(src: string) {
  const start = src.indexOf("export async function GET");
  expect(start).toBeGreaterThanOrEqual(0);
  const next = src.indexOf("export async function ", start + 10);
  return next >= 0 ? src.slice(start, next) : src.slice(start);
}

const SAMPLE_ROW = {
  id: "c1",
  nom: "Dupont",
  email: "alice@club.example",
  telephone: "+41000000001",
  adresse: "1 rue de la Gare",
  postal_code: "1000",
  city: "Lausanne",
  user_id: "club-1",
  role: "player",
  category: "seniors",
  date_of_birth: "1990-04-12",
  avs_number: "756.1234.5678.90",
  created_by: null,
  updated_by: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("068 — clients SELECT staff only", () => {
  const migration = read("supabase/migrations/068_clients_select_staff.sql");
  const previous = read("supabase/migrations/023_strict_rls_clubscope.sql");
  const writes = read("supabase/migrations/038_clients_rls_manage_members.sql");
  const listApi = read("app/api/clients/route.ts");
  const detailApi = read("app/api/clients/[id]/route.ts");
  const listGet = extractGetHandler(listApi);
  const detailGet = extractGetHandler(detailApi);

  it("retire le SELECT member et pose un SELECT staff", () => {
    expect(previous).toContain("'clients|member|owner'");
    expect(migration).toContain('DROP POLICY IF EXISTS "clients_select"');
    expect(migration).toContain('CREATE POLICY "clients_select_staff"');
    expect(migration).toContain("public.is_club_staff(user_id)");
    expect(migration).toContain("deleted_at IS NULL");
    expect(migration).not.toMatch(/\bis_club_member\(user_id\)/);
    expect(migration).not.toMatch(/\bUPDATE\s+public\.clients/i);
    expect(migration).not.toMatch(/\bINSERT\s+INTO\s+public\.clients/i);
    expect(migration).not.toMatch(/\bDELETE\s+FROM\s+public\.clients/i);
    expect(migration).not.toMatch(/\bALTER TABLE\s+public\.clients/i);
    expect(migration).not.toMatch(/\bDROP COLUMN\b/i);
  });

  it("ne touche pas aux policies INSERT/UPDATE de 038", () => {
    expect(writes).toContain("clients_insert_staff");
    expect(writes).toContain("clients_update_staff");
    expect(migration).not.toContain("clients_insert_staff");
    expect(migration).not.toContain("clients_update_staff");
    expect(migration).not.toContain("has_club_permission");
    expect(migration).not.toContain("manage_members");
  });

  it("member actif → SELECT PostgREST table clients refusé (0 ligne)", () => {
    expect(canSelectClientsTable("member", "active")).toBe(false);
  });

  it("committee / admin / owner actifs conservent le SELECT table", () => {
    expect(canSelectClientsTable("committee", "active")).toBe(true);
    expect(canSelectClientsTable("admin", "active")).toBe(true);
    expect(canSelectClientsTable("owner", "active")).toBe(true);
    expect(canSelectClientsTable("committee", "disabled")).toBe(false);
  });

  it("GET /api/clients : VIEW_MEMBERS puis admin filtré par clubId", () => {
    expect(listGet).toContain("PERMISSIONS.VIEW_MEMBERS");
    expect(listGet).toContain("createAdminClient");
    expect(listGet).toMatch(/const admin = createAdminClient\(\)/);
    expect(listGet).toMatch(/await admin\s*\n\s*\.from\("clients"\)/);
    expect(listGet).toContain('.eq("user_id", guard.clubId)');
    expect(listGet).toContain('.is("deleted_at", null)');
    expect(listGet).toContain("normalizedClientToApiListItem");
    expect(listGet.indexOf("requirePermission")).toBeLessThan(
      listGet.indexOf("createAdminClient")
    );
    expect(listGet).not.toContain("await createClient()");
  });

  it("GET /api/clients/[id] : VIEW_MEMBERS puis admin filtré par clubId, AVS masqué", () => {
    expect(detailGet).toContain("PERMISSIONS.VIEW_MEMBERS");
    expect(detailGet).toContain("createAdminClient");
    expect(detailGet).toMatch(/const admin = createAdminClient\(\)/);
    expect(detailGet).toMatch(/await admin\s*\n\s*\.from\("clients"\)/);
    expect(detailGet).toContain('.eq("user_id", guard.clubId)');
    expect(detailGet).toContain('.is("deleted_at", null)');
    expect(detailGet).toContain("maskAvsNumber");
    expect(detailGet).toContain("normalizedClientToApi");
    expect(detailGet).toMatch(/avsNumber:\s*maskAvsNumber\(normalized\.avs_number\)/);
    expect(detailGet.indexOf("requirePermission")).toBeLessThan(
      detailGet.indexOf("createAdminClient")
    );
    expect(detailGet).not.toContain("await createClient()");
  });

  it("liste API → aucun avs_number ni date_of_birth", () => {
    const item = normalizedClientToApiListItem(SAMPLE_ROW);
    expect(item).not.toHaveProperty("avsNumber");
    expect(item).not.toHaveProperty("dateOfBirth");
    expect(item).not.toHaveProperty("avs_number");
    expect(item).not.toHaveProperty("date_of_birth");
    expect(item.email).toBe("alice@club.example");
    expect(item.telephone).toBe("+41000000001");
    expect(JSON.stringify(item)).not.toContain("756.1234.5678.90");
    expect(JSON.stringify(item)).not.toContain("1990-04-12");
  });

  it("fiche API → AVS toujours masqué comme actuellement", () => {
    expect(maskAvsNumber("756.1234.5678.90")).toBe("756.XXXX.XXXX.90");
    expect(maskAvsNumber("7561234567890")).toBe("756.XXXX.XXXX.90");
    expect(maskAvsNumber(SAMPLE_ROW.avs_number)).not.toBe(SAMPLE_ROW.avs_number);
  });

  it("l’annuaire UI liste via /api/clients ; la fiche RSC lit via admin après VIEW_MEMBERS", () => {
    const listPage = read("app/tableau-de-bord/clients/page.tsx");
    expect(listPage).toContain('fetch("/api/clients"');
    expect(listPage).not.toMatch(/from\("clients"\)/);

    const detailPage = read("app/tableau-de-bord/clients/[id]/page.tsx");
    expect(detailPage).toContain("PERMISSIONS.VIEW_MEMBERS");
    expect(detailPage).toContain("createAdminClient");
    expect(detailPage).toContain('.eq("user_id", clubId)');
    expect(detailPage).toContain("maskAvsNumber");
  });

  it("planning public : noms toujours via admin, colonnes id, nom uniquement", () => {
    const pub = read("app/api/public/plannings/[token]/route.ts");
    expect(pub).toContain("createAdminClient");
    expect(pub).toContain('.from("clients")');
    expect(pub).toContain('.select("id, nom")');
  });

  it("matching planning : charge toujours id, nom (flux public admin inchangé)", () => {
    const match = read("lib/planning/fetchClubMembersForNameMatch.ts");
    expect(match).toContain('"id, nom, deleted_at"');
    expect(match).toContain('"id, nom"');
    expect(match).toContain('.from("clients")');
    const pub = read("app/api/public/plannings/[token]/route.ts");
    expect(pub).toContain("fetchClubMembersForNameMatch");
    expect(pub).toContain("createAdminClient");
  });

  it("documents / cotisations / buvette : lectures clients via admin après permission", () => {
    expect(read("app/api/documents/route.ts")).toContain("createAdminClient");
    expect(read("app/api/documents/route.ts")).toContain('.from("clients")');
    expect(read("app/api/documents/[id]/route.ts")).toContain("createAdminClient");
    expect(read("app/api/buvette/requests/[id]/send-invoice/route.tsx")).toContain(
      "createAdminClient"
    );
  });

  it("ne touche pas au planning public, matching, documents, QR, boutique, autres policies", () => {
    expect(migration).not.toContain("plannings");
    expect(migration).not.toContain("planning_assignments");
    expect(migration).not.toContain("qrcodes");
    expect(migration).not.toContain("shop_");
    expect(migration).not.toContain("documents");
    expect(migration).not.toContain("buvette");
    expect(migration).not.toContain("profiles");
  });
});
