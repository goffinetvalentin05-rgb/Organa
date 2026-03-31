/**
 * Totaux financiers d'événement : factures (documents type invoice) + revenus simples (club_revenues).
 */

export function sumInvoiceRevenueFromDocuments(documents: { type?: string; total_ttc?: number | string }[]) {
  return documents
    .filter((d) => d.type === "invoice")
    .reduce((sum, d) => sum + (Number(d.total_ttc) || 0), 0);
}

export function sumClubRevenues(revenues: { amount?: number | string }[]) {
  return revenues.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
}

export function totalEventRevenue(
  documents: { type?: string; total_ttc?: number | string }[],
  clubRevenues: { amount?: number | string }[]
) {
  return sumInvoiceRevenueFromDocuments(documents) + sumClubRevenues(clubRevenues);
}
