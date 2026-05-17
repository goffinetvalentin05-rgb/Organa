/**
 * Mock minimaliste du client Supabase (requêtes chaînées + await direct)
 * pour tester les routes API sans base réelle.
 */

export type RecordedSupabaseOp = {
  op: "select" | "insert" | "update" | "delete";
  table: string;
  filters: Record<string, unknown>;
  payload?: unknown;
  selectColumns?: string | object;
  countHead?: boolean;
};

export type ResolveResult = {
  data?: unknown;
  error?: unknown;
  count?: number | null;
};

export type OpMatcher = (record: RecordedSupabaseOp) => ResolveResult | null;

function cloneFilters(f: Record<string, unknown>) {
  return { ...f };
}

/**
 * Crée un client Supabase factice : chaque opération terminée (single,
 * maybeSingle, await sur une requête head) enregistre un RecordedSupabaseOp
 * et résout via le premier matcher qui retourne non-null.
 */
export function createThenableSupabaseMock(matchers: OpMatcher[]) {
  const log: RecordedSupabaseOp[] = [];

  const resolve = (record: RecordedSupabaseOp): Promise<ResolveResult> => {
    log.push(record);
    for (const m of matchers) {
      const r = m(record);
      if (r) return Promise.resolve(r);
    }
    return Promise.reject(
      new Error(
        `[mock supabase] Aucun matcher pour: ${JSON.stringify(record, null, 0)}`
      )
    );
  };

  function startQuery(table: string) {
    const state: RecordedSupabaseOp = {
      op: "select",
      table,
      filters: {},
    };

    const buildTerminal = () => ({
      maybeSingle: () => resolve({ ...state, filters: cloneFilters(state.filters) }),
      single: () => resolve({ ...state, filters: cloneFilters(state.filters) }),
      then: (
        onFulfilled?: (v: ResolveResult) => unknown,
        onRejected?: (e: unknown) => unknown
      ) =>
        resolve({ ...state, filters: cloneFilters(state.filters) }).then(
          onFulfilled,
          onRejected
        ),
    });

    const chain: Record<string, unknown> = {
      select(columns?: string | object, opts?: { count: string; head?: boolean }) {
        state.op = "select";
        state.selectColumns = typeof columns === "string" ? columns : "(object)";
        if (opts?.head) {
          state.countHead = true;
        }
        return chain;
      },
      insert(payload: unknown) {
        state.op = "insert";
        state.payload = payload;
        return insertChain;
      },
      update(payload: unknown) {
        state.op = "update";
        state.payload = payload;
        return updateChain;
      },
      delete() {
        state.op = "delete";
        return deleteChain;
      },
      eq(col: string, val: unknown) {
        state.filters[col] = val;
        return chain;
      },
      neq(col: string, val: unknown) {
        state.filters[`${col}__neq`] = val;
        return chain;
      },
      is(col: string, val: unknown) {
        state.filters[`${col}__is`] = val;
        return chain;
      },
      in(col: string, vals: unknown[]) {
        state.filters[`${col}__in`] = vals;
        return chain;
      },
      gte(col: string, val: unknown) {
        state.filters[`${col}__gte`] = val;
        return chain;
      },
      lte(col: string, val: unknown) {
        state.filters[`${col}__lte`] = val;
        return chain;
      },
      order() {
        return chain;
      },
      ...buildTerminal(),
    };

    const insertChain = {
      select(_columns?: string) {
        return {
          single: () =>
            resolve({ ...state, filters: cloneFilters(state.filters) }),
        };
      },
      then(
        onFulfilled?: (v: ResolveResult) => unknown,
        onRejected?: (e: unknown) => unknown
      ) {
        return resolve({
          ...state,
          filters: cloneFilters(state.filters),
        }).then(onFulfilled, onRejected);
      },
    };

    const updateChain = {
      eq(col: string, val: unknown) {
        state.filters[col] = val;
        return updateChainAfterEq;
      },
    };

    const updateChainAfterEq = {
      eq(col: string, val: unknown) {
        state.filters[col] = val;
        return updateChainAfterEq;
      },
      select() {
        return {
          single: () =>
            resolve({ ...state, filters: cloneFilters(state.filters) }),
        };
      },
      then(
        onFulfilled?: (v: ResolveResult) => unknown,
        onRejected?: (e: unknown) => unknown
      ) {
        return resolve({
          ...state,
          filters: cloneFilters(state.filters),
        }).then(onFulfilled, onRejected);
      },
    };

    const deleteChain = {
      eq(col: string, val: unknown) {
        state.filters[col] = val;
        return deleteChain;
      },
      then(
        onFulfilled?: (v: ResolveResult) => unknown,
        onRejected?: (e: unknown) => unknown
      ) {
        return resolve({
          ...state,
          filters: cloneFilters(state.filters),
        }).then(onFulfilled, onRejected);
      },
    };

    return chain;
  }

  return {
    client: { from: (table: string) => startQuery(table) },
    log,
  };
}

export function tableOp(
  table: string,
  op: RecordedSupabaseOp["op"],
  fn: (record: RecordedSupabaseOp) => ResolveResult | null
): OpMatcher {
  return (record) => {
    if (record.table !== table || record.op !== op) return null;
    return fn(record);
  };
}
