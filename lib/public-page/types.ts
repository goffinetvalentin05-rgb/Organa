export type MatchProgramType = "external_url" | "pdf";
export type PublicPageLinkType = "qr_code" | "event" | "buvette" | "custom";

export interface PublicPageSettings {
  enabled: boolean;
  slug: string | null;
  title: string;
  description: string;
  primaryColor: string;
  logoUrl: string | null;
  instagramUrl: string;
  facebookUrl: string;
  websiteUrl: string;
  showBuvette: boolean;
  showMatchProgram: boolean;
  matchProgramType: MatchProgramType | null;
  matchProgramUrl: string | null;
  matchProgramPdfPath: string | null;
  matchProgramPdfName: string | null;
  matchProgramPdfUrl: string | null;
  showPublicLinks: boolean;
  publicUrlPath: string | null;
  buvetteSlug: string | null;
}

export interface PublicPageLink {
  id: string;
  title: string;
  description: string | null;
  url: string;
  type: PublicPageLinkType;
  qrcodeId: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface PublicPageLinkInput {
  id?: string;
  title: string;
  description?: string | null;
  url: string;
  type: PublicPageLinkType;
  qrcodeId?: string | null;
  isActive?: boolean;
  sortOrder: number;
}

export interface PublicClubPageData {
  title: string;
  description: string;
  logoUrl: string | null;
  primaryColor: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  websiteUrl: string | null;
  showBuvette: boolean;
  buvetteSlug: string | null;
  matchProgram: {
    label: string;
    href: string;
    external: boolean;
  } | null;
  publicLinks: {
    id: string;
    title: string;
    description: string | null;
    url: string;
    external: boolean;
  }[];
}

export interface PublicPageSettingsResponse {
  settings: PublicPageSettings;
  links: PublicPageLink[];
  qrcodeOptions: {
    id: string;
    name: string;
    code: string;
    registrationPath: string;
  }[];
}
