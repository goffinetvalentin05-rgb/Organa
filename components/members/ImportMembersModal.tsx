"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { X, Upload, CheckCircle, AlertCircle, FileText } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { useMemberFieldSettings } from "@/components/member-fields/MemberFieldSettingsProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import {
  dashboardModalClass,
  dashboardSelectClass,
  dashboardSecondaryButtonClass,
  dashboardInnerPanelClass,
  dashboardHintClass,
  dashboardLabelClass,
  cn,
} from "@/components/ui";
import type { MemberFieldKey } from "@/lib/member-fields/types";
import {
  buildCsvTemplateHeaders,
  buildImportRows,
  getAvailableImportFields,
  guessColumnMapping,
  importFieldLabelKey,
  summarizeImportRows,
  type ImportMemberRow,
  type MemberImportFieldKey,
  type ParsedSpreadsheet,
} from "@/lib/clients/importMembers";
import {
  downloadCsvTemplate,
  isAcceptedImportFile,
  parseSpreadsheetFile,
} from "@/lib/clients/parseSpreadsheet";

type Step = "upload" | "mapping" | "preview" | "importing" | "success";

interface ImportMembersModalProps {
  open: boolean;
  onClose: () => void;
  existingMembers: { nom: string; email: string }[];
  onImported: () => void;
  onSuccess?: (imported: number, duplicates: number) => void;
}

interface ImportResult {
  imported: number;
  duplicates: number;
  errors: number;
}

const ERROR_MESSAGE_KEYS: Record<string, string> = {
  missing_prenom: "dashboard.clients.import.errors.missingPrenom",
  missing_nom: "dashboard.clients.import.errors.missingNom",
  invalid_birth_date: "dashboard.clients.import.errors.invalidBirthDate",
};

const FILE_ERROR_KEYS: Record<string, string> = {
  INVALID_FORMAT: "dashboard.clients.import.errors.invalidFormat",
  EMPTY_FILE: "dashboard.clients.import.errors.emptyFile",
  NO_COLUMNS: "dashboard.clients.import.errors.noColumns",
  NO_ROWS: "dashboard.clients.import.errors.noRows",
  INVALID_CSV: "dashboard.clients.import.errors.invalidCsv",
};

export default function ImportMembersModal({
  open,
  onClose,
  existingMembers,
  onImported,
  onSuccess,
}: ImportMembersModalProps) {
  const { t } = useI18n();
  const vis = useMemberFieldSettings();
  const [step, setStep] = useState<Step>("upload");
  const [fileError, setFileError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, MemberImportFieldKey | "">>({});
  const [importRows, setImportRows] = useState<ImportMemberRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const availableFields = useMemo(() => getAvailableImportFields(vis), [vis]);

  const fieldLabels = useMemo(() => {
    const labels: Record<MemberFieldKey, string> = {
      email: t("dashboard.clients.fields.email"),
      phone: t("dashboard.clients.fields.phone"),
      address: t("dashboard.clients.fields.address"),
      birth_date: t("dashboard.clients.fields.dateOfBirth"),
      category: t("dashboard.clients.fields.category"),
      role: t("dashboard.clients.fields.role"),
      avs_number: t("dashboard.clients.fields.avsNumber"),
    };
    return labels;
  }, [t]);

  const summary = useMemo(() => summarizeImportRows(importRows), [importRows]);

  const reset = useCallback(() => {
    setStep("upload");
    setFileError(null);
    setParsed(null);
    setColumnMapping({});
    setImportRows([]);
    setImportResult(null);
    setDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleSuccessClose = useCallback(() => {
    reset();
    if (importResult && onSuccess) {
      onSuccess(importResult.imported, importResult.duplicates);
    } else {
      onClose();
    }
  }, [importResult, onClose, onSuccess, reset]);

  const handleFile = useCallback(
    async (file: File) => {
      setFileError(null);
      if (!isAcceptedImportFile(file)) {
        setFileError(t("dashboard.clients.import.errors.invalidFormat"));
        return;
      }
      try {
        const data = await parseSpreadsheetFile(file);
        const mapping = guessColumnMapping(data.headers);
        setParsed(data);
        setColumnMapping(mapping);
        setStep("mapping");
      } catch (err) {
        const code = err instanceof Error ? err.message : "INVALID_FORMAT";
        const key = FILE_ERROR_KEYS[code] || FILE_ERROR_KEYS.INVALID_FORMAT;
        setFileError(t(key));
      }
    },
    [t]
  );

  const handleMappingNext = useCallback(() => {
    if (!parsed) return;
    const hasPrenom = Object.values(columnMapping).includes("prenom");
    const hasNom = Object.values(columnMapping).includes("nom");
    if (!hasPrenom || !hasNom) {
      toast.error(t("dashboard.clients.import.errors.mappingRequired"));
      return;
    }
    const rows = buildImportRows(parsed, columnMapping, existingMembers);
    setImportRows(rows);
    setStep("preview");
  }, [columnMapping, existingMembers, parsed, t]);

  const handleImport = useCallback(async () => {
    const validRows = importRows.filter((r) => r.status === "valid");
    if (validRows.length === 0) {
      toast.error(t("dashboard.clients.import.errors.noValidRows"));
      return;
    }
    setStep("importing");
    try {
      const res = await fetch("/api/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: validRows.map((r) => ({
            prenom: r.prenom,
            nom: r.nom,
            email: r.email,
            telephone: r.telephone,
            adresse: r.adresse,
            postal_code: r.postal_code,
            city: r.city,
            role: r.role,
            category: r.category,
            date_of_birth: r.date_of_birth,
            avs_number: r.avs_number,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "LIMIT_REACHED") {
          toast.error(data.message || t("dashboard.clients.limitReached"));
        } else {
          toast.error(
            typeof data.error === "string"
              ? data.error
              : t("dashboard.clients.import.errors.importFailed")
          );
        }
        setStep("preview");
        return;
      }
      setImportResult({
        imported: data.imported ?? 0,
        duplicates: data.duplicates ?? 0,
        errors: data.errors ?? 0,
      });
      setStep("success");
      onImported();
    } catch {
      toast.error(t("dashboard.clients.import.errors.importFailed"));
      setStep("preview");
    }
  }, [importRows, onImported, t]);

  const handleDownloadTemplate = useCallback(() => {
    const headers = buildCsvTemplateHeaders(vis, fieldLabels);
    downloadCsvTemplate(headers);
  }, [fieldLabels, vis]);

  const updateMapping = (header: string, value: MemberImportFieldKey | "") => {
    setColumnMapping((prev) => {
      const next = { ...prev };
      if (value) {
        for (const [h, v] of Object.entries(next)) {
          if (h !== header && v === value) next[h] = "";
        }
      }
      next[header] = value;
      return next;
    });
  };

  if (!open) return null;

  return createPortal(
    <ModalOverlay onClose={step === "success" ? handleSuccessClose : handleClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-members-modal-title"
        className={cn(
          "pointer-events-auto relative z-[2] flex w-full min-h-0 flex-col",
          "max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-1.5rem))]",
          "max-w-[calc(100vw-1.5rem)] sm:max-w-2xl",
          dashboardModalClass
        )}
      >
        <ModalHeader
          step={step}
          onClose={step === "success" ? handleSuccessClose : handleClose}
          title={t("dashboard.clients.import.title")}
          subtitle={t(`dashboard.clients.import.steps.${step === "importing" ? "preview" : step}`)}
        />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {step === "upload" && (
            <UploadStep
              fileError={fileError}
              dragOver={dragOver}
              onDragOver={(v) => setDragOver(v)}
              onFile={handleFile}
              onDownloadTemplate={handleDownloadTemplate}
              t={t}
            />
          )}

          {step === "mapping" && parsed && (
            <MappingStep
              parsed={parsed}
              columnMapping={columnMapping}
              availableFields={availableFields}
              onMappingChange={updateMapping}
              t={t}
            />
          )}

          {(step === "preview" || step === "importing") && (
            <PreviewStep rows={importRows} summary={summary} t={t} />
          )}

          {step === "success" && importResult && (
            <SuccessStep result={importResult} t={t} />
          )}
        </div>

        <ModalFooter
          step={step}
          summary={summary}
          onBack={() => {
            if (step === "mapping") setStep("upload");
            else if (step === "preview") setStep("mapping");
          }}
          onNext={() => {
            if (step === "mapping") handleMappingNext();
            else if (step === "preview") handleImport();
            else if (step === "success") handleSuccessClose();
          }}
          onClose={step === "success" ? handleSuccessClose : handleClose}
          importing={step === "importing"}
          t={t}
        />
      </div>
    </ModalOverlay>,
    document.body
  );
}

function ModalOverlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 z-0 bg-slate-950/70 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="relative z-[1] flex w-full max-w-2xl min-h-0 items-center justify-center pointer-events-none">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  step,
  onClose,
  title,
  subtitle,
}: {
  step: Step;
  onClose: () => void;
  title: string;
  subtitle: string;
}) {
  const steps: Step[] = ["upload", "mapping", "preview", "success"];
  const stepIndex = steps.indexOf(step === "importing" ? "preview" : step);

  return (
    <div className="shrink-0 border-b border-white/10 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
            {subtitle}
          </p>
          <h2 id="import-members-modal-title" className="mt-1 text-xl font-bold text-white">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {step !== "success" && step !== "importing" && (
        <div className="mt-4 flex gap-2">
          {steps.slice(0, 3).map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= stepIndex ? "bg-blue-500" : "bg-white/10"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadStep({
  fileError,
  dragOver,
  onDragOver,
  onFile,
  onDownloadTemplate,
  t,
}: {
  fileError: string | null;
  dragOver: boolean;
  onDragOver: (v: boolean) => void;
  onFile: (file: File) => void;
  onDownloadTemplate: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      <label
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver
            ? "border-blue-400/60 bg-blue-500/10"
            : "border-white/20 bg-white/[0.03] hover:border-blue-400/40 hover:bg-white/[0.06]"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver(true);
        }}
        onDragLeave={() => onDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          onDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) onFile(file);
        }}
      >
        <Upload className="mb-3 h-10 w-10 text-blue-300" />
        <p className="font-medium text-white">{t("dashboard.clients.import.uploadLabel")}</p>
        <p className={cn("mt-1", dashboardHintClass)}>
          {t("dashboard.clients.import.uploadHint")}
        </p>
        <input
          type="file"
          accept=".csv,.xlsx"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </label>

      {fileError && (
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {fileError}
        </p>
      )}

      <button
        type="button"
        onClick={onDownloadTemplate}
        className="text-sm text-blue-300 underline-offset-2 hover:text-blue-200 hover:underline"
      >
        {t("dashboard.clients.import.downloadTemplate")}
      </button>
    </div>
  );
}

function MappingStep({
  parsed,
  columnMapping,
  availableFields,
  onMappingChange,
  t,
}: {
  parsed: ParsedSpreadsheet;
  columnMapping: Record<string, MemberImportFieldKey | "">;
  availableFields: MemberImportFieldKey[];
  onMappingChange: (header: string, value: MemberImportFieldKey | "") => void;
  t: (key: string) => string;
}) {
  const previewRows = parsed.rows.slice(0, 3);

  return (
    <div className="space-y-5">
      <p className={dashboardHintClass}>{t("dashboard.clients.import.mappingHint")}</p>

      <div className="space-y-3">
        {parsed.headers.map((header) => (
          <div
            key={header}
            className={cn(dashboardInnerPanelClass, "flex flex-col gap-2 p-4 sm:flex-row sm:items-center")}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{header || "—"}</p>
              {previewRows[0] && (
                <p className="mt-0.5 truncate text-xs text-white/50">
                  ex. {previewRows[0][parsed.headers.indexOf(header)] || "—"}
                </p>
              )}
            </div>
            <select
              value={columnMapping[header] || ""}
              onChange={(e) =>
                onMappingChange(header, (e.target.value || "") as MemberImportFieldKey | "")
              }
              className={cn(dashboardSelectClass, "sm:w-52")}
            >
              <option value="">{t("dashboard.clients.import.ignoreColumn")}</option>
              {availableFields.map((field) => (
                <option key={field} value={field}>
                  {t(importFieldLabelKey(field))}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {parsed.rows.length > 0 && (
        <div className={dashboardInnerPanelClass}>
          <p className={cn(dashboardLabelClass, "px-4 pt-4")}>
            {t("dashboard.clients.import.previewSample")}
          </p>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs text-white/80">
              <thead>
                <tr className="border-b border-white/10">
                  {parsed.headers.map((h) => (
                    <th key={h} className="px-2 py-2 font-medium text-white/60">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {row.map((cell, j) => (
                      <td key={j} className="max-w-[120px] truncate px-2 py-2">
                        {cell || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewStep({
  rows,
  summary,
  t,
}: {
  rows: ImportMemberRow[];
  summary: ReturnType<typeof summarizeImportRows>;
  t: (key: string) => string;
}) {
  const statusClass: Record<ImportMemberRow["status"], string> = {
    valid: "text-emerald-300",
    error: "text-red-300",
    duplicate: "text-amber-300",
  };

  const statusLabel: Record<ImportMemberRow["status"], string> = {
    valid: t("dashboard.clients.import.status.valid"),
    error: t("dashboard.clients.import.status.error"),
    duplicate: t("dashboard.clients.import.status.duplicate"),
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label={t("dashboard.clients.import.summary.total")} value={summary.total} />
        <SummaryCard
          label={t("dashboard.clients.import.summary.valid")}
          value={summary.valid}
          accent="text-emerald-300"
        />
        <SummaryCard
          label={t("dashboard.clients.import.summary.errors")}
          value={summary.errors}
          accent="text-red-300"
        />
        <SummaryCard
          label={t("dashboard.clients.import.summary.duplicates")}
          value={summary.duplicates}
          accent="text-amber-300"
        />
      </div>

      <div className={cn(dashboardInnerPanelClass, "max-h-64 overflow-y-auto")}>
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-900/95">
            <tr className="border-b border-white/10 text-xs text-white/55">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">{t("dashboard.clients.import.fields.prenom")}</th>
              <th className="px-3 py-2">{t("dashboard.clients.import.fields.nom")}</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">{t("dashboard.common.status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 50).map((row) => (
              <tr key={row.rowIndex} className="border-b border-white/5">
                <td className="px-3 py-2 text-white/50">{row.rowIndex}</td>
                <td className="px-3 py-2 text-white/90">{row.prenom || "—"}</td>
                <td className="px-3 py-2 text-white/90">{row.nom || "—"}</td>
                <td className="max-w-[140px] truncate px-3 py-2 text-white/70">
                  {row.email || "—"}
                </td>
                <td className={cn("px-3 py-2 text-xs font-medium", statusClass[row.status])}>
                  {statusLabel[row.status]}
                  {row.errors.length > 0 && (
                    <span className="mt-0.5 block text-white/45">
                      {row.errors
                        .map((e) => t(ERROR_MESSAGE_KEYS[e] || e))
                        .join(", ")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 50 && (
          <p className={cn(dashboardHintClass, "p-3 text-center")}>
            {t("dashboard.clients.import.previewTruncated").replace("{count}", String(rows.length))}
          </p>
        )}
      </div>

      {summary.valid > 0 && (
        <p className={dashboardHintClass}>
          {t("dashboard.clients.import.confirmHint").replace("{count}", String(summary.valid))}
        </p>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className={cn(dashboardInnerPanelClass, "p-3 text-center")}>
      <p className="text-xs text-white/55">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold text-white", accent)}>{value}</p>
    </div>
  );
}

function SuccessStep({
  result,
  t,
}: {
  result: ImportResult;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
        <CheckCircle className="h-8 w-8 text-emerald-300" />
      </div>
      <h3 className="text-lg font-semibold text-white">
        {t("dashboard.clients.import.successTitle")}
      </h3>
      <p className="mt-2 text-sm text-white/70">
        {t("dashboard.clients.import.successMessage")
          .replace("{imported}", String(result.imported))
          .replace("{duplicates}", String(result.duplicates))}
      </p>
      {result.errors > 0 && (
        <p className="mt-2 flex items-center gap-1 text-sm text-amber-300">
          <AlertCircle className="h-4 w-4" />
          {t("dashboard.clients.import.successErrors").replace("{count}", String(result.errors))}
        </p>
      )}
    </div>
  );
}

function ModalFooter({
  step,
  summary,
  onBack,
  onNext,
  onClose,
  importing,
  t,
}: {
  step: Step;
  summary: ReturnType<typeof summarizeImportRows>;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
  importing: boolean;
  t: (key: string) => string;
}) {
  if (step === "upload") {
    return (
      <div className="shrink-0 flex justify-end border-t border-white/10 p-3 sm:p-4">
        <button type="button" onClick={onClose} className={dashboardSecondaryButtonClass}>
          {t("dashboard.common.cancel")}
        </button>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="shrink-0 flex justify-end border-t border-white/10 p-3 sm:p-4">
        <DashboardPrimaryButton type="button" onClick={onNext} icon="none">
          {t("dashboard.clients.import.close")}
        </DashboardPrimaryButton>
      </div>
    );
  }

  return (
    <div className="shrink-0 flex flex-col-reverse gap-3 border-t border-white/10 p-3 sm:flex-row sm:justify-between sm:p-4">
      <button
        type="button"
        onClick={step === "preview" ? onBack : onBack}
        disabled={importing}
        className={cn(dashboardSecondaryButtonClass, "sm:min-w-[120px]")}
      >
        {t("dashboard.clients.import.back")}
      </button>
      <DashboardPrimaryButton
        type="button"
        onClick={onNext}
        disabled={importing || (step === "preview" && summary.valid === 0)}
        icon="none"
        className="justify-center sm:min-w-[160px]"
      >
        {importing ? (
          t("dashboard.clients.import.importing")
        ) : step === "mapping" ? (
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t("dashboard.clients.import.continueToPreview")}
          </span>
        ) : (
          t("dashboard.clients.import.confirmImport").replace("{count}", String(summary.valid))
        )}
      </DashboardPrimaryButton>
    </div>
  );
}
