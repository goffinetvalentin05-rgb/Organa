import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function readMigration(name: string) {
  return readFileSync(path.join(ROOT, "supabase/migrations", name), "utf8");
}

type ClubRole = "owner" | "admin" | "committee" | "member";
type MembershipStatus = "invited" | "active" | "disabled";

type Membership = {
  role: ClubRole;
  status: MembershipStatus;
  deletedAt: string | null;
  permissions?: Record<string, boolean>;
};

/** Sémantique 066 de is_club_member (et donc staff/admin/owner). */
function isClubMember(
  m: Membership | null,
  roles?: ClubRole[] | null
): boolean {
  if (!m) return false;
  if (m.deletedAt !== null) return false;
  if (m.status !== "active") return false;
  if (roles == null) return true;
  return roles.includes(m.role);
}

function isClubStaff(m: Membership | null) {
  return isClubMember(m, ["owner", "admin", "committee"]);
}

function isClubAdmin(m: Membership | null) {
  return isClubMember(m, ["owner", "admin"]);
}

function isClubOwner(m: Membership | null) {
  return isClubMember(m, ["owner"]);
}

function currentUserRoleIn(m: Membership | null): ClubRole | null {
  if (!isClubMember(m)) return null;
  return m!.role;
}

function currentUserPermissions(m: Membership | null): Record<string, boolean> | null {
  if (!isClubMember(m)) return null;
  if (m!.role === "owner" || m!.role === "admin") {
    return { all: true };
  }
  return m!.permissions ?? {};
}

function extractFunction(sql: string, name: string): string {
  const marker = `CREATE OR REPLACE FUNCTION public.${name}`;
  const start = sql.indexOf(marker);
  if (start < 0) return "";
  const next = sql.indexOf("CREATE OR REPLACE FUNCTION", start + marker.length);
  const grant = sql.indexOf("GRANT EXECUTE", start + marker.length);
  let end = sql.length;
  if (next >= 0) end = Math.min(end, next);
  if (grant >= 0) end = Math.min(end, grant);
  return sql.slice(start, end);
}

describe("066 — is_club_member exige status = active", () => {
  const migration = readMigration("066_is_club_member_status_active.sql");
  const previousMember = readMigration("020_clubs_memberships.sql");
  const previousPerms = readMigration("028_club_memberships_permissions.sql");
  const acceptFn = readMigration("031_accept_invitation_fix_ambiguous_club_id.sql");

  it("redéfinit uniquement les quatre helpers demandés, sans DML ni policies", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.is_club_member(");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.current_user_club_ids()");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.current_user_role_in(");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.current_user_permissions(");
    expect(migration).not.toContain("CREATE OR REPLACE FUNCTION public.has_club_permission");
    expect(migration).not.toContain("CREATE OR REPLACE FUNCTION public.accept_invitation");
    expect(migration).not.toContain("CREATE OR REPLACE FUNCTION public.is_club_staff");
    expect(migration).not.toContain("CREATE OR REPLACE FUNCTION public.is_club_admin");
    expect(migration).not.toContain("CREATE OR REPLACE FUNCTION public.is_club_owner");
    expect(migration).not.toContain("find_user_id_by_email");
    expect(migration).not.toMatch(/CREATE POLICY/i);
    expect(migration).not.toMatch(/DROP POLICY/i);
    expect(migration).not.toMatch(/\bUPDATE\s+public\.club_memberships/i);
    expect(migration).not.toMatch(/\bDELETE\s+FROM\s+public\.club_memberships/i);
    expect(migration).not.toMatch(/\bINSERT\s+INTO\s+public\.club_memberships/i);
    expect(migration).not.toMatch(/\bUPDATE\s+public\.club_invitations/i);
  });

  it("is_club_member conserve deleted_at IS NULL et ajoute status = active", () => {
    const before = extractFunction(previousMember, "is_club_member");
    const after = extractFunction(migration, "is_club_member");
    expect(before).toContain("cm.deleted_at IS NULL");
    expect(before).not.toMatch(/cm\.status = 'active'/);
    expect(after).toContain("cm.deleted_at IS NULL");
    expect(after).toMatch(/cm\.status = 'active'/);
  });

  it("current_user_club_ids / current_user_role_in / current_user_permissions filtrent status = active", () => {
    expect(extractFunction(previousMember, "current_user_club_ids")).not.toMatch(
      /cm\.status = 'active'/
    );
    expect(extractFunction(previousMember, "current_user_role_in")).not.toMatch(
      /cm\.status = 'active'/
    );
    expect(extractFunction(previousPerms, "current_user_permissions")).toMatch(
      /WHEN cm\.role IN \('owner', 'admin'\) THEN/
    );

    for (const name of [
      "current_user_club_ids",
      "current_user_role_in",
      "current_user_permissions",
    ]) {
      const body = extractFunction(migration, name);
      expect(body).toContain("cm.deleted_at IS NULL");
      expect(body).toMatch(/cm\.status = 'active'/);
    }

    const perms = extractFunction(migration, "current_user_permissions");
    expect(perms).toMatch(/AND cm\.status = 'active'/);
  });

  it("member disabled → ne peut plus SELECT les données du club", () => {
    const m: Membership = {
      role: "member",
      status: "disabled",
      deletedAt: null,
    };
    expect(isClubMember(m)).toBe(false);
  });

  it("committee disabled → ne peut plus UPDATE", () => {
    const m: Membership = {
      role: "committee",
      status: "disabled",
      deletedAt: null,
    };
    expect(isClubStaff(m)).toBe(false);
  });

  it("admin disabled → ne peut plus gérer invitations/memberships", () => {
    const m: Membership = {
      role: "admin",
      status: "disabled",
      deletedAt: null,
    };
    expect(isClubAdmin(m)).toBe(false);
    expect(currentUserRoleIn(m)).toBeNull();
    expect(currentUserPermissions(m)).toBeNull();
  });

  it("member active → SELECT toujours OK", () => {
    const m: Membership = {
      role: "member",
      status: "active",
      deletedAt: null,
    };
    expect(isClubMember(m)).toBe(true);
    expect(isClubStaff(m)).toBe(false);
    expect(isClubAdmin(m)).toBe(false);
  });

  it("committee/admin active → écritures toujours OK", () => {
    const committee: Membership = {
      role: "committee",
      status: "active",
      deletedAt: null,
    };
    const admin: Membership = {
      role: "admin",
      status: "active",
      deletedAt: null,
    };
    expect(isClubStaff(committee)).toBe(true);
    expect(isClubAdmin(committee)).toBe(false);
    expect(isClubStaff(admin)).toBe(true);
    expect(isClubAdmin(admin)).toBe(true);
  });

  it("owner actif → inchangé", () => {
    const m: Membership = {
      role: "owner",
      status: "active",
      deletedAt: null,
    };
    expect(isClubOwner(m)).toBe(true);
    expect(isClubAdmin(m)).toBe(true);
    expect(isClubStaff(m)).toBe(true);
    expect(isClubMember(m)).toBe(true);
    expect(currentUserRoleIn(m)).toBe("owner");
    expect(currentUserPermissions(m)).toEqual({ all: true });
  });

  it("acceptation d’une invitation → membership active puis accès normal", () => {
    expect(acceptFn).toMatch(/SECURITY DEFINER/);
    expect(acceptFn).toMatch(/status = 'active'/);
    expect(acceptFn).toMatch(/v_inv\.club_id, v_uid, v_inv\.role, 'active'/);
    expect(migration).not.toContain("accept_invitation");

    const afterAccept: Membership = {
      role: "member",
      status: "active",
      deletedAt: null,
    };
    expect(isClubMember(afterAccept)).toBe(true);
  });

  it("membership supprimée → toujours aucun accès", () => {
    const deletedActive: Membership = {
      role: "admin",
      status: "active",
      deletedAt: "2026-01-01T00:00:00Z",
    };
    const deletedDisabled: Membership = {
      role: "committee",
      status: "disabled",
      deletedAt: "2026-01-01T00:00:00Z",
    };
    expect(isClubMember(deletedActive)).toBe(false);
    expect(isClubStaff(deletedDisabled)).toBe(false);
    expect(isClubAdmin(deletedActive)).toBe(false);
  });

  it("invited n’est pas traité comme membre actif", () => {
    const m: Membership = {
      role: "member",
      status: "invited",
      deletedAt: null,
    };
    expect(isClubMember(m)).toBe(false);
    expect(currentUserRoleIn(m)).toBeNull();
    expect(currentUserPermissions(m)).toBeNull();
  });
});
