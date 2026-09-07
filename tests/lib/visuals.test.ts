import { describe, expect, it } from "vitest";
import { getVisualTemplateMeta, isVisualTemplateId } from "@/lib/visuals/catalog";
import {
  applyClubContext,
  buildNewVisualData,
  mergeVisualData,
  sanitizeVisualData,
  slugifyVisualPart,
  visualDownloadFilename,
} from "@/lib/visuals/data";
import { normalizeHexColor } from "@/lib/visuals/colors";

describe("visuals catalog", () => {
  it("exposes the three v1 templates", () => {
    expect(isVisualTemplateId("match-poster-01")).toBe(true);
    expect(isVisualTemplateId("match-result-01")).toBe(true);
    expect(isVisualTemplateId("club-event-01")).toBe(true);
    expect(isVisualTemplateId("unknown")).toBe(false);
    expect(getVisualTemplateMeta("match-result-01")?.category).toBe("match_result");
  });
});

describe("visuals data", () => {
  it("does not force club colors when none are configured", () => {
    const data = buildNewVisualData("match-poster-01", {
      clubName: "FC Alle",
      logoUrl: null,
      primaryColor: null,
      venue: null,
    });
    expect(data.homeTeam).toBe("FC Alle");
    expect(data.primaryColor).toBe("#1A23FF");
  });

  it("applies club color and logo when present", () => {
    const data = applyClubContext(
      mergeVisualData(),
      {
        clubName: "FC Alle",
        logoUrl: "https://example.com/logo.png",
        primaryColor: "#112233",
        venue: "Stade municipal",
      },
      { overwriteTeams: true }
    );
    expect(data.clubLogoUrl).toBe("https://example.com/logo.png");
    expect(data.primaryColor).toBe("#112233");
    expect(data.venue).toBe("Stade municipal");
    expect(data.secondaryColor).not.toBe("#112233");
  });

  it("strips blob urls and clips text on sanitize", () => {
    const data = sanitizeVisualData({
      title: "  Victoire   ",
      homeTeam: "A".repeat(200),
      clubLogoUrl: "blob:http://localhost/1",
      opponentLogoUrl: "https://cdn.example.com/away.png",
      playerImageUrl: "data:image/png;base64,xxxx",
      homeScore: "2",
    });
    expect(data.title).toBe("Victoire");
    expect(data.homeTeam.length).toBeLessThanOrEqual(120);
    expect(data.clubLogoUrl).toBeNull();
    expect(data.playerImageUrl).toBeNull();
    expect(data.opponentLogoUrl).toBe("https://cdn.example.com/away.png");
    expect(data.homeScore).toBe("2");
  });

  it("builds a clean download filename", () => {
    expect(
      visualDownloadFilename({
        templateId: "match-poster-01",
        data: sanitizeVisualData({
          homeTeam: "FC Allé",
          awayTeam: "FC Porrentruy",
        }),
      })
    ).toBe("obillz-match-fc-alle-vs-fc-porrentruy.png");
    expect(slugifyVisualPart("Soirée foot & grillades")).toBe("soiree-foot-grillades");
  });
});

describe("visuals colors", () => {
  it("normalizes hex shortcuts", () => {
    expect(normalizeHexColor("#abc")).toBe("#AABBCC");
    expect(normalizeHexColor("1a23ff")).toBe("#1A23FF");
    expect(normalizeHexColor("nope")).toBeNull();
  });
});
