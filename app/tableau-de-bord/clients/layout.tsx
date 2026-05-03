import { requireCurrentClub } from "@/lib/auth/rbac";
import { createClient } from "@/lib/supabase/server";
import { fetchMergedMemberFieldSettings } from "@/lib/member-fields/loadSettings";
import { MemberFieldSettingsProvider } from "@/components/member-fields/MemberFieldSettingsProvider";

export default async function ClientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { clubId } = await requireCurrentClub();
  const supabase = await createClient();
  const fields = await fetchMergedMemberFieldSettings(supabase, clubId);

  return (
    <MemberFieldSettingsProvider value={fields}>{children}</MemberFieldSettingsProvider>
  );
}
