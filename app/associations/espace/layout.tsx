import { requireProductAccess } from "@/lib/auth/require-product-access";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AssociationsDashboardShell from "@/components/associations/dashboard/AssociationsDashboardShell";
import {
  associationsOrgDisplayName,
  associationsRoleLabel,
  associationsUserChipLabel,
} from "@/lib/associations/settings";
import { resolveClubLogoUrlForClient } from "@/lib/club/resolveClubLogoUrl";

async function loadAssociationsContext() {
  const access = await requireProductAccess("association");
  const supabase = await createClient();

  const [{ data: profile }, { data: membership }, { data: authUser }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("company_name, product_type, logo_url, logo_path")
        .eq("user_id", access.clubId)
        .maybeSingle(),
      supabase
        .from("club_memberships")
        .select("name, email, role")
        .eq("club_id", access.clubId)
        .eq("user_id", access.userId)
        .eq("status", "active")
        .is("deleted_at", null)
        .maybeSingle(),
      supabase.auth.getUser(),
    ]);

  if (profile?.product_type && profile.product_type !== "association") {
    redirect("/tableau-de-bord");
  }

  const orgName = associationsOrgDisplayName(profile?.company_name);

  const logoUrl = await resolveClubLogoUrlForClient(
    supabase,
    profile
      ? { logo_url: profile.logo_url, logo_path: profile.logo_path }
      : null,
    access.clubId
  );

  const userEmail =
    (typeof membership?.email === "string" && membership.email.trim()) ||
    authUser.user?.email ||
    null;

  const userLabel = associationsUserChipLabel(membership?.name, userEmail);

  return {
    orgName,
    logoUrl,
    userEmail,
    userLabel,
    role: associationsRoleLabel(access.role),
    hasLogo: Boolean(logoUrl),
  };
}

export default async function AssociationsEspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await loadAssociationsContext();

  return (
    <AssociationsDashboardShell
      orgName={ctx.orgName}
      logoUrl={ctx.logoUrl}
      userEmail={ctx.userEmail}
      userLabel={ctx.userLabel}
      role={ctx.role}
    >
      {children}
    </AssociationsDashboardShell>
  );
}
