"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import {
  ActionButton,
  DetailPageHeader,
  PageLayout,
  cn,
  dashboardTabActiveClass,
  dashboardTabInactiveClass,
} from "@/components/ui";
import VisualCanvas from "@/components/visuals/VisualCanvas";
import VisualConfigPanel from "@/components/visuals/VisualConfigPanel";
import { useI18n } from "@/components/I18nProvider";
import { usePermissions } from "@/lib/auth/permissions-client";
import { notifyError, notifySuccess } from "@/lib/notify";
import { createMutationGuard } from "@/lib/ui/optimistic";
import { buildNewVisualData, defaultVisualTitle, visualDownloadFilename } from "@/lib/visuals/data";
import { downloadDataUrl, exportVisualPng } from "@/lib/visuals/export";
import { getVisualTemplate } from "@/lib/visuals/templates/registry";
import {
  VISUAL_FORMAT_SIZE,
  type VisualClubContext,
  type VisualData,
  type VisualFormat,
  type VisualRecord,
} from "@/lib/visuals/types";

type Props = {
  visualId?: string;
  templateId?: string;
};

export default function VisualEditor({ visualId, templateId }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const { has, loading: permsLoading } = usePermissions();
  const canManage = has("manage_visuals");
  const canView = has("view_visuals");

  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<VisualClubContext | null>(null);
  const [savedId, setSavedId] = useState<string | null>(visualId ?? null);
  const [activeTemplateId, setActiveTemplateId] = useState(templateId ?? "");
  const [format, setFormat] = useState<VisualFormat>("story");
  const [data, setData] = useState<VisualData>(() => buildNewVisualData(templateId ?? "", null));
  const [mobilePane, setMobilePane] = useState<"preview" | "edit">("preview");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.32);
  const exportRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const saveGuard = useRef(createMutationGuard());
  const exportGuard = useRef(createMutationGuard());

  const template = getVisualTemplate(activeTemplateId);

  useEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;
    const update = () => {
      const maxW = Math.max(240, el.clientWidth - 8);
      const native = VISUAL_FORMAT_SIZE[format].width;
      setPreviewScale(Math.min(0.42, maxW / native));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [format]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const contextRes = await fetch("/api/visuals/context", { cache: "no-store" });
        const contextJson = await contextRes.json().catch(() => ({}));
        const ctx = (contextJson.context ?? null) as VisualClubContext | null;
        if (!cancelled) setClub(ctx);

        if (visualId) {
          const res = await fetch(`/api/visuals/${visualId}`, { cache: "no-store" });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json.error || t("dashboard.visuals.loadError"));
          const visual = json.visual as VisualRecord;
          if (cancelled) return;
          setSavedId(visual.id);
          setActiveTemplateId(visual.templateId);
          setFormat(visual.format);
          setData(visual.data);
        } else {
          const id = templateId || "";
          if (cancelled) return;
          setActiveTemplateId(id);
          const tpl = getVisualTemplate(id);
          setFormat(tpl?.defaultFormat ?? "story");
          setData(buildNewVisualData(id, ctx));
        }
      } catch (e) {
        if (!cancelled) {
          notifyError(e instanceof Error ? e.message : t("dashboard.visuals.loadError"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [templateId, visualId, t]);

  const patchData = useCallback((patch: Partial<VisualData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const save = useCallback(async () => {
    if (!template || !canManage) return;
    await saveGuard.current.run(async () => {
      setSaving(true);
      try {
        const payload = {
          templateId: template.id,
          format,
          title: defaultVisualTitle(template.id, data),
          data,
        };
        const res = await fetch(savedId ? `/api/visuals/${savedId}` : "/api/visuals", {
          method: savedId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || t("dashboard.visuals.saveError"));
        const visual = json.visual as VisualRecord;
        setSavedId(visual.id);
        notifySuccess(t("dashboard.visuals.saved"));
        if (!savedId) {
          router.replace(`/tableau-de-bord/visuels/${visual.id}`);
        }
      } catch (e) {
        notifyError(e instanceof Error ? e.message : t("dashboard.visuals.saveError"));
      } finally {
        setSaving(false);
      }
    });
  }, [canManage, data, format, router, savedId, t, template]);

  const download = useCallback(async () => {
    if (!template) return;
    await exportGuard.current.run(async () => {
      setExporting(true);
      try {
        const node = exportRef.current;
        if (!node) throw new Error(t("dashboard.visuals.exportError"));
        const size = VISUAL_FORMAT_SIZE[format];
        const png = await exportVisualPng(node, size);
        downloadDataUrl(png, visualDownloadFilename({ templateId: template.id, data }));
      } catch (e) {
        notifyError(e instanceof Error ? e.message : t("dashboard.visuals.exportError"));
      } finally {
        setExporting(false);
      }
    });
  }, [data, format, t, template]);

  const nativeSize = VISUAL_FORMAT_SIZE[format];
  const headerTitle = useMemo(() => {
    if (template) return t(`dashboard.visuals.templateNames.${template.id}`);
    return t("dashboard.visuals.editorTitle");
  }, [t, template]);

  if (permsLoading || loading) {
    return (
      <PageLayout>
        <div className="rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white p-12 text-center text-slate-500 shadow-sm">
          {t("dashboard.common.loading")}
        </div>
      </PageLayout>
    );
  }

  if (!canView) {
    return (
      <PageLayout>
        <p className="text-sm text-[#64748B]">{t("dashboard.visuals.forbidden")}</p>
      </PageLayout>
    );
  }

  if (!template) {
    return (
      <PageLayout>
        <DetailPageHeader
          backHref="/tableau-de-bord/visuels"
          backLabel={t("dashboard.visuals.back")}
          title={t("dashboard.visuals.templateMissing")}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="full" stack="compact" className="relative">
      <DetailPageHeader
        backHref="/tableau-de-bord/visuels"
        backLabel={t("dashboard.visuals.back")}
        title={headerTitle}
        meta={
          <span className="text-sm text-[#64748B]">
            {t("dashboard.visuals.activeFormat")}: {nativeSize.label}
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {canManage ? (
              <DashboardPrimaryButton
                icon="none"
                size="sm"
                loading={saving}
                loadingLabel={t("dashboard.common.saving")}
                onClick={() => void save()}
              >
                {t("dashboard.visuals.save")}
              </DashboardPrimaryButton>
            ) : null}
            <ActionButton
              type="button"
              loading={exporting}
              loadingLabel={t("dashboard.visuals.exporting")}
              onClick={() => void download()}
            >
              {t("dashboard.visuals.downloadVisual")}
            </ActionButton>
          </div>
        }
      />

      <div className="mb-4 flex gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobilePane("preview")}
          className={cn(
            "flex-1 rounded-full px-4 py-2.5 text-sm font-semibold",
            mobilePane === "preview" ? dashboardTabActiveClass : dashboardTabInactiveClass
          )}
        >
          {t("dashboard.visuals.preview")}
        </button>
        <button
          type="button"
          onClick={() => setMobilePane("edit")}
          className={cn(
            "flex-1 rounded-full px-4 py-2.5 text-sm font-semibold",
            mobilePane === "edit" ? dashboardTabActiveClass : dashboardTabInactiveClass
          )}
        >
          {t("dashboard.visuals.editTab")}
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
        <div
          ref={previewWrapRef}
          className={cn(
            "flex justify-center rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-[#0B1220] px-4 py-6 sm:px-6",
            mobilePane === "edit" && "hidden lg:flex"
          )}
        >
          <VisualCanvas
            template={template}
            data={data}
            format={format}
            scale={previewScale}
            className="rounded-[1.1rem]"
          />
        </div>

        <div className={cn(mobilePane === "preview" && "hidden lg:block", "lg:sticky lg:top-4 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto")}>
          <VisualConfigPanel
            template={template}
            data={data}
            format={format}
            club={club}
            t={t}
            onChange={patchData}
            onFormatChange={setFormat}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute -left-[12000px] top-0" aria-hidden>
        <VisualCanvas
          ref={exportRef}
          template={template}
          data={data}
          format={format}
          scale={1}
        />
      </div>
    </PageLayout>
  );
}
