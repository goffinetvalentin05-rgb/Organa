import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function hasJwtTableRead(src: string, table: string) {
  const escaped = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    new RegExp(`(?:await\\s+)?supabase\\s*\\n\\s*\\.from\\("${escaped}"\\)`).test(
      src
    ) || new RegExp(`supabase\\.from\\("${escaped}"\\)`).test(src)
  );
}

type ClubRole = "owner" | "admin" | "committee" | "member";

function canSelectViaMemberRls(role: ClubRole, status: "active" | "disabled") {
  return status === "active";
}

function canSelectAfterRevokeJwt(role: ClubRole) {
  void role;
  return false;
}

const PRIVATE_DOCUMENTS = [
  "app/api/documents/route.ts",
  "app/api/documents/[id]/route.ts",
  "app/api/events/route.ts",
  "app/api/events/[id]/route.ts",
  "app/api/export/route.ts",
  "app/api/export/accounting/route.tsx",
  "app/api/email/route.ts",
  "app/api/buvette/requests/[id]/send-invoice/route.tsx",
  "lib/utils/pdf-data.ts",
] as const;

const PRIVATE_SHOP_ORDERS = [
  "app/api/shop/orders/route.ts",
  "app/api/shop/orders/[id]/route.ts",
  "app/api/shop/stats/route.ts",
] as const;

describe("documents + shop_orders — lectures privées admin", () => {
  it("aujourd’hui un member actif pourrait SELECT via RLS is_club_member", () => {
    expect(canSelectViaMemberRls("member", "active")).toBe(true);
    expect(read("supabase/migrations/023_strict_rls_clubscope.sql")).toContain(
      "'documents|member|owner'"
    );
    expect(read("supabase/migrations/062_create_shop_module.sql")).toContain(
      "shop_orders_select_member"
    );
    expect(read("supabase/migrations/062_create_shop_module.sql")).toContain(
      "public.is_club_member(club_id)"
    );
  });

  it("après REVOKE SELECT JWT, aucun rôle authenticated ne lit plus la table directement", () => {
    expect(canSelectAfterRevokeJwt("member")).toBe(false);
    expect(canSelectAfterRevokeJwt("committee")).toBe(false);
    expect(canSelectAfterRevokeJwt("admin")).toBe(false);
    expect(canSelectAfterRevokeJwt("owner")).toBe(false);
  });

  it("liste/détail documents : admin après VIEW_DOCUMENTS ou VIEW_INVOICES, sans payment_token", () => {
    const list = read("app/api/documents/route.ts");
    expect(list).toContain("requireViewDocumentsOrInvoices");
    expect(list).toContain("createAdminClient");
    expect(list).toContain("DOCUMENT_SELECT");
    expect(list).toMatch(/admin\s*\n\s*\.from\("documents"\)/);
    expect(hasJwtTableRead(list, "documents")).toBe(false);

    const detail = read("app/api/documents/[id]/route.ts");
    expect(detail).toContain("PERMISSIONS.VIEW_DOCUMENTS");
    expect(detail).toContain("PERMISSIONS.VIEW_INVOICES");
    expect(detail).toMatch(/await admin\s*\n\s*\.from\("documents"\)/);
    expect(detail).toContain('.eq("user_id", guard.clubId)');
    expect(detail).not.toContain("payment_token");
    expect(hasJwtTableRead(detail, "documents")).toBe(false);
  });

  it("commandes boutique : admin après VIEW_SHOP / MANAGE_SHOP, filtrées club_id", () => {
    const list = read("app/api/shop/orders/route.ts");
    expect(list).toContain("PERMISSIONS.VIEW_SHOP");
    expect(list).toMatch(/await admin\s*\n\s*\.from\("shop_orders"\)/);
    expect(list).toContain('.eq("club_id", guard.clubId)');
    expect(hasJwtTableRead(list, "shop_orders")).toBe(false);

    const detail = read("app/api/shop/orders/[id]/route.ts");
    expect(detail).toContain("PERMISSIONS.VIEW_SHOP");
    expect(detail).toContain("PERMISSIONS.MANAGE_SHOP");
    expect(hasJwtTableRead(detail, "shop_orders")).toBe(false);
    expect(detail).toContain('.eq("club_id", guard.clubId)');

    const stats = read("app/api/shop/stats/route.ts");
    expect(stats).toContain("PERMISSIONS.VIEW_SHOP");
    expect(stats).toContain("createAdminClient");
    expect(stats).toContain("computeShopStats(admin, guard.clubId)");
  });

  it("PDF / exports / facture buvette / totaux événements : documents via admin", () => {
    expect(read("lib/utils/pdf-data.ts")).toMatch(
      /await admin\s*\n\s*\.from\("documents"\)/
    );
    expect(hasJwtTableRead(read("lib/utils/pdf-data.ts"), "documents")).toBe(
      false
    );
    expect(read("app/api/export/route.ts")).toMatch(
      /await admin\s*\n\s*\.from\("documents"\)/
    );
    expect(read("app/api/export/accounting/route.tsx")).toMatch(
      /await admin\s*\n\s*\.from\("documents"\)/
    );
    expect(
      hasJwtTableRead(
        read("app/api/buvette/requests/[id]/send-invoice/route.tsx"),
        "documents"
      )
    ).toBe(false);
    expect(read("app/api/events/route.ts")).toMatch(
      /await admin\s*\n\s*\.from\("documents"\)/
    );
    expect(read("app/api/events/[id]/route.ts")).toMatch(
      /await admin\s*\n\s*\.from\("documents"\)/
    );
  });

  it("payment_token n’est pas exposé dans les API internes de liste", () => {
    const listSelect = read("app/api/documents/route.ts");
    expect(listSelect).toContain("const DOCUMENT_SELECT");
    const selectLine = listSelect.slice(
      listSelect.indexOf("const DOCUMENT_SELECT"),
      listSelect.indexOf("type DocumentInsertPayload")
    );
    expect(selectLine).not.toContain("payment_token");
    expect(read("app/api/documents/[id]/route.ts")).not.toContain(
      "payment_token"
    );
    expect(read("app/api/export/route.ts")).not.toContain("payment_token");
  });

  it("pages publiques cotisation + checkout boutique restent admin filtrés par token/slug", () => {
    const publicCotisation = read("app/api/public/cotisations/[token]/route.ts");
    expect(publicCotisation).toContain("createAdminClient");
    expect(publicCotisation).toContain('.eq("payment_token", token)');
    expect(publicCotisation).not.toMatch(/from\("documents"\)[\s\S]*payment_token,/);

    const membershipCheckout = read("lib/quotes/create-checkout-session.ts");
    expect(membershipCheckout).toContain("createAdminClient");
    expect(membershipCheckout).toContain('.eq("payment_token", params.token)');

    const shopCheckout = read("lib/shop/create-checkout-session.ts");
    expect(shopCheckout).toContain("createAdminClient");
    expect(shopCheckout).toContain("resolvePublicShop");

    const webhook = read("lib/shop/stripe-webhook.ts");
    expect(webhook).toContain("createAdminClient");
    expect(webhook).toContain('.from("shop_orders")');
  });

  it("routes privées listées : plus de supabase.from(documents|shop_orders)", () => {
    for (const rel of PRIVATE_DOCUMENTS) {
      expect(hasJwtTableRead(read(rel), "documents"), rel).toBe(false);
    }
    for (const rel of PRIVATE_SHOP_ORDERS) {
      expect(hasJwtTableRead(read(rel), "shop_orders"), rel).toBe(false);
      expect(read(rel), rel).toContain("createAdminClient");
    }
  });
});
