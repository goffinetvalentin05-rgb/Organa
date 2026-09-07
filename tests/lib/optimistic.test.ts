import { describe, expect, it, vi } from "vitest";
import {
  createMutationGuard,
  isInteractiveTarget,
  runOptimisticUpdate,
} from "@/lib/ui/optimistic";

describe("runOptimisticUpdate", () => {
  it("applies the next value immediately then persists", async () => {
    const values: string[] = [];
    const persist = vi.fn(async () => {
      values.push("persisted");
    });

    await runOptimisticUpdate({
      previous: "off",
      next: "on",
      apply: (value) => values.push(value),
      persist,
    });

    expect(values).toEqual(["on", "persisted"]);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("rolls back and reports the error if persist fails", async () => {
    const values: string[] = [];
    const onError = vi.fn();

    await runOptimisticUpdate({
      previous: "off",
      next: "on",
      apply: (value) => values.push(value),
      persist: async () => {
        throw new Error("fail");
      },
      onError,
    });

    expect(values).toEqual(["on", "off"]);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe("createMutationGuard", () => {
  it("lets the first click through and ignores a concurrent second call", async () => {
    const guard = createMutationGuard();
    let started = 0;
    let finished = 0;
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const first = guard.run(async () => {
      started += 1;
      await gate;
      finished += 1;
      return "ok";
    });
    const second = guard.run(async () => {
      started += 1;
      finished += 1;
      return "skip";
    });

    expect(started).toBe(1);
    release();
    await expect(first).resolves.toBe("ok");
    await expect(second).resolves.toBeUndefined();
    expect(started).toBe(1);
    expect(finished).toBe(1);
  });

  it("allows a new mutation after the first one finished", async () => {
    const guard = createMutationGuard();
    await guard.run(async () => "one");
    const result = await guard.run(async () => "two");
    expect(result).toBe("two");
  });
});

describe("isInteractiveTarget", () => {
  it("returns false for non-elements", () => {
    expect(isInteractiveTarget(null)).toBe(false);
  });
});
