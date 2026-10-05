/**
 * Rubriques facultatives du plan.
 * Une rubrique totalise des comptes. Elle ne reçoit aucune écriture.
 */

export type AccountGroup = {
  id: string;
  number: string;
  name: string;
  accountIds: string[];
};

export type GroupAccountRef = {
  id: string;
  number: string;
};

const NUMBER = /^\d{3,6}$/;

export function findGroupCycle(edges: Array<{ from: string; to: string }>): string[] | null {
  const next = new Map<string, string[]>();
  for (const edge of edges) {
    const list = next.get(edge.from) ?? [];
    list.push(edge.to);
    next.set(edge.from, list);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  function walk(node: string): string[] | null {
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      return start >= 0 ? stack.slice(start) : [node];
    }
    if (visited.has(node)) return null;
    visiting.add(node);
    stack.push(node);
    for (const child of next.get(node) ?? []) {
      const cycle = walk(child);
      if (cycle) return cycle;
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
    return null;
  }

  for (const node of next.keys()) {
    const cycle = walk(node);
    if (cycle) return cycle;
  }
  return null;
}

export function assessAccountGroup(input: {
  group: { id?: string; number: string; name: string; accountIds: string[] };
  accounts: GroupAccountRef[];
  otherGroups: AccountGroup[];
}): { ok: true; number: string; name: string; accountIds: string[] } | { ok: false; message: string } {
  const number = input.group.number.trim();
  const name = input.group.name.trim();
  if (!NUMBER.test(number)) return { ok: false, message: "Le numéro de rubrique comporte 3 à 6 chiffres." };
  if (!name) return { ok: false, message: "La rubrique a besoin d’un nom." };

  const accountIds = [...new Set(input.group.accountIds.map((id) => id.trim()).filter(Boolean))];
  if (accountIds.length < 2) {
    return { ok: false, message: "Une rubrique totalise au moins deux comptes." };
  }

  const known = new Map(input.accounts.map((account) => [account.id, account]));
  for (const accountId of accountIds) {
    if (!known.has(accountId)) return { ok: false, message: "Un compte de la rubrique est introuvable." };
  }

  if (input.accounts.some((account) => account.number === number)) {
    return {
      ok: false,
      message: "Ce numéro est déjà un compte qui reçoit des écritures. Une rubrique ne reçoit pas d’écritures : choisissez un numéro libre.",
    };
  }

  const groupIds = new Set(input.otherGroups.map((group) => group.id));
  if (input.group.id) groupIds.add(input.group.id);
  if (accountIds.some((accountId) => groupIds.has(accountId))) {
    return { ok: false, message: "Une rubrique totalise des comptes, pas d’autres rubriques." };
  }

  if (input.otherGroups.some((group) => group.number === number)) {
    return { ok: false, message: "Ce numéro de rubrique est déjà utilisé." };
  }

  for (const accountId of accountIds) {
    const owner = input.otherGroups.find((group) => group.accountIds.includes(accountId));
    if (owner) {
      const account = known.get(accountId);
      return {
        ok: false,
        message: `Le compte ${account?.number || ""} est déjà dans la rubrique ${owner.number}. Un compte ne peut appartenir qu’à une rubrique.`,
      };
    }
  }

  return { ok: true, number, name, accountIds };
}
