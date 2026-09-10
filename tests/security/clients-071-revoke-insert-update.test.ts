import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

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

function stripSqlComments(sql: string) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*--[^\n]*$/gm, "")
    .replace(/^[ \t]*--[^\n]*\n/gm, "");
}

type ClubRole = "owner" | "admin" | "committee" | "member";

/**
 * 071 : GRANT INSERT/UPDATE retirés à authenticated.
 * Le rôle JWT ne peut plus écrire, même owner/admin ou manage_members.
 * service_role conserve INSERT/UPDATE (non révoqué).
 */
function authenticatedCanInsertOrUpdateClients(_args: {
  role: ClubRole;
  manageMembers: boolean;
}): boolean {
  void _args;
  return false;
}

function serviceRoleCanInsertOrUpdateClients(): boolean {
  return true;
}

describe("071 — clients REVOKE INSERT/UPDATE authenticated", () => {
  const migration = read(
    "supabase/migrations/071_clients_revoke_insert_update.sql"
  );
  const rls070 = read(
    "supabase/migrations/070_clients_insert_update_manage_members.sql"
  );
  const select068 = read("supabase/migrations/068_clients_select_staff.sql");
  const grants069 = read(
    "supabase/migrations/069_clients_revoke_avs_dob_select.sql"
  );

  it("révoque INSERT et UPDATE pour PUBLIC, anon, authenticated", () => {
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE ON TABLE public.clients FROM PUBLIC;"
    );
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE ON TABLE public.clients FROM anon;"
    );
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE ON TABLE public.clients FROM authenticated;"
    );
  });

  it("ne touche pas à SELECT, DELETE, GRANT, 070, service_role, schéma", () => {
    const executable = stripSqlComments(migration);
    expect(executable).not.toMatch(/\bREVOKE\s+SELECT\b/i);
    expect(executable).not.toMatch(/\bREVOKE\s+DELETE\b/i);
    expect(executable).not.toMatch(/\bGRANT\b/i);
    expect(executable).not.toMatch(/\bDROP POLICY\b/i);
    expect(executable).not.toMatch(/\bCREATE POLICY\b/i);
    expect(executable).not.toMatch(/\bALTER TABLE\b/i);
    expect(executable).not.toMatch(/\bDROP COLUMN\b/i);
    expect(executable).not.toMatch(/\bservice_role\b/i);
    expect(migration).not.toContain("clients_select_staff");
    expect(select068).toContain("clients_select_staff");
    expect(grants069).toContain("GRANT SELECT (");
    expect(rls070).toContain("clients_insert_manage_members");
    expect(rls070).toContain("clients_update_manage_members");
    expect(migration).not.toContain("clients_insert_manage_members");
    expect(migration).not.toContain("clients_update_manage_members");
  });

  it("committee + manage_members → UPDATE PostgREST refusé", () => {
    expect(
      authenticatedCanInsertOrUpdateClients({
        role: "committee",
        manageMembers: true,
      })
    ).toBe(false);
  });

  it("owner / admin → UPDATE PostgREST refusé également", () => {
    expect(
      authenticatedCanInsertOrUpdateClients({
        role: "owner",
        manageMembers: true,
      })
    ).toBe(false);
    expect(
      authenticatedCanInsertOrUpdateClients({
        role: "admin",
        manageMembers: true,
      })
    ).toBe(false);
  });

  it("INSERT PostgREST authenticated → refusé", () => {
    expect(
      authenticatedCanInsertOrUpdateClients({
        role: "committee",
        manageMembers: true,
      })
    ).toBe(false);
    expect(
      authenticatedCanInsertOrUpdateClients({
        role: "owner",
        manageMembers: false,
      })
    ).toBe(false);
  });

  it("POST /api/clients autorisé → createAdminClient après MANAGE_MEMBERS", () => {
    const post = extractFn(read("app/api/clients/route.ts"), "POST");
    expect(post).toContain("PERMISSIONS.MANAGE_MEMBERS");
    expect(post.indexOf("requirePermission")).toBeLessThan(
      post.indexOf("createAdminClient")
    );
    expect(post).toMatch(/await admin\s*\n\s*\.from\("clients"\)/);
    expect(post).toContain(".insert(");
    expect(post).toContain("insertPayload");
  });

  it("PUT /api/clients/[id] autorisé → createAdminClient après MANAGE_MEMBERS", () => {
    const put = extractFn(read("app/api/clients/[id]/route.ts"), "PUT");
    expect(put).toContain("PERMISSIONS.MANAGE_MEMBERS");
    expect(put.indexOf("requirePermission")).toBeLessThan(
      put.indexOf("createAdminClient")
    );
    expect(put).toContain('.eq("user_id", guard.clubId)');
    expect(put).toContain(".update(");
    expect(put).toContain("createAdminClient");
  });

  it("import → admin insert après MANAGE_MEMBERS", () => {
    const imp = read("app/api/clients/import/route.ts");
    expect(imp).toContain("PERMISSIONS.MANAGE_MEMBERS");
    expect(imp).toContain("createAdminClient");
    expect(imp).toContain(".insert(");
    expect(imp).toContain("insertPayload");
  });

  it("AVS/DOB édition UI → PUT API (pas d’update JWT navigateur)", () => {
    const form = read(
      "app/tableau-de-bord/clients/[id]/edit/EditClientForm.tsx"
    );
    expect(form).toContain("avs_number");
    expect(form).toContain("date_of_birth");
    expect(form).toContain('method: "PUT"');
    expect(form).toContain("/api/clients/");
    expect(form).not.toMatch(/from\("clients"\)/);

    const edit = read("app/tableau-de-bord/clients/[id]/edit/page.tsx");
    expect(edit).toContain("PERMISSIONS.MANAGE_MEMBERS");
    expect(edit).toContain("createAdminClient");
    expect(edit).toContain('.select("*")');
  });

  it("buvette find-or-create → admin insert après MANAGE_INVOICES", () => {
    const buvette = extractFn(
      read("app/api/buvette/requests/[id]/send-invoice/route.tsx"),
      "POST"
    );
    expect(buvette).toContain("PERMISSIONS.MANAGE_INVOICES");
    expect(buvette.indexOf("requirePermission")).toBeLessThan(
      buvette.indexOf("createAdminClient()")
    );
    expect(buvette).toContain('.eq("user_id", guard.clubId)');
    expect(buvette).toContain(".insert({");
    expect(buvette).toContain("user_id: guard.clubId");
  });

  it("planning / documents → lectures admin, pas d’insert/update clients", () => {
    const planning = extractFn(read("app/api/plannings/[id]/route.ts"), "GET");
    expect(planning).toContain("createAdminClient");
    expect(planning).not.toMatch(/from\("clients"\)[\s\S]{0,80}\.(insert|update)\(/);

    const docs = read("app/api/documents/route.ts");
    expect(docs).toContain("createAdminClient");
    expect(docs).toContain('.from("clients")');
    expect(docs).toContain('.select("id")');

    const pdfPlan = read("app/api/pdf/planning/download/route.tsx");
    expect(pdfPlan).toContain("createAdminClient");
    expect(pdfPlan).toContain('.select("id, nom, email, telephone, role, category")');
  });

  it("service_role → INSERT/UPDATE toujours autorisés (aucun REVOKE le concernant)", () => {
    expect(serviceRoleCanInsertOrUpdateClients()).toBe(true);
    expect(stripSqlComments(migration)).not.toMatch(/\bservice_role\b/i);
  });

  it("DELETE owner → JWT + select id, pas de createAdminClient", () => {
    const del = extractFn(read("app/api/clients/[id]/route.ts"), "DELETE");
    expect(del).toContain("PERMISSIONS.DELETE_MEMBERS");
    expect(del).toContain("await createClient()");
    expect(del).not.toContain("createAdminClient");
    expect(del).toContain(".delete()");
    expect(del).toContain('.select("id")');
    expect(migration).not.toMatch(/\bREVOKE\s+DELETE\b/i);
  });
});
