import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  CLIENTS_PLANNING_COLUMNS,
  CLIENTS_SAFE_COLUMNS,
} from "@/lib/clients/safeSelect";

const ROOT = path.resolve(__dirname, "../..");

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function extractFn(src: string, name: string) {
  const start = src.indexOf(`export async function ${name}`);
  expect(start).toBeGreaterThanOrEqual(0);
  const next = src.indexOf("export async function ", start + 10);
  return next >= 0 ? src.slice(start, next) : src.slice(start);
}

/** Allowlist 069 — colonnes SELECT JWT authenticated. Jamais AVS / DOB. */
export const CLIENTS_JWT_SELECT_ALLOWLIST = [
  "id",
  "organization_id",
  "user_id",
  "nom",
  "email",
  "telephone",
  "adresse",
  "postal_code",
  "city",
  "role",
  "category",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "deleted_at",
  "deleted_by",
] as const;

const SENSITIVE_COLUMNS = ["avs_number", "date_of_birth"] as const;
const LEGACY_RENAMED = ["name", "phone", "address"] as const;

type ClubRole = "owner" | "admin" | "committee" | "member";
type JwtSelectOutcome = "ok" | "privilege_denied" | "rls_empty";

/** Policy 068 : SELECT RLS = is_club_staff + deleted_at IS NULL. */
function rlsAllowsClientsSelect(role: ClubRole, status: "active" | "disabled") {
  if (status !== "active") return false;
  return role === "owner" || role === "admin" || role === "committee";
}

/**
 * PostgREST JWT authenticated après 069 :
 * - member / non-actif → 0 ligne (068) avant même les colonnes ;
 * - select=* ou colonne hors allowlist → permission denied (GRANT colonne) ;
 * - allowlist + staff actif → autorisé.
 */
function jwtSelect(
  role: ClubRole,
  status: "active" | "disabled",
  columns: "*" | readonly string[]
): JwtSelectOutcome {
  if (!rlsAllowsClientsSelect(role, status)) return "rls_empty";
  if (columns === "*") return "privilege_denied";
  const allow: readonly string[] = CLIENTS_JWT_SELECT_ALLOWLIST;
  if (columns.some((c) => !allow.includes(c))) return "privilege_denied";
  return "ok";
}

function stripSqlComments(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*--[^\n]*$/gm, "")
    .replace(/^[ \t]*--[^\n]*\n/gm, "");
}

function parseGrantedSelectColumns(sql: string): string[] {
  const m = sql.match(
    /GRANT\s+SELECT\s+\(([\s\S]*?)\)\s+ON\s+TABLE\s+public\.clients\s+TO\s+authenticated/i
  );
  expect(m).not.toBeNull();
  return m![1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

describe("069 — clients GRANT SELECT colonnes, sans AVS ni DOB", () => {
  const migration = read(
    "supabase/migrations/069_clients_revoke_avs_dob_select.sql"
  );
  const rls068 = read("supabase/migrations/068_clients_select_staff.sql");
  const writes = read("supabase/migrations/038_clients_rls_manage_members.sql");

  it("révoque le SELECT de niveau table pour PUBLIC, anon, authenticated", () => {
    expect(migration).toContain(
      "REVOKE SELECT ON TABLE public.clients FROM PUBLIC;"
    );
    expect(migration).toContain(
      "REVOKE SELECT ON TABLE public.clients FROM anon;"
    );
    expect(migration).toContain(
      "REVOKE SELECT ON TABLE public.clients FROM authenticated;"
    );
  });

  it("n’accorde aucun SELECT de niveau table à authenticated", () => {
    expect(migration).not.toMatch(
      /GRANT\s+(ALL(\s+PRIVILEGES)?|SELECT)\s+ON\s+TABLE\s+public\.clients/i
    );
    expect(migration).not.toMatch(
      /GRANT\s+SELECT\s+ON\s+public\.clients/i
    );
  });

  it("GRANT SELECT explicite = allowlist, sans AVS / DOB / colonnes legacy", () => {
    const granted = parseGrantedSelectColumns(migration);
    expect(granted).toEqual([...CLIENTS_JWT_SELECT_ALLOWLIST]);
    for (const col of SENSITIVE_COLUMNS) {
      expect(granted).not.toContain(col);
    }
    for (const col of LEGACY_RENAMED) {
      expect(granted).not.toContain(col);
    }
  });

  it("révoque aussi le SELECT colonne sur avs_number et date_of_birth", () => {
    expect(migration).toContain(
      "REVOKE SELECT (avs_number) ON TABLE public.clients FROM authenticated;"
    );
    expect(migration).toContain(
      "REVOKE SELECT (date_of_birth) ON TABLE public.clients FROM authenticated;"
    );
  });

  it("ne touche pas à service_role, ni à INSERT / UPDATE / DELETE, ni à 068", () => {
    const executable = stripSqlComments(migration);
    expect(executable).not.toMatch(/\bservice_role\b/i);
    expect(migration).not.toMatch(/\bGRANT\s+(INSERT|UPDATE|DELETE)\b/i);
    expect(migration).not.toMatch(/\bREVOKE\s+(INSERT|UPDATE|DELETE)\b/i);
    expect(migration).not.toMatch(/\bCREATE POLICY\b/i);
    expect(migration).not.toMatch(/\bDROP POLICY\b/i);
    expect(migration).not.toMatch(/\bUPDATE\s+public\.clients/i);
    expect(migration).not.toMatch(/\bINSERT\s+INTO\s+public\.clients/i);
    expect(migration).not.toMatch(/\bDELETE\s+FROM\s+public\.clients/i);
    expect(migration).not.toMatch(/\bALTER TABLE\s+public\.clients/i);
    expect(migration).not.toMatch(/\bDROP COLUMN\b/i);
    expect(migration).not.toContain("information_schema.columns");
    expect(rls068).toContain("clients_select_staff");
    expect(migration).not.toContain("clients_select_staff");
    expect(writes).toContain("clients_insert_staff");
    expect(migration).not.toContain("clients_insert_staff");
    expect(migration).not.toContain("clients_update_staff");
  });

  it("allowlist = colonnes réellement introduites par le schéma actuel", () => {
    const schema = read("supabase/schema.sql");
    const clientsCreate = schema.slice(
      schema.indexOf("CREATE TABLE IF NOT EXISTS clients"),
      schema.indexOf("CREATE TABLE IF NOT EXISTS devis")
    );
    expect(clientsCreate).toContain("organization_id");
    expect(clientsCreate).toContain("nom");
    expect(clientsCreate).toContain("email");
    expect(clientsCreate).toContain("telephone");
    expect(clientsCreate).toContain("adresse");
    expect(clientsCreate).toContain("created_at");
    expect(clientsCreate).toContain("updated_at");

    expect(read("supabase/migrations/004_fix_clients_rls_user_id.sql")).toMatch(
      /user_id/
    );
    expect(read("supabase/migrations/010_add_role_category_to_clients.sql")).toContain(
      "ADD COLUMN IF NOT EXISTS role"
    );
    expect(read("supabase/migrations/010_add_role_category_to_clients.sql")).toContain(
      "ADD COLUMN IF NOT EXISTS category"
    );
    expect(read("supabase/migrations/032_clients_postal_city.sql")).toContain(
      "postal_code"
    );
    expect(read("supabase/migrations/032_clients_postal_city.sql")).toContain("city");
    expect(read("supabase/migrations/022_soft_delete.sql")).toContain("'clients'");
    expect(read("supabase/migrations/029_created_by_updated_by.sql")).toContain(
      "'clients'"
    );
    expect(
      read("supabase/migrations/033_club_member_field_settings_and_clients_avs.sql")
    ).toContain("ADD COLUMN IF NOT EXISTS date_of_birth");
    expect(
      read("supabase/migrations/033_club_member_field_settings_and_clients_avs.sql")
    ).toContain("ADD COLUMN IF NOT EXISTS avs_number");
    expect(read("supabase/migrations/001_rename_clients_columns.sql")).toContain(
      "RENAME COLUMN name TO nom"
    );
  });

  it("committee : select=avs_number → refusé", () => {
    expect(jwtSelect("committee", "active", ["avs_number"])).toBe(
      "privilege_denied"
    );
    expect(jwtSelect("admin", "active", ["avs_number"])).toBe("privilege_denied");
    expect(jwtSelect("owner", "active", ["avs_number"])).toBe("privilege_denied");
  });

  it("committee : select=date_of_birth → refusé", () => {
    expect(jwtSelect("committee", "active", ["date_of_birth"])).toBe(
      "privilege_denied"
    );
    expect(jwtSelect("admin", "active", ["date_of_birth"])).toBe(
      "privilege_denied"
    );
    expect(jwtSelect("owner", "active", ["date_of_birth"])).toBe(
      "privilege_denied"
    );
  });

  it("committee : select=* → refusé (ne contourne pas le GRANT colonne)", () => {
    expect(jwtSelect("committee", "active", "*")).toBe("privilege_denied");
    expect(jwtSelect("admin", "active", "*")).toBe("privilege_denied");
    expect(jwtSelect("owner", "active", "*")).toBe("privilege_denied");
  });

  it("committee : select=id,nom,email,telephone → autorisé si RLS 068", () => {
    expect(
      jwtSelect("committee", "active", ["id", "nom", "email", "telephone"])
    ).toBe("ok");
    expect(jwtSelect("committee", "disabled", ["id", "nom"])).toBe("rls_empty");
  });

  it("member → toujours aucune ligne grâce à 068", () => {
    expect(jwtSelect("member", "active", ["id", "nom", "email", "telephone"])).toBe(
      "rls_empty"
    );
    expect(jwtSelect("member", "active", "*")).toBe("rls_empty");
    expect(jwtSelect("member", "active", ["avs_number"])).toBe("rls_empty");
    expect(rlsAllowsClientsSelect("member", "active")).toBe(false);
  });

  it("service_role conserve l’accès complet (aucun REVOKE / GRANT le concernant)", () => {
    const executable = stripSqlComments(migration);
    expect(executable).not.toMatch(/\bservice_role\b/i);
    expect(executable).not.toMatch(
      /GRANT\s+SELECT[\s\S]*TO\s+(PUBLIC|anon|authenticator)\b/i
    );
  });

  it("API manage_members : lecture / édition AVS et DOB via admin après permission", () => {
    const put = extractFn(read("app/api/clients/[id]/route.ts"), "PUT");
    expect(put).toContain("PERMISSIONS.MANAGE_MEMBERS");
    expect(put.indexOf("requirePermission")).toBeLessThan(
      put.indexOf("createAdminClient")
    );
    expect(put).toContain('.select("*")');
    expect(put).toContain('.eq("user_id", guard.clubId)');
    expect(put).toContain("maskAvsNumber");

    const post = extractFn(read("app/api/clients/route.ts"), "POST");
    expect(post).toContain("PERMISSIONS.MANAGE_MEMBERS");
    expect(post).toContain("createAdminClient");

    const detailGet = extractFn(read("app/api/clients/[id]/route.ts"), "GET");
    expect(detailGet).toContain("createAdminClient");
    expect(detailGet).toContain('.select("*")');
    expect(detailGet).toContain("normalized.avs_number");
  });

  it("owner/admin : interface édition intacte (RSC admin + formulaire AVS/DOB)", () => {
    const edit = read("app/tableau-de-bord/clients/[id]/edit/page.tsx");
    expect(edit).toContain("PERMISSIONS.MANAGE_MEMBERS");
    const handler = edit.slice(edit.indexOf("export default"));
    expect(handler.indexOf("checkPermission")).toBeLessThan(
      handler.indexOf("createAdminClient()")
    );
    expect(edit).toContain('.select("*")');
    expect(edit).toContain('.eq("user_id", clubId)');
    expect(edit).toContain("date_of_birth");
    expect(edit).toContain("avs_number");

    const form = read(
      "app/tableau-de-bord/clients/[id]/edit/EditClientForm.tsx"
    );
    expect(form).toContain("avs_number");
    expect(form).toContain("date_of_birth");
  });

  it("export / documents / PDF / planning / buvette : pas de régression", () => {
    expect(CLIENTS_SAFE_COLUMNS).not.toContain("avs_number");
    expect(CLIENTS_SAFE_COLUMNS).not.toContain("date_of_birth");
    expect(CLIENTS_PLANNING_COLUMNS).not.toContain("avs_number");
    expect(CLIENTS_PLANNING_COLUMNS).not.toContain("date_of_birth");

    const exp = read("app/api/export/route.ts");
    expect(exp).toContain("PERMISSIONS.VIEW_MEMBERS");
    expect(exp).toContain("createAdminClient");
    expect(exp).toContain('.select("nom, email, telephone, adresse, created_at")');

    const docs = read("app/api/documents/route.ts");
    expect(docs).toContain("CLIENTS_SAFE_COLUMNS");
    expect(docs).toContain("createAdminClient");

    const pdf = read("lib/utils/pdf-data.ts");
    expect(pdf).toContain("createAdminClient");
    expect(pdf).not.toContain("client:clients(*)");

    const planning = extractFn(read("app/api/plannings/[id]/route.ts"), "GET");
    expect(planning).toContain("CLIENTS_PLANNING_COLUMNS");
    expect(planning).toContain("createAdminClient");

    const pdfPlan = read("app/api/pdf/planning/download/route.tsx");
    expect(pdfPlan).toContain("createAdminClient");
    expect(pdfPlan).not.toMatch(/from\("clients"\)\s*\n\s*\.select\("\*"\)/);

    const buvette = extractFn(
      read("app/api/buvette/requests/[id]/send-invoice/route.tsx"),
      "POST"
    );
    expect(buvette).toContain("PERMISSIONS.MANAGE_INVOICES");
    expect(buvette).toContain("createAdminClient");
    expect(buvette).toContain('.eq("user_id", guard.clubId)');
  });

  it("DELETE JWT ne sélectionne que id (dans l’allowlist)", () => {
    const del = extractFn(read("app/api/clients/[id]/route.ts"), "DELETE");
    expect(del).toContain("await createClient()");
    expect(del).not.toContain("createAdminClient");
    expect(del).toContain('.select("id")');
    expect(del).not.toContain("avs_number");
    expect(del).not.toContain("date_of_birth");
  });
});
