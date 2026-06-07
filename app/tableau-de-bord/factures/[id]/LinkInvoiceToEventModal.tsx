"use client";

import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import { Calendar, X } from "@/lib/icons";
import {
  dashboardModalClass,
  dashboardSelectClass,
  dashboardLabelClass,
  dashboardSecondaryButtonClass,
  dashboardInnerPanelClass,
} from "@/components/ui";

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
      <div className={`relative w-full max-w-md p-6 ${dashboardModalClass}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white/95">
              {t("dashboard.invoices.detail.modalTitle")}
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {t("dashboard.invoices.detail.modalHint")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/45 transition-colors hover:bg-white/10 hover:text-white/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {eventsLoading ? (
          <p className="py-6 text-center text-sm text-white/55">
            {t("dashboard.common.loading")}
          </p>
        ) : events.length === 0 ? (
          <p className="rounded-xl border border-amber-400/25 bg-amber-500/12 p-4 text-sm text-amber-200">
            {t("dashboard.invoices.detail.noEventsAvailable")}
          </p>
        ) : (
          <>
            <label className={`block mb-2 ${dashboardLabelClass}`}>
              {t("dashboard.invoices.detail.eventLinkedLabel")}
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => onSelectedEventIdChange(e.target.value)}
              className={dashboardSelectClass}
            >
              <option value="">{t("dashboard.invoices.detail.selectPlaceholder")}</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                  {ev.start_date ? ` — ${formatEventDate(ev.start_date)}` : ""}
                </option>
              ))}
            </select>

            <ul className={`mt-3 max-h-40 divide-y divide-white/10 overflow-y-auto rounded-lg text-sm ${dashboardInnerPanelClass}`}>
              {events.map((ev) => (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={() => onSelectedEventIdChange(ev.id)}
                    className={`flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.08] ${
                      selectedEventId === ev.id ? "bg-blue-500/15" : ""
                    }`}
                  >
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                    <span>
                      <span className="font-medium text-white/90">{ev.name}</span>
                      {ev.start_date && (
                        <span className="block text-xs text-white/55">
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

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={dashboardSecondaryButtonClass}
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
