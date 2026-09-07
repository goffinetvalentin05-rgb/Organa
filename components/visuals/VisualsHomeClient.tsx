"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ActionButton,
  DashboardBadge,
  EmptyState,
  PageHeader,
  PageLayout,
} from "@/components/ui";
import VisualCanvas from "@/components/visuals/VisualCanvas";
import { useI18n } from "@/components/I18nProvider";
import { usePermissions } from "@/lib/auth/permissions-client";
import { notifyError, notifySuccess } from "@/lib/notify";
import { Copy, Download, Edit, Sparkles, Trash } from "@/lib/icons";
import { localeToIntl } from "@/lib/i18n";
import { createMutationGuard } from "@/lib/ui/optimistic";
import { buildNewVisualData, visualDownloadFilename } from "@/lib/visuals/data";
import { downloadDataUrl, exportVisualPng } from "@/lib/visuals/export";
import { getVisualTemplate, visualTemplates } from "@/lib/visuals/templates/registry";
import {
  VISUAL_CATEGORIES,
  VISUAL_FORMAT_SIZE,
  type VisualCategory,
  type VisualClubContext,
  type VisualRecord,
} from "@/lib/visuals/types";

export default function VisualsHomeClient() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { has, loading: permsLoading } = usePermissions();
  const canView = has("view_visuals");
  const canManage = has("manage_visuals");

  const [loading, setLoading] = useState(true);
  const [visuals, setVisuals] = useState<VisualRecord[]>([]);
  const [club, setClub] = useState<VisualClubContext | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const exportTarget = useRef<VisualRecord | null>(null);
  const actionGuard = useRef(createMutationGuard());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, ctxRes] = await Promise.all([
        fetch("/api/visuals", { cache: "no-store" }),
        fetch("/api/visuals/context", { cache: "no-store" }),
      ]);
      const listJson = await listRes.json().catch(() => ({}));
      const ctxJson = await ctxRes.json().catch(() => ({}));
      if (!listRes.ok) throw new Error(listJson.error || t("dashboard.visuals.loadError"));
      setVisuals(listJson.visuals || []);
      setClub(ctxJson.context ?? null);
    } catch (e) {
      notifyError(e instanceof Error ? e.message : t("dashboard.visuals.loadError"));
      setVisuals([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!permsLoading && canView) void load();
    if (!permsLoading && !canView) setLoading(false);
  }, [canView, load, permsLoading]);

  const duplicate = async (id: string) => {
    await actionGuard.current.run(async () => {
      try {
        const res = await fetch(`/api/visuals/${id}/duplicate`, { method: "POST" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || t("dashboard.visuals.saveError"));
        notifySuccess(t("dashboard.visuals.duplicated"));
        router.push(`/tableau-de-bord/visuels/${json.visual.id}`);
      } catch (e) {
        notifyError(e instanceof Error ? e.message : t("dashboard.visuals.saveError"));
      }
    });
  };

  const remove = async (id: string) => {
    if (!confirm(t("dashboard.visuals.deleteConfirm"))) return;
    const previous = visuals;
    setVisuals((list) => list.filter((item) => item.id !== id));
    try {
      const res = await fetch(`/api/visuals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      notifySuccess(t("dashboard.visuals.deleted"));
    } catch {
      setVisuals(previous);
      notifyError(t("dashboard.visuals.saveError"));
    }
  };

  const downloadSaved = (visual: VisualRecord) => {
    const template = getVisualTemplate(visual.templateId);
    if (!template) {
      notifyError(t("dashboard.visuals.templateMissing"));
      return;
    }
    exportTarget.current = visual;
    setExportingId(visual.id);
  };

  useEffect(() => {
    if (!exportingId) return;
    const visual =
      visuals.find((item) => item.id === exportingId) ?? exportTarget.current;
    if (!visual) {
      setExportingId(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      try {
        const node = exportRef.current;
        if (!node) throw new Error(t("dashboard.visuals.exportError"));
        const png = await exportVisualPng(node, VISUAL_FORMAT_SIZE[visual.format]);
        if (cancelled) return;
        downloadDataUrl(
          png,
          visualDownloadFilename({ templateId: visual.templateId, data: visual.data })
        );
      } catch (e) {
        if (!cancelled) {
          notifyError(e instanceof Error ? e.message : t("dashboard.visuals.exportError"));
        }
      } finally {
        if (!cancelled) {
          exportTarget.current = null;
          setExportingId(null);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [exportingId, t, visuals]);

  if (permsLoading || loading) {
    return (
      <PageLayout>
        <PageHeader title={t("dashboard.visuals.title")} subtitle={t("dashboard.visuals.subtitle")} />
        <div className="rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white p-12 text-center text-slate-500 shadow-sm">
          {t("dashboard.common.loading")}
        </div>
      </PageLayout>
    );
  }

  if (!canView) {
    return (
      <PageLayout>
        <PageHeader title={t("dashboard.visuals.title")} />
        <p className="text-sm text-[#64748B]">{t("dashboard.visuals.forbidden")}</p>
      </PageLayout>
    );
  }

  const exportVisual = exportingId
    ? visuals.find((item) => item.id === exportingId) ?? exportTarget.current
    : null;
  const exportTemplate = exportVisual ? getVisualTemplate(exportVisual.templateId) : null;

  return (
    <PageLayout className="relative">
      <PageHeader
        title={t("dashboard.visuals.title")}
        subtitle={t("dashboard.visuals.subtitle")}
      />

      {VISUAL_CATEGORIES.map((category) => (
        <CategorySection
          key={category}
          category={category}
          club={club}
          canManage={canManage}
          t={t}
          onPick={(id) => router.push(`/tableau-de-bord/visuels/nouveau?template=${id}`)}
        />
      ))}

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#0F172A]">
            {t("dashboard.visuals.mine")}
          </h2>
        </div>
        {visuals.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={t("dashboard.visuals.mineEmpty")}
            description={t("dashboard.visuals.mineEmptyHint")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visuals.map((visual) => {
              const tpl = getVisualTemplate(visual.templateId);
              const scale = visual.format === "story" ? 0.16 : 0.22;
              return (
                <article
                  key={visual.id}
                  className="flex flex-col overflow-hidden rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex justify-center bg-[#0B1220] px-4 py-5">
                    {tpl ? (
                      <VisualCanvas
                        template={tpl}
                        data={visual.data}
                        format={visual.format}
                        scale={scale}
                        className="rounded-xl"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0F172A]">{visual.title}</p>
                        <p className="mt-1 text-sm text-[#64748B]">
                          {t("dashboard.visuals.modified")} ·{" "}
                          {new Date(visual.updatedAt).toLocaleString(localeToIntl[locale], {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <DashboardBadge>
                        {t(`dashboard.visuals.categories.${visual.type}`)}
                      </DashboardBadge>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      {canManage ? (
                        <ActionButton
                          href={`/tableau-de-bord/visuels/${visual.id}`}
                          className="inline-flex items-center gap-1.5"
                        >
                          <Edit className="h-4 w-4" />
                          {t("dashboard.common.edit")}
                        </ActionButton>
                      ) : null}
                      {canManage ? (
                        <ActionButton
                          type="button"
                          className="inline-flex items-center gap-1.5"
                          onClick={() => void duplicate(visual.id)}
                        >
                          <Copy className="h-4 w-4" />
                          {t("dashboard.visuals.duplicate")}
                        </ActionButton>
                      ) : null}
                      <ActionButton
                        type="button"
                        className="inline-flex items-center gap-1.5"
                        loading={exportingId === visual.id}
                        onClick={() => downloadSaved(visual)}
                      >
                        <Download className="h-4 w-4" />
                        {t("dashboard.visuals.download")}
                      </ActionButton>
                      {canManage ? (
                        <ActionButton
                          type="button"
                          variant="dangerSoft"
                          className="inline-flex p-2"
                          title={t("dashboard.common.delete")}
                          onClick={() => void remove(visual.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </ActionButton>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {exportVisual && exportTemplate ? (
        <div className="pointer-events-none absolute -left-[12000px] top-0" aria-hidden>
          <VisualCanvas
            ref={exportRef}
            template={exportTemplate}
            data={exportVisual.data}
            format={exportVisual.format}
            scale={1}
          />
        </div>
      ) : null}
    </PageLayout>
  );
}

function CategorySection({
  category,
  club,
  canManage,
  t,
  onPick,
}: {
  category: VisualCategory;
  club: VisualClubContext | null;
  canManage: boolean;
  t: (key: string) => string;
  onPick: (templateId: string) => void;
}) {
  const templates = visualTemplates.filter((item) => item.category === category);
  if (templates.length === 0) return null;
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-[#0F172A]">
          {t(`dashboard.visuals.categories.${category}`)}
        </h2>
        <p className="mt-1 text-sm text-[#64748B]">
          {t(`dashboard.visuals.categoryHints.${category}`)}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const previewData = buildNewVisualData(template.id, club);
          const format = template.defaultFormat;
          const scale = format === "story" ? 0.2 : 0.28;
          return (
            <button
              key={template.id}
              type="button"
              disabled={!canManage}
              onClick={() => onPick(template.id)}
              className="group overflow-hidden rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white text-left shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[rgba(26,35,255,0.18)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <div className="flex justify-center bg-[#0B1220] px-4 py-5">
                <VisualCanvas
                  template={template}
                  data={previewData}
                  format={format}
                  scale={scale}
                  className="rounded-xl"
                />
              </div>
              <div className="px-5 py-4">
                <p className="font-semibold text-[#0F172A]">
                  {t(`dashboard.visuals.templateNames.${template.id}`)}
                </p>
                <p className="mt-1 text-sm text-[#64748B]">
                  {canManage
                    ? t("dashboard.visuals.useTemplate")
                    : t("dashboard.visuals.viewOnly")}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
