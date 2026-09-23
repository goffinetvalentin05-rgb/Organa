import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { isAccountingAddonSubscription } from "@/lib/billing/accountingAddon";

const migration = readFileSync(
  path.resolve(__dirname, "../../supabase/migrations/091_accounting_module.sql"),
  "utf8"
);
const purge = readFileSync(
  path.resolve(__dirname, "../../supabase/migrations/078_retention_purge_and_legal_acceptances.sql"),
  "utf8"
);

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

  it("ne comptabilise pas une facture tant qu'elle n'est pas payée", () => {
    expect(migration).toContain("accounting_document_is_paid");
    expect(migration).toMatch(/p_type = 'invoice' THEN p_status = 'paye'/);
  });
});
