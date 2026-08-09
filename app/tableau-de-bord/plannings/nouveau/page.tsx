"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus, Trash, Clock, MapPin, Calendar } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import SubmittingOverlay from "@/components/SubmittingOverlay";
import DraftAutosaveHint from "@/components/DraftAutosaveHint";
import { useSafeSubmit } from "@/hooks/useSafeSubmit";
import { useAutoDraft } from "@/hooks/useAutoDraft";
import { idempotentFetch } from "@/lib/api/idempotentFetch";
import { notifyError, notifySuccess } from "@/lib/notify";
import { usePermissions } from "@/lib/auth/permissions-client";
import {
  createDefaultPlanningSlots,
  emptyPlanningCreateDraftData,
  planningCreateDraftStore,
  type PlanningCreateDraftData,
  type PlanningCreateDraftSlot,
} from "@/lib/planning/planningCreateDraft";
import {
  PageLayout,
  PageHeader,
  GlassCard,
  ActionButton,
  SectionCard,
  dashboardInputClass,
  dashboardInputSmClass,
  dashboardLabelClass,
  dashboardInnerPanelClass,
} from "@/components/ui";
import { getSlotTimeRangeError, isOvernightSlot } from "@/lib/planning/slotTimeRange";

interface Event {
  id: string;
  name: string;
}

type SlotForm = PlanningCreateDraftSlot;

const inputClass = dashboardInputClass;

const compactInputClass = dashboardInputSmClass;

const labelClass = `${dashboardLabelClass} mb-2`;

const compactLabelClass = "mb-1.5 flex items-center gap-1 text-xs font-medium text-white/65";

export default function NouveauPlanningPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { clubId, loading: clubLoading } = usePermissions();
  const { isSubmitting, showOverlay, run } = useSafeSubmit({ overlayDelayMs: 450 });
  const [createSuccess, setCreateSuccess] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [eventId, setEventId] = useState("");

  const [slots, setSlots] = useState<SlotForm[]>(() => createDefaultPlanningSlots());

  const draftData = useMemo<PlanningCreateDraftData>(
    () => ({ name, description, date, eventId, slots }),
    [name, description, date, eventId, slots]
  );

  const applyDraftData = useCallback((data: PlanningCreateDraftData) => {
    setName(data.name);
    setDescription(data.description);
    setDate(data.date);
    setEventId(data.eventId);
    setSlots(data.slots.length > 0 ? data.slots : createDefaultPlanningSlots());
  }, []);

  const resetDraftForm = useCallback(() => {
    applyDraftData(emptyPlanningCreateDraftData());
  }, [applyDraftData]);

  const { clearDraft, showDraftStatus, draftStatusLabel } = useAutoDraft({
    store: planningCreateDraftStore,
    clubId,
    clubLoading,
    data: draftData,
    onRestore: applyDraftData,
    onEmpty: resetDraftForm,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch("/api/events", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setEvents(data?.events || []);
      }
    } catch (error) {
      console.error("[NouveauPlanning] Erreur chargement événements:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const addSlot = () => {
    const newId = String(Date.now());
    const defaultDate = date || "";
    setSlots([
      ...slots,
      {
        id: newId,
        location: "",
        slotDate: defaultDate,
        startTime: "08:00",
        endTime: "10:00",
        requiredPeople: 1,
        notes: "",
      },
    ]);
  };

  const removeSlot = (id: string) => {
    if (slots.length <= 1) {
      notifyError("Vous devez avoir au moins un créneau", "planning-create");
      return;
    }
    setSlots(slots.filter((s) => s.id !== id));
  };

  const updateSlot = (id: string, field: keyof SlotForm, value: string | number) => {
    setSlots(slots.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      notifyError("Le nom du planning est requis", "planning-create");
      return;
    }

    if (!date) {
      notifyError("La date est requise", "planning-create");
      return;
    }

    for (const slot of slots) {
      if (!slot.location.trim()) {
        notifyError("Chaque créneau doit avoir un lieu/poste", "planning-create");
        return;
      }
      if (!slot.slotDate) {
        notifyError("Chaque créneau doit avoir une date", "planning-create");
        return;
      }
      const timeError = getSlotTimeRangeError(slot.startTime, slot.endTime);
      if (timeError) {
        notifyError(timeError, "planning-create");
        return;
      }
    }

    if (isSubmitting) return;
    await run(async (idempotencyKey) => {
      const response = await idempotentFetch("/api/plannings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        idempotencyKey,
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          date,
          eventId: eventId || null,
          slots: slots.map((s) => ({
            location: s.location.trim(),
            slotDate: s.slotDate,
            startTime: s.startTime,
            endTime: s.endTime,
            requiredPeople: s.requiredPeople,
            notes: s.notes.trim() || null,
          })),
        }),
      });

      if (!response.ok) {
        // Ne jamais supprimer le brouillon sur erreur API.
        const data = await response.json().catch(() => ({}));
        if (data.error === "LIMIT_REACHED") {
          notifyError(data.message || "Limite de plannings atteinte", "planning-create");
          return;
        }
        notifyError(data.error || "Erreur lors de la création", "planning-create");
        return;
      }

      const data = await response.json();
      const createdId =
        typeof data?.planning?.id === "string" ? data.planning.id : null;
      if (!createdId) {
        notifyError("Création incomplète — votre brouillon est conservé", "planning-create");
        return;
      }

      // Succès confirmé uniquement : effacer le brouillon du club, puis naviguer.
      clearDraft();
      setCreateSuccess(true);
      notifySuccess("Planning créé avec succès ✓", "planning-create");
      setTimeout(() => setCreateSuccess(false), 2000);

      router.replace(`/tableau-de-bord/plannings/${createdId}`);
    });
  };

  const handleEventChange = (value: string) => {
    setEventId(value);
    if (value) {
      const selectedEvent = events.find((e) => e.id === value);
      if (selectedEvent && !date) {
        const evDate = ((selectedEvent as Event & { start_date?: string }).start_date || "").slice(0, 10);
        if (evDate) {
          setDate(evDate);
          setSlots((prev) =>
            prev.map((s) => (!s.slotDate ? { ...s, slotDate: evDate } : s))
          );
        }
      }
    }
  };

  useEffect(() => {
    if (!date) return;
    setSlots((prev) =>
      prev.map((s) => (!s.slotDate ? { ...s, slotDate: date } : s))
    );
  }, [date]);

  return (
    <>
      <SubmittingOverlay visible={showOverlay} message="Création en cours…" />
      <PageLayout maxWidth="5xl">
        <div>
        <Link
          href="/tableau-de-bord/plannings"
          className="inline-flex items-center gap-1 text-sm font-medium text-white/85 hover:text-white transition-colors"
        >
          ← Retour aux plannings
        </Link>
        </div>

      <PageHeader
        title="Nouveau planning"
        subtitle="Créez un planning et définissez vos créneaux horaires"
      />

      <DraftAutosaveHint show={showDraftStatus} label={draftStatusLabel} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <SectionCard title="Informations générales" icon={Calendar}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Nom du planning *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Bénévoles match du samedi"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Lié à un événement (optionnel)</label>
              <select
                value={eventId}
                onChange={(e) => handleEventChange(e.target.value)}
                className={inputClass}
                disabled={loadingEvents}
              >
                <option value="">Aucun événement</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Description (optionnelle)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Organisation de la buvette"
                className={inputClass}
              />
            </div>
          </div>
        </SectionCard>

        {/* Créneaux horaires */}
        <SectionCard
          title={t("dashboard.plannings.form.slotsSection")}
          icon={Clock}
          headerRight={
            <ActionButton type="button" onClick={addSlot} className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t("dashboard.plannings.form.addSlot")}
            </ActionButton>
          }
        >
          <div className="space-y-4">
            {slots.map((slot, index) => (
              <div
                key={slot.id}
                className={`${dashboardInnerPanelClass} p-4 transition-colors hover:border-blue-400/25 hover:bg-white/[0.08]`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-slate-700">Créneau {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeSlot(slot.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer ce créneau"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="lg:col-span-2">
                    <label className={compactLabelClass}>
                      <MapPin className="w-3 h-3" />
                      Lieu / Poste *
                    </label>
                    <input
                      type="text"
                      value={slot.location}
                      onChange={(e) => updateSlot(slot.id, "location", e.target.value)}
                      placeholder="Ex: Bar, Entrée, Cuisine..."
                      className={compactInputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={compactLabelClass}>
                      <Calendar className="w-3 h-3" />
                      Date *
                    </label>
                    <input
                      type="date"
                      value={slot.slotDate}
                      onChange={(e) => updateSlot(slot.id, "slotDate", e.target.value)}
                      className={compactInputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={compactLabelClass}>
                      <Clock className="w-3 h-3" />
                      Début *
                    </label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(slot.id, "startTime", e.target.value)}
                      className={compactInputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={compactLabelClass}>
                      <Clock className="w-3 h-3" />
                      Fin *
                    </label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(slot.id, "endTime", e.target.value)}
                      className={compactInputClass}
                      required
                    />
                    {isOvernightSlot(slot.startTime, slot.endTime) && (
                      <p className="mt-1 text-xs text-white/50">
                        Ce créneau se termine le lendemain.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={compactLabelClass}>Nb personnes *</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={slot.requiredPeople}
                      onChange={(e) => updateSlot(slot.id, "requiredPeople", parseInt(e.target.value) || 1)}
                      className={compactInputClass}
                      required
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Notes (optionnel)
                  </label>
                  <input
                    type="text"
                    value={slot.notes}
                    onChange={(e) => updateSlot(slot.id, "notes", e.target.value)}
                    placeholder="Instructions particulières..."
                    className={compactInputClass}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Résumé */}
          <GlassCard padding="sm" className="mt-2 bg-gradient-to-br from-blue-50/80 via-white/95 to-indigo-50/70">
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-700">
                <strong className="text-slate-900">{slots.length}</strong> créneau{slots.length > 1 ? "x" : ""} défini{slots.length > 1 ? "s" : ""}
              </span>
              <span className="text-slate-700">
                <strong className="text-slate-900">{slots.reduce((sum, s) => sum + s.requiredPeople, 0)}</strong>{" "}
                personne{slots.reduce((sum, s) => sum + s.requiredPeople, 0) > 1 ? "s" : ""} requise
                {slots.reduce((sum, s) => sum + s.requiredPeople, 0) > 1 ? "s" : ""} au total
              </span>
            </div>
          </GlassCard>
        </SectionCard>

        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
          <ActionButton href="/tableau-de-bord/plannings" className="w-full justify-center sm:w-auto">
            {t("dashboard.plannings.form.cancel")}
          </ActionButton>
          <DashboardPrimaryButton
            type="submit"
            icon="none"
            loading={isSubmitting}
            loadingLabel={t("dashboard.plannings.form.creating")}
            success={createSuccess}
            successLabel="Planning créé ✓"
            className="w-full justify-center rounded-xl px-8 sm:w-auto"
          >
            <span className="flex items-center gap-2">
              {t("dashboard.plannings.form.createAction")}
              <ArrowRight className="w-5 h-5" />
            </span>
          </DashboardPrimaryButton>
        </div>
      </form>
      </PageLayout>
    </>
  );
}
