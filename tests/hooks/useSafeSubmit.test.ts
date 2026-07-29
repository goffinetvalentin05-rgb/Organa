import { describe, expect, it, vi } from "vitest";

/**
 * Logique de garde anti double-soumission (extrait de useSafeSubmit).
 * Testée hors React pour rester stable sans jsdom.
 */
function createSubmitGuard() {
  let submitting = false;

  return async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (submitting) return undefined;
    submitting = true;
    try {
      return await fn();
    } finally {
      submitting = false;
    }
  };
}

describe("useSafeSubmit garde", () => {
  it("bloque un second appel concurrent", async () => {
    const guard = createSubmitGuard();
    let resolveFirst!: () => void;
    const firstPromise = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });

    const op = vi.fn(async () => {
      await firstPromise;
      return "ok";
    });

    const p1 = guard(op);
    const p2 = guard(op);

    expect(op).toHaveBeenCalledTimes(1);
    resolveFirst();
    await expect(p1).resolves.toBe("ok");
    await expect(p2).resolves.toBeUndefined();
  });

  it("autorise un nouvel appel après fin", async () => {
    const guard = createSubmitGuard();
    const op = vi.fn(async () => "done");

    await expect(guard(op)).resolves.toBe("done");
    await expect(guard(op)).resolves.toBe("done");
    expect(op).toHaveBeenCalledTimes(2);
  });
});
