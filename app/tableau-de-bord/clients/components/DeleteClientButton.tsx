"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash, Loader } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";

interface DeleteClientButtonProps {
  clientId: string;
}

export default function DeleteClientButton({ clientId }: DeleteClientButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useI18n();

  const handleDelete = async () => {
    // Garde de sécurité : vérifier que l'ID existe
    if (!clientId || typeof clientId !== "string" || clientId.trim().length === 0) {
      return;
    }

    if (!confirm(t("dashboard.clients.deleteConfirm"))) {
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || t("dashboard.clients.deleteError"));
      }

      // Rafraîchir pour recharger les données depuis la DB
      router.refresh();
    } catch (err: any) {
      console.error("[DeleteClientButton] Erreur lors de la suppression", err);
      alert(err.message || t("dashboard.clients.deleteErrorDetail"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-red-200 shadow-sm"
    >
      {isDeleting ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : (
        <Trash className="w-4 h-4" />
      )}
      {t("dashboard.clients.deleteAction")}
    </button>
  );
}





















