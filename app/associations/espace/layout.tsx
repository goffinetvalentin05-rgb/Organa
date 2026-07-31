import { requireProductAccess } from "@/lib/auth/require-product-access";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AssociationsDashboardShell from "@/components/associations/dashboard/AssociationsDashboardShell";

async function loadAssociationsContext() {
  const access = await requireProductAccess("association");
  const supabase = await createClient();

  const [{ data: profile }, { data: membership }, { data: authUser }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("company_name, product_type, logo_url")
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

  const orgName =
    typeof profile?.company_name === "string" && profile.company_name.trim()
      ? profile.company_name.trim()
      : "Votre association";

  const logoUrl =
    typeof profile?.logo_url === "string" && profile.logo_url.trim()
      ? profile.logo_url.trim()
      : null;

  const userEmail =
    (typeof membership?.email === "string" && membership.email.trim()) ||
    authUser.user?.email ||
    null;

  const userLabel =
    (typeof membership?.name === "string" && membership.name.trim()) ||
    userEmail ||
    "Utilisateur";

  return {
    orgName,
    logoUrl,
    userEmail,
    userLabel,
    role: access.role,
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
