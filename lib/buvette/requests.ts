export type BuvetteRequestStatus = "pending" | "accepted" | "refused";

export type BuvetteRequest = {
  id: string;
  reservation_date: string;
  status: BuvetteRequestStatus;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  event_type: string;
  message?: string | null;
  created_at: string;
};

export type BuvetteRequestTab = "pending" | "upcoming" | "accepted" | "refused" | "all";

export function todayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export function formatBuvetteStatus(status: BuvetteRequestStatus) {
  if (status === "accepted") return "Acceptée";
  if (status === "refused") return "Refusée";
  return "En attente";
}

export function statusBadgeVariant(
  status: BuvetteRequestStatus
): "warning" | "success" | "danger" {
  if (status === "accepted") return "success";
  if (status === "refused") return "danger";
  return "warning";
}

export function filterRequestsByTab(
  requests: BuvetteRequest[],
  tab: BuvetteRequestTab
): BuvetteRequest[] {
  const today = todayDateKey();

  switch (tab) {
    case "pending":
      return requests.filter((r) => r.status === "pending");
    case "upcoming":
      return requests.filter(
        (r) => r.status === "accepted" && r.reservation_date >= today
      );
    case "accepted":
      return requests.filter((r) => r.status === "accepted");
    case "refused":
      return requests.filter((r) => r.status === "refused");
    case "all":
    default:
      return requests;
  }
}

export function sortRequestsForTab(
  requests: BuvetteRequest[],
  tab: BuvetteRequestTab
): BuvetteRequest[] {
  const today = todayDateKey();
  const copy = [...requests];

  if (tab === "upcoming" || tab === "pending") {
    return copy.sort((a, b) => {
      const byDate = a.reservation_date.localeCompare(b.reservation_date);
      if (byDate !== 0) return byDate;
      return b.created_at.localeCompare(a.created_at);
    });
  }

  return copy.sort((a, b) => {
    const aFuture = a.reservation_date >= today;
    const bFuture = b.reservation_date >= today;
    if (aFuture !== bFuture) return aFuture ? -1 : 1;
    if (aFuture) return a.reservation_date.localeCompare(b.reservation_date);
    const byDate = b.reservation_date.localeCompare(a.reservation_date);
    if (byDate !== 0) return byDate;
    return b.created_at.localeCompare(a.created_at);
  });
}

export function countRequestsByTab(requests: BuvetteRequest[]) {
  const today = todayDateKey();
  return {
    pending: requests.filter((r) => r.status === "pending").length,
    upcoming: requests.filter(
      (r) => r.status === "accepted" && r.reservation_date >= today
    ).length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    refused: requests.filter((r) => r.status === "refused").length,
    all: requests.length,
  };
}

export const BUVETTE_REQUEST_TAB_LABELS: Record<BuvetteRequestTab, string> = {
  pending: "À traiter",
  upcoming: "À venir",
  accepted: "Acceptées",
  refused: "Refusées",
  all: "Toutes",
};

export const BUVETTE_REQUEST_EMPTY_LABELS: Record<BuvetteRequestTab, string> = {
  pending: "Aucune demande à traiter",
  upcoming: "Aucune demande à venir",
  accepted: "Aucune demande acceptée",
  refused: "Aucune demande refusée",
  all: "Aucune demande pour le moment",
};
