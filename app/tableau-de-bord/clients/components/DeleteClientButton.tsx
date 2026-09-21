"use client";

import { useState } from "react";
import { Trash, Loader } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";

interface DeleteClientButtonProps {
  clientId: string;
  /** Appelé après suppression réussie pour mettre à jour la liste (page client-side). */
  onDeleted?: (clientId: string) => void;
  className?: string;
  /** Icône seule — action secondaire, plus discrète. */
  iconOnly?: boolean;
}

export default function DeleteClientButton({
  clientId,
  onDeleted,
  className,
  iconOnly = false,
}: DeleteClientButtonProps) {
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

      onDeleted?.(clientId);
    } catch (err: unknown) {
      console.error("[DeleteClientButton] Erreur lors de la suppression", err);
      alert(
        (err instanceof Error ? err.message : null) ||
          t("dashboard.clients.deleteErrorDetail")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const label = t("dashboard.clients.deleteAction");

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      title={label}
      aria-label={label}
      className={
        className ??
        "px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-red-200 shadow-sm"
      }
    >
      {isDeleting ? (
        <Loader className={iconOnly ? "h-3.5 w-3.5 animate-spin" : "h-4 w-4 animate-spin"} />
      ) : (
        <Trash className={iconOnly ? "h-3.5 w-3.5" : "h-4 w-4"} />
      )}
      {iconOnly ? null : label}
    </button>
  );
}