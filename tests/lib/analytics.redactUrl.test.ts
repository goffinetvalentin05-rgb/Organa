import { describe, expect, it } from "vitest";
import {
  redactAnalyticsEvent,
  redactAnalyticsPath,
} from "@/lib/analytics/redactUrl";

describe("redactAnalyticsPath", () => {
  it("masque le token cotisation, y compris /succes", () => {
    expect(redactAnalyticsPath("/cotisation/abc123secret")).toBe(
      "/cotisation/[token]"
    );
    expect(redactAnalyticsPath("/cotisation/abc123secret/succes")).toBe(
      "/cotisation/[token]/succes"
    );
    expect(
      redactAnalyticsPath("https://obillz.com/cotisation/abc123secret/succes")
    ).toBe("https://obillz.com/cotisation/[token]/succes");
  });

  it("masque invitations et désinscription", () => {
    expect(redactAnalyticsPath("/invitations/tok_invite")).toBe(
      "/invitations/[token]"
    );
    expect(redactAnalyticsPath("/desinscription/tok_unsub")).toBe(
      "/desinscription/[token]"
    );
  });

  it("laisse les autres chemins intacts", () => {
    expect(redactAnalyticsPath("/tableau-de-bord/clients")).toBe(
      "/tableau-de-bord/clients"
    );
  });

  it("beforeSend équivalent : event.url redacted, pas le token réel", () => {
    const event = redactAnalyticsEvent({
      type: "pageview",
      url: "https://obillz.com/cotisation/super-secret-token",
    });
    expect(event.url).toBe("https://obillz.com/cotisation/[token]");
    expect(event.url).not.toContain("super-secret-token");
  });
});
