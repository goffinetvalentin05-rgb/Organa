"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import LimitReachedAlert from "@/components/LimitReachedAlert";
import {
  PageLayout,
  PageHeader,
  GlassCard,
  ActionButton,
} from "@/components/ui";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";

interface EventType {
  id: string;
  name: string;
}

const inputClass =
  "w-full rounded-xl border border-slate-200/90 bg-white/95 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60";

const labelClass = "block text-sm font-medium text-slate-700 mb-2";

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
    <PageLayout maxWidth="4xl">
      <div>
        <Link
          href="/tableau-de-bord/evenements"
          className="inline-flex items-center gap-1 text-sm font-medium text-white/85 hover:text-white transition-colors"
        >
          ← {t("dashboard.events.detail.backToList")}
        </Link>
      </div>

      <PageHeader
        title={t("dashboard.events.form.title")}
        subtitle={t("dashboard.events.form.subtitle")}
      />

      {limitReached && <LimitReachedAlert message={t("dashboard.events.limitReached")} />}

      {errorMessage && !limitReached && (
        <GlassCard padding="md" className="border-red-200/80 bg-red-50/70">
          <p className="text-sm font-medium text-red-700">{errorMessage}</p>
        </GlassCard>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard padding="lg">
          <div className="space-y-6">
            <div>
              <label className={labelClass}>{t("dashboard.events.fields.name")}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("dashboard.events.fields.namePlaceholder")}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>{t("dashboard.events.fields.type")}</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={formData.eventTypeId}
                  onChange={(e) => setFormData({ ...formData, eventTypeId: e.target.value })}
                  className={`${inputClass} flex-1`}
                >
                  <option value="">{t("dashboard.events.fields.typePlaceholder")}</option>
                  {eventTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <ActionButton
                  type="button"
                  onClick={() => setShowNewTypeForm(!showNewTypeForm)}
                  className="shrink-0 justify-center"
                >
                  + {t("dashboard.events.fields.createType")}
                </ActionButton>
              </div>
              {showNewTypeForm && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder={t("dashboard.events.fields.newTypeName")}
                    className={`${inputClass} flex-1`}
                  />
                  <DashboardPrimaryButton
                    type="button"
                    onClick={handleCreateType}
                    icon="none"
                    className="shrink-0 rounded-xl"
                  >
                    OK
                  </DashboardPrimaryButton>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t("dashboard.events.fields.startDate")}</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t("dashboard.events.fields.endDate")}</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>{t("dashboard.events.fields.description")}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("dashboard.events.fields.descriptionPlaceholder")}
                rows={4}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>{t("dashboard.events.fields.status")}</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as "planned" | "completed" })
                }
                className={inputClass}
              >
                <option value="planned">{t("dashboard.events.status.planned")}</option>
                <option value="completed">{t("dashboard.events.status.completed")}</option>
              </select>
            </div>
          </div>
        </GlassCard>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <ActionButton href="/tableau-de-bord/evenements" className="flex-1 justify-center">
            {t("dashboard.events.form.cancel")}
          </ActionButton>
          <DashboardPrimaryButton
            type="submit"
            disabled={loading || limitReached}
            icon="none"
            className="flex-1 justify-center rounded-xl"
          >
            {loading ? t("dashboard.common.loading") : t("dashboard.events.form.createAction")}
          </DashboardPrimaryButton>
        </div>
      </form>
    </PageLayout>
  );
}
