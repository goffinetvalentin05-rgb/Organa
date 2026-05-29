"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FileText, Loader, Trash } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import type { MatchProgramType, PublicPageSettings } from "@/lib/public-page/types";
import { cn } from "@/components/ui";

const inputClass =
  "w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20";

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
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
        <div>
          <span className="text-sm font-medium text-white">
            {t("dashboard.settings.publicPage.matchProgram.enabled")}
          </span>
          <p className="mt-0.5 text-xs text-white/55">
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
          className="h-5 w-5 rounded accent-[#2563EB]"
        />
      </label>

      {form.showMatchProgram && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setType("external_url")}
              className={cn(
                "flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                form.matchProgramType === "external_url"
                  ? "border-blue-400 bg-blue-500/20 text-white"
                  : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
              )}
            >
              {t("dashboard.settings.publicPage.matchProgram.typeExternal")}
            </button>
            <button
              type="button"
              onClick={() => setType("pdf")}
              className={cn(
                "flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                form.matchProgramType === "pdf"
                  ? "border-blue-400 bg-blue-500/20 text-white"
                  : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
              )}
            >
              {t("dashboard.settings.publicPage.matchProgram.typePdf")}
            </button>
          </div>

          {form.matchProgramType === "external_url" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/70">
                {t("dashboard.settings.publicPage.matchProgram.urlLabel")}
              </label>
              <input
                className={inputClass}
                value={form.matchProgramUrl || ""}
                onChange={(e) =>
                  setForm({ ...form, matchProgramUrl: e.target.value, matchProgramType: "external_url" })
                }
                placeholder="https://..."
              />
              <p className="mt-1.5 text-xs text-white/50">
                {t("dashboard.settings.publicPage.matchProgram.urlHint")}
              </p>
            </div>
          )}

          {form.matchProgramType === "pdf" && (
            <div className="space-y-3 rounded-xl border border-white/15 bg-white/5 p-4">
              {form.matchProgramPdfPath ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {form.matchProgramPdfName || "programme.pdf"}
                      </p>
                      {form.matchProgramPdfUrl ? (
                        <a
                          href={form.matchProgramPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-200 hover:underline"
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
                      className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15 disabled:opacity-50"
                    >
                      {uploading
                        ? t("dashboard.settings.publicPage.matchProgram.uploading")
                        : t("dashboard.settings.publicPage.matchProgram.replacePdf")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deletePdf()}
                      disabled={deleting}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-500/20 disabled:opacity-50"
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
                  <p className="mb-3 text-sm text-white/70">
                    {t("dashboard.settings.publicPage.matchProgram.pdfEmpty")}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-xl border border-dashed border-white/25 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
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
      )}
    </div>
  );
}
