import type { VisualTemplateMeta } from "./types";

export const VISUAL_TEMPLATE_CATALOG: VisualTemplateMeta[] = [
  {
    id: "match-poster-01",
    name: "Kickoff Split",
    category: "match_poster",
    formats: ["story", "square"],
    defaultFormat: "story",
    editableFields: [
      "title",
      "competition",
      "homeTeam",
      "awayTeam",
      "date",
      "time",
      "venue",
      "clubLogoUrl",
      "opponentLogoUrl",
      "playerImageUrl",
      "primaryColor",
      "secondaryColor",
      "accentColor",
      "textColor",
    ],
  },
  {
    id: "match-result-01",
    name: "Final Score",
    category: "match_result",
    formats: ["story", "square"],
    defaultFormat: "story",
    editableFields: [
      "title",
      "homeTeam",
      "awayTeam",
      "homeScore",
      "awayScore",
      "resultLabel",
      "clubLogoUrl",
      "opponentLogoUrl",
      "teamImageUrl",
      "primaryColor",
      "secondaryColor",
      "accentColor",
      "textColor",
    ],
  },
  {
    id: "club-event-01",
    name: "Club Night",
    category: "club_event",
    formats: ["story", "square"],
    defaultFormat: "story",
    editableFields: [
      "title",
      "subtitle",
      "date",
      "time",
      "venue",
      "extraText",
      "clubLogoUrl",
      "eventLogoUrl",
      "eventImageUrl",
      "primaryColor",
      "secondaryColor",
      "accentColor",
      "textColor",
    ],
  },
];

export function getVisualTemplateMeta(id: string): VisualTemplateMeta | undefined {
  return VISUAL_TEMPLATE_CATALOG.find((item) => item.id === id);
}

export function isVisualTemplateId(id: string): boolean {
  return VISUAL_TEMPLATE_CATALOG.some((item) => item.id === id);
}
