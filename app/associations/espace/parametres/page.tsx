import { requireProductAccess } from "@/lib/auth/require-product-access";
import { createClient } from "@/lib/supabase/server";
import {
  ASSOCIATION_SETTINGS_PROFILE_SELECT,
  associationsRoleLabel,
  requireAssociationSettingsAccess,
} from "@/lib/associations/settings";
import { resolveClubLogoUrlForClient } from "@/lib/club/resolveClubLogoUrl";
import AssociationsSettingsForm from "@/components/associations/dashboard/AssociationsSettingsForm";

function asFormString(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export default async function AssociationsParametresPage() {
  await requireProductAccess("association");
  const settingsAccess = await requireAssociationSettingsAccess();
  const supabase = await createClient();

  if (!settingsAccess.ok) {
    return (
      <div className="rounded-2xl border border-[#17211d]/10 bg-white/80 p-6 text-sm font-semibold text-[#66736d]">
        Impossible de charger les paramètres ({settingsAccess.error}).
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(ASSOCIATION_SETTINGS_PROFILE_SELECT)
    .eq("user_id", settingsAccess.clubId)
    .maybeSingle();

  const logoUrl = await resolveClubLogoUrlForClient(
    supabase,
    profile
      ? { logo_url: profile.logo_url, logo_path: profile.logo_path }
      : null,
    settingsAccess.clubId
  );

  return (
    <AssociationsSettingsForm
      clubId={settingsAccess.clubId}
      roleLabel={associationsRoleLabel(settingsAccess.role)}
      canEdit={settingsAccess.canEdit}
      initialSettings={{
        company_name: asFormString(profile?.company_name),
        company_email: asFormString(profile?.company_email),
        company_phone: asFormString(profile?.company_phone),
        company_address: asFormString(profile?.company_address),
        company_address_line2: asFormString(profile?.company_address_line2),
        company_postal_code: asFormString(profile?.company_postal_code),
        company_city: asFormString(profile?.company_city),
        company_region: asFormString(profile?.company_region),
        company_country: asFormString(profile?.company_country),
        website: asFormString(profile?.public_page_website_url),
        description: asFormString(profile?.public_page_description),
        iban: asFormString(profile?.iban),
        bank_name: asFormString(profile?.bank_name),
        logo_url: logoUrl,
      }}
    />
  );
}
