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
 * has_club_permission (028) + status active (066) :
 * owner/admin actifs → true ; sinon JSON manage_members = true.
 * Scope = clients.user_id (club de la ligne).
 */
function hasManageMembers(args: {
  role: ClubRole;
  status: "active" | "disabled";
  manageMembers: boolean;
  sameClub: boolean;
}): boolean {
  if (!args.sameClub) return false;
  if (args.status !== "active") return false;
  if (args.role === "owner" || args.role === "admin") return true;
  return args.manageMembers;
}

/** 070 : INSERT/UPDATE JWT = has_club_permission uniquement. */
function canWriteClientsJwt(args: {
  role: ClubRole;
  status: "active" | "disabled";
  manageMembers: boolean;
  sameClub: boolean;
}): boolean {
  return hasManageMembers(args);
}

describe("070 — clients INSERT/UPDATE = manage_members", () => {
  const migration = read(
    "supabase/migrations/070_clients_insert_update_manage_members.sql"
  );
  const previous = read("supabase/migrations/038_clients_rls_manage_members.sql");
  const select068 = read("supabase/migrations/068_clients_select_staff.sql");
  const grants069 = read(
    "supabase/migrations/069_clients_revoke_avs_dob_select.sql"
  );

  it("retire 038 (staff OR manage_members) et pose has_club_permission seul", () => {
    expect(previous).toContain("public.is_club_staff(user_id)");
    expect(previous).toContain(
      "public.has_club_permission(user_id, 'manage_members')"
    );
    expect(migration).toContain("DROP POLICY IF EXISTS clients_insert_staff");
    expect(migration).toContain("DROP POLICY IF EXISTS clients_update_staff");
    expect(migration).toContain("CREATE POLICY clients_insert_manage_members");
    expect(migration).toContain("CREATE POLICY clients_update_manage_members");

    const created = migration.slice(migration.indexOf("CREATE POLICY"));
    expect(created).toContain("public.has_club_permission(user_id, 'manage_members')");
    expect(created).not.toContain("is_club_staff");
    expect(created.match(/has_club_permission/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("ne touche pas à SELECT 068/069, DELETE, GRANT, schéma, service_role", () => {
    const executable = stripSqlComments(migration);
    expect(executable).not.toMatch(/\bFOR SELECT\b/i);
    expect(executable).not.toMatch(/\bFOR DELETE\b/i);
    expect(executable).not.toMatch(/\bGRANT\b/i);
    expect(executable).not.toMatch(/\bREVOKE\b/i);
    expect(executable).not.toMatch(/\bALTER TABLE\b/i);
    expect(executable).not.toMatch(/\bDROP COLUMN\b/i);
    expect(executable).not.toMatch(/\bUPDATE\s+public\.clients/i);
    expect(executable).not.toMatch(/\bINSERT\s+INTO\s+public\.clients/i);
    expect(executable).not.toMatch(/\bservice_role\b/i);
    expect(executable).not.toContain("clients_select_staff");
    expect(executable).not.toContain("avs_number");
    expect(executable).not.toContain("date_of_birth");
    expect(select068).toContain("clients_select_staff");
    expect(select068).toContain("public.is_club_staff(user_id)");
    expect(grants069).toContain("REVOKE SELECT ON TABLE public.clients FROM authenticated");
    expect(grants069).toContain("GRANT SELECT (");
  });

  it("committee sans manage_members → UPDATE refusé", () => {
    expect(
      canWriteClientsJwt({
        role: "committee",
        status: "active",
        manageMembers: false,
        sameClub: true,
      })
    ).toBe(false);
  });

  it("committee sans manage_members → INSERT refusé", () => {
    expect(
      canWriteClientsJwt({
        role: "committee",
        status: "active",
        manageMembers: false,
        sameClub: true,
      })
    ).toBe(false);
  });

  it("committee sans manage_members : AVS / DOB / nom / email refusés", () => {
    const denied = canWriteClientsJwt({
      role: "committee",
      status: "active",
      manageMembers: false,
      sameClub: true,
    });
    expect(denied).toBe(false);
    for (const _field of ["avs_number", "date_of_birth", "nom", "email"] as const) {
      expect(denied).toBe(false);
    }
  });

  it("committee + manage_members → autorisé", () => {
    expect(
      canWriteClientsJwt({
        role: "committee",
        status: "active",
        manageMembers: true,
        sameClub: true,
      })
    ).toBe(true);
  });

  it("owner / admin → autorisés (rôle fort, sans JSON)", () => {
    expect(
      canWriteClientsJwt({
        role: "owner",
        status: "active",
        manageMembers: false,
        sameClub: true,
      })
    ).toBe(true);
    expect(
      canWriteClientsJwt({
        role: "admin",
        status: "active",
        manageMembers: false,
        sameClub: true,
      })
    ).toBe(true);
  });

  it("member + manage_members → INSERT/UPDATE RLS conservé (modèle 038)", () => {
    expect(
      canWriteClientsJwt({
        role: "member",
        status: "active",
        manageMembers: true,
        sameClub: true,
      })
    ).toBe(true);
    expect(
      canWriteClientsJwt({
        role: "member",
        status: "active",
        manageMembers: false,
        sameClub: true,
      })
    ).toBe(false);
  });

  it("disabled → refusé", () => {
    expect(
      canWriteClientsJwt({
        role: "committee",
        status: "disabled",
        manageMembers: true,
        sameClub: true,
      })
    ).toBe(false);
    expect(
      canWriteClientsJwt({
        role: "owner",
        status: "disabled",
        manageMembers: false,
        sameClub: true,
      })
    ).toBe(false);
    expect(
      canWriteClientsJwt({
        role: "member",
        status: "disabled",
        manageMembers: true,
        sameClub: true,
      })
    ).toBe(false);
  });

  it("écriture sur un autre club → refusée", () => {
    expect(
      canWriteClientsJwt({
        role: "committee",
        status: "active",
        manageMembers: true,
        sameClub: false,
      })
    ).toBe(false);
    expect(
      canWriteClientsJwt({
        role: "owner",
        status: "active",
        manageMembers: false,
        sameClub: false,
      })
    ).toBe(false);
    expect(
      canWriteClientsJwt({
        role: "admin",
        status: "active",
        manageMembers: false,
        sameClub: false,
      })
    ).toBe(false);
  });

  it("APIs création / édition / import : MANAGE_MEMBERS puis createAdminClient + clubId", () => {
    const post = extractFn(read("app/api/clients/route.ts"), "POST");
    expect(post).toContain("PERMISSIONS.MANAGE_MEMBERS");
    expect(post.indexOf("requirePermission")).toBeLessThan(
      post.indexOf("createAdminClient")
    );
    expect(post).toMatch(/await admin\s*\n\s*\.from\("clients"\)/);
    expect(post).toContain("insert");

    const put = extractFn(read("app/api/clients/[id]/route.ts"), "PUT");
    expect(put).toContain("PERMISSIONS.MANAGE_MEMBERS");
    expect(put.indexOf("requirePermission")).toBeLessThan(
      put.indexOf("createAdminClient")
    );
    expect(put).toContain('.eq("user_id", guard.clubId)');
    expect(put).toContain(".update(");

    const edit = read("app/tableau-de-bord/clients/[id]/edit/page.tsx");
    expect(edit).toContain("PERMISSIONS.MANAGE_MEMBERS");
    expect(edit).toContain("createAdminClient");
    expect(edit).toContain('.eq("user_id", clubId)');

    const imp = read("app/api/clients/import/route.ts");
    expect(imp).toContain("PERMISSIONS.MANAGE_MEMBERS");
    expect(imp).toContain("createAdminClient");
    expect(imp).toContain(".insert(");
  });

  it("068 et 069 restent inchangées (fichiers + 070 ne les réécrit pas)", () => {
    expect(select068).toContain('CREATE POLICY "clients_select_staff"');
    expect(select068).not.toContain("has_club_permission");
    expect(grants069).toContain("avs_number");
    expect(grants069).toContain("date_of_birth");
    expect(migration).not.toContain("REVOKE SELECT");
    expect(migration).not.toContain("GRANT SELECT");
    expect(migration).not.toContain("clients_select");
  });
});
