"use client";

import { useCallback, useRef, useState } from "react";

type UseSafeSubmitOptions = {
  // Show a lightweight Obillz overlay only if the request takes longer
  // than this threshold (to avoid “flash” on fast actions).
  overlayDelayMs?: number;
};

function makeIdempotencyKey() {
  // Prefer the Web Crypto UUID when available.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback (should still be unique enough for client-side dedupe).
  return `idemp_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function useSafeSubmit(options: UseSafeSubmitOptions = {}) {
  const overlayDelayMs = options.overlayDelayMs ?? 450;

  const submittingRef = useRef(false);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  const run = useCallback(
    async <T,>(
      fn: (key: string) => Promise<T>
    ): Promise<T | undefined> => {
      if (submittingRef.current) return undefined;

      submittingRef.current = true;
      setIsSubmitting(true);
      setShowOverlay(false);

      const key = makeIdempotencyKey();
      setIdempotencyKey(key);

      overlayTimerRef.current = setTimeout(() => {
        setShowOverlay(true);
      }, overlayDelayMs);

      try {
        return await fn(key);
      } finally {
        if (overlayTimerRef.current) {
          clearTimeout(overlayTimerRef.current);
          overlayTimerRef.current = null;
        }
        submittingRef.current = false;
        setIsSubmitting(false);
        setShowOverlay(false);
        setIdempotencyKey(null);
      }
    },
    [overlayDelayMs]
  );

  return {
    isSubmitting,
    showOverlay,
    idempotencyKey,
    run,
  };
}

