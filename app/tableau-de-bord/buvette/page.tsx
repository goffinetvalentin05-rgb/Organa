"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildMonthGrid } from "@/lib/buvette/calendar";
import toast from "react-hot-toast";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import { PageLayout, PageHeader, GlassCard, dashboardSecondaryButtonClass, dashboardModalClass, dashboardInputClass, dashboardInnerPanelClass, buvetteDayAvailableClass, buvetteDayReservedClass, buvetteDayOccupiedClass, buvetteDayEmptyClass } from "@/components/ui";
import BuvettePublicSettingsPanel from "@/components/buvette/BuvettePublicSettings";
import BuvetteRequestsPanel from "@/components/buvette/BuvetteRequestsPanel";
import type { BuvetteRequest } from "@/lib/buvette/requests";

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

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function BuvettePage() {
  const { t, tList, locale } = useI18n();
  const weekdayLabels = tList("dashboard.buvette.weekdays");
  const [month, setMonth] = useState(currentMonthKey());
  const [days, setDays] = useState<Record<string, DayData>>({});
  const [requests, setRequests] = useState<BuvetteRequest[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessageDraft, setInfoMessageDraft] = useState("");
  const [sendingInfo, setSendingInfo] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceMessageDraft, setInvoiceMessageDraft] = useState("");
  const [invoiceStep, setInvoiceStep] = useState<"message" | "amount">("message");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [archiveTargetId, setArchiveTargetId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

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

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
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
        } else {
          setMessage(await getApiError(requestsRes.value, "Impossible de charger les demandes"));
        }
      }
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const grid = useMemo(() => buildMonthGrid(month), [month]);

  const selectedDayData = selectedDate ? days[selectedDate] : null;
  const selectedRequest = selectedRequestId
    ? requests.find((r) => r.id === selectedRequestId) || null
    : selectedDate
    ? requests.find((r) => r.reservation_date === selectedDate) || null
    : null;

  const formatDateFr = (value: string) =>
    new Date(value).toLocaleDateString(localeToIntl[locale], {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatStatus = (status: BuvetteRequest["status"]) => {
    if (status === "accepted") return "Acceptée";
    if (status === "refused") return "Refusée";
    return "En attente";
  };

  const goMonth = (delta: number) => {
    const [year, monthNum] = month.split("-").map(Number);
    const next = new Date(year, monthNum - 1 + delta, 1);
    setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
    setSelectedDate(null);
    setSelectedRequestId(null);
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

  const archiveTarget = archiveTargetId
    ? requests.find((r) => r.id === archiveTargetId) || null
    : null;

  const requestArchive = (id: string) => {
    setArchiveTargetId(id);
  };

  const executeArchive = async () => {
    if (!archiveTargetId) return;
    const id = archiveTargetId;
    const previousRequests = requests;

    setArchiving(true);
    setSubmitting(true);
    setMessage(null);
    setArchiveTargetId(null);
    setRequests((prev) => prev.filter((r) => r.id !== id));

    if (selectedRequestId === id) {
      setSelectedRequestId(null);
      setSelectedDate(null);
    }

    try {
      const res = await fetch(`/api/buvette/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });
      if (!res.ok) throw new Error(await getApiError(res, "Impossible d'archiver la demande"));
      toast.success("Demande archivée");
      void loadData({ silent: true });
    } catch (error: unknown) {
      setRequests(previousRequests);
      const errMsg = getErrorMessage(error);
      setMessage(errMsg);
      toast.error(errMsg);
    } finally {
      setArchiving(false);
      setSubmitting(false);
    }
  };

  const openInfoModal = () => {
    if (!selectedRequest) return;
    const defaultText = `Bonjour ${selectedRequest.first_name},

Suite à la validation de ta réservation de la buvette
pour le ${formatDateFr(selectedRequest.reservation_date)}, voici les informations pratiques :

- Récupération des clés : [à compléter]
- Règles d'utilisation : [à compléter]
- Contact en cas de problème : [à compléter]

N'hésite pas à nous contacter si tu as des questions.
À bientôt !`;
    setInfoMessageDraft(defaultText);
    setShowInfoModal(true);
  };

  const openInvoiceModal = () => {
    if (!selectedRequest) return;
    const defaultText = `Bonjour ${selectedRequest.first_name},

Suite à la validation de ta réservation de la buvette
pour le ${formatDateFr(selectedRequest.reservation_date)}, tu trouveras en pièce jointe ta facture.

N'hésite pas à nous contacter si tu as des questions.
À bientôt !`;
    setInvoiceMessageDraft(defaultText);
    setInvoiceAmount("");
    setInvoiceStep("message");
    setShowInvoiceModal(true);
  };

  const sendPracticalInfo = async () => {
    if (!selectedRequest) return;
    if (!infoMessageDraft.trim()) {
      setMessage("Le message ne peut pas être vide.");
      return;
    }

    setSendingInfo(true);
    setMessage(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`/api/buvette/requests/${selectedRequest.id}/send-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: infoMessageDraft }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
      if (!res.ok) throw new Error(await getApiError(res, "Impossible d'envoyer les infos pratiques"));
      setShowInfoModal(false);
      toast.success("✅ Email envoyé avec succès !");
    } catch (error: unknown) {
      console.error("[Buvette][UI] Erreur envoi infos pratiques:", error);
      setMessage(getErrorMessage(error));
    } finally {
      setSendingInfo(false);
    }
  };

  const sendInvoice = async () => {
    if (!selectedRequest) return;
    if (!invoiceMessageDraft.trim()) {
      setMessage("Le message ne peut pas être vide.");
      return;
    }
    const amount = Number(invoiceAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Merci de saisir un montant valide.");
      return;
    }

    setSendingInvoice(true);
    setMessage(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`/api/buvette/requests/${selectedRequest.id}/send-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, message: invoiceMessageDraft }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
      if (!res.ok) throw new Error(await getApiError(res, "Impossible d'envoyer la facture"));
      setShowInvoiceModal(false);
      setInvoiceAmount("");
      toast.success("✅ Email envoyé avec succès !");
    } catch (error: unknown) {
      console.error("[Buvette][UI] Erreur envoi facture:", error);
      setMessage(getErrorMessage(error));
    } finally {
      setSendingInvoice(false);
    }
  };

  return (
    <PageLayout maxWidth="7xl">
      <PageHeader title="Buvette" subtitle="Gestion des disponibilités et demandes externes." />

      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500" /> {t("dashboard.buvette.legendAvailable")}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500" /> {t("dashboard.buvette.legendOccupied")}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-500" /> {t("dashboard.buvette.legendReserved")}
        </span>
      </div>

      {message ? (
        <GlassCard padding="md" className="border-white/10 text-sm text-white/75">
          {message}
        </GlassCard>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
        <GlassCard padding="md">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => goMonth(-1)} className={dashboardSecondaryButtonClass}>{"<"}</button>
            <p className="font-semibold text-white/90">{month}</p>
            <button onClick={() => goMonth(1)} className={dashboardSecondaryButtonClass}>{">"}</button>
          </div>

          {loading ? (
            <p className="text-white/55">{t("dashboard.buvette.calendarLoading")}</p>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2 mb-2 text-xs text-white/50">
                {(weekdayLabels.length ? weekdayLabels : ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]).map((d) => (
                  <div key={d} className="text-center">{d}</div>
                ))}
              </div>
              <div className="space-y-2">
                {grid.map((week, idx) => (
                  <div key={idx} className="grid grid-cols-7 gap-2">
                    {week.map((date) => {
                      if (!date) return <div key={`${idx}-empty`} className={`h-14 rounded-lg ${buvetteDayEmptyClass}`} />;
                      const data = days[date];
                      const isSelected = selectedDate === date;
                      const color = !data
                        ? buvetteDayAvailableClass
                        : data.status === "reserved"
                        ? buvetteDayReservedClass
                        : buvetteDayOccupiedClass;
                      return (
                        <button
                          key={date}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedRequestId(days[date]?.request?.id || null);
                          }}
                          className={`h-14 rounded-lg border text-sm font-medium transition ${color} ${
                            isSelected ? "ring-2 ring-blue-400/60 ring-offset-1 ring-offset-transparent" : ""
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
        </GlassCard>

        <GlassCard padding="md" className="space-y-4">
          <h2 className="font-semibold text-white/90">Détails date</h2>
          {!selectedDate ? (
            <p className="text-sm text-white/55">Sélectionne une date dans le calendrier.</p>
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
                  ? formatStatus(selectedRequest.status)
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
                  className={`w-full px-4 py-2 ${dashboardSecondaryButtonClass} disabled:opacity-50`}
                >
                  Débloquer la date
                </button>
              )}

              {selectedRequest && (
                <div className={`${dashboardInnerPanelClass} space-y-2 p-3`}>
                  <p className="font-medium text-sm">Réservation sélectionnée</p>
                  <p className="text-sm">
                    {selectedRequest.first_name} {selectedRequest.last_name}
                  </p>
                  <p className="text-xs text-slate-500">{selectedRequest.email}</p>
                  <p className="text-sm">Date : {selectedRequest.reservation_date}</p>
                  <p className="text-sm">Type : {selectedRequest.event_type}</p>
                  {selectedRequest.phone && (
                    <p className="text-sm">Téléphone : {selectedRequest.phone}</p>
                  )}
                  <p className="text-sm">Statut : {formatStatus(selectedRequest.status)}</p>
                  {selectedRequest.message && (
                    <p className="text-sm text-slate-600">{selectedRequest.message}</p>
                  )}

                  {selectedRequest.status === "pending" && (
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
                  )}

                  {selectedRequest.status === "accepted" && (
                    <div className="flex gap-2">
                      <button
                        onClick={openInfoModal}
                        className={`flex-1 px-3 py-2 ${dashboardSecondaryButtonClass}`}
                      >
                        Envoyer les infos
                      </button>
                      <button
                        onClick={openInvoiceModal}
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                      >
                        Envoyer la facture
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => requestArchive(selectedRequest.id)}
                    disabled={submitting}
                    className={`w-full px-3 py-2 ${dashboardSecondaryButtonClass} disabled:opacity-50`}
                  >
                    Archiver
                  </button>
                </div>
              )}
            </>
          )}
        </GlassCard>
      </div>

      <BuvetteRequestsPanel
        requests={requests}
        loading={loading}
        submitting={submitting}
        formatDate={formatDateFr}
        onSelectRequest={(request) => {
          setSelectedDate(request.reservation_date);
          setSelectedRequestId(request.id);
          const [year, monthNum] = request.reservation_date.split("-");
          setMonth(`${year}-${monthNum}`);
        }}
        onDecide={decideRequest}
        onRequestArchive={requestArchive}
      />

      {archiveTarget ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Fermer"
            onClick={() => !archiving && setArchiveTargetId(null)}
          />
          <div className={`relative w-full max-w-md space-y-4 p-5 ${dashboardModalClass}`}>
            <div>
              <h3 className="text-lg font-semibold text-white/95">Archiver cette demande ?</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                La demande de{" "}
                <span className="font-medium text-white/85">
                  {archiveTarget.first_name} {archiveTarget.last_name}
                </span>{" "}
                ({formatDateFr(archiveTarget.reservation_date)}) sera retirée de la liste. Les
                réservations déjà acceptées restent visibles dans le calendrier.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setArchiveTargetId(null)}
                disabled={archiving}
                className={dashboardSecondaryButtonClass}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void executeArchive()}
                disabled={archiving}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {archiving ? "Archivage…" : "Archiver"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showInfoModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl p-5 space-y-4 ${dashboardModalClass}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Envoyer les infos pratiques</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="rounded-md px-2 py-1 text-white/55 transition hover:bg-white/10 hover:text-white/90"
              >
                ✕
              </button>
            </div>
            <textarea
              value={infoMessageDraft}
              onChange={(e) => setInfoMessageDraft(e.target.value)}
              rows={14}
              className={`${dashboardInputClass} min-h-[14rem] resize-y`}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowInfoModal(false)}
                className={dashboardSecondaryButtonClass}
              >
                Annuler
              </button>
              <button
                onClick={sendPracticalInfo}
                disabled={sendingInfo}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {sendingInfo ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvoiceModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg p-5 space-y-4 ${dashboardModalClass}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Envoyer la facture</h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="rounded-md px-2 py-1 text-white/55 transition hover:bg-white/10 hover:text-white/90"
              >
                ✕
              </button>
            </div>
            {invoiceStep === "message" ? (
              <>
                <p className="text-sm text-slate-600">
                  Étape A - Personnalise le message avant envoi.
                </p>
                <textarea
                  value={invoiceMessageDraft}
                  onChange={(e) => setInvoiceMessageDraft(e.target.value)}
                  rows={10}
                  className={`${dashboardInputClass} min-h-[14rem] resize-y`}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className={dashboardSecondaryButtonClass}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => setInvoiceStep("amount")}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Continuer
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  Étape B - Saisis le montant en CHF pour{" "}
                  {selectedRequest.first_name} {selectedRequest.last_name}.
                </p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="Montant en CHF"
                  className={`${dashboardInputClass} min-h-[14rem] resize-y`}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setInvoiceStep("message")}
                    className={dashboardSecondaryButtonClass}
                  >
                    Retour
                  </button>
                  <button
                    onClick={sendInvoice}
                    disabled={sendingInvoice}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {sendingInvoice ? "Envoi..." : "Générer et envoyer la facture"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <BuvettePublicSettingsPanel />
    </PageLayout>
  );
}
