"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LimitReachedAlert from "@/components/LimitReachedAlert";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import { ArrowRight, Users } from "@/lib/icons";

interface ClientFormData {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  postal_code: string;
  city: string;
  role: string;
  category: string;
}

interface EditClientFormProps {
  clientId: string;
  initialData: ClientFormData;
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
    postal_code: initialData.postal_code || "",
    city: initialData.city || "",
    role: initialData.role || "player",
    category: initialData.category || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{
    type: "LIMIT_REACHED" | "OTHER";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId || typeof clientId !== "string" || clientId.trim().length === 0) {
      setError({
        type: "OTHER",
        message: t("dashboard.clients.errors.missingId"),
      });
      return;
    }

    const trimmedNom = formData.nom.trim();
    if (!trimmedNom) {
      setError({
        type: "OTHER",
        message: t("dashboard.clients.errors.nameRequired"),
      });
      return;
    }

    setSaving(true);
    setError(null);

    const dataToSend = {
      nom: trimmedNom,
      email: formData.email.trim(),
      telephone: formData.telephone.trim(),
      adresse: formData.adresse.trim(),
      postal_code: formData.postal_code.trim(),
      city: formData.city.trim(),
      role: formData.role,
      category: formData.category.trim() || null,
    };

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.error === "SUBSCRIPTION_REQUIRED") {
          setError({
            type: "LIMIT_REACHED",
            message: data.message || t("dashboard.clients.limitReached"),
          });
          setSaving(false);
          return;
        }
        setError({
          type: "OTHER",
          message: data.message || data.error || t("dashboard.clients.errors.updateError"),
        });
        setSaving(false);
        return;
      }

      router.push("/tableau-de-bord/clients");
    } catch {
      setError({
        type: "OTHER",
        message: t("dashboard.common.unexpectedError"),
      });
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/tableau-de-bord/clients"
          className="text-slate-500 hover:text-slate-700 transition-colors"
        >
          {t("dashboard.pageTitles.clients")}
        </Link>
        <span className="text-slate-400">/</span>
        <span className="text-slate-900 font-medium">
          {t("dashboard.pageTitles.editClient")}
        </span>
      </div>

      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--obillz-blue-light)" }}
        >
          <Users className="w-7 h-7 text-[var(--obillz-hero-blue)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("dashboard.clients.editTitle")}
          </h1>
          <p className="mt-1 text-slate-500">{t("dashboard.clients.editSubtitle")}</p>
        </div>
      </div>

      {error?.type === "LIMIT_REACHED" && (
        <LimitReachedAlert message={error.message} resource="clients" />
      )}

      {error?.type === "OTHER" && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <p className="text-red-700 text-sm">{error.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("dashboard.clients.fields.name")}
            </label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="input-obillz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("dashboard.clients.fields.email")}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-obillz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("dashboard.clients.fields.phone")}
            </label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={(e) =>
                setFormData({ ...formData, telephone: e.target.value })
              }
              className="input-obillz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("dashboard.clients.fields.address")}
            </label>
            <textarea
              value={formData.adresse}
              onChange={(e) =>
                setFormData({ ...formData, adresse: e.target.value })
              }
              rows={3}
              className="input-obillz resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Code postal
              </label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) =>
                  setFormData({ ...formData, postal_code: e.target.value })
                }
                className="input-obillz"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Localité
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input-obillz"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("dashboard.clients.fields.role")}
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input-obillz"
              >
                <option value="player">{t("dashboard.clients.roles.player")}</option>
                <option value="coach">{t("dashboard.clients.roles.coach")}</option>
                <option value="volunteer">
                  {t("dashboard.clients.roles.volunteer")}
                </option>
                <option value="staff">{t("dashboard.clients.roles.staff")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("dashboard.clients.fields.category")}
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="input-obillz"
              >
                <option value="">{t("dashboard.clients.filters.allCategories")}</option>
                <option value="first_team">
                  {t("dashboard.clients.categories.first_team")}
                </option>
                <option value="second_team">
                  {t("dashboard.clients.categories.second_team")}
                </option>
                <option value="junior">{t("dashboard.clients.categories.junior")}</option>
                <option value="president">
                  {t("dashboard.clients.categories.president")}
                </option>
                <option value="treasurer">
                  {t("dashboard.clients.categories.treasurer")}
                </option>
                <option value="secretary">
                  {t("dashboard.clients.categories.secretary")}
                </option>
                <option value="other">{t("dashboard.clients.categories.other")}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-all"
          >
            {t("dashboard.common.cancel")}
          </button>
          <DashboardPrimaryButton
            type="submit"
            disabled={saving}
            icon="none"
            className="flex-1 justify-center"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t("dashboard.common.saving")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {t("dashboard.clients.saveChanges")}
                <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </DashboardPrimaryButton>
        </div>
      </form>
    </div>
  );
}
