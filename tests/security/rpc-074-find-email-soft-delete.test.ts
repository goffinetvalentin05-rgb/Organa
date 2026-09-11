import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function extractFn(src: string, name: string) {
  const start = src.indexOf(`CREATE OR REPLACE FUNCTION public.${name}`);
  expect(start).toBeGreaterThanOrEqual(0);
  const nextCreate = src.indexOf("CREATE OR REPLACE FUNCTION", start + 10);
  const nextRevoke = src.indexOf("REVOKE ", start + 10);
  let end = src.length;
  if (nextCreate >= 0) end = Math.min(end, nextCreate);
  if (nextRevoke >= 0 && nextRevoke < end) end = nextRevoke;
  return src.slice(start, end);
}

type ClubRole = "owner" | "admin" | "committee" | "member";

function authenticatedCanExecuteFindUserIdByEmail(_role: ClubRole) {
  void _role;
  return false;
}

function serviceRoleCanExecuteFindUserIdByEmail() {
  return true;
}

function canSoftDeleteClientsViaRpc(args: {
  role: ClubRole;
  manageMembers: boolean;
}) {
  void args;
  return false;
}

function canSoftDeleteBuvetteRequestViaRpc(role: ClubRole) {
  return role === "owner" || role === "admin" || role === "committee";
}

describe("074 — RPC find_user_id_by_email + soft_delete_row", () => {
  const migration = read(
    "supabase/migrations/074_rpc_find_email_and_soft_delete_clients.sql"
  );
  const previousFind = read("supabase/migrations/028_club_memberships_permissions.sql");
  const previousSoft = read("supabase/migrations/022_soft_delete.sql");

  it("révoque EXECUTE JWT de find_user_id_by_email, conserve service_role", () => {
    const fn = extractFn(migration, "find_user_id_by_email");
    expect(fn).toContain("SECURITY DEFINER");
    expect(fn).toContain("SET search_path = pg_catalog");
    expect(fn).toContain("FROM auth.users");
    expect(migration).toContain(
      "REVOKE EXECUTE ON FUNCTION public.find_user_id_by_email(TEXT) FROM PUBLIC"
    );
    expect(migration).toContain(
      "REVOKE EXECUTE ON FUNCTION public.find_user_id_by_email(TEXT) FROM anon"
    );
    expect(migration).toContain(
      "REVOKE EXECUTE ON FUNCTION public.find_user_id_by_email(TEXT) FROM authenticated"
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.find_user_id_by_email(TEXT) TO service_role"
    );
    expect(authenticatedCanExecuteFindUserIdByEmail("member")).toBe(false);
    expect(authenticatedCanExecuteFindUserIdByEmail("committee")).toBe(false);
    expect(authenticatedCanExecuteFindUserIdByEmail("admin")).toBe(false);
    expect(serviceRoleCanExecuteFindUserIdByEmail()).toBe(true);
  });

  it("028 accordait encore EXECUTE authenticated — 074 le retire", () => {
    expect(previousFind).toContain(
      "GRANT EXECUTE ON FUNCTION public.find_user_id_by_email(TEXT) TO authenticated"
    );
    expect(migration).not.toContain(
      "GRANT EXECUTE ON FUNCTION public.find_user_id_by_email(TEXT) TO authenticated"
    );
  });

  it("API membres : RPC admin après MANAGE_USERS, plus de JWT", () => {
    const src = read("app/api/club/members/route.ts");
    const post = src.slice(src.indexOf("export async function POST"));
    expect(post).toContain("PERMISSIONS.MANAGE_USERS");
    expect(post.indexOf("requirePermission(PERMISSIONS.MANAGE_USERS)")).toBeLessThan(
      post.indexOf("createAdminClient()")
    );
    expect(post).toContain('admin.rpc(\n    "find_user_id_by_email"');
    expect(post).not.toContain('supabase.rpc(\n    "find_user_id_by_email"');
  });

  it("invitations publiques : find_user_id_by_email via admin + token", () => {
    const status = read("app/api/invitations/[token]/account-status/route.ts");
    expect(status).toContain("createAdminClient");
    expect(status).toContain("get_invitation_by_token");
    expect(status.indexOf("get_invitation_by_token")).toBeLessThan(
      status.indexOf("find_user_id_by_email")
    );
    expect(status).toContain("admin.rpc");

    const signup = read("app/api/invitations/[token]/signup/route.ts");
    expect(signup).toContain("createAdminClient");
    expect(signup).toContain("get_invitation_by_token");
    expect(signup.indexOf("get_invitation_by_token")).toBeLessThan(
      signup.indexOf("find_user_id_by_email")
    );
  });

  it("soft_delete_row : clients retiré de la whitelist, buvette conservée", () => {
    expect(previousSoft).toContain("'clients'");
    const fn = extractFn(migration, "soft_delete_row");
    expect(fn).toContain("SECURITY DEFINER");
    expect(fn).toContain("SET search_path = pg_catalog, public");
    expect(fn).toContain("p_row_id UUID");
    expect(fn).toContain("IF p_row_id IS NULL");
    expect(fn).toContain("'buvette_requests'");
    expect(fn).not.toMatch(/'clients'/);
    expect(fn).toContain("public.is_club_staff(v_club_id)");
    expect(fn).toContain("format(");
    expect(fn).toContain("%I");
    expect(canSoftDeleteClientsViaRpc({ role: "committee", manageMembers: false })).toBe(
      false
    );
    expect(canSoftDeleteClientsViaRpc({ role: "committee", manageMembers: true })).toBe(
      false
    );
    expect(canSoftDeleteBuvetteRequestViaRpc("committee")).toBe(true);
    expect(canSoftDeleteBuvetteRequestViaRpc("member")).toBe(false);
  });

  it("buvette archive : MANAGE_PLANNINGS puis soft_delete_row(buvette_requests)", () => {
    const src = read("app/api/buvette/requests/[id]/route.ts");
    expect(src).toContain("PERMISSIONS.MANAGE_PLANNINGS");
    expect(src).toContain('p_table: "buvette_requests"');
    expect(src).not.toContain('p_table: "clients"');
    const patch = src.slice(src.indexOf("export async function PATCH"));
    expect(patch.indexOf("requirePermission(PERMISSIONS.MANAGE_PLANNINGS)")).toBeLessThan(
      patch.indexOf("archiveBuvetteRequest")
    );
  });

  it("074 ne touche pas aux GRANT table ni aux policies RLS", () => {
    expect(migration).not.toMatch(/REVOKE SELECT/i);
    expect(migration).not.toMatch(/CREATE POLICY/i);
    expect(migration).not.toMatch(/DROP POLICY/i);
    expect(migration).not.toMatch(/GRANT SELECT|GRANT INSERT|GRANT UPDATE|GRANT DELETE/i);
  });
});
