"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

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
  const { t } = useI18n();
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
      setError(t("dashboard.clients.errors.missingId"));
      return;
    }

    // Validation du nom
    if (!formData.nom || formData.nom.trim().length === 0) {
      setError(t("dashboard.clients.errors.nameRequired"));
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
        throw new Error(errorData.error || t("dashboard.clients.errors.updateError"));
      }

      // Rediriger vers la liste
      router.push("/tableau-de-bord/clients");
      router.refresh();
    } catch (err: any) {
      console.error("[EditClientForm] Erreur lors de la mise à jour", err);
      setError(err.message || t("dashboard.clients.errors.updateError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.clients.editTitle")}</h1>
        <p className="mt-2 text-secondary">{t("dashboard.clients.editSubtitle")}</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-500/50 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-subtle bg-surface p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.clients.fields.name")}
            </label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) =>
                setFormData({ ...formData, nom: e.target.value })
              }
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.clients.fields.emailOptional")}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.clients.fields.phone")}
            </label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={(e) =>
                setFormData({ ...formData, telephone: e.target.value })
              }
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.clients.fields.address")}
            </label>
            <textarea
              value={formData.adresse}
              onChange={(e) =>
                setFormData({ ...formData, adresse: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/tableau-de-bord/clients"
            className="flex-1 px-6 py-3 rounded-lg bg-surface-hover hover:bg-surface text-primary transition-all text-center"
          >
            {t("dashboard.common.cancel")}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-6 py-3 rounded-lg accent-bg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t("dashboard.common.saving") : t("dashboard.clients.saveChanges")}
          </button>
        </div>
      </form>
    </div>
  );
}






























