"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus, Trash, Clock, MapPin } from "@/lib/icons";
import toast from "react-hot-toast";

interface Event {
  id: string;
  name: string;
  start_date: string;
}

interface SlotForm {
  id: string;
  location: string;
  startTime: string;
  endTime: string;
  requiredPeople: number;
  notes: string;
}

export default function NouveauPlanningPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Formulaire principal
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [eventId, setEventId] = useState("");

  // Créneaux
  const [slots, setSlots] = useState<SlotForm[]>([
    { id: "1", location: "", startTime: "08:00", endTime: "10:00", requiredPeople: 1, notes: "" },
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
    setSlots([
      ...slots,
      { id: newId, location: "", startTime: "08:00", endTime: "10:00", requiredPeople: 1, notes: "" },
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

    // Valider les créneaux
    for (const slot of slots) {
      if (!slot.location.trim()) {
        toast.error("Chaque créneau doit avoir un lieu/poste");
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

  // Pré-remplir la date si un événement est sélectionné
  const handleEventChange = (value: string) => {
    setEventId(value);
    if (value) {
      const selectedEvent = events.find((e) => e.id === value);
      if (selectedEvent && !date) {
        setDate(selectedEvent.start_date);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nouveau planning</h1>
          <p className="mt-2 text-secondary">
            Créez un planning et définissez vos créneaux horaires
          </p>
        </div>
        <Link
          href="/tableau-de-bord/plannings"
          className="text-secondary hover:text-primary transition-colors"
        >
          Retour aux plannings
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations générales */}
        <div className="rounded-2xl border border-subtle bg-surface/80 p-6 shadow-premium">
          <h2 className="text-xl font-semibold mb-6">Informations générales</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Nom du planning *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Bénévoles match du samedi"
                className="w-full px-4 py-3 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Lié à un événement (optionnel)
              </label>
              <select
                value={eventId}
                onChange={(e) => handleEventChange(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all"
                disabled={loadingEvents}
              >
                <option value="">Aucun événement</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({new Date(event.start_date).toLocaleDateString("fr-FR")})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Description (optionnelle)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Organisation de la buvette"
                className="w-full px-4 py-3 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Créneaux horaires */}
        <div className="rounded-2xl border border-subtle bg-surface/80 p-6 shadow-premium">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Créneaux horaires</h2>
            <button
              type="button"
              onClick={addSlot}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un créneau
            </button>
          </div>

          <div className="space-y-4">
            {slots.map((slot, index) => (
              <div
                key={slot.id}
                className="rounded-xl border border-subtle bg-surface/60 p-4 hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-tertiary">Créneau {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeSlot(slot.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer ce créneau"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-secondary mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Lieu / Poste *
                    </label>
                    <input
                      type="text"
                      value={slot.location}
                      onChange={(e) => updateSlot(slot.id, "location", e.target.value)}
                      placeholder="Ex: Bar, Entrée, Cuisine..."
                      className="w-full px-3 py-2 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Début *
                    </label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(slot.id, "startTime", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Fin *
                    </label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(slot.id, "endTime", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1.5">
                      Nb personnes *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={slot.requiredPeople}
                      onChange={(e) => updateSlot(slot.id, "requiredPeople", parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-secondary mb-1.5">
                    Notes (optionnel)
                  </label>
                  <input
                    type="text"
                    value={slot.notes}
                    onChange={(e) => updateSlot(slot.id, "notes", e.target.value)}
                    placeholder="Instructions particulières..."
                    className="w-full px-3 py-2 rounded-lg border border-subtle bg-white focus:border-accent-border focus:ring-2 focus:ring-accent-border/20 transition-all text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Résumé */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary">
                <strong>{slots.length}</strong> créneau{slots.length > 1 ? "x" : ""} défini{slots.length > 1 ? "s" : ""}
              </span>
              <span className="text-secondary">
                <strong>{slots.reduce((sum, s) => sum + s.requiredPeople, 0)}</strong> personne{slots.reduce((sum, s) => sum + s.requiredPeople, 0) > 1 ? "s" : ""} requise{slots.reduce((sum, s) => sum + s.requiredPeople, 0) > 1 ? "s" : ""} au total
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/tableau-de-bord/plannings"
            className="px-6 py-3 text-secondary hover:text-primary transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 accent-bg text-white font-medium rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              "Création..."
            ) : (
              <>
                Créer le planning
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
