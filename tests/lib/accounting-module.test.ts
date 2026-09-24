import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isAccountingAddonSubscription } from "@/lib/billing/accountingAddon";
import { accountingPriceDetail, accountingPriceLabel } from "@/lib/billing/pricing";
import { isAccountingDevEmail } from "@/lib/accounting/devAccess";

const migration = readFileSync(
  path.resolve(__dirname, "../../supabase/migrations/091_accounting_module.sql"),
  "utf8"
);
const finalize = readFileSync(
  path.resolve(__dirname, "../../supabase/migrations/093_accounting_onboarding_finalize.sql"),
  "utf8"
);
const purge = readFileSync(
  path.resolve(__dirname, "../../supabase/migrations/078_retention_purge_and_legal_acceptances.sql"),
  "utf8"
);

describe("accès et tarif comptabilité", () => {
  it("affiche CHF 120/an depuis la source unique", () => {
    expect(accountingPriceLabel()).toBe("CHF 120/an");
    expect(accountingPriceDetail()).toBe("CHF 120 / an / club");
  });

  it("reconnaît uniquement les e-mails développeur listés", () => {
    const list = "Dev@Obillz.ch, autre@example.com";
    expect(isAccountingDevEmail("dev@obillz.ch", list)).toBe(true);
    expect(isAccountingDevEmail("  AUTRE@example.com ", list)).toBe(true);
    expect(isAccountingDevEmail("client@club.ch", list)).toBe(false);
    expect(isAccountingDevEmail(null, list)).toBe(false);
    expect(isAccountingDevEmail("dev@obillz.ch", "")).toBe(false);
  });
});

describe("add-on comptabilité", () => {
  it("reconnaît un abonnement distinct et ne le confond pas avec la formule", () => {
    expect(
      isAccountingAddonSubscription({
        metadata: { obillz_addon: "accounting", user_id: "club" },
        items: { data: [{ price: { id: "price_accounting" } as never }] },
      })
    ).toBe(true);

    expect(
      isAccountingAddonSubscription({
        metadata: { user_id: "club", subscription_tier: "team" },
        items: { data: [{ price: { id: "price_team_year" } as never }] },
      })
    ).toBe(false);
  });
});

describe("migration comptabilité", () => {
  it("isole par club, refuse l'écriture client et conserve l'audit hors purge", () => {
    expect(migration).toContain("club_id UUID NOT NULL");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("has_club_permission(club_id, 'view_accounting')");
    expect(migration).toContain("accounting_audit_log");
    expect(migration).toContain("Exclue de purge_operational_data");
    expect(migration).not.toContain("CREATE POLICY accounting_entries_insert");
    expect(purge).not.toContain("accounting_entries");
    expect(purge).not.toContain("accounting_audit_log");
  });

  it("finalise l’onboarding dans une transaction idempotente", () => {
    expect(finalize).toContain("accounting_finalize_onboarding");
    expect(finalize).toContain("FOR UPDATE");
    expect(finalize).toContain("IF v_done IS NOT NULL THEN");
    expect(finalize).toContain("onboarding_completed_at IS NULL");
    expect(finalize).toContain("missing_account_codes=%");
    expect(finalize).toContain("missing_account_ids=%");
    expect(finalize).toContain("opening:' || v_period::TEXT");
    expect(finalize).toContain("ON CONFLICT (club_id, source_kind)");
  });

  it("ne comptabilise pas une facture tant qu'elle n'est pas payée", () => {
    expect(migration).toContain("accounting_document_is_paid");
    expect(migration).toMatch(/p_type = 'invoice' THEN p_status = 'paye'/);
  });
});
