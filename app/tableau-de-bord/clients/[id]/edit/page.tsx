import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EditClientForm from "./EditClientForm";
import { requireCurrentClub } from "@/lib/auth/rbac";
import { checkPermission, PERMISSIONS } from "@/lib/auth/permissions";

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

  const row = data as Record<string, unknown>;
  const nom = (typeof row.nom === "string" ? row.nom : typeof row.name === "string" ? row.name : "") || "";
  const telephone =
    (typeof row.telephone === "string" ? row.telephone : typeof row.phone === "string" ? row.phone : "") || "";
  const adresse =
    (typeof row.adresse === "string" ? row.adresse : typeof row.address === "string" ? row.address : "") || "";

  const initialData = {
    id: String(row.id ?? ""),
    nom,
    email: typeof row.email === "string" ? row.email : "",
    telephone,
    adresse,
    postal_code: typeof row.postal_code === "string" ? row.postal_code : "",
    city: typeof row.city === "string" ? row.city : "",
    role: typeof row.role === "string" ? row.role : "player",
    category: typeof row.category === "string" ? row.category : "",
  };

  return <EditClientForm clientId={id} initialData={initialData} />;
}
