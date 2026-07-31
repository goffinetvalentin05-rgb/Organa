import { requireProductAccess } from "@/lib/auth/require-product-access";
import { createClient } from "@/lib/supabase/server";
import AssociationsDashboardHome from "@/components/associations/dashboard/AssociationsDashboardHome";

export default async function AssociationsEspacePage() {
  const access = await requireProductAccess("association");
  const supabase = await createClient();

  const [{ data: profile }, { data: membership }, auth] =
    await Promise.all([
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
      supabase.auth.getUser(),
    ]);

  const orgName =
    typeof profile?.company_name === "string" && profile.company_name.trim()
      ? profile.company_name.trim()
      : "Votre association";

  const userLabel =
    (typeof membership?.name === "string" && membership.name.trim()) ||
    auth.data.user?.email ||
    "Utilisateur";

  return (
    <AssociationsDashboardHome
      orgName={orgName}
      userLabel={userLabel}
      hasLogo={Boolean(profile?.logo_url)}
    />
  );
}
