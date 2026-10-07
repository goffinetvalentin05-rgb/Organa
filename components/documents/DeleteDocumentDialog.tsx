"use client";

import { useEffect, useId, useRef, useState } from "react";
import BodyPortal from "@/components/ui/BodyPortal";
import { dashboardModalClass } from "@/components/ui/styles";
import { removalMessage, type DocumentRemoval } from "@/lib/documents/documentDeletion";

type Target = {
  id: string;
  numero: string;
  kind: "quote" | "invoice";
};

export default function DeleteDocumentDialog({
  target,
  onClose,
  onDeleted,
}: {
  target: Target | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [removal, setRemoval] = useState<DocumentRemoval | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [busy, setBusy] = useState(false);
  const open = target !== null;

  const targetId = target?.id ?? "";
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!targetId) return;
    let cancelled = false;
    setRemoval(null);
    setPreviewError("");
    setDeleteError("");
    setBusy(false);
    void fetch(`/api/documents?id=${encodeURIComponent(targetId)}&retention=1`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Impossible de préparer la suppression.");
        if (!cancelled) setRemoval(data.removal as DocumentRemoval);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setPreviewError(error instanceof Error ? error.message : "Impossible de préparer la suppression.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [targetId]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (busy) return;
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = [cancelRef.current, confirmRef.current].filter((node): node is HTMLButtonElement => Boolean(node));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, busy]);

  const confirm = async () => {
    if (!target || busy || !removal) return;
    setBusy(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/documents?id=${encodeURIComponent(target.id)}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setDeleteError(data.error || "La suppression n'a pas abouti. Le document est inchangé.");
        setBusy(false);
        return;
      }
      onDeleted();
    } catch {
      setDeleteError("La suppression n'a pas abouti. Le document est inchangé.");
      setBusy(false);
    }
  };

  const message = target && removal ? removalMessage(target.kind, removal.retention) : "";
  const title = target?.kind === "invoice" ? "Supprimer la facture" : "Supprimer la cotisation";

  return (
    <BodyPortal open={open}>
      {target ? (
        <div
          className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-[#0F172A]/50 p-4"
          role="presentation"
          onClick={(event) => {
            if (busy) return;
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            aria-busy={busy || undefined}
            className={`${dashboardModalClass} w-full max-w-md p-5 sm:p-6`}
          >
            <h2 id={titleId} className="text-lg font-semibold text-[#0F172A]">
              {title}
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#1A23FF]">{target.numero || "Sans numéro"}</p>
            <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-[#334155]">
              {previewError || message || "Vérification des liens du document…"}
            </p>
            {deleteError ? <p className="mt-3 text-sm font-medium text-red-700">{deleteError}</p> : null}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                className="rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] disabled:opacity-50"
                onClick={onClose}
                disabled={busy}
              >
                Annuler
              </button>
              <button
                ref={confirmRef}
                type="button"
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                onClick={() => void confirm()}
                disabled={busy || !removal || Boolean(previewError)}
              >
                {busy ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </BodyPortal>
  );
}
