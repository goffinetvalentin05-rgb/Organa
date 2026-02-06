"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LimitReachedAlert from "@/components/LimitReachedAlert";
import { useI18n } from "@/components/I18nProvider";
import { ArrowRight, Users } from "@/lib/icons";

export default function NouveauClientPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    postal_code: "",
    city: "",
    role: "player",
    category: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    type: "LIMIT_REACHED" | "OTHER";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation front-end : le nom est obligatoire et ne peut pas être vide
    const trimmedNom = formData.nom.trim();
    if (!trimmedNom) {
      setError({
        type: "OTHER",
        message: t("dashboard.clients.nameRequired") || "Le nom est obligatoire",
      });
      return;
    }

    setLoading(true);

    // Préparer les données avec trim() sur les champs texte
    const dataToSend = {
      ...formData,
      nom: trimmedNom,
      adresse: formData.adresse.trim() || "",
      postal_code: formData.postal_code.trim() || "",
      city: formData.city.trim() || "",
    };

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        
        if (data.error === "LIMIT_REACHED") {
          setError({
            type: "LIMIT_REACHED",
            message: data.message || t("dashboard.clients.limitReached"),
          });
          setLoading(false);
          return;
        }

        setError({
          type: "OTHER",
          message: data.message || data.error || t("dashboard.clients.createError"),
        });
        setLoading(false);
        return;
      }

      router.push("/tableau-de-bord/clients");
    } catch (err) {
      setError({
        type: "OTHER",
        message: t("dashboard.common.unexpectedError"),
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/tableau-de-bord/clients" className="text-slate-500 hover:text-slate-700 transition-colors">
          Clients
        </Link>
        <span className="text-slate-400">/</span>
        <span className="text-slate-900 font-medium">Nouveau</span>
      </div>

      {/* En-tête */}
      <div className="flex items-start gap-4">
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "var(--obillz-blue-light)" }}
        >
          <Users className="w-7 h-7 text-[var(--obillz-hero-blue)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("dashboard.clients.newTitle")}</h1>
          <p className="mt-1 text-slate-500">{t("dashboard.clients.newSubtitle")}</p>
        </div>
      </div>

      {/* Message d'erreur pour limite atteinte */}
      {error?.type === "LIMIT_REACHED" && (
        <LimitReachedAlert message={error.message} resource="clients" />
      )}

      {/* Message d'erreur générique */}
      {error?.type === "OTHER" && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <p className="text-red-700 text-sm">{error.message}</p>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("dashboard.clients.fields.name")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Nom du client ou de l'entreprise"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="input-obillz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("dashboard.clients.fields.email")} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="email@exemple.com"
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
              placeholder="+41 79 123 45 67"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              className="input-obillz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("dashboard.clients.fields.address")}
            </label>
            <textarea
              placeholder="Adresse complète"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              rows={3}
              className="input-obillz resize-none"
            />
          </div>

          {/* Code postal et Localité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Code postal
              </label>
              <input
                type="text"
                placeholder="1000"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                className="input-obillz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Localité
              </label>
              <input
                type="text"
                placeholder="Lausanne"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input-obillz"
              />
            </div>
          </div>

          {/* Rôle et Catégorie */}
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
                <option value="volunteer">{t("dashboard.clients.roles.volunteer")}</option>
                <option value="staff">{t("dashboard.clients.roles.staff")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("dashboard.clients.fields.category")}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-obillz"
              >
                <option value="">{t("dashboard.clients.filters.allCategories")}</option>
                <option value="first_team">{t("dashboard.clients.categories.first_team")}</option>
                <option value="second_team">{t("dashboard.clients.categories.second_team")}</option>
                <option value="junior">{t("dashboard.clients.categories.junior")}</option>
                <option value="president">{t("dashboard.clients.categories.president")}</option>
                <option value="treasurer">{t("dashboard.clients.categories.treasurer")}</option>
                <option value="secretary">{t("dashboard.clients.categories.secretary")}</option>
                <option value="other">{t("dashboard.clients.categories.other")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-all"
          >
            {t("dashboard.common.cancel")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-obillz justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t("dashboard.clients.creating")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {t("dashboard.clients.createAction")}
                <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
