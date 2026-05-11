"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus, Trash, Clock, MapPin, Calendar } from "@/lib/icons";
import toast from "react-hot-toast";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import {
  PageLayout,
  PageHeader,
  GlassCard,
  ActionButton,
  SectionCard,
} from "@/components/ui";

interface Event {
  id: string;
  name: string;
}

interface SlotForm {
  id: string;
  location: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  requiredPeople: number;
  notes: string;
}

const inputClass =
  "w-full rounded-xl border border-slate-200/90 bg-white/95 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60";

const compactInputClass =
  "w-full rounded-lg border border-slate-200/90 bg-white/95 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200/60";

const labelClass = "block text-sm font-medium text-slate-700 mb-2";

const compactLabelClass = "flex items-center gap-1 mb-1.5 text-xs font-medium text-slate-600";

export default function NouveauPlanningPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [eventId, setEventId] = useState("");

  const [slots, setSlots] = useState<SlotForm[]>([
    { id: "1", location: "", slotDate: "", startTime: "08:00", endTime: "10:00", requiredPeople: 1, notes: "" },
  ]);

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
      toast.error("Vous devez avoir au moins un créneau");
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
      toast.error("Le nom du planning est requis");
      return;
    }

    if (!date) {
      toast.error("La date est requise");
      return;
    }

    for (const slot of slots) {
      if (!slot.location.trim()) {
        toast.error("Chaque créneau doit avoir un lieu/poste");
        return;
      }
      if (!slot.slotDate) {
        toast.error("Chaque créneau doit avoir une date");
        return;
      }
      if (!slot.startTime || !slot.endTime) {
        toast.error("Chaque créneau doit avoir des horaires");
        return;
      }
      if (slot.startTime >= slot.endTime) {
        toast.error("L'heure de fin doit être après l'heure de début");
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch("/api/plannings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        const data = await response.json().catch(() => ({}));
        if (data.error === "LIMIT_REACHED") {
          toast.error(data.message || "Limite de plannings atteinte");
        } else {
          throw new Error(data.error || "Erreur lors de la création");
        }
        return;
      }

      const data = await response.json();
      toast.success("Planning créé avec succès !");
      router.push(`/tableau-de-bord/plannings/${data.planning.id}`);
    } catch (error: any) {
      console.error("[NouveauPlanning] Erreur:", error);
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
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
                className="rounded-xl border border-slate-200/70 bg-white/90 p-4 shadow-sm transition-colors hover:bg-white"
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
            disabled={loading}
            icon="none"
            className="w-full justify-center rounded-xl px-8 sm:w-auto"
          >
            {loading ? (
              t("dashboard.plannings.form.creating")
            ) : (
              <span className="flex items-center gap-2">
                {t("dashboard.plannings.form.createAction")}
                <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </DashboardPrimaryButton>
        </div>
      </form>
    </PageLayout>
  );
}
