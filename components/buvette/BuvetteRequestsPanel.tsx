"use client";

import { useMemo, useState } from "react";
import {
  type BuvetteRequest,
  type BuvetteRequestTab,
  BUVETTE_REQUEST_EMPTY_LABELS,
  BUVETTE_REQUEST_TAB_LABELS,
  countRequestsByTab,
  filterRequestsByTab,
  formatBuvetteStatus,
  sortRequestsForTab,
  statusBadgeVariant,
} from "@/lib/buvette/requests";
import {
  cn,
  dashboardCardDescriptionClass,
  dashboardCardTitleClass,
  EmptyState,
  DashboardBadge,
  GlassCard,
  ActionButton,
  unifiedSectionBodyClass,
  unifiedSectionHeaderClass,
} from "@/components/ui";

type BuvetteRequestsPanelProps = {
  requests: BuvetteRequest[];
  loading: boolean;
  submitting: boolean;
  formatDate: (value: string) => string;
  onSelectRequest: (request: BuvetteRequest) => void;
  onDecide: (id: string, decision: "accepted" | "refused") => void;
  onRequestArchive: (id: string) => void;
};

const TABS: BuvetteRequestTab[] = ["pending", "upcoming", "accepted", "refused", "all"];

const REQUEST_ROW_GRID =
  "grid grid-cols-1 items-center gap-3 lg:grid-cols-[minmax(0,1.5fr)_11rem_7.5rem_minmax(11.5rem,auto)] lg:gap-4";

export default function BuvetteRequestsPanel({
  requests,
  loading,
  submitting,
  formatDate,
  onSelectRequest,
  onDecide,
  onRequestArchive,
}: BuvetteRequestsPanelProps) {
  const [activeTab, setActiveTab] = useState<BuvetteRequestTab>("pending");

  const counts = useMemo(() => countRequestsByTab(requests), [requests]);

  const visibleRequests = useMemo(() => {
    const filtered = filterRequestsByTab(requests, activeTab);
    return sortRequestsForTab(filtered, activeTab);
  }, [requests, activeTab]);

  return (
    <GlassCard padding="none" className="overflow-hidden">
      <div className={cn(unifiedSectionHeaderClass, "px-4 py-4 sm:px-6 sm:py-5")}>
        <h2 className={dashboardCardTitleClass}>Demandes de réservation</h2>
        <p className={dashboardCardDescriptionClass}>
          Suivez les demandes acceptées, refusées et à venir.
        </p>
      </div>

      <div className="border-b border-[rgba(15,23,42,0.06)] px-4 py-3 sm:px-6">
        <div className="-mx-1 max-w-full overflow-x-auto overscroll-x-contain px-1 scrollbar-none">
          <div className="inline-flex min-w-min items-center rounded-full bg-[#F1F5F9] p-1 ring-1 ring-inset ring-[rgba(15,23,42,0.04)]">
            {TABS.map((tab) => {
              const count = counts[tab];
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm tracking-[-0.01em] transition-all duration-200",
                    isActive
                      ? "bg-[#1A23FF] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(26,35,255,0.28)]"
                      : "font-medium text-[#475569] hover:bg-white/80 hover:text-[#0F172A]"
                  )}
                >
                  {BUVETTE_REQUEST_TAB_LABELS[tab]}
                  {count > 0 ? (
                    <span
                      className={cn(
                        "inline-flex min-w-[1.15rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                        isActive ? "bg-white/20 text-white" : "bg-white text-[#64748B]"
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={cn(unifiedSectionBodyClass, "space-y-2.5")}>
        {loading ? (
          <p className="text-sm text-[#64748B]">Chargement des demandes…</p>
        ) : visibleRequests.length === 0 ? (
          <EmptyState embedded title={BUVETTE_REQUEST_EMPTY_LABELS[activeTab]} />
        ) : (
          <div className="min-w-0 space-y-2">
            <div
              className={cn(
                REQUEST_ROW_GRID,
                "hidden px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8] lg:grid"
              )}
            >
              <span className="min-w-0">Réservation</span>
              <span>Date</span>
              <span>Statut</span>
              <span className="text-right">Actions</span>
            </div>
            {visibleRequests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                formatDate={formatDate}
                submitting={submitting}
                onSelect={() => onSelectRequest(request)}
                onDecide={onDecide}
                onRequestArchive={() => onRequestArchive(request.id)}
              />
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

type RequestRowProps = {
  request: BuvetteRequest;
  formatDate: (value: string) => string;
  submitting: boolean;
  onSelect: () => void;
  onDecide: (id: string, decision: "accepted" | "refused") => void;
  onRequestArchive: () => void;
};

function RequestRow({
  request,
  formatDate,
  submitting,
  onSelect,
  onDecide,
  onRequestArchive,
}: RequestRowProps) {
  const fullName = `${request.first_name} ${request.last_name}`.trim();

  return (
    <article
      onClick={onSelect}
      className="cursor-pointer rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_16px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-200 hover:border-[rgba(26,35,255,0.16)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)] sm:px-5"
    >
      <div className={REQUEST_ROW_GRID}>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-[#0F172A]">{fullName}</p>
          <p className="mt-0.5 truncate text-sm text-[#64748B]">
            {request.event_type}
            {request.email ? ` · ${request.email}` : ""}
          </p>
        </div>
        <p className="min-w-0 truncate text-sm tabular-nums text-[#475569]">
          {formatDate(request.reservation_date)}
        </p>
        <div className="min-w-0">
          <DashboardBadge variant={statusBadgeVariant(request.status)}>
            {formatBuvetteStatus(request.status)}
          </DashboardBadge>
        </div>
        <div
          className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {request.status === "pending" ? (
            <>
              <button
                type="button"
                onClick={() => onDecide(request.id, "accepted")}
                disabled={submitting}
                className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                Accepter
              </button>
              <button
                type="button"
                onClick={() => onDecide(request.id, "refused")}
                disabled={submitting}
                className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                Refuser
              </button>
            </>
          ) : null}
          <ActionButton
            type="button"
            onClick={onRequestArchive}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
          >
            Archiver
          </ActionButton>
        </div>
      </div>
    </article>
  );
}
