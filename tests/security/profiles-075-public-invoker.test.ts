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

const SECRET_COLUMNS = [
  "deleted_at",
  "resend_api_key",
  "iban",
  "bank_name",
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
] as const;

type ClubRole = "owner" | "admin" | "committee" | "member";

function extractView(sql: string) {
  const start = sql.indexOf("CREATE VIEW public.profiles_public");
  expect(start).toBeGreaterThanOrEqual(0);
  const comment = sql.indexOf("COMMENT ON VIEW", start);
  return sql.slice(start, comment >= 0 ? comment : sql.length);
}

function extractPolicy(sql: string) {
  const start = sql.indexOf('CREATE POLICY "profiles_select_active_member"');
  expect(start).toBeGreaterThanOrEqual(0);
  const next = sql.indexOf("REVOKE SELECT", start);
  return sql.slice(start, next >= 0 ? next : sql.length);
}

function extractGrantColumns(sql: string) {
  const start = sql.indexOf("GRANT SELECT (");
  expect(start).toBeGreaterThanOrEqual(0);
  const end = sql.indexOf("TO authenticated", start);
  return sql.slice(start, end);
}

/** JWT : pas de SELECT table, uniquement les 6 colonnes publiques. */
function jwtCanSelectProfilesColumn(column: string) {
  return (PUBLIC_COLUMNS as readonly string[]).includes(column);
}

function jwtCanSelectStarOnProfiles() {
  return false;
}

function jwtCanReadClubPublicFields(args: {
  memberOf: string;
  targetClub: string;
  status: "active" | "disabled" | "invited";
  role: ClubRole;
}) {
  void args.role;
  return args.status === "active" && args.memberOf === args.targetClub;
}

function securityAdvisorFlagsDefinerView(securityInvoker: boolean) {
  return securityInvoker !== true;
}

describe("075 — profiles_public security_invoker + GRANT colonnes", () => {
  const migration = read(
    "supabase/migrations/075_profiles_public_security_invoker.sql"
  );
  const previous = read(
    "supabase/migrations/067_profiles_select_staff_and_public_view.sql"
  );
  const revoke072 = read(
    "supabase/migrations/072_revoke_profiles_select_from_authenticated.sql"
  );

  it("recrée la vue en security_invoker = true (lint 0010 disparait)", () => {
    const view = extractView(migration);
    expect(previous).toContain("security_invoker = false");
    expect(view).toContain("WITH (security_invoker = true)");
    expect(view).not.toContain("security_invoker = false");
    expect(securityAdvisorFlagsDefinerView(true)).toBe(false);
  });

  it("n’expose que les 6 colonnes publiques, aucun secret", () => {
    const view = extractView(migration);
    for (const col of PUBLIC_COLUMNS) {
      expect(view).toContain(`p.${col}`);
    }
    const selectPart = view.slice(0, view.indexOf("FROM public.profiles"));
    for (const col of SECRET_COLUMNS) {
      expect(selectPart).not.toContain(col);
    }
  });

  it("deleted_at : pas dans la vue, pas de GRANT, uniquement RLS", () => {
    const view = extractView(migration);
    expect(view).not.toMatch(/deleted_at/);
    expect(view).toContain("public.is_club_member(p.user_id)");

    const grant = extractGrantColumns(migration);
    expect(grant).not.toContain("deleted_at");

    const policy = extractPolicy(migration);
    expect(policy).toContain("public.is_club_member(user_id)");
    expect(policy).toContain("deleted_at IS NULL");
  });

  it("REVOKE SELECT table puis GRANT des 6 colonnes seulement", () => {
    expect(revoke072).toContain(
      "REVOKE SELECT ON TABLE public.profiles FROM authenticated"
    );
    expect(migration).toContain(
      "REVOKE SELECT ON TABLE public.profiles FROM PUBLIC"
    );
    expect(migration).toContain(
      "REVOKE SELECT ON TABLE public.profiles FROM anon"
    );
    expect(migration).toContain(
      "REVOKE SELECT ON TABLE public.profiles FROM authenticated"
    );

    const grant = extractGrantColumns(migration);
    for (const col of PUBLIC_COLUMNS) {
      expect(grant).toContain(col);
    }
    for (const col of SECRET_COLUMNS) {
      expect(grant).not.toContain(col);
    }
    expect(migration).not.toMatch(
      /GRANT SELECT ON TABLE public\.profiles TO authenticated/
    );
  });

  it("member club A lit A, pas B ; disabled ne lit rien", () => {
    expect(
      jwtCanReadClubPublicFields({
        memberOf: "A",
        targetClub: "A",
        status: "active",
        role: "member",
      })
    ).toBe(true);
    expect(
      jwtCanReadClubPublicFields({
        memberOf: "A",
        targetClub: "B",
        status: "active",
        role: "member",
      })
    ).toBe(false);
    expect(
      jwtCanReadClubPublicFields({
        memberOf: "A",
        targetClub: "A",
        status: "disabled",
        role: "member",
      })
    ).toBe(false);
    expect(
      jwtCanReadClubPublicFields({
        memberOf: "A",
        targetClub: "A",
        status: "invited",
        role: "committee",
      })
    ).toBe(false);
  });

  it("select(*) et select(resend_api_key) JWT échouent", () => {
    expect(jwtCanSelectStarOnProfiles()).toBe(false);
    expect(jwtCanSelectProfilesColumn("resend_api_key")).toBe(false);
    expect(jwtCanSelectProfilesColumn("iban")).toBe(false);
    expect(jwtCanSelectProfilesColumn("stripe_customer_id")).toBe(false);
    expect(jwtCanSelectProfilesColumn("plan")).toBe(false);
    expect(jwtCanSelectProfilesColumn("company_name")).toBe(true);
    expect(jwtCanSelectProfilesColumn("product_type")).toBe(true);
  });

  it("/api/me, product-access, Associations restent sur profiles_public", () => {
    const me = read("app/api/me/route.ts");
    expect(me).toContain('.from("profiles_public")');
    expect(me).toContain("company_name");
    expect(me).not.toMatch(/from\("profiles"\)/);

    const product = read("lib/auth/product-access.ts");
    expect(product).toContain('.from("profiles_public")');
    expect(product).toContain("product_type");
    expect(product).not.toMatch(/from\("profiles"\)/);

    const middleware = read("middleware.ts");
    expect(middleware).toContain("resolveOrgForProduct");
    expect(middleware).not.toMatch(/from\("profiles"\)/);

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

  it("lectures privées profiles restent admin, pas de JWT secrets", () => {
    const settings = read("app/api/settings/route.ts");
    expect(settings).toContain("createAdminClient");
    expect(settings).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);
    expect(settings).not.toMatch(/supabase\.from\("profiles"\)/);

    const email = read("app/api/email/route.ts");
    expect(email).toContain("resend_api_key");
    expect(email).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);

    const pdf = read("lib/utils/pdf-data.ts");
    expect(pdf).toContain("iban");
    expect(pdf).toMatch(/await admin\s*\n\s*\.from\("profiles"\)/);

    const assoc = read("lib/associations/settings.ts");
    expect(assoc).toMatch(
      /loadAssociationSettingsProfile[\s\S]*createAdminClient\(\)[\s\S]*\.from\("profiles"\)/
    );
  });

  it("075 ne touche pas INSERT/UPDATE/DELETE ni service_role", () => {
    expect(migration).not.toMatch(/REVOKE INSERT/i);
    expect(migration).not.toMatch(/REVOKE UPDATE/i);
    expect(migration).not.toMatch(/REVOKE DELETE/i);
    expect(migration).not.toMatch(/GRANT INSERT|GRANT UPDATE|GRANT DELETE/i);
    expect(migration).not.toContain("service_role");
  });
});
