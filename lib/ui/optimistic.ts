/**
 * Mises à jour optimistes + garde anti double-mutation.
 * Le feedback visuel part au premier clic ; l’API suit en arrière-plan.
 */

export async function runOptimisticUpdate<T>(options: {
  apply: (value: T) => void;
  next: T;
  previous: T;
  persist: () => Promise<void>;
  onError?: (error: unknown) => void;
}): Promise<void> {
  options.apply(options.next);
  try {
    await options.persist();
  } catch (error) {
    options.apply(options.previous);
    options.onError?.(error);
  }
}

export function createMutationGuard() {
  let pending = false;
  return {
    get pending() {
      return pending;
    },
    async run<T>(fn: () => Promise<T>): Promise<T | undefined> {
      if (pending) return undefined;
      pending = true;
      try {
        return await fn();
      } finally {
        pending = false;
      }
    },
  };
}

export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!target || typeof Element === "undefined") return false;
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "a, button, input, select, textarea, label, [role='button'], [role='menuitem'], [role='option'], [role='switch']"
    )
  );
}
