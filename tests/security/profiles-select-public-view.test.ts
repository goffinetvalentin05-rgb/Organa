import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const PUBLIC_COLUMNS = [
  "user_id",
  "company_name",
  "logo_url",
  "logo_path",
  "product_type",
  "primary_color",
] as const;

const FORBIDDEN_PUBLIC_COLUMNS = [
  "resend_api_key",
  "iban",
  "bank_name",
  "payment_terms",
  "qr_creditor_name",
  "qr_creditor_street",
  "qr_creditor_building_num",
  "qr_creditor_zip",
  "qr_creditor_city",
  "qr_creditor_country",
  "stripe_customer_id",
  "stripe_subscription_id",
  "plan",
  "subscription_status",
  "subscription_tier",
  "billing_cycle",
  "email_sender_email",
  "email_custom_enabled",
];

type ClubRole = "owner" | "admin" | "committee" | "member";

/** Policy 067 : SELECT table profiles = is_club_staff + deleted_at IS NULL. */
function canSelectProfilesTable(role: ClubRole, status: "active" | "disabled") {
  if (status !== "active") return false;
  return role === "owner" || role === "admin" || role === "committee";
}

function canSelectProfilesPublic(role: ClubRole, status: "active" | "disabled") {
  void role;
  return status === "active";
}

describe("067 — profiles SELECT staff + profiles_public", () => {
  const migration = read(
    "supabase/migrations/067_profiles_select_staff_and_public_view.sql"
  );
  const previous = read("supabase/migrations/023_strict_rls_clubscope.sql");

  it("retire le SELECT member et pose un SELECT staff", () => {
    expect(previous).toContain("profiles_select_member");
    expect(migration).toContain('DROP POLICY IF EXISTS "profiles_select_member"');
    expect(migration).toContain('CREATE POLICY "profiles_select_staff"');
    expect(migration).toContain("public.is_club_staff(user_id)");
    expect(migration).toContain("deleted_at IS NULL");
    expect(migration).not.toMatch(/\bUPDATE\s+public\.profiles/i);
    expect(migration).not.toMatch(/\bDELETE\s+FROM\s+public\.profiles/i);
    expect(migration).not.toMatch(/\bALTER TABLE\s+public\.profiles\s+DROP/i);
  });

  it("profiles_public n’expose que les colonnes UI non sensibles", () => {
    expect(migration).toContain("CREATE VIEW public.profiles_public");
    expect(migration).toContain("security_invoker = false");
    expect(migration).toContain("public.is_club_member(p.user_id)");
    for (const col of PUBLIC_COLUMNS) {
      expect(migration).toContain(`p.${col}`);
    }
    const viewBody = migration.slice(
      migration.indexOf("CREATE VIEW public.profiles_public")
    );
    const selectPart = viewBody.slice(0, viewBody.indexOf("FROM public.profiles"));
    for (const col of FORBIDDEN_PUBLIC_COLUMNS) {
      expect(selectPart).not.toContain(col);
    }
  });

  it("member actif : SELECT table profiles → refusé (pas de secrets PostgREST)", () => {
    expect(canSelectProfilesTable("member", "active")).toBe(false);
  });

  it("member actif : accès profiles_public → nom/logo/product_type", () => {
    expect(canSelectProfilesPublic("member", "active")).toBe(true);
    expect(PUBLIC_COLUMNS).toContain("company_name");
    expect(PUBLIC_COLUMNS).toContain("logo_url");
    expect(PUBLIC_COLUMNS).toContain("logo_path");
    expect(PUBLIC_COLUMNS).toContain("product_type");
  });

  it("profiles_public : absence de resend_api_key, iban, stripe ids", () => {
    expect(PUBLIC_COLUMNS).not.toContain("resend_api_key");
    expect(PUBLIC_COLUMNS).not.toContain("iban");
    expect(PUBLIC_COLUMNS).not.toContain("stripe_customer_id");
    expect(PUBLIC_COLUMNS).not.toContain("stripe_subscription_id");
  });

  it("lectures member passent par profiles_public", () => {
    expect(read("lib/auth/product-access.ts")).toContain('.from("profiles_public")');
    expect(read("app/api/me/route.ts")).toContain('.from("profiles_public")');
    expect(read("app/associations/espace/layout.tsx")).toContain(
      '.from("profiles_public")'
    );
    expect(read("app/associations/espace/page.tsx")).toContain(
      '.from("profiles_public")'
    );
    expect(read("lib/associations/settings.ts")).toMatch(
      /from\("profiles_public"\)[\s\S]*product_type/
    );
  });

  it("/api/me et changement de club n’interrogent plus profiles pour le nom / product_type", () => {
    const me = read("app/api/me/route.ts");
    expect(me).toContain("company_name");
    expect(me).not.toMatch(/from\("profiles"\)/);
    const product = read("lib/auth/product-access.ts");
    expect(product).toContain("product_type");
    expect(product).not.toMatch(/from\("profiles"\)/);
  });

  it("paramètres : lecture privée après ACCESS_SETTINGS via client admin", () => {
    const settings = read("app/api/settings/route.ts");
    expect(settings).toContain("createAdminClient");
    expect(settings).toContain("PERMISSIONS.ACCESS_SETTINGS");
    expect(settings).toMatch(/const admin = createAdminClient\(\)/);
    expect(settings).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);
  });

  it("envoi d’e-mails : lecture resend_api_key via admin après MANAGE_INVOICES", () => {
    const email = read("app/api/email/route.ts");
    expect(email).toContain("PERMISSIONS.MANAGE_INVOICES");
    expect(email).toContain("createAdminClient");
    expect(email).toContain("resend_api_key");
    expect(email).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);
  });

  it("staff actif conserve le SELECT table (paramètres / e-mails owner-admin/committee)", () => {
    expect(canSelectProfilesTable("admin", "active")).toBe(true);
    expect(canSelectProfilesTable("committee", "active")).toBe(true);
    expect(canSelectProfilesTable("owner", "active")).toBe(true);
  });

  it("Stripe / cotisations / boutique / invitations non modifiés par cette correction", () => {
    expect(read("lib/billing/stripeSync.ts")).toContain('.from("profiles")');
    expect(read("app/api/public/cotisations/[token]/route.ts")).toContain(
      '.from("profiles")'
    );
    expect(read("lib/shop/public.ts")).toContain('.from("profiles")');
    expect(read("app/api/club/invitations/route.ts")).toContain('.from("profiles")');
  });
});
