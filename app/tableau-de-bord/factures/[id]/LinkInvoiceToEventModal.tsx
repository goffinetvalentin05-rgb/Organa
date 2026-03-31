"use client";

import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import { Calendar, X } from "@/lib/icons";

export interface EventListItem {
  id: string;
  name: string;
  start_date?: string;
}

interface LinkInvoiceToEventModalProps {
  open: boolean;
  onClose: () => void;
  events: EventListItem[];
  eventsLoading: boolean;
  selectedEventId: string;
  onSelectedEventIdChange: (id: string) => void;
  onConfirm: () => void;
  saving: boolean;
}

export default function LinkInvoiceToEventModal({
  open,
  onClose,
  events,
  eventsLoading,
  selectedEventId,
  onSelectedEventIdChange,
  onConfirm,
  saving,
}: LinkInvoiceToEventModalProps) {
  const { t, locale } = useI18n();

  if (!open) return null;

  const formatEventDate = (d?: string) => {
    if (!d) return "";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString(localeToIntl[locale], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-label={t("dashboard.invoices.detail.modalCancel")}
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {t("dashboard.invoices.detail.modalTitle")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("dashboard.invoices.detail.modalHint")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {eventsLoading ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            {t("dashboard.common.loading")}
          </p>
        ) : events.length === 0 ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-4">
            {t("dashboard.invoices.detail.noEventsAvailable")}
          </p>
        ) : (
          <>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("dashboard.invoices.detail.eventLinkedLabel")}
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => onSelectedEventIdChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--obillz-hero-blue,#1d4ed8)]"
            >
              <option value="">{t("dashboard.invoices.detail.selectPlaceholder")}</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                  {ev.start_date ? ` — ${formatEventDate(ev.start_date)}` : ""}
                </option>
              ))}
            </select>

            <ul className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/80 text-sm divide-y divide-slate-100">
              {events.map((ev) => (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={() => onSelectedEventIdChange(ev.id)}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-white transition-colors ${
                      selectedEventId === ev.id ? "bg-blue-50/80" : ""
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      <span className="font-medium text-slate-800">{ev.name}</span>
                      {ev.start_date && (
                        <span className="block text-xs text-slate-500">
                          {formatEventDate(ev.start_date)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="flex gap-2 mt-6 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {t("dashboard.invoices.detail.modalCancel")}
          </button>
          <button
            type="button"
            disabled={saving || eventsLoading || !selectedEventId || events.length === 0}
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[var(--obillz-hero-blue,#1d4ed8)] hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? t("dashboard.common.saving") : t("dashboard.invoices.detail.modalConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
