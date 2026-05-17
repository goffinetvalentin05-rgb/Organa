import type { OpMatcher, RecordedSupabaseOp, ResolveResult } from "./thenableSupabaseMock";

/**
 * Match les opérations Supabase dans l’ordre exact (non-régression sur le flux SQL).
 */
export function sequentialOps(
  specs: Array<{
    table: string;
    op: RecordedSupabaseOp["op"];
    match?: (r: RecordedSupabaseOp) => boolean;
    result: ResolveResult;
  }>
): OpMatcher {
  let i = 0;
  return (record) => {
    if (i >= specs.length) return null;
    const s = specs[i];
    if (record.table !== s.table || record.op !== s.op) return null;
    if (s.match && !s.match(record)) return null;
    i += 1;
    return s.result;
  };
}
