/**
 * PostgREST renvoie au plus `max-rows` par requête (1 000 par défaut).
 * Une lecture sans pagination, même sans `.limit(500)`, est donc incomplète.
 */
export const SUPABASE_PAGE_SIZE = 1000;

type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

export async function fetchAllPages<T>(
  load: (from: number, to: number) => PromiseLike<PageResult<T>>
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += SUPABASE_PAGE_SIZE) {
    const to = from + SUPABASE_PAGE_SIZE - 1;
    const { data, error } = await load(from, to);
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < SUPABASE_PAGE_SIZE) return rows;
  }
}
