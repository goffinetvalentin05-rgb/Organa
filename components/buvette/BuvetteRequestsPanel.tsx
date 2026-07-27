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
  dashboardSecondaryButtonClass,
  dashboardTabActiveClass,
  dashboardTabInactiveClass,
  dashboardTextMutedClass,
  dashboardTextPrimaryClass,
  dashboardTextSecondaryClass,
  EmptyState,
  DashboardBadge,
  GlassCard,
  sectionListRowClass,
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

      <div className="border-b border-[rgba(15,23,42,0.08)] px-4 py-3 sm:px-6">
        <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const count = counts[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive ? dashboardTabActiveClass : dashboardTabInactiveClass
                )}
              >
                {BUVETTE_REQUEST_TAB_LABELS[tab]}
                {count > 0 ? (
                  <span
                    className={cn(
                      "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                      isActive
                        ? "bg-[rgba(26,35,255,0.12)] text-[#1A23FF]"
                        : "bg-[#F1F5F9] text-[#64748B]"
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

      <div className={cn(unifiedSectionBodyClass, "space-y-3")}>
        {loading ? (
          <p className={cn("text-sm", dashboardTextSecondaryClass)}>Chargement des demandes…</p>
        ) : visibleRequests.length === 0 ? (
          <EmptyState embedded title={BUVETTE_REQUEST_EMPTY_LABELS[activeTab]} />
        ) : (
          visibleRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              formatDate={formatDate}
              submitting={submitting}
              onSelect={() => onSelectRequest(request)}
              onDecide={onDecide}
              onRequestArchive={() => onRequestArchive(request.id)}
            />
          ))
        )}
      </div>
    </GlassCard>
  );
}

type RequestCardProps = {
  request: BuvetteRequest;
  formatDate: (value: string) => string;
  submitting: boolean;
  onSelect: () => void;
  onDecide: (id: string, decision: "accepted" | "refused") => void;
  onRequestArchive: () => void;
};

function RequestCard({
  request,
  formatDate,
  submitting,
  onSelect,
  onDecide,
  onRequestArchive,
}: RequestCardProps) {
  const fullName = `${request.first_name} ${request.last_name}`.trim();

  return (
    <article className={cn(sectionListRowClass, "flex-col items-stretch gap-3 sm:flex-row sm:items-start")}>
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 space-y-2 text-left"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn("truncate text-sm font-semibold", dashboardTextPrimaryClass)}>{fullName}</p>
            <p className={cn("mt-0.5 text-xs", dashboardTextMutedClass)}>
              Demandée le{" "}
              {new Date(request.created_at).toLocaleDateString("fr-CH", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <DashboardBadge variant={statusBadgeVariant(request.status)}>
            {formatBuvetteStatus(request.status)}
          </DashboardBadge>
        </div>

        <div className={cn("grid gap-1.5 text-sm sm:grid-cols-2", dashboardTextSecondaryClass)}>
          <p>
            <span className={dashboardTextMutedClass}>Date : </span>
            {formatDate(request.reservation_date)}
          </p>
          <p>
            <span className={dashboardTextMutedClass}>Type : </span>
            {request.event_type}
          </p>
          {request.email ? (
            <p className="truncate sm:col-span-2">
              <span className={dashboardTextMutedClass}>Email : </span>
              {request.email}
            </p>
          ) : null}
          {request.phone ? (
            <p>
              <span className={dashboardTextMutedClass}>Tél. : </span>
              {request.phone}
            </p>
          ) : null}
        </div>

        {request.message ? (
          <p className="rounded-lg border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-3 py-2 text-sm leading-relaxed text-[#475569]">
            {request.message}
          </p>
        ) : null}
      </button>

      <div className="flex shrink-0 flex-wrap gap-2 sm:w-44 sm:flex-col">
        {request.status === "pending" ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDecide(request.id, "accepted");
              }}
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              Accepter
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDecide(request.id, "refused");
              }}
              disabled={submitting}
              className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              Refuser
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRequestArchive();
          }}
          disabled={submitting}
          className={cn(dashboardSecondaryButtonClass, "text-xs disabled:opacity-50")}
        >
          Archiver
        </button>
      </div>
    </article>
  );
}
