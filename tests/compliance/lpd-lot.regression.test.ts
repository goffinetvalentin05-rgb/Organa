import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

describe("lot LPD — régressions source", () => {
  it("inscription événement : opt-in requis avant upsert marketing", () => {
    const src = read("app/api/registrations/route.ts");
    expect(src).toContain("isTruthyMarketingOptIn");
    expect(src).toContain('consentSource: "event_form"');
    expect(src).toMatch(/if \(isTruthyMarketingOptIn[\s\S]*upsertMarketingContact/);
  });

  it("buvette : opt-in requis avant upsert marketing", () => {
    const src = read("app/api/public/buvette/[slug]/requests/route.ts");
    expect(src).toContain("isTruthyMarketingOptIn");
    expect(src).toContain('consentSource: "buvette_form"');
  });

  it("planning n’appelle pas upsertMarketingContact", () => {
    expect(read("app/api/public/plannings/[token]/route.ts")).not.toContain(
      "upsertMarketingContact"
    );
    expect(
      read("app/api/public/plannings/[token]/confirmation/route.ts")
    ).not.toContain("upsertMarketingContact");
  });

  it("campagnes exigent consented_at", () => {
    const src = read("app/api/marketing/campaigns/route.ts");
    expect(src).toContain('.eq("unsubscribed", false)');
    expect(src).toContain('.not("consented_at", "is", null)');
  });

  it("contact staff exige une déclaration de base valable", () => {
    const src = read("app/api/marketing/contacts/route.ts");
    expect(src).toContain("isStaffLawfulBasisDeclared");
    expect(src).toContain('consent_source: "staff_declared"');
  });

  it("désinscription met toujours unsubscribed, sans exiger consented_at", () => {
    const src = read("app/desinscription/[token]/page.tsx");
    expect(src).toContain("unsubscribed: true");
    expect(src).not.toContain("consented_at");
  });

  it("analytics masque les tokens", () => {
    expect(read("components/ObillzAnalytics.tsx")).toContain("beforeSend");
    expect(read("components/ObillzAnalytics.tsx")).toContain("redactAnalyticsEvent");
    expect(read("app/layout.tsx")).toContain("ObillzAnalytics");
    expect(read("app/layout.tsx")).not.toMatch(/<Analytics\s*\/>/);
  });

  it("AVS : confirmation à l’activation", () => {
    const src = read("app/tableau-de-bord/parametres/MemberFieldsSettingsCard.tsx");
    expect(src).toContain("window.confirm");
    expect(src).toContain("avsConfirm");
  });

  it("storage : dépenses, visuels, produits", () => {
    expect(read("app/api/depenses/route.ts")).toContain('removeStorageObjects(supabase, "expenses"');
    expect(read("app/api/visuals/[id]/route.ts")).toContain("visualAssetPathsFromData");
    expect(read("app/api/shop/products/[id]/route.ts")).toContain('"shop-products"');
  });

  it("clubs existants : aucun blocage DPA", () => {
    expect(read("app/tableau-de-bord/DashboardShell.tsx")).not.toContain("legal_acceptances");
    expect(read("app/tableau-de-bord/DashboardShell.tsx")).not.toContain("acceptLegal");
    expect(
      read("components/associations/dashboard/AssociationsDashboardShell.tsx")
    ).not.toContain("legal_acceptances");
    expect(read("app/api/invitations/[token]/signup/route.ts")).not.toContain("acceptLegal");
    expect(read("app/api/invitations/[token]/signup/route.ts")).not.toContain(
      "legal_acceptances"
    );
    expect(read("middleware.ts")).not.toContain("legal_acceptances");
  });

  it("nouveaux clubs : case + API signup + versions", () => {
    expect(read("app/inscription/page.tsx")).toContain(
      "const [acceptLegal, setAcceptLegal] = useState(false)"
    );
    expect(read("app/inscription/page.tsx")).toContain("/api/auth/signup");
    expect(read("app/inscription/page.tsx")).toContain("/accord-traitement-donnees");
    expect(read("app/api/auth/signup/route.ts")).toContain("legalAcceptanceError");
    expect(read("lib/legal/versions.ts")).toContain('TERMS_VERSION = "2026-09"');
    expect(read("lib/legal/versions.ts")).toContain('DPA_VERSION = "2026-09"');
  });

  it("page DPA publique", () => {
    const src = read("app/accord-traitement-donnees/page.tsx");
    expect(src).toContain("Accord de traitement des données");
    expect(src).toContain("Valentin Goffinet");
    expect(src).toContain("Les Courtats 7, 2942 Alle, Suisse");
    expect(src).toContain("2026-09");
  });

  it("docs rétention : auto vs manuel, pas de fausse purge", () => {
    const retention = read("docs/compliance/RETENTION.md");
    expect(retention).toContain("purge_operational_data");
    expect(retention).toContain("Conservation gérée manuellement selon la finalité");
    expect(retention).not.toMatch(/Aucune purge automatique n’est mise en place/);
    const status = read("docs/compliance/LPD_STATUS.md");
    expect(status).toContain("n’est pas « certifié LPD »");
    expect(status).toContain("À éviter");
  });
});
