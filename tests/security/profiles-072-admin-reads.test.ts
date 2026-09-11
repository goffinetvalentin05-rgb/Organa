import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function hasJwtProfilesRead(src: string) {
  return (
    /(?:await\s+)?supabase\s*\n\s*\.from\("profiles"\)/.test(src) ||
    /supabase\.from\("profiles"\)/.test(src)
  );
}

function guardBeforeAdmin(src: string, guard: string) {
  const g = src.indexOf(guard);
  const a = src.search(/createAdminClient\s*\(/);
  expect(g).toBeGreaterThanOrEqual(0);
  expect(a).toBeGreaterThan(g);
}

const PRIVATE_ROUTES = [
  "app/api/settings/route.ts",
  "app/api/club/email-status/route.ts",
  "app/api/club/invitations/route.ts",
  "app/api/club/invitations/[id]/route.ts",
  "app/api/club/members/route.ts",
  "app/api/marketing/campaigns/route.ts",
  "app/api/plannings/[id]/assignments/route.ts",
  "app/api/buvette/requests/[id]/send-info/route.ts",
  "app/api/buvette/requests/[id]/decision/route.ts",
  "app/api/buvette/settings/route.ts",
  "app/api/buvette/public-link/route.ts",
  "app/api/buvette/requests/route.ts",
  "app/api/buvette/banner/route.ts",
  "app/api/buvette/requests/[id]/send-invoice/route.tsx",
  "app/api/shop/settings/route.ts",
  "app/api/upload/logo/route.ts",
  "app/api/visuals/context/route.ts",
  "app/api/sponsor-contracts/route.ts",
  "app/api/sponsor-contracts/[id]/route.ts",
  "app/api/meeting-minutes/route.ts",
  "app/api/meeting-minutes/[id]/route.ts",
  "app/api/pdf/planning/download/route.tsx",
  "app/api/export/accounting/route.tsx",
  "app/api/associations/logo/route.ts",
  "app/api/associations/settings/route.ts",
] as const;

describe("072 prep — lectures privées profiles via admin", () => {
  it("settings : admin après ACCESS_SETTINGS, filtré sur guard.clubId", () => {
    const src = read("app/api/settings/route.ts");
    expect(src).toContain("PERMISSIONS.ACCESS_SETTINGS");
    expect(src).toContain("createAdminClient");
    expect(src).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);
    expect(src).toMatch(/\.eq\("user_id", clubId\)/);
    expect(hasJwtProfilesRead(src)).toBe(false);
    guardBeforeAdmin(src, "requirePermission(PERMISSIONS.ACCESS_SETTINGS)");
  });

  it("email-status : admin après MANAGE_USERS", () => {
    const src = read("app/api/club/email-status/route.ts");
    expect(src).toContain("PERMISSIONS.MANAGE_USERS");
    expect(src).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);
    expect(src).toContain('.eq("user_id", guard.clubId)');
    expect(hasJwtProfilesRead(src)).toBe(false);
  });

  it("invitations : lecture clubProfile via admin après permission", () => {
    const src = read("app/api/club/invitations/route.ts");
    expect(src).toContain("PERMISSIONS.MANAGE_USERS");
    expect(src).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);
    expect(src).toContain('.eq("user_id", guard.clubId)');
    expect(hasJwtProfilesRead(src)).toBe(false);
  });

  it("invitations resend : admin après MANAGE_USERS", () => {
    const src = read("app/api/club/invitations/[id]/route.ts");
    expect(src).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);
    expect(src).toContain('.eq("user_id", guard.clubId)');
    expect(hasJwtProfilesRead(src)).toBe(false);
  });

  it("campagnes marketing : admin après MANAGE_MEMBERS", () => {
    const src = read("app/api/marketing/campaigns/route.ts");
    expect(src).toContain("PERMISSIONS.MANAGE_MEMBERS");
    expect(src).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);
    expect(hasJwtProfilesRead(src)).toBe(false);
  });

  it("notifications planning : profil email via admin", () => {
    const src = read("app/api/plannings/[id]/assignments/route.ts");
    expect(src).toContain("createAdminClient");
    expect(src).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);
    expect(src).toContain("resend_api_key");
    expect(hasJwtProfilesRead(src)).toBe(false);
  });

  it("buvette mails + facture : profils via admin", () => {
    for (const rel of [
      "app/api/buvette/requests/[id]/send-info/route.ts",
      "app/api/buvette/requests/[id]/decision/route.ts",
      "app/api/buvette/requests/[id]/send-invoice/route.tsx",
    ] as const) {
      const src = read(rel);
      expect(src).toContain("createAdminClient");
      expect(src).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);
      expect(src).toContain('.eq("user_id", guard.clubId)');
      expect(hasJwtProfilesRead(src)).toBe(false);
    }
  });

  it("PDF IBAN/QR : getClubCompanyPdfData lit profiles via admin", () => {
    const src = read("lib/utils/pdf-data.ts");
    expect(src).toContain("createAdminClient");
    expect(src).toContain("iban");
    expect(src).toContain("qr_creditor_name");
    expect(src).toMatch(/const admin = createAdminClient\(\)/);
    expect(src).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);
    expect(hasJwtProfilesRead(src)).toBe(false);
  });

  it("Associations settings : page + PUT + helper admin après garde", () => {
    const page = read("app/associations/espace/parametres/page.tsx");
    expect(page).toContain("requireAssociationSettingsAccess");
    expect(page).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);
    expect(page.indexOf("requireAssociationSettingsAccess()")).toBeLessThan(
      page.indexOf("createAdminClient()")
    );

    const put = read("app/api/associations/settings/route.ts");
    expect(put).toContain("requireAssociationSettingsAccess");
    expect(put).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);
    expect(hasJwtProfilesRead(put)).toBe(false);

    const helper = read("lib/associations/settings.ts");
    expect(helper).toContain("createAdminClient");
    expect(helper).toContain("requireAssociationSettingsAccess");
    expect(helper).toMatch(
      /loadAssociationSettingsProfile[\s\S]*createAdminClient\(\)[\s\S]*\.from\("profiles"\)/
    );
    expect(helper).toContain('.from("profiles_public")');
  });

  it("boutique : clubProfile via admin après VIEW_SHOP / MANAGE_SHOP", () => {
    const src = read("app/api/shop/settings/route.ts");
    expect(src).toContain("PERMISSIONS.VIEW_SHOP");
    expect(src).toContain("createAdminClient");
    expect(src).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);
    expect(hasJwtProfilesRead(src)).toBe(false);
  });

  it("Stripe/billing : plus de fallback JWT sur profiles", () => {
    const sub = read("lib/billing/subscription.ts");
    expect(sub).toContain("createAdminClient");
    expect(sub).not.toContain("fallback client session");
    expect(hasJwtProfilesRead(sub)).toBe(false);
    expect(sub.indexOf("getUser()")).toBeLessThan(sub.indexOf("createAdminClient()"));

    const team = read("lib/billing/teamPlan.ts");
    expect(team).toContain("createAdminClient");
    expect(hasJwtProfilesRead(team)).toBe(false);
    expect(team).not.toContain("@/lib/supabase/server");

    const plan = read("lib/billing/getPlan.ts");
    expect(plan).toContain("createAdminClient");
    expect(hasJwtProfilesRead(plan)).toBe(false);

    const accounts = read("lib/payments/connect/accounts.ts");
    expect(accounts).toContain("createAdminClient");
    expect(hasJwtProfilesRead(accounts)).toBe(false);
  });

  it("/api/me et product-access restent sur profiles_public", () => {
    const me = read("app/api/me/route.ts");
    expect(me).toContain('.from("profiles_public")');
    expect(me).not.toMatch(/from\("profiles"\)/);

    const product = read("lib/auth/product-access.ts");
    expect(product).toContain('.from("profiles_public")');
    expect(product).not.toMatch(/from\("profiles"\)/);

    expect(read("lib/auth/active-club.ts")).not.toMatch(/from\("profiles"\)/);
  });

  it("profiles_public inchangée (vue + usages UI)", () => {
    const migration = read(
      "supabase/migrations/067_profiles_select_staff_and_public_view.sql"
    );
    expect(migration).toContain("CREATE VIEW public.profiles_public");
    expect(read("app/associations/espace/layout.tsx")).toContain(
      '.from("profiles_public")'
    );
    expect(read("app/associations/espace/page.tsx")).toContain(
      '.from("profiles_public")'
    );
  });

  it("routes privées listées : pas de supabase.from(profiles)", () => {
    for (const rel of PRIVATE_ROUTES) {
      const src = read(rel);
      expect(src, rel).toContain("createAdminClient");
      expect(src, rel).toContain('.from("profiles")');
      expect(hasJwtProfilesRead(src), rel).toBe(false);
    }
  });

  it("page publique et helpers buvette/public-page reçoivent l’admin côté API", () => {
    const publicPage = read("app/api/settings/public-page/route.ts");
    expect(publicPage).toContain("fetchPublicPageSettingsBundle(admin, guard.clubId)");
    expect(publicPage).toContain("updatePublicPageSettings(admin, guard.clubId");

    const buvette = read("app/api/buvette/settings/route.ts");
    expect(buvette).toContain("updateBuvettePublicSettings(admin, guard.clubId");

    const quotes = read("app/api/quotes/payment-method/route.ts");
    expect(quotes).toContain("getClubMembershipPaymentMethod(admin, guard.clubId)");
    expect(quotes).toContain("setClubMembershipPaymentMethod(admin, guard.clubId");

    const documents = read("app/api/documents/route.ts");
    expect(documents).toContain("supabase: admin");
  });
});
