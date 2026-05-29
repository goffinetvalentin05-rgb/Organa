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
  contactUrl: string;
  showBuvette: boolean;
  showMatches: boolean;
  showContact: boolean;
  publicUrlPath: string | null;
  buvetteSlug: string | null;
}

export interface PublicClubPageData {
  title: string;
  description: string;
  logoUrl: string | null;
  primaryColor: string;
  instagramUrl: string | null;
  facebookUrl: string | null;
  websiteUrl: string | null;
  contactUrl: string | null;
  showBuvette: boolean;
  showMatches: boolean;
  showContact: boolean;
  buvetteSlug: string | null;
}

export interface PublicClubEvent {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  eventTypeName: string | null;
}
