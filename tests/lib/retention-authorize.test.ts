import { afterEach, describe, expect, it } from "vitest";
import { isAuthorizedRetentionPurge } from "@/lib/retention/authorize";

describe("autorisation purge rétention", () => {
  const prev = process.env.CRON_SECRET;

  afterEach(() => {
    if (prev === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prev;
  });
  it("refuse sans secret, sans header, ou mauvais Bearer", () => {
    const prev = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    expect(
      isAuthorizedRetentionPurge(
        new Request("http://localhost/api/internal/retention-purge")
      )
    ).toBe(false);

    process.env.CRON_SECRET = "s3cret";
    expect(
      isAuthorizedRetentionPurge(
        new Request("http://localhost/api/internal/retention-purge")
      )
    ).toBe(false);
    expect(
      isAuthorizedRetentionPurge(
        new Request("http://localhost/api/internal/retention-purge", {
          headers: { authorization: "Bearer other" },
        })
      )
    ).toBe(false);
    expect(
      isAuthorizedRetentionPurge(
        new Request("http://localhost/api/internal/retention-purge", {
          headers: { authorization: "Bearer s3cret" },
        })
      )
    ).toBe(true);
    process.env.CRON_SECRET = prev;
  });
});
