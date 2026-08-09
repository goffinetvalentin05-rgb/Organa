import { createLocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const MEMBER_DRAFT_VERSION = 1 as const;

export type MemberDraftData = {
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  postal_code: string;
  city: string;
  role: string;
  category: string | null;
  date_of_birth: string;
  avs_number: string;
};

export function emptyMemberDraftData(): MemberDraftData {
  return {
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    postal_code: "",
    city: "",
    role: "player",
    category: null,
    date_of_birth: "",
    avs_number: "",
  };
}

export function normalizeMemberDraftData(raw: unknown): MemberDraftData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  return {
    nom: typeof d.nom === "string" ? d.nom : "",
    email: typeof d.email === "string" ? d.email : "",
    telephone: typeof d.telephone === "string" ? d.telephone : "",
    adresse: typeof d.adresse === "string" ? d.adresse : "",
    postal_code: typeof d.postal_code === "string" ? d.postal_code : "",
    city: typeof d.city === "string" ? d.city : "",
    role: typeof d.role === "string" && d.role ? d.role : "player",
    category: typeof d.category === "string" ? d.category : null,
    date_of_birth: typeof d.date_of_birth === "string" ? d.date_of_birth : "",
    avs_number: typeof d.avs_number === "string" ? d.avs_number : "",
  };
}

export function isMeaningfulMemberDraft(data: MemberDraftData): boolean {
  if (data.nom.trim()) return true;
  if (data.email.trim()) return true;
  if (data.telephone.trim()) return true;
  if (data.adresse.trim()) return true;
  if (data.postal_code.trim()) return true;
  if (data.city.trim()) return true;
  if (data.category) return true;
  if (data.date_of_birth.trim()) return true;
  if (data.avs_number.trim()) return true;
  if (data.role && data.role !== "player") return true;
  return false;
}

export const memberDraftStore = createLocalDraftStore<MemberDraftData>({
  version: MEMBER_DRAFT_VERSION,
  product: "sport",
  formType: "member",
  isMeaningful: isMeaningfulMemberDraft,
  normalize: normalizeMemberDraftData,
});
