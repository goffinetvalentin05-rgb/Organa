"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FileText, Loader, Trash } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import type { MatchProgramType, PublicPageSettings } from "@/lib/public-page/types";
import { cn } from "@/components/ui";
import {
  ppCheckboxClass,
  ppDangerButtonClass,
  ppDashedButtonClass,
  ppDisabledBlockClass,
  ppHintClass,
  ppInputClass,
  ppLabelClass,
  ppPanelClass,
  ppSecondaryButtonClass,
  ppSegmentActive,
  ppSegmentBase,
  ppSegmentInactive,
  ppToggleHintClass,
  ppToggleRowClass,
  ppToggleTitleClass,
} from "./settings-styles";

export default function MatchProgramSettings({
  form,
  setForm,
}: {
  form: PublicPageSettings;
  setForm: (next: PublicPageSettings) => void;
}) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const setType = (type: MatchProgramType) => {
    setForm({
      ...form,
      matchProgramType: type,
      matchProgramUrl: type === "external_url" ? form.matchProgramUrl : null,
    });
  };

  const uploadPdf = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/settings/public-page/match-program-pdf", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload impossible");
      setForm({
        ...form,
        showMatchProgram: true,
        matchProgramType: "pdf",
        matchProgramPdfPath: data.settings?.matchProgramPdfPath ?? form.matchProgramPdfPath,
        matchProgramPdfName: data.settings?.matchProgramPdfName ?? file.name,
        matchProgramPdfUrl: data.pdfUrl ?? data.settings?.matchProgramPdfUrl ?? null,
        matchProgramUrl: null,
      });
      toast.success(t("dashboard.settings.publicPage.matchProgram.pdfUploaded"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deletePdf = async () => {
    if (!form.matchProgramPdfPath) return;
    if (!confirm(t("dashboard.settings.publicPage.matchProgram.deleteConfirm"))) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/settings/public-page/match-program-pdf", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Suppression impossible");
      setForm({
        ...form,
        matchProgramType: null,
        matchProgramPdfPath: null,
        matchProgramPdfName: null,
        matchProgramPdfUrl: null,
      });
      toast.success(t("dashboard.settings.publicPage.matchProgram.pdfDeleted"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className={ppToggleRowClass}>
        <div>
          <span className={ppToggleTitleClass}>
            {t("dashboard.settings.publicPage.matchProgram.enabled")}
          </span>
          <p className={ppToggleHintClass}>
            {t("dashboard.settings.publicPage.matchProgram.enabledHint")}
          </p>
        </div>
        <input
          type="checkbox"
          checked={form.showMatchProgram}
          onChange={(e) =>
            setForm({
              ...form,
              showMatchProgram: e.target.checked,
            })
          }
          className={ppCheckboxClass}
        />
      </label>

      <div className={cn(!form.showMatchProgram && ppDisabledBlockClass)}>
        {form.showMatchProgram ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setType("external_url")}
                className={cn(
                  ppSegmentBase,
                  form.matchProgramType === "external_url" ? ppSegmentActive : ppSegmentInactive
                )}
              >
                {t("dashboard.settings.publicPage.matchProgram.typeExternal")}
              </button>
              <button
                type="button"
                onClick={() => setType("pdf")}
                className={cn(
                  ppSegmentBase,
                  form.matchProgramType === "pdf" ? ppSegmentActive : ppSegmentInactive
                )}
              >
                {t("dashboard.settings.publicPage.matchProgram.typePdf")}
              </button>
            </div>

            {form.matchProgramType === "external_url" && (
              <div>
                <label className={ppLabelClass}>
                  {t("dashboard.settings.publicPage.matchProgram.urlLabel")}
                </label>
                <input
                  className={ppInputClass}
                  value={form.matchProgramUrl || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      matchProgramUrl: e.target.value,
                      matchProgramType: "external_url",
                    })
                  }
                  placeholder="https://..."
                />
                <p className={ppHintClass}>
                  {t("dashboard.settings.publicPage.matchProgram.urlHint")}
                </p>
              </div>
            )}

            {form.matchProgramType === "pdf" && (
              <div className={ppPanelClass}>
                {form.matchProgramPdfPath ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {form.matchProgramPdfName || "programme.pdf"}
                        </p>
                        {form.matchProgramPdfUrl ? (
                          <a
                            href={form.matchProgramPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-[#2563EB] hover:underline"
                          >
                            {t("dashboard.settings.publicPage.matchProgram.previewPdf")}
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className={ppSecondaryButtonClass}
                      >
                        {uploading
                          ? t("dashboard.settings.publicPage.matchProgram.uploading")
                          : t("dashboard.settings.publicPage.matchProgram.replacePdf")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deletePdf()}
                        disabled={deleting}
                        className={ppDangerButtonClass}
                      >
                        {deleting ? (
                          <Loader className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash className="h-3.5 w-3.5" />
                        )}
                        {t("dashboard.settings.publicPage.matchProgram.deletePdf")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="mb-3 text-sm text-slate-600">
                      {t("dashboard.settings.publicPage.matchProgram.pdfEmpty")}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className={ppDashedButtonClass}
                    >
                      {uploading && <Loader className="h-4 w-4 animate-spin" />}
                      {t("dashboard.settings.publicPage.matchProgram.uploadPdf")}
                    </button>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadPdf(file);
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <p className={ppHintClass}>
            {t("dashboard.settings.publicPage.matchProgram.disabledHint")}
          </p>
        )}
      </div>
    </div>
  );
}
