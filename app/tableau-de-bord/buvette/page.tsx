"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildMonthGrid } from "@/lib/buvette/calendar";

type DayData = {
  status: "available" | "occupied" | "reserved";
  reason?: string | null;
  source?: string | null;
  request?: {
    id: string;
    status: string;
    name: string;
    eventType: string;
  } | null;
};

type BuvetteRequest = {
  id: string;
  reservation_date: string;
  status: "pending" | "accepted" | "refused";
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  event_type: string;
  message?: string | null;
  created_at: string;
};

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function BuvettePage() {
  const [month, setMonth] = useState(currentMonthKey());
  const [days, setDays] = useState<Record<string, DayData>>({});
  const [requests, setRequests] = useState<BuvetteRequest[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [publicUrlPath, setPublicUrlPath] = useState<string>("");
  const [loadingLink, setLoadingLink] = useState(true);

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Erreur";

  const getApiError = async (res: Response, fallback: string) => {
    try {
      const data = await res.json();
      return data?.error || fallback;
    } catch {
      return fallback;
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [calendarRes, requestsRes] = await Promise.allSettled([
        fetch(`/api/buvette/calendar?month=${month}`, { cache: "no-store" }),
        fetch("/api/buvette/requests", { cache: "no-store" }),
      ]);

      if (calendarRes.status === "fulfilled") {
        if (calendarRes.value.ok) {
          const calendarData = await calendarRes.value.json();
          setDays(calendarData.days || {});
        } else {
          setMessage(await getApiError(calendarRes.value, "Impossible de charger le calendrier"));
        }
      }

      if (requestsRes.status === "fulfilled") {
        if (requestsRes.value.ok) {
          const requestsData = await requestsRes.value.json();
          setRequests(requestsData.requests || []);
          if (requestsData.publicUrlPath) setPublicUrlPath(requestsData.publicUrlPath);
        } else {
          setMessage(await getApiError(requestsRes.value, "Impossible de charger les demandes"));
        }
      }
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [month]);

  const loadPublicLink = useCallback(async () => {
    setLoadingLink(true);
    try {
      const res = await fetch("/api/buvette/public-link", { cache: "no-store" });
      if (!res.ok) {
        setMessage(await getApiError(res, "Impossible de charger le lien public"));
        return;
      }
      const data = await res.json();
      setPublicUrlPath(data.publicUrlPath || "");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoadingLink(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void loadPublicLink();
  }, [loadPublicLink]);

  const grid = useMemo(() => buildMonthGrid(month), [month]);

  const selectedDayData = selectedDate ? days[selectedDate] : null;
  const selectedRequest = selectedDate
    ? requests.find((r) => r.reservation_date === selectedDate && r.status === "pending") || null
    : null;

  const goMonth = (delta: number) => {
    const [year, monthNum] = month.split("-").map(Number);
    const next = new Date(year, monthNum - 1 + delta, 1);
    setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
    setSelectedDate(null);
  };

  const blockDate = async () => {
    if (!selectedDate) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/buvette/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, reason: "Événement interne" }),
      });
      if (!res.ok) throw new Error(await getApiError(res, "Impossible de bloquer la date"));
      await loadData();
      setMessage("Date bloquée avec succès");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const unblockDate = async () => {
    if (!selectedDate) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/buvette/blocks?date=${selectedDate}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await getApiError(res, "Impossible de débloquer la date"));
      await loadData();
      setMessage("Date débloquée");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const decideRequest = async (id: string, decision: "accepted" | "refused") => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/buvette/requests/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error(await getApiError(res, "Impossible de traiter la demande"));
      await loadData();
      setMessage(decision === "accepted" ? "Demande acceptée" : "Demande refusée");
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const publicUrl =
    typeof window !== "undefined" && publicUrlPath ? `${window.location.origin}${publicUrlPath}` : "";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Buvette</h1>
          <p className="text-slate-600 mt-1">Gestion des disponibilités et demandes externes.</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm">
          <p className="font-medium text-slate-700 mb-1">Lien public</p>
          <p className="text-slate-500 break-all">{loadingLink ? "Chargement..." : publicUrl || "Indisponible"}</p>
          {!!publicUrl && (
            <div className="mt-2 flex gap-2">
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50"
              >
                Ouvrir
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(publicUrl)}
                className="text-xs px-2.5 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50"
              >
                Copier
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" /> Disponible</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" /> Occupée</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500" /> Réservée</span>
      </div>

      {message && <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => goMonth(-1)} className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">{"<"}</button>
            <p className="font-semibold text-slate-800">{month}</p>
            <button onClick={() => goMonth(1)} className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">{">"}</button>
          </div>

          {loading ? (
            <p className="text-slate-500">Chargement du calendrier...</p>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2 mb-2 text-xs text-slate-500">
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                  <div key={d} className="text-center">{d}</div>
                ))}
              </div>
              <div className="space-y-2">
                {grid.map((week, idx) => (
                  <div key={idx} className="grid grid-cols-7 gap-2">
                    {week.map((date) => {
                      if (!date) return <div key={`${idx}-empty`} className="h-14 rounded-lg bg-slate-50" />;
                      const data = days[date];
                      const isSelected = selectedDate === date;
                      const color = !data
                        ? "bg-green-50 border-green-200"
                        : data.status === "reserved"
                        ? "bg-amber-50 border-amber-300"
                        : "bg-red-50 border-red-300";
                      return (
                        <button
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          className={`h-14 rounded-lg border text-sm font-medium transition ${color} ${
                            isSelected ? "ring-2 ring-slate-700" : ""
                          }`}
                        >
                          {date.slice(-2)}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
          <h2 className="font-semibold text-slate-900">Détails date</h2>
          {!selectedDate ? (
            <p className="text-sm text-slate-500">Sélectionne une date dans le calendrier.</p>
          ) : (
            <>
              <p className="text-sm"><span className="font-medium">Date :</span> {selectedDate}</p>
              <p className="text-sm">
                <span className="font-medium">Statut :</span>{" "}
                {!selectedDayData
                  ? "Disponible"
                  : selectedDayData.status === "reserved"
                  ? "Réservée"
                  : selectedRequest
                  ? "En attente"
                  : "Occupée"}
              </p>
              {selectedDayData?.reason && (
                <p className="text-sm"><span className="font-medium">Raison :</span> {selectedDayData.reason}</p>
              )}

              {!selectedDayData && (
                <button
                  onClick={blockDate}
                  disabled={submitting}
                  className="w-full px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Bloquer la date
                </button>
              )}

              {selectedDayData?.status === "occupied" && selectedDayData?.source === "admin" && (
                <button
                  onClick={unblockDate}
                  disabled={submitting}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  Débloquer la date
                </button>
              )}

              {selectedRequest && (
                <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                  <p className="font-medium text-sm">Demande en attente</p>
                  <p className="text-sm">{selectedRequest.first_name} {selectedRequest.last_name}</p>
                  <p className="text-xs text-slate-500">{selectedRequest.email}</p>
                  <p className="text-sm">Type: {selectedRequest.event_type}</p>
                  {selectedRequest.message && <p className="text-sm text-slate-600">{selectedRequest.message}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => decideRequest(selectedRequest.id, "accepted")}
                      disabled={submitting}
                      className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => decideRequest(selectedRequest.id, "refused")}
                      disabled={submitting}
                      className="flex-1 px-3 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Demandes récentes</h2>
        <div className="space-y-2">
          {requests.length === 0 && <p className="text-sm text-slate-500">Aucune demande pour le moment.</p>}
          {requests.slice(0, 8).map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedDate(r.reservation_date)}
              className="w-full text-left rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{r.first_name} {r.last_name}</p>
                <span className="text-xs text-slate-500">{r.status}</span>
              </div>
              <p className="text-xs text-slate-500">{r.reservation_date} • {r.event_type}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
