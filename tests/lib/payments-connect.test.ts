import { describe, expect, it } from "vitest";
import { buildAccountSessionParams } from "@/lib/payments/connect/account-session";
import {
  deriveConnectUiMode,
  isConnectActionRequired,
} from "@/lib/payments/connect/ui-state";

describe("club Stripe Connect UI state", () => {
  it("shows intro until a connected account exists", () => {
    expect(
      deriveConnectUiMode({
        hasAccount: false,
        detailsSubmitted: false,
        chargesEnabled: false,
        currentlyDue: [],
        pastDue: [],
      })
    ).toBe("intro");
  });

  it("shows embedded onboarding before details are submitted", () => {
    expect(
      deriveConnectUiMode({
        hasAccount: true,
        detailsSubmitted: false,
        chargesEnabled: false,
        currentlyDue: ["individual.verification.document"],
        pastDue: [],
      })
    ).toBe("onboarding");
  });

  it("shows action required when Stripe still needs information", () => {
    expect(
      deriveConnectUiMode({
        hasAccount: true,
        detailsSubmitted: true,
        chargesEnabled: false,
        currentlyDue: ["external_account"],
        pastDue: [],
      })
    ).toBe("action_required");
  });

  it("is ready when charges are enabled and nothing is due", () => {
    expect(
      deriveConnectUiMode({
        hasAccount: true,
        detailsSubmitted: true,
        chargesEnabled: true,
        currentlyDue: [],
        pastDue: [],
      })
    ).toBe("ready");
    expect(
      isConnectActionRequired({
        chargesEnabled: true,
        detailsSubmitted: true,
        currentlyDue: [],
        pastDue: [],
      })
    ).toBe(false);
  });
});

describe("AccountSession params", () => {
  it("binds the session to the server-resolved connected account only", () => {
    const params = buildAccountSessionParams("acct_club_a");
    expect(params.account).toBe("acct_club_a");
    expect(params.components.account_onboarding?.enabled).toBe(true);
    expect(params.components.account_management?.enabled).toBe(true);
    expect(params.components.notification_banner?.enabled).toBe(true);
    expect(
      params.components.account_management?.features?.external_account_collection
    ).toBe(true);
  });
});
