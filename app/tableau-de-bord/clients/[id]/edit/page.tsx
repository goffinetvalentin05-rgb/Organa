import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EditClientForm from "./EditClientForm";
import { requireCurrentClub } from "@/lib/auth/rbac";
import { checkPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { normalizeClientsDbRow } from "@/lib/clients/normalizeDbRow";

interface EditClientPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await Promise.resolve(params);

  if (!id || typeof id !== "string" || id.trim().length === 0) {
    notFound();
  }

  const { clubId } = await requireCurrentClub();
  const canManage = await checkPermission(PERMISSIONS.MANAGE_MEMBERS);
  if (!canManage.ok) {
    notFound();
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("user_id", clubId)
    .single();

  if (error || !data) {
    notFound();
  }

  const n = normalizeClientsDbRow(data as Record<string, unknown>);
  if (!n) {
    notFound();
  }

  const initialData = {
    id: n.id,
    nom: n.nom ?? "",
    email: n.email ?? "",
    telephone: n.telephone ?? "",
    adresse: n.adresse ?? "",
    postal_code: n.postal_code ?? "",
    city: n.city ?? "",
    role: n.role,
    category: n.category ?? "",
    date_of_birth: n.date_of_birth ? n.date_of_birth.slice(0, 10) : "",
    avs_number: n.avs_number ?? "",
  };

  return <EditClientForm clientId={id} initialData={initialData} />;
}
