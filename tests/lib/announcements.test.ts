import { describe, expect, it } from "vitest";
import {
  normalizeAnnouncementKeysFromBody,
  parseAnnouncementKeysParam,
} from "@/lib/announcements/keys";
import { placeNotificationPanel } from "@/lib/announcements/panelPosition";
import {
  FEATURE_ANNOUNCEMENT_TRACKING_KEYS,
  RELEASE_ONLINE_PAYMENTS_2026_09,
  RELEASE_SHOP_2026_09,
  RELEASE_VISUALS_2026_09,
} from "@/lib/announcements/constants";

describe("parseAnnouncementKeysParam", () => {
  it("splits, trims and dedupes keys", () => {
    expect(parseAnnouncementKeysParam(" a, b ,a,c ")).toEqual(["a", "b", "c"]);
  });

  it("returns an empty list for blank input", () => {
    expect(parseAnnouncementKeysParam(null)).toEqual([]);
    expect(parseAnnouncementKeysParam("  ,  ")).toEqual([]);
  });
});

describe("normalizeAnnouncementKeysFromBody", () => {
  it("accepts a single key", () => {
    expect(normalizeAnnouncementKeysFromBody({ key: "release_shop_2026_09" }, "fallback")).toEqual([
      "release_shop_2026_09",
    ]);
  });

  it("accepts a keys array and merges with key", () => {
    expect(
      normalizeAnnouncementKeysFromBody(
        { key: "a", keys: ["b", "a", "c"] },
        "fallback"
      )
    ).toEqual(["a", "b", "c"]);
  });

  it("falls back when the body has no keys", () => {
    expect(normalizeAnnouncementKeysFromBody({}, "club_public_page_2026_05")).toEqual([
      "club_public_page_2026_05",
    ]);
  });
});

describe("placeNotificationPanel", () => {
  it("aligns the desktop panel to the right of the bell", () => {
    const placement = placeNotificationPanel({
      trigger: { top: 8, right: 900, bottom: 44, left: 864 },
      viewportWidth: 1280,
      viewportHeight: 800,
    });

    expect(placement.mobile).toBe(false);
    expect(placement.width).toBe(392);
    expect(placement.left + placement.width).toBe(900);
    expect(placement.top).toBe(52);
  });

  it("uses a full-width sheet on mobile without overflowing", () => {
    const placement = placeNotificationPanel({
      trigger: { top: 8, right: 348, bottom: 44, left: 312 },
      viewportWidth: 390,
      viewportHeight: 700,
    });

    expect(placement.mobile).toBe(true);
    expect(placement.left).toBe(12);
    expect(placement.left + placement.width).toBe(378);
  });
});

describe("product notification keys", () => {
  it("tracks the three September 2026 releases", () => {
    expect(FEATURE_ANNOUNCEMENT_TRACKING_KEYS).toEqual(
      expect.arrayContaining([
        RELEASE_ONLINE_PAYMENTS_2026_09,
        RELEASE_SHOP_2026_09,
        RELEASE_VISUALS_2026_09,
      ])
    );
  });
});
