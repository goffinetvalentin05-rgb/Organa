import type {
  MatchProgramType,
  PublicPageLinkInput,
  PublicPageLinkType,
  PublicPageSettings,
} from "@/lib/public-page/types";
import { createLocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const PUBLIC_PAGE_DRAFT_VERSION = 1 as const;

/** Métadonnées page publique — pas de File/PDF binaire. */
export type PublicPageDraftData = {
  form: {
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
    /** Chemins / URLs serveur déjà persistés — pas de contenu binaire. */
    matchProgramPdfPath: string | null;
    matchProgramPdfName: string | null;
    matchProgramPdfUrl: string | null;
    showPublicLinks: boolean;
    publicUrlPath: string | null;
    buvetteSlug: string | null;
  };
  links: PublicPageLinkInput[];
};

const LINK_TYPES = new Set<PublicPageLinkType>([
  "qr_code",
  "event",
  "buvette",
  "custom",
]);

export function emptyPublicPageDraftData(): PublicPageDraftData {
  return {
    form: {
      enabled: false,
      slug: null,
      title: "",
      description: "",
      primaryColor: "",
      logoUrl: null,
      instagramUrl: "",
      facebookUrl: "",
      websiteUrl: "",
      showBuvette: false,
      showMatchProgram: false,
      matchProgramType: null,
      matchProgramUrl: null,
      matchProgramPdfPath: null,
      matchProgramPdfName: null,
      matchProgramPdfUrl: null,
      showPublicLinks: false,
      publicUrlPath: null,
      buvetteSlug: null,
    },
    links: [],
  };
}

function normalizeLink(raw: unknown, index: number): PublicPageLinkInput | null {
  if (!raw || typeof raw !== "object") return null;
  const l = raw as Record<string, unknown>;
  const type: PublicPageLinkType =
    typeof l.type === "string" && LINK_TYPES.has(l.type as PublicPageLinkType)
      ? (l.type as PublicPageLinkType)
      : "custom";
  return {
    id: typeof l.id === "string" ? l.id : undefined,
    title: typeof l.title === "string" ? l.title : "",
    description: typeof l.description === "string" ? l.description : null,
    url: typeof l.url === "string" ? l.url : "",
    type,
    qrcodeId: typeof l.qrcodeId === "string" ? l.qrcodeId : null,
    isActive: l.isActive !== false,
    sortOrder: typeof l.sortOrder === "number" ? l.sortOrder : index,
  };
}

export function normalizePublicPageDraftData(
  raw: unknown
): PublicPageDraftData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (!d.form || typeof d.form !== "object") return null;
  const f = d.form as Record<string, unknown>;

  const matchProgramType: MatchProgramType | null =
    f.matchProgramType === "external_url" || f.matchProgramType === "pdf"
      ? f.matchProgramType
      : null;

  const links = Array.isArray(d.links)
    ? d.links
        .map((l, i) => normalizeLink(l, i))
        .filter((l): l is PublicPageLinkInput => l !== null)
    : [];

  return {
    form: {
      enabled: Boolean(f.enabled),
      slug: typeof f.slug === "string" ? f.slug : null,
      title: typeof f.title === "string" ? f.title : "",
      description: typeof f.description === "string" ? f.description : "",
      primaryColor: typeof f.primaryColor === "string" ? f.primaryColor : "",
      logoUrl: typeof f.logoUrl === "string" ? f.logoUrl : null,
      instagramUrl: typeof f.instagramUrl === "string" ? f.instagramUrl : "",
      facebookUrl: typeof f.facebookUrl === "string" ? f.facebookUrl : "",
      websiteUrl: typeof f.websiteUrl === "string" ? f.websiteUrl : "",
      showBuvette: Boolean(f.showBuvette),
      showMatchProgram: Boolean(f.showMatchProgram),
      matchProgramType,
      matchProgramUrl:
        typeof f.matchProgramUrl === "string" ? f.matchProgramUrl : null,
      matchProgramPdfPath:
        typeof f.matchProgramPdfPath === "string" ? f.matchProgramPdfPath : null,
      matchProgramPdfName:
        typeof f.matchProgramPdfName === "string" ? f.matchProgramPdfName : null,
      matchProgramPdfUrl:
        typeof f.matchProgramPdfUrl === "string" ? f.matchProgramPdfUrl : null,
      showPublicLinks: Boolean(f.showPublicLinks),
      publicUrlPath:
        typeof f.publicUrlPath === "string" ? f.publicUrlPath : null,
      buvetteSlug: typeof f.buvetteSlug === "string" ? f.buvetteSlug : null,
    },
    links,
  };
}

export function isMeaningfulPublicPageDraft(data: PublicPageDraftData): boolean {
  const f = data.form;
  if (f.enabled) return true;
  if (f.slug?.trim()) return true;
  if (f.title.trim()) return true;
  if (f.description.trim()) return true;
  if (f.primaryColor.trim()) return true;
  if (f.instagramUrl.trim()) return true;
  if (f.facebookUrl.trim()) return true;
  if (f.websiteUrl.trim()) return true;
  if (f.showBuvette || f.showMatchProgram || f.showPublicLinks) return true;
  if (f.matchProgramUrl?.trim()) return true;
  if (f.matchProgramType) return true;
  if (data.links.length > 0) return true;
  return false;
}

export function toPublicPageDraftPayload(
  form: PublicPageSettings,
  links: PublicPageLinkInput[]
): PublicPageDraftData {
  return {
    form: {
      enabled: form.enabled,
      slug: form.slug,
      title: form.title,
      description: form.description,
      primaryColor: form.primaryColor,
      logoUrl: form.logoUrl,
      instagramUrl: form.instagramUrl,
      facebookUrl: form.facebookUrl,
      websiteUrl: form.websiteUrl,
      showBuvette: form.showBuvette,
      showMatchProgram: form.showMatchProgram,
      matchProgramType: form.matchProgramType,
      matchProgramUrl: form.matchProgramUrl,
      matchProgramPdfPath: form.matchProgramPdfPath,
      matchProgramPdfName: form.matchProgramPdfName,
      matchProgramPdfUrl: form.matchProgramPdfUrl,
      showPublicLinks: form.showPublicLinks,
      publicUrlPath: form.publicUrlPath,
      buvetteSlug: form.buvetteSlug,
    },
    links: links.map((l, i) => ({
      id: l.id,
      title: l.title,
      description: l.description ?? null,
      url: l.url,
      type: l.type,
      qrcodeId: l.qrcodeId ?? null,
      isActive: l.isActive !== false,
      sortOrder: l.sortOrder ?? i,
    })),
  };
}

export const publicPageDraftStore = createLocalDraftStore<PublicPageDraftData>({
  version: PUBLIC_PAGE_DRAFT_VERSION,
  product: "sport",
  formType: "public-page",
  isMeaningful: isMeaningfulPublicPageDraft,
  normalize: normalizePublicPageDraftData,
});
