"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import LimitReachedAlert from "@/components/LimitReachedAlert";

interface EventType {
  id: string;
  name: string;
}

export default function NouvelEvenementPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    eventTypeId: "",
    startDate: "",
    endDate: "",
    description: "",
    status: "planned" as "planned" | "completed",
  });

  useEffect(() => {
    void loadEventTypes();
  }, []);

  const loadEventTypes = async () => {
    try {
      const response = await fetch("/api/event-types");
      if (response.ok) {
        const data = await response.json();
        setEventTypes(data?.eventTypes || []);
      }
    } catch (error) {
      console.error("Error loading event types:", error);
    }
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;
    try {
      const response = await fetch("/api/event-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTypeName.trim() }),
      });
      if (response.ok) {
        const data = await response.json();
        setEventTypes([...eventTypes, data.eventType]);
        setFormData({ ...formData, eventTypeId: data.eventType.id });
        setNewTypeName("");
        setShowNewTypeForm(false);
      }
    } catch (error) {
      console.error("Error creating type:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          status: formData.status,
          eventTypeId: formData.eventTypeId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "LIMIT_REACHED") {
          setLimitReached(true);
          setErrorMessage(data.message);
        } else {
          throw new Error(data.error || t("dashboard.events.createError"));
        }
        return;
      }

      router.push("/tableau-de-bord/evenements");
    } catch (error: any) {
      console.error("Error creating event:", error);
      setErrorMessage(error.message || t("dashboard.events.createError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Link
          href="/tableau-de-bord/evenements"
          className="text-sm text-secondary hover:text-primary transition-colors"
        >
          ← {t("dashboard.events.detail.backToList")}
        </Link>
        <h1 className="text-3xl font-bold mt-4">{t("dashboard.events.form.title")}</h1>
        <p className="mt-2 text-secondary">{t("dashboard.events.form.subtitle")}</p>
      </div>

      {limitReached && (
        <LimitReachedAlert message={t("dashboard.events.limitReached")} />
      )}

      {errorMessage && !limitReached && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-subtle bg-surface/80 p-6 space-y-6 shadow-premium">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.events.fields.name")}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t("dashboard.events.fields.namePlaceholder")}
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
          </div>

          {/* Type d'événement */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.events.fields.type")}
            </label>
            <div className="flex gap-2">
              <select
                value={formData.eventTypeId}
                onChange={(e) => setFormData({ ...formData, eventTypeId: e.target.value })}
                className="flex-1 rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              >
                <option value="">{t("dashboard.events.fields.typePlaceholder")}</option>
                {eventTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewTypeForm(!showNewTypeForm)}
                className="px-4 py-3 rounded-lg border border-subtle bg-surface-hover text-secondary hover:text-primary transition-colors text-sm"
              >
                + {t("dashboard.events.fields.createType")}
              </button>
            </div>
            {showNewTypeForm && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder={t("dashboard.events.fields.newTypeName")}
                  className="flex-1 rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
                <button
                  type="button"
                  onClick={handleCreateType}
                  className="px-4 py-2 rounded-lg accent-bg text-white font-medium"
                >
                  OK
                </button>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.events.fields.startDate")}
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.events.fields.endDate")}
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.events.fields.description")}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t("dashboard.events.fields.descriptionPlaceholder")}
              rows={4}
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            />
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.events.fields.status")}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as "planned" | "completed" })}
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            >
              <option value="planned">{t("dashboard.events.status.planned")}</option>
              <option value="completed">{t("dashboard.events.status.completed")}</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/tableau-de-bord/evenements"
            className="flex-1 px-6 py-3 rounded-lg bg-surface-hover hover:bg-surface text-primary text-center transition-all"
          >
            {t("dashboard.events.form.cancel")}
          </Link>
          <button
            type="submit"
            disabled={loading || limitReached}
            className="flex-1 px-6 py-3 rounded-lg accent-bg text-white font-medium transition-all disabled:opacity-50"
          >
            {loading ? t("dashboard.common.loading") : t("dashboard.events.form.createAction")}
          </button>
        </div>
      </form>
    </div>
  );
}
