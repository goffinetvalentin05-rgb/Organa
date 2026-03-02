"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { buildMonthGrid } from "@/lib/buvette/calendar";

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function PublicBuvettePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [month, setMonth] = useState(currentMonthKey());
  const [clubName, setClubName] = useState("Club");
  const [clubLogoUrl, setClubLogoUrl] = useState<string | null>(null);
  const [clubColor, setClubColor] = useState("#1d4ed8");
  const [days, setDays] = useState<Record<string, "available" | "occupied" | "reserved">>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    eventType: "",
    message: "",
  });

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Erreur";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clubRes, calendarRes] = await Promise.all([
        fetch(`/api/public/buvette/${slug}`, { cache: "no-store" }),
        fetch(`/api/public/buvette/${slug}/calendar?month=${month}`, { cache: "no-store" }),
      ]);
      if (!clubRes.ok) throw new Error("Club introuvable");
      if (!calendarRes.ok) throw new Error("Impossible de charger le calendrier");
      const clubData = await clubRes.json();
      const calendarData = await calendarRes.json();
      setClubName(clubData.clubName || "Club");
      setClubLogoUrl(clubData.logoUrl || null);
      setClubColor(clubData.primaryColor || "#1d4ed8");
      setDays(calendarData.days || {});
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [month, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const grid = useMemo(() => buildMonthGrid(month), [month]);
  const hasAvailableDates = useMemo(
    () =>
      grid.some((week) =>
        week.some((date) => {
          if (!date) return false;
          const status = days[date] || "available";
          return status === "available";
        })
      ),
    [days, grid]
  );

  const goMonth = (delta: number) => {
    const [year, monthNum] = month.split("-").map(Number);
    const next = new Date(year, monthNum - 1 + delta, 1);
    setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
    setSelectedDate(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.eventType) {
      setError("Merci de remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/public/buvette/${slug}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          ...formData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'envoi");

      setMessage("Demande envoyée. Vous allez recevoir un email de confirmation.");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        eventType: "",
        message: "",
      });
      setSelectedDate(null);
      await load();
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !clubName) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          {clubLogoUrl ? (
            <Image
              src={clubLogoUrl}
              alt={`Logo ${clubName}`}
              width={64}
              height={64}
              className="w-16 h-16 object-cover rounded-full mx-auto mb-3 border border-slate-200"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: clubColor }}
            >
              {clubName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Réservation de buvette</h1>
          <p className="text-slate-600 mt-2">{clubName}</p>
        </div>

        {loading && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-500 text-sm">
            Chargement du calendrier...
          </div>
        )}
        {message && <div className="rounded-lg bg-emerald-50 text-emerald-700 px-4 py-3">{message}</div>}
        {error && <div className="rounded-lg bg-rose-50 text-rose-700 px-4 py-3">{error}</div>}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3 text-xs sm:text-sm mb-3 text-slate-700">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Disponible</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Occupée</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Réservée</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => goMonth(-1)} className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">{"<"}</button>
            <p className="font-semibold text-slate-800">{month}</p>
            <button onClick={() => goMonth(1)} className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">{">"}</button>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-2 text-xs text-slate-500">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} className="text-center">{d}</div>
            ))}
          </div>
          <div className="space-y-2">
            {grid.map((week, idx) => (
              <div key={idx} className="grid grid-cols-7 gap-2">
                {week.map((date) => {
                  if (!date) return <div key={`${idx}-empty`} className="h-12 rounded-lg bg-slate-50" />;
                  const status = days[date] || "available";
                  const clickable = status === "available";
                  const isSelected = selectedDate === date;
                  const cls =
                    status === "available"
                      ? "bg-green-50 border-green-200 hover:bg-green-100"
                      : status === "reserved"
                      ? "bg-amber-50 border-amber-300 cursor-not-allowed"
                      : "bg-red-50 border-red-300 cursor-not-allowed";
                  return (
                    <button
                      key={date}
                      onClick={() => clickable && setSelectedDate(date)}
                      disabled={!clickable}
                      className={`h-11 sm:h-12 rounded-lg border text-sm font-medium ${cls} ${
                        isSelected ? "ring-2 ring-slate-700" : ""
                      }`}
                      title={clickable ? "Date disponible" : "Date non disponible"}
                    >
                      {date.slice(-2)}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          {!loading && !hasAvailableDates && (
            <p className="text-sm text-slate-500 mt-4">
              Aucune date disponible ce mois-ci. Merci de consulter le mois suivant.
            </p>
          )}
        </div>

        {selectedDate && (
          <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Demande pour le {selectedDate}</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Prénom *"
                className="px-4 py-2.5 rounded-lg border border-slate-200"
              />
              <input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Nom *"
                className="px-4 py-2.5 rounded-lg border border-slate-200"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email *"
                className="px-4 py-2.5 rounded-lg border border-slate-200"
              />
              <input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Téléphone"
                className="px-4 py-2.5 rounded-lg border border-slate-200"
              />
            </div>
            <input
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              placeholder="Type d'événement *"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200"
            />
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Message (optionnel)"
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? "Envoi..." : "Envoyer la demande"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
