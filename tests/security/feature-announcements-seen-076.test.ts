import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function extractPolicy(sql: string, name: string) {
  const start = sql.indexOf(`CREATE POLICY ${name}`);
  expect(start).toBeGreaterThanOrEqual(0);
  const next = sql.indexOf("CREATE POLICY", start + 10);
  const commit = sql.indexOf("COMMIT", start);
  let end = sql.length;
  if (next >= 0) end = Math.min(end, next);
  if (commit >= 0) end = Math.min(end, commit);
  return sql.slice(start, end);
}

/**
 * Isolation JWT : identique à INSERT/SELECT 044.
 * is_club_member volontairement absent — l’ajouter seulement sur UPDATE
 * casserait le 2e upsert si le helper divergait, alors que l’API scope déjà club_id.
 */
function canInsertSeen(actorId: string, rowUserId: string) {
  return actorId === rowUserId;
}

function canUpdateSeen(actorId: string, rowUserId: string) {
  return actorId === rowUserId;
}

function upsertPath(args: {
  actorId: string;
  rowUserId: string;
  clubId: string;
  existing?: { userId: string; clubId: string; key: string } | null;
  key: string;
}): "insert" | "update" | "deny" {
  const conflict =
    args.existing &&
    args.existing.userId === args.rowUserId &&
    args.existing.clubId === args.clubId &&
    args.existing.key === args.key;

  if (!conflict) {
    return canInsertSeen(args.actorId, args.rowUserId) ? "insert" : "deny";
  }
  return canUpdateSeen(args.actorId, args.existing.userId) ? "update" : "deny";
}

describe("076 — feature_announcements_seen UPDATE own", () => {
  const migration = read(
    "supabase/migrations/076_feature_announcements_seen_update_own.sql"
  );
  const created = read("supabase/migrations/044_club_public_page.sql");
  const api = read("app/api/feature-announcements/route.ts");

  it("ajoute uniquement une policy UPDATE alignée sur INSERT (user_id = auth.uid())", () => {
    expect(created).not.toMatch(/FOR UPDATE/i);
    expect(migration).toContain("feature_announcements_seen_update_own");
    const policy = extractPolicy(migration, "feature_announcements_seen_update_own");
    expect(policy).toContain("FOR UPDATE");
    expect(policy).toContain("TO authenticated");
    expect(policy).toContain("USING (user_id = auth.uid())");
    expect(policy).toContain("WITH CHECK (user_id = auth.uid())");
    expect(policy).not.toContain("is_club_member");
    expect(migration).not.toMatch(/CREATE POLICY feature_announcements_seen_select_own/);
    expect(migration).not.toMatch(/CREATE POLICY feature_announcements_seen_insert_own/);
    expect(migration).not.toMatch(/DROP TABLE/i);
    expect(migration).not.toMatch(/ALTER TABLE/i);
  });

  it("044 conserve SELECT/INSERT own ; 076 ne les réécrit pas", () => {
    expect(extractPolicy(created, "feature_announcements_seen_select_own")).toContain(
      "USING (user_id = auth.uid())"
    );
    expect(extractPolicy(created, "feature_announcements_seen_insert_own")).toContain(
      "WITH CHECK (user_id = auth.uid())"
    );
  });

  it("API : upsert conservé, JWT, club actif", () => {
    expect(api).toContain("createClient");
    expect(api).not.toContain("createAdminClient");
    expect(api).toContain(".upsert(");
    expect(api).toContain('onConflict: "user_id,club_id,announcement_key"');
    expect(api).toContain("user_id: user.id");
    expect(api).toContain("club_id: clubId");
  });

  it("premier mark seen = INSERT OK", () => {
    expect(
      upsertPath({
        actorId: "user-a",
        rowUserId: "user-a",
        clubId: "club-a",
        existing: null,
        key: "release_bundle_toast_2026_09",
      })
    ).toBe("insert");
  });

  it("deuxième mark seen du même triplet = UPDATE OK", () => {
    expect(
      upsertPath({
        actorId: "user-a",
        rowUserId: "user-a",
        clubId: "club-a",
        existing: {
          userId: "user-a",
          clubId: "club-a",
          key: "release_bundle_toast_2026_09",
        },
        key: "release_bundle_toast_2026_09",
      })
    ).toBe("update");
  });

  it("un utilisateur ne peut pas modifier la ligne d’un autre", () => {
    expect(canUpdateSeen("user-b", "user-a")).toBe(false);
    expect(
      upsertPath({
        actorId: "user-b",
        rowUserId: "user-a",
        clubId: "club-a",
        existing: {
          userId: "user-a",
          clubId: "club-a",
          key: "release_shop_2026_09",
        },
        key: "release_shop_2026_09",
      })
    ).toBe("deny");
  });

  it("pas de cross-club : conflit unique inclut club_id, pas d’UPDATE de la ligne d’un autre club", () => {
    expect(
      upsertPath({
        actorId: "user-a",
        rowUserId: "user-a",
        clubId: "club-b",
        existing: {
          userId: "user-a",
          clubId: "club-a",
          key: "release_shop_2026_09",
        },
        key: "release_shop_2026_09",
      })
    ).toBe("insert");
    expect(
      upsertPath({
        actorId: "user-a",
        rowUserId: "user-b",
        clubId: "club-b",
        existing: {
          userId: "user-b",
          clubId: "club-b",
          key: "release_shop_2026_09",
        },
        key: "release_shop_2026_09",
      })
    ).toBe("deny");
  });

  it("toast / cloche / modales inchangés (toujours POST upsert via l’API)", () => {
    const provider = read(
      "components/announcements/NewFeaturesAnnouncementProvider.tsx"
    );
    expect(provider).toContain('fetch("/api/feature-announcements"');
    expect(provider).toContain('method: "POST"');

    const modal = read(
      "components/public-page/ClubPublicPageAnnouncementModal.tsx"
    );
    expect(modal).toContain('fetch("/api/feature-announcements"');
    expect(modal).toContain('method: "POST"');

    const bell = read(
      "components/announcements/DashboardNotificationBellConnected.tsx"
    );
    expect(bell).toContain("handleNotificationClick");
    expect(bell).toContain("markAllRead");
  });
});
