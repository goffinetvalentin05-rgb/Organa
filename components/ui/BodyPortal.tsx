"use client";

import { useLayoutEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const PORTAL_ROOT_ID = "obillz-portal-root";

function usePortalRoot(): HTMLElement | null {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    let el = document.getElementById(PORTAL_ROOT_ID);
    if (!el) {
      el = document.createElement("div");
      el.id = PORTAL_ROOT_ID;
      el.className = "fixed inset-0 z-[9999] pointer-events-none";
      document.body.appendChild(el);
    }
    setRoot(el);
  }, []);

  return root;
}

/**
 * Monte des enfants dans #obillz-portal-root (ou le crée sur body).
 * Toujours retourner ce composant (ne pas alterner null / portal dans le parent).
 */
export default function BodyPortal({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  const isBrowser = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const root = usePortalRoot();

  if (!open || !isBrowser || !root) return null;

  return createPortal(children, root);
}
