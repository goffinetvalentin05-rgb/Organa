import Link from "next/link";
import DeleteClientButton from "./components/DeleteClientButton";
import { Info, Plus } from "@/lib/icons";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  user_id: string;
}

export default async function ClientsPage() {
  let clients: Client[] = [];
  let errorMessage: string | null = null;

  try {
    const supabase = await createClient();

    // Authentification
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.id) {
      return (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="p-12 text-center">
            <p className="text-red-400">Erreur d'authentification</p>
          </div>
        </div>
      );
    }

    // Charger les clients directement depuis Supabase
    const { data, error } = await supabase
      .from("clients")
      .select("id, nom, email, telephone, adresse, user_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ClientsPage] Erreur Supabase", error);
      errorMessage = error.message || "Erreur lors du chargement des clients";
    } else {
      // Filtrer les clients valides (avec ID)
      clients = (data || []).filter(
        (c: Client): c is Client => c.id && typeof c.id === "string" && c.id.length > 0 && c.user_id === user.id
      );
    }
  } catch (error: any) {
    console.error("[ClientsPage] Erreur", error);
    errorMessage = error.message || "Erreur lors du chargement des clients";
  }

  // Afficher l'erreur si présente
  if (errorMessage && clients.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="p-12 text-center">
          <p className="text-red-400 mb-4">Erreur lors du chargement des clients</p>
          <p className="text-white/70 text-sm">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="mt-2 text-white/70">
            Gérez vos clients et leurs informations
          </p>
        </div>
        <Link
          href="/tableau-de-bord/clients/nouveau"
          className="px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nouveau client
        </Link>
      </div>

      {/* Message informatif */}
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
        <p className="text-yellow-300 text-sm flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span><strong>Modification désactivée :</strong> Pour modifier un client, veuillez le supprimer et le recréer.</span>
        </p>
      </div>

      {/* Liste */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        {clients.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/70 mb-4">Aucun client pour le moment</p>
            <Link
              href="/tableau-de-bord/clients/nouveau"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all"
            >
              Créer votre premier client
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Nom
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/90">
                    Téléphone
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white/90">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">
                      {client.nom || "Sans nom"}
                    </td>
                    <td className="px-6 py-4 text-white/70">
                      {client.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-white/70">
                      {client.telephone || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DeleteClientButton clientId={client.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}