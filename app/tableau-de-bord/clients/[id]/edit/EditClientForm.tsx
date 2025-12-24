"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
}

interface EditClientFormProps {
  clientId: string;
  initialData: Client;
}

export default function EditClientForm({
  clientId,
  initialData,
}: EditClientFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nom: initialData.nom || "",
    email: initialData.email || "",
    telephone: initialData.telephone || "",
    adresse: initialData.adresse || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérification de l'ID
    if (!clientId || typeof clientId !== "string" || clientId.trim().length === 0) {
      setError("ID du client manquant");
      return;
    }

    // Validation du nom
    if (!formData.nom || formData.nom.trim().length === 0) {
      setError("Le nom est obligatoire");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de la mise à jour du client");
      }

      // Rediriger vers la liste
      router.push("/tableau-de-bord/clients");
      router.refresh();
    } catch (err: any) {
      console.error("[EditClientForm] Erreur lors de la mise à jour", err);
      setError(err.message || "Erreur lors de la mise à jour du client");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Modifier le client</h1>
        <p className="mt-2 text-white/70">Modifier les informations du client</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Nom *
            </label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) =>
                setFormData({ ...formData, nom: e.target.value })
              }
              className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={(e) =>
                setFormData({ ...formData, telephone: e.target.value })
              }
              className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Adresse
            </label>
            <textarea
              value={formData.adresse}
              onChange={(e) =>
                setFormData({ ...formData, adresse: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/tableau-de-bord/clients"
            className="flex-1 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all text-center"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </div>
  );
}










