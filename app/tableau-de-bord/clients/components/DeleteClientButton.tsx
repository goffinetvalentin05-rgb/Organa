"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteClientButtonProps {
  clientId: string;
}

export default function DeleteClientButton({ clientId }: DeleteClientButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    // Garde de sécurité : vérifier que l'ID existe
    if (!clientId || typeof clientId !== "string" || clientId.trim().length === 0) {
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      // Rafraîchir pour recharger les données depuis la DB
      router.refresh();
    } catch (err: any) {
      console.error("[DeleteClientButton] Erreur lors de la suppression", err);
      alert(err.message || "Erreur lors de la suppression du client");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDeleting ? "..." : "🗑️ Supprimer"}
    </button>
  );
}













