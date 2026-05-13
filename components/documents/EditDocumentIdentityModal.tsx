"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { X } from "@/lib/icons";
import { ActionButton } from "@/components/ui";
import {
  DOCUMENT_NUMERO_MAX_LENGTH,
  DOCUMENT_TITLE_MAX_LENGTH,
} from "@/lib/documents/identityLimits";

export type DocumentIdentityKind = "invoice" | "quote";

interface EditDocumentIdentityModalProps {
  open: boolean;
  onClose: () => void;
  kind: DocumentIdentityKind;
  initialNumero: string;
  initialTitle: string;
  documentId: string;
  onSaved: (next: { numero: string; title: string }) => void;
}

export default function EditDocumentIdentityModal({
  open,
  onClose,
  kind,
  initialNumero,
  initialTitle,
  documentId,
  onSaved,
}: EditDocumentIdentityModalProps) {
  const { t } = useI18n();
  const [numero, setNumero] = useState(initialNumero);
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNumero(initialNumero);
      setTitle(initialTitle);
      setLocalError(null);
      setSaving(false);
    }
  }, [open, initialNumero, initialTitle]);

  if (!open) return null;

  const type = kind === "invoice" ? "invoice" : "quote";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const n = numero.trim();
    const ti = title.trim();
    if (!n || !ti) {
      setLocalError(t("dashboard.documents.identityEdit.errorEmpty"));
      return;
    }
    if (n.length > DOCUMENT_NUMERO_MAX_LENGTH || ti.length > DOCUMENT_TITLE_MAX_LENGTH) {
      setLocalError(t("dashboard.documents.identityEdit.errorTooLong"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: documentId,
          type,
          numero: n,
          title: ti,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || t("dashboard.documents.identityEdit.errorGeneric"));
      }
      onSaved({ numero: data.numero ?? n, title: data.title ?? ti });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("dashboard.documents.identityEdit.errorGeneric");
      setLocalError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-label={t("dashboard.common.cancel")}
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {kind === "invoice"
                ? t("dashboard.documents.identityEdit.modalTitleInvoice")
                : t("dashboard.documents.identityEdit.modalTitleQuote")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("dashboard.documents.identityEdit.modalHint")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="doc-identity-numero" className="mb-1.5 block text-sm font-medium text-slate-700">
              {kind === "invoice"
                ? t("dashboard.documents.identityEdit.referenceInvoice")
                : t("dashboard.documents.identityEdit.referenceQuote")}
            </label>
            <input
              id="doc-identity-numero"
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              maxLength={DOCUMENT_NUMERO_MAX_LENGTH}
              className="input-obillz w-full"
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-slate-400">
              {t("dashboard.documents.identityEdit.maxChars", {
                max: DOCUMENT_NUMERO_MAX_LENGTH,
              })}
            </p>
          </div>
          <div>
            <label htmlFor="doc-identity-title" className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("dashboard.documents.identityEdit.titleLabel")}
            </label>
            <input
              id="doc-identity-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={DOCUMENT_TITLE_MAX_LENGTH}
              className="input-obillz w-full"
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-slate-400">
              {t("dashboard.documents.identityEdit.maxChars", {
                max: DOCUMENT_TITLE_MAX_LENGTH,
              })}
            </p>
          </div>

          {localError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {localError}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <ActionButton type="button" variant="ghost" onClick={onClose} disabled={saving}>
              {t("dashboard.common.cancel")}
            </ActionButton>
            <ActionButton type="submit" disabled={saving} className="min-w-[120px] justify-center">
              {saving ? t("dashboard.common.saving") : t("dashboard.documents.identityEdit.save")}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
