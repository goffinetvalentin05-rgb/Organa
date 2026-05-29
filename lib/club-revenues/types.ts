export type ClubRevenueDbRow = {
  id: string;
  name: string;
  amount: number | string;
  revenue_date: string;
  description: string | null;
  event_id: string | null;
  created_at: string;
  updated_at: string;
};

export function mapClubRevenueToApi(
  row: ClubRevenueDbRow,
  event: { id: string; name: string } | null
) {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount) || 0,
    revenue_date: row.revenue_date,
    description: row.description,
    event_id: row.event_id,
    event,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
