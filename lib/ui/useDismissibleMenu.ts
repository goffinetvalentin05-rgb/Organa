"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Ferme un menu au clic extérieur (pointerdown) et avec Escape.
 * pointerdown plutôt que mousedown : évite de « manger » le premier clic
 * et de laisser le menu ouvert jusqu’au second.
 */
export function useDismissibleMenu(
  open: boolean,
  onClose: () => void
): RefObject<HTMLDivElement | null> {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return rootRef;
}
