import { requireProductAccess } from "@/lib/auth/require-product-access";
import { createClient } from "@/lib/supabase/server";
import {
  associationsDisplayFirstName,
  associationsOrgDisplayName,
} from "@/lib/associations/settings";
import AssociationsDashboardHome from "@/components/associations/dashboard/AssociationsDashboardHome";

export default async function AssociationsEspacePage() {
  const access = await requireProductAccess("association");
  const supabase = await createClient();

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase
      .from("profiles")
      .select("company_name, logo_url")
      .eq("user_id", access.clubId)
      .maybeSingle(),
    supabase
      .from("club_memberships")
      .select("name, email")
      .eq("club_id", access.clubId)
      .eq("user_id", access.userId)
      .eq("status", "active")
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  const orgName = associationsOrgDisplayName(profile?.company_name);
  const firstName = associationsDisplayFirstName(
    membership?.name,
    membership?.email
  );

  return (
    <AssociationsDashboardHome
      orgName={orgName}
      firstName={firstName}
      hasLogo={Boolean(profile?.logo_url)}
      hasCompanyName={Boolean(
        typeof profile?.company_name === "string" && profile.company_name.trim()
      )}
    />
  );
}
