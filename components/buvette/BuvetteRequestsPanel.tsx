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
  dashboardTabActiveClass,
  dashboardTabInactiveClass,
  EmptyState,
  DashboardBadge,
  GlassCard,
  ActionButton,
  EntityCard,
  EntityCardList,
  EntityMetaRow,
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
          <p className="text-sm text-[#64748B]">Chargement des demandes…</p>
        ) : visibleRequests.length === 0 ? (
          <EmptyState embedded title={BUVETTE_REQUEST_EMPTY_LABELS[activeTab]} />
        ) : (
          <EntityCardList>
            {visibleRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                formatDate={formatDate}
                submitting={submitting}
                onSelect={() => onSelectRequest(request)}
                onDecide={onDecide}
                onRequestArchive={() => onRequestArchive(request.id)}
              />
            ))}
          </EntityCardList>
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
    <EntityCard
      layout="row"
      onClick={onSelect}
      title={fullName}
      subtitle={request.email || undefined}
      status={
        <DashboardBadge variant={statusBadgeVariant(request.status)}>
          {formatBuvetteStatus(request.status)}
        </DashboardBadge>
      }
      meta={
        <>
          <EntityMetaRow
            inline
            label="Demandée le"
            value={new Date(request.created_at).toLocaleDateString("fr-CH", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          />
          <EntityMetaRow inline label="Date" value={formatDate(request.reservation_date)} />
          <EntityMetaRow inline label="Type" value={request.event_type} />
          {request.phone ? <EntityMetaRow inline label="Tél." value={request.phone} /> : null}
          {request.message ? (
            <p className="text-sm leading-relaxed text-[#475569]">{request.message}</p>
          ) : null}
        </>
      }
      actions={
        <>
          {request.status === "pending" ? (
            <>
              <button
                type="button"
                onClick={() => onDecide(request.id, "accepted")}
                disabled={submitting}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                Accepter
              </button>
              <button
                type="button"
                onClick={() => onDecide(request.id, "refused")}
                disabled={submitting}
                className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                Refuser
              </button>
            </>
          ) : null}
          <ActionButton
            type="button"
            onClick={onRequestArchive}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 text-xs"
          >
            Archiver
          </ActionButton>
        </>
      }
    />
  );
}
