import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditClientForm from "./EditClientForm";

interface EditClientPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await Promise.resolve(params);

  if (!id || typeof id !== "string" || id.trim().length === 0) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/connexion");
  }

  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, name, email, phone, address, postal_code, city, user_id, role, category"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const initialData = {
    id: data.id,
    nom: data.name ?? "",
    email: data.email ?? "",
    telephone: data.phone ?? "",
    adresse: data.address ?? "",
    postal_code: data.postal_code ?? "",
    city: data.city ?? "",
    role: data.role ?? "player",
    category: data.category ?? "",
  };

  return <EditClientForm clientId={id} initialData={initialData} />;
}
