import { createClient } from "@/lib/supabase/server";
import { getAuthContext, type ClubRole } from "@/lib/auth/rbac";
import {
  checkPermission,
  PERMISSIONS,
} from "@/lib/auth/permissions";

/** Colonnes profiles lues/écrites par les paramètres Associations (type local). */
export type AssociationSettingsProfile = {
  company_name: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
  company_address_line2: string | null;
  company_postal_code: string | null;
  company_city: string | null;
  company_region: string | null;
  company_country: string | null;
  logo_url: string | null;
  logo_path: string | null;
  iban: string | null;
  bank_name: string | null;
  public_page_website_url: string | null;
  public_page_description: string | null;
  product_type: string | null;
};

export const ASSOCIATION_SETTINGS_PROFILE_SELECT =
  "company_name, company_email, company_phone, company_address, company_address_line2, company_postal_code, company_city, company_region, company_country, logo_url, logo_path, iban, bank_name, public_page_website_url, public_page_description, product_type";

const ROLE_LABELS: Record<ClubRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  committee: "Comité",
  member: "Membre",
};

export function associationsRoleLabel(role: string | null | undefined): string {
  if (role === "owner" || role === "admin" || role === "committee" || role === "member") {
    return ROLE_LABELS[role];
  }
  return "Membre";
}

/**
 * Contexte sécurisé pour lecture/écriture des paramètres Associations.
 * N'accepte jamais un club_id venant du client.
 */
export async function requireAssociationSettingsAccess(options?: {
  requireEdit?: boolean;
}): Promise<
  | {
      ok: true;
      clubId: string;
      userId: string;
      role: ClubRole;
      canEdit: boolean;
    }
  | { ok: false; status: 401 | 403; error: string }
> {
  const ctx = await getAuthContext();
  if (!ctx?.current) {
    return { ok: false, status: 401, error: "Non authentifié" };
  }

  const clubId = ctx.current.clubId;
  const userId = ctx.user.id;
  const supabase = await createClient();

  const [{ data: membership, error: membershipError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase
        .from("club_memberships")
        .select("role, status, permissions")
        .eq("club_id", clubId)
        .eq("user_id", userId)
        .eq("status", "active")
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("product_type")
        .eq("user_id", clubId)
        .maybeSingle(),
    ]);

  if (membershipError || !membership) {
    return { ok: false, status: 403, error: "Membership introuvable" };
  }

  if (profileError) {
    console.error("[associations/settings] lecture product_type:", profileError.message);
    return { ok: false, status: 403, error: "Accès refusé" };
  }

  if (profile?.product_type !== "association") {
    return {
      ok: false,
      status: 403,
      error: "Cette organisation n’est pas une association Obillz",
    };
  }

  const role = membership.role as ClubRole;
  const editPerm = await checkPermission(PERMISSIONS.ACCESS_SETTINGS);
  const canEdit = editPerm.ok && editPerm.clubId === clubId;

  if (options?.requireEdit && !canEdit) {
    return {
      ok: false,
      status: 403,
      error: "Vous n’avez pas l’autorisation de modifier ces paramètres",
    };
  }

  return {
    ok: true,
    clubId,
    userId,
    role,
    canEdit,
  };
}

export async function loadAssociationSettingsProfile(
  clubId: string
): Promise<AssociationSettingsProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(ASSOCIATION_SETTINGS_PROFILE_SELECT)
    .eq("user_id", clubId)
    .maybeSingle();

  if (error) {
    console.error("[associations/settings] load profile:", error.message);
    return null;
  }

  return (data as AssociationSettingsProfile | null) ?? null;
}

/** Prénom affichable — jamais l’email. */
export function associationsDisplayFirstName(
  membershipName: string | null | undefined,
  email?: string | null | undefined
): string | null {
  const name = typeof membershipName === "string" ? membershipName.trim() : "";
  if (name && !name.includes("@")) {
    const first = name.split(/\s+/)[0];
    if (first && first.length >= 2) return first;
  }
  void email;
  return null;
}

export function associationsDisplayFullName(
  membershipName: string | null | undefined
): string | null {
  const name = typeof membershipName === "string" ? membershipName.trim() : "";
  if (name && !name.includes("@")) return name;
  return null;
}

export function associationsOrgDisplayName(
  companyName: string | null | undefined
): string {
  const name = typeof companyName === "string" ? companyName.trim() : "";
  return name || "Votre association";
}

export function associationsUserChipLabel(
  membershipName: string | null | undefined,
  email: string | null | undefined
): string {
  return (
    associationsDisplayFullName(membershipName) ||
    associationsDisplayFirstName(membershipName, email) ||
    "Utilisateur"
  );
}
