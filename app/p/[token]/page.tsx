"use client";

import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Plus, Users, X } from "@/lib/icons";
import {
  PUBLIC_PLANNING_CONFIRM_STORAGE_KEY,
  type PublicPlanningConfirmationPayload,
} from "@/lib/planning/publicPlanningConfirmationPayload";

interface PublicAssignment {
  id: string;
  member: {
    id: string;
    nom: string;
    email?: string;
    telephone?: string;
    status: "member" | "public";
  };
}

interface PublicSlot {
  id: string;
  location: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  requiredPeople: number;
  notes?: string | null;
  assignedCount: number;
  isFull: boolean;
  assignments: PublicAssignment[];
}

interface PublicPlanning {
  id: string;
  name: string;
  date: string;
  description?: string;
  clubName: string;
  slots: PublicSlot[];
  totalRequired: number;
  totalAssigned: number;
  isComplete: boolean;
  requireName: boolean;
  requireEmail: boolean;
}

export default function PublicPlanningPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [planning, setPlanning] = useState<PublicPlanning | null>(null);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const loadPlanning = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/plannings/${token}`, {
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Lien invalide");
      }

      const canonicalSlug =
        typeof data?.canonicalSlug === "string" ? data.canonicalSlug : null;

      setPlanning(data.planning || null);
      const nextSlug = canonicalSlug || token;
      setPublicSlug(nextSlug);

      // Si on est tombé sur un ancien token, on redirige vers l'URL canonique.
      if (canonicalSlug && canonicalSlug !== token) {
        router.replace(`/p/${canonicalSlug}`);
      }
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger le planning");
      setPlanning(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadPlanning();
  }, [loadPlanning]);

  const formatTime = (value: string) => value?.slice(0, 5) || value;

  const formatSlotDateShort = (value: string) => {
    if (!value) return "";
    const d = new Date(`${value}T12:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const planningGeneralDateLabel = useMemo(() => {
    const raw = planning?.date?.trim();
    if (!raw) return "—";
    const d = new Date(`${raw}T12:00:00`);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [planning?.date]);

  const openSignupModal = (slot: PublicSlot) => {
    if (slot.isFull) return;
    setError(null);
    setSelectedSlot(slot);
    setFormData({ name: "", email: "", phone: "" });
  };

  const closeSignupModal = () => {
    setSelectedSlot(null);
    setSubmitting(false);
  };

  const submitSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!planning || !selectedSlot) return;
    const identifier = publicSlug || token;

    if (planning.requireName && !formData.name.trim()) {
      setError("Le nom est requis.");
      return;
    }

    if (planning.requireEmail && !formData.email.trim()) {
      setError("L'email est requis.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/plannings/${identifier}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Inscription impossible");
      }

      const assignmentId =
        typeof data?.assignment?.id === "string" ? data.assignment.id : undefined;
      if (!assignmentId) {
        throw new Error("Réponse serveur incomplète (inscription).");
      }

      const confirmation = data?.confirmation as PublicPlanningConfirmationPayload | undefined;
      if (confirmation) {
        try {
          sessionStorage.setItem(
            PUBLIC_PLANNING_CONFIRM_STORAGE_KEY,
            JSON.stringify(confirmation)
          );
        } catch {
          /* optionnel : la page de confirmation charge tout via assignmentId */
        }
      }

      closeSignupModal();
      router.push(
        `/p/${identifier}/confirmation?assignmentId=${encodeURIComponent(assignmentId)}`
      );
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Erreur lors de l'inscription");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center text-slate-600">Chargement...</div>
      </div>
    );
  }

  if (error || !planning) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto rounded-xl border border-rose-200 bg-rose-50 px-6 py-4 text-rose-700">
          {error || "Lien invalide ou expiré"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{planning.name}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Cliquez sur un créneau libre pour vous inscrire.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {planningGeneralDateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {planning.clubName}
            </span>
          </div>
          <div className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700 flex flex-wrap items-center gap-3">
            <span>
              Progression: {planning.totalAssigned} / {planning.totalRequired} bénévoles
            </span>
            {planning.isComplete && (
              <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">
                Complet
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {planning.slots.map((slot) => (
            <div key={slot.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-100 p-4 sm:p-5">
                <h2 className="text-lg font-semibold text-slate-900">{slot.location}</h2>
                <div className="mt-1 text-sm text-slate-600 flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatSlotDateShort(slot.slotDate)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </span>
                  <span>{slot.assignedCount} / {slot.requiredPeople} bénévoles</span>
                  {slot.isFull && (
                    <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">
                      Complet
                    </span>
                  )}
                </div>
                {slot.notes?.trim() ? (
                  <p className="mt-2 text-sm leading-snug text-slate-600 italic">{slot.notes.trim()}</p>
                ) : null}
              </div>

              <div className="p-4 sm:p-5 flex flex-wrap gap-3">
                {slot.assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="px-4 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-900 text-sm"
                  >
                    {assignment.member.nom}
                  </div>
                ))}

                {Array.from({
                  length: Math.max(0, slot.requiredPeople - slot.assignedCount),
                }).map((_, index) => (
                  <button
                    key={`${slot.id}-empty-${index}`}
                    onClick={() => openSignupModal(slot)}
                    disabled={slot.isFull}
                    className="px-4 py-2.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Créneau libre
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSlot && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-900">Inscription bénévole</h3>
                <p className="text-sm text-slate-600">
                  {selectedSlot.location} • {formatSlotDateShort(selectedSlot.slotDate)} •{" "}
                  {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                </p>
                {selectedSlot.notes?.trim() ? (
                  <p className="mt-1 text-sm text-slate-600 italic">{selectedSlot.notes.trim()}</p>
                ) : null}
              </div>
              <button onClick={closeSignupModal} className="p-1.5 rounded hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitSignup} className="p-5 space-y-3">
              <input
                value={formData.name}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, name: event.target.value }))
                }
                placeholder={planning.requireName ? "Nom *" : "Nom"}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200"
                required={planning.requireName}
              />
              <input
                type="email"
                value={formData.email}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, email: event.target.value }))
                }
                placeholder={planning.requireEmail ? "Email *" : "Email (optionnel)"}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200"
                required={planning.requireEmail}
              />
              <input
                value={formData.phone}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="Téléphone (optionnel)"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200"
              />

              {error && (
                <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? "Inscription..." : "Je m'inscris"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
