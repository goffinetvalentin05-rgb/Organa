export const VISUAL_CATEGORIES = [
  "match_poster",
  "match_result",
  "club_event",
] as const;

export type VisualCategory = (typeof VISUAL_CATEGORIES)[number];

export const VISUAL_FORMATS = ["story", "square"] as const;

export type VisualFormat = (typeof VISUAL_FORMATS)[number];

export const VISUAL_FORMAT_SIZE: Record<
  VisualFormat,
  { width: number; height: number; label: string }
> = {
  story: { width: 1080, height: 1920, label: "Story 1080×1920" },
  square: { width: 1080, height: 1080, label: "Post carré 1080×1080" },
};

export type VisualImageFit = {
  objectPositionY: number;
  scale: number;
};

export const DEFAULT_IMAGE_FIT: VisualImageFit = {
  objectPositionY: 50,
  scale: 1,
};

export type VisualData = {
  title: string;
  subtitle: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  resultLabel: string;
  date: string;
  time: string;
  venue: string;
  extraText: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  clubLogoUrl: string | null;
  opponentLogoUrl: string | null;
  eventLogoUrl: string | null;
  playerImageUrl: string | null;
  teamImageUrl: string | null;
  backgroundImageUrl: string | null;
  eventImageUrl: string | null;
  playerImageFit: VisualImageFit;
  teamImageFit: VisualImageFit;
  backgroundImageFit: VisualImageFit;
  eventImageFit: VisualImageFit;
};

export type VisualFieldKey = keyof VisualData;

export type VisualClubContext = {
  clubName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  venue: string | null;
};

export type VisualRecord = {
  id: string;
  clubId: string;
  templateId: string;
  type: VisualCategory;
  format: VisualFormat;
  title: string;
  data: VisualData;
  createdAt: string;
  updatedAt: string;
};

export type VisualRenderProps = {
  data: VisualData;
  format: VisualFormat;
};

export type VisualTemplateMeta = {
  id: string;
  name: string;
  category: VisualCategory;
  formats: VisualFormat[];
  defaultFormat: VisualFormat;
  editableFields: VisualFieldKey[];
};

export const CONTENT_FIELDS: VisualFieldKey[] = [
  "title",
  "subtitle",
  "competition",
  "homeTeam",
  "awayTeam",
  "homeScore",
  "awayScore",
  "resultLabel",
  "date",
  "time",
  "venue",
  "extraText",
];

export const LOGO_FIELDS: VisualFieldKey[] = [
  "clubLogoUrl",
  "opponentLogoUrl",
  "eventLogoUrl",
];

export const IMAGE_FIELDS: VisualFieldKey[] = [
  "playerImageUrl",
  "teamImageUrl",
  "backgroundImageUrl",
  "eventImageUrl",
];

export const COLOR_FIELDS: VisualFieldKey[] = [
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "textColor",
];
