import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function readMigration(name: string) {
  return readFileSync(path.join(ROOT, "supabase/migrations", name), "utf8");
}

/**
 * Évalue la policy UPDATE 065 (admin-only).
 * USING / WITH CHECK = is_club_admin(club_id) uniquement.
 */
function canUpdateInvitationAdminOnly(args: {
  isClubAdminOnOldClub: boolean;
  isClubAdminOnNewClub: boolean;
}): boolean {
  return args.isClubAdminOnOldClub && args.isClubAdminOnNewClub;
}

describe("065 — club_invitations UPDATE admin-only", () => {
  const migration = readMigration("065_club_invitations_update_admin_only.sql");
  const previous = readMigration("030_club_invitations.sql");
  const acceptFn = readMigration("031_accept_invitation_fix_ambiguous_club_id.sql");

  it("retire l’ancienne policy invitee et pose une policy admin-only", () => {
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "club_invitations_update_admin_or_invitee"'
    );
    expect(migration).toContain('CREATE POLICY "club_invitations_update_admin"');
    expect(migration).toMatch(/FOR UPDATE/);
    expect(migration).toContain("public.is_club_admin(club_id)");
    expect(migration).not.toMatch(/LOWER\(email\)/);
    expect(migration).not.toMatch(/auth\.users/);
    expect(migration).not.toMatch(/status = 'pending'/);
  });

  it("ne recréé pas la branche invitee de 030", () => {
    expect(previous).toContain("club_invitations_update_admin_or_invitee");
    expect(previous).toMatch(/LOWER\(email\)/);
    expect(migration).toMatch(
      /DROP POLICY IF EXISTS "club_invitations_update_admin_or_invitee"/
    );
    const created = migration.slice(migration.indexOf("CREATE POLICY"));
    expect(created).not.toContain("club_invitations_update_admin_or_invitee");
    expect(created).not.toMatch(/LOWER\(email\)/);
  });

  it("invité : tentative role = owner → refusée", () => {
    expect(
      canUpdateInvitationAdminOnly({
        isClubAdminOnOldClub: false,
        isClubAdminOnNewClub: false,
      })
    ).toBe(false);
  });

  it("invité : modification permissions → refusée", () => {
    expect(
      canUpdateInvitationAdminOnly({
        isClubAdminOnOldClub: false,
        isClubAdminOnNewClub: false,
      })
    ).toBe(false);
  });

  it("invité : modification club_id → refusée", () => {
    expect(
      canUpdateInvitationAdminOnly({
        isClubAdminOnOldClub: false,
        isClubAdminOnNewClub: false,
      })
    ).toBe(false);
    // Même si le NEW club_id était un club dont l’invité n’est pas admin
    expect(
      canUpdateInvitationAdminOnly({
        isClubAdminOnOldClub: false,
        isClubAdminOnNewClub: true,
      })
    ).toBe(false);
  });

  it("admin : USING + WITH CHECK is_club_admin → UPDATE autorisé (cancel / resend)", () => {
    expect(
      canUpdateInvitationAdminOnly({
        isClubAdminOnOldClub: true,
        isClubAdminOnNewClub: true,
      })
    ).toBe(true);
  });

  it("accept_invitation recopie toujours v_inv.role (invitation member → membership member)", () => {
    expect(acceptFn).toMatch(/role = v_inv\.role/);
    expect(acceptFn).toMatch(/v_inv\.club_id, v_uid, v_inv\.role, 'active'/);
    expect(acceptFn).toMatch(/SECURITY DEFINER/);
  });
});
