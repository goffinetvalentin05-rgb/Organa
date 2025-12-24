"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LimitReachedAlert from "@/components/LimitReachedAlert";

export default function NouveauClientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    type: "LIMIT_REACHED" | "OTHER";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        
        // Vérifier si c'est une erreur de limite atteinte
        if (data.error === "LIMIT_REACHED") {
          setError({
            type: "LIMIT_REACHED",
            message: data.message || "Limite du plan gratuit atteinte.",
          });
          setLoading(false);
          return;
        }

        // Autre erreur
        setError({
          type: "OTHER",
          message: data.message || data.error || "Erreur lors de la création du client",
        });
        setLoading(false);
        return;
      }

      // Succès : rediriger vers la liste des clients
      router.push("/tableau-de-bord/clients");
    } catch (err) {
      setError({
        type: "OTHER",
        message: "Une erreur inattendue s'est produite",
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nouveau client</h1>
        <p className="mt-2 text-white/70">Ajouter un nouveau client</p>
      </div>

      {/* Message d'erreur pour limite atteinte */}
      {error?.type === "LIMIT_REACHED" && (
        <LimitReachedAlert message={error.message} resource="clients" />
      )}

      {/* Message d'erreur générique */}
      {error?.type === "OTHER" && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 backdrop-blur-sm">
          <p className="text-red-400">{error.message}</p>
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
              Email *
            </label>
            <input
              type="email"
              required
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
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Création..." : "Créer le client"}
          </button>
        </div>
      </form>
    </div>
  );
}





