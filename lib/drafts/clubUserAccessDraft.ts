import {
  ALL_PERMISSIONS,
  emptyPermissionMap,
  suggestedDefaultPermissions,
  type Permission,
} from "@/lib/auth/permissions-shared";
import { createLocalDraftStore } from "@/lib/drafts/createLocalDraftStore";

export const CLUB_USER_ACCESS_DRAFT_VERSION = 1 as const;

export type ClubUserAccessDraftData = {
  name: string;
  email: string;
  functionTitle: string;
  role: "member" | "committee" | "admin";
  permissions: Record<Permission, boolean>;
};

export function emptyClubUserAccessDraftData(): ClubUserAccessDraftData {
  return {
    name: "",
    email: "",
    functionTitle: "",
    role: "member",
    permissions: suggestedDefaultPermissions(),
  };
}

function normalizePermissions(raw: unknown): Record<Permission, boolean> {
  const base = emptyPermissionMap();
  if (!raw || typeof raw !== "object") return suggestedDefaultPermissions();
  const src = raw as Record<string, unknown>;
  for (const p of ALL_PERMISSIONS) {
    if (typeof src[p] === "boolean") base[p] = src[p];
  }
  return base;
}

export function normalizeClubUserAccessDraftData(
  raw: unknown
): ClubUserAccessDraftData | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;

  // Jamais de tokens / invitationUrl / passwords
  const role =
    d.role === "admin" || d.role === "committee" || d.role === "member"
      ? d.role
      : "member";

  return {
    name: typeof d.name === "string" ? d.name : "",
    email: typeof d.email === "string" ? d.email : "",
    functionTitle: typeof d.functionTitle === "string" ? d.functionTitle : "",
    role,
    permissions: normalizePermissions(d.permissions),
  };
}

export function isMeaningfulClubUserAccessDraft(
  data: ClubUserAccessDraftData
): boolean {
  if (data.name.trim()) return true;
  if (data.email.trim()) return true;
  if (data.functionTitle.trim()) return true;
  if (data.role !== "member") return true;
  const defaults = suggestedDefaultPermissions();
  return ALL_PERMISSIONS.some((p) => data.permissions[p] !== defaults[p]);
}

export const clubUserAccessDraftStore =
  createLocalDraftStore<ClubUserAccessDraftData>({
    version: CLUB_USER_ACCESS_DRAFT_VERSION,
    product: "sport",
    formType: "club-user-access",
    isMeaningful: isMeaningfulClubUserAccessDraft,
    normalize: normalizeClubUserAccessDraftData,
  });
