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
        (c: Client): c is Client => 
          Boolean(c.id) && 
          typeof c.id === "string" && 
          c.id.length > 0 && 
          c.user_id === user.id
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
          <p className="text-secondary text-sm">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* En-tête */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="mt-2 text-secondary">
            Une vue claire pour gérer vos contacts et leurs informations clés.
          </p>
        </div>
        <Link
          href="/tableau-de-bord/clients/nouveau"
          className="px-6 py-3 accent-bg text-white font-semibold rounded-full transition-all flex items-center gap-2 shadow-premium hover:shadow-premium-hover"
        >
          <Plus className="w-5 h-5" />
          Nouveau client
        </Link>
      </div>

      {/* Message informatif */}
      <div className="rounded-[24px] border border-yellow-300/40 bg-yellow-50 px-8 py-6 shadow-premium">
        <div className="flex items-start gap-3 text-yellow-800">
          <div className="mt-0.5 rounded-full bg-yellow-100 p-2">
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Modification temporairement désactivée</p>
            <p>
              Pour modifier un client, supprimez-le puis recréez-le. Cela garantit des données
              propres et une base toujours fiable.
            </p>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="rounded-[28px] border border-subtle bg-surface p-8 shadow-premium">
        {clients.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-secondary mb-4">Aucun client pour le moment.</p>
            <Link
              href="/tableau-de-bord/clients/nouveau"
              className="inline-block px-6 py-3 accent-bg text-white font-semibold rounded-full transition-all shadow-premium hover:shadow-premium-hover"
            >
              Créer votre premier client
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {clients.map((client) => (
              <div
                key={client.id}
                className="rounded-[24px] border border-subtle bg-white px-8 py-6 shadow-premium transition-all hover:shadow-premium-hover"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-tertiary">
                      Client
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-primary">
                      {client.nom || "Sans nom"}
                    </h3>
                    <div className="mt-3 grid gap-2 text-sm text-secondary md:grid-cols-2">
                      <p>
                        <span className="text-tertiary">Email :</span>{" "}
                        {client.email || "Non renseigné"}
                      </p>
                      <p>
                        <span className="text-tertiary">Téléphone :</span>{" "}
                        {client.telephone || "Non renseigné"}
                      </p>
                      <p className="md:col-span-2">
                        <span className="text-tertiary">Adresse :</span>{" "}
                        {client.adresse || "Non renseignée"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DeleteClientButton clientId={client.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



