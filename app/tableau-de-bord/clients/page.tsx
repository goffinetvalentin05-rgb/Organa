import Link from "next/link";
import DeleteClientButton from "./components/DeleteClientButton";
import { Info, Plus, Users } from "@/lib/icons";
import { createClient } from "@/lib/supabase/server";
import I18nText from "@/components/I18nText";

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.id) {
      return (
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 rounded-2xl border border-red-200 p-8 text-center">
            <p className="text-red-600 font-medium">
              <I18nText id="dashboard.clients.authError" />
            </p>
          </div>
        </div>
      );
    }

    const { data, error } = await supabase
      .from("clients")
      .select("id, nom, email, telephone, adresse, user_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ClientsPage] Erreur Supabase", error);
      errorMessage = error.message || null;
    } else {
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
    errorMessage = error.message || null;
  }

  if (errorMessage && clients.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 rounded-2xl border border-red-200 p-8 text-center">
          <p className="text-red-600 font-medium mb-2">
            <I18nText id="dashboard.clients.loadError" />
          </p>
          {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            <I18nText id="dashboard.clients.title" />
          </h1>
          <p className="mt-1 text-slate-500">
            <I18nText id="dashboard.clients.subtitle" />
          </p>
        </div>
        <Link
          href="/tableau-de-bord/clients/nouveau"
          className="btn-obillz"
        >
          <Plus className="w-5 h-5" />
          <I18nText id="dashboard.clients.newClient" />
        </Link>
      </div>

      {/* Message informatif */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-amber-900">
              <I18nText id="dashboard.clients.editDisabledTitle" />
            </p>
            <p className="text-sm text-amber-700 mt-1">
              <I18nText id="dashboard.clients.editDisabledText" />
            </p>
          </div>
        </div>
      </div>

      {/* Liste des clients */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {clients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-4">
              <I18nText id="dashboard.clients.emptyState" />
            </p>
            <Link
              href="/tableau-de-bord/clients/nouveau"
              className="btn-obillz inline-flex"
            >
              <Plus className="w-5 h-5" />
              <I18nText id="dashboard.clients.emptyCta" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {clients.map((client, index) => (
              <div
                key={client.id}
                className="p-5 md:p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                      style={{ backgroundColor: "var(--obillz-hero-blue)" }}
                    >
                      {(client.nom || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {client.nom || <I18nText id="dashboard.clients.noName" />}
                      </h3>
                      <div className="mt-2 grid gap-1 text-sm">
                        <p className="text-slate-500 flex items-center gap-2">
                          <span className="text-slate-400 w-16 shrink-0">Email</span>
                          <span className="truncate">{client.email || <I18nText id="dashboard.clients.notProvided" />}</span>
                        </p>
                        <p className="text-slate-500 flex items-center gap-2">
                          <span className="text-slate-400 w-16 shrink-0">Tél.</span>
                          <span>{client.telephone || <I18nText id="dashboard.clients.notProvided" />}</span>
                        </p>
                        <p className="text-slate-500 flex items-center gap-2">
                          <span className="text-slate-400 w-16 shrink-0">Adresse</span>
                          <span className="truncate">{client.adresse || <I18nText id="dashboard.clients.addressNotProvided" />}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:ml-4">
                    <DeleteClientButton clientId={client.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer avec compteur */}
      {clients.length > 0 && (
        <div className="text-center text-sm text-slate-400">
          {clients.length} client{clients.length > 1 ? "s" : ""} au total
        </div>
      )}
    </div>
  );
}
