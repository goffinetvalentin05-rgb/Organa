"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Check, ClipboardList } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import {
  PageLayout,
  PageHeader,
  EmptyState,
  GlassCard,
  ActionButton,
  EntityCard,
  EntityCardList,
  DashboardBadge,
  cn,
} from "@/components/ui";
import type { MeetingMinuteTaskDto, TaskUrgency } from "@/lib/meeting-minute-tasks";
import { relativeDeadline } from "@/lib/meeting-minute-tasks";

type FilterId = "active" | "overdue" | "upcoming" | "done";

type Summary = {
  overdue: number;
  today: number;
  upcoming: number;
  total: number;
};

function relativeLabel(
  deadline: string | null,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  const rel = relativeDeadline(deadline);
  if (rel.kind === "today") return t("dashboard.todos.urgency.today");
  if (rel.kind === "tomorrow") return t("dashboard.todos.relative.tomorrow");
  if (rel.kind === "inDays") return t("dashboard.todos.relative.inDays", { count: rel.count });
  if (rel.kind === "overdue") {
    return rel.count === 1
      ? t("dashboard.todos.relative.overdueOne")
      : t("dashboard.todos.relative.overdueMany", { count: rel.count });
  }
  return null;
}

function urgencyBadge(urgency: TaskUrgency, t: (key: string) => string) {
  if (urgency === "overdue") {
    return <DashboardBadge variant="danger">{t("dashboard.todos.urgency.overdue")}</DashboardBadge>;
  }
  if (urgency === "today") {
    return <DashboardBadge variant="warning">{t("dashboard.todos.urgency.today")}</DashboardBadge>;
  }
  if (urgency === "soon") {
    return <DashboardBadge variant="info">{t("dashboard.todos.urgency.soon")}</DashboardBadge>;
  }
  return <DashboardBadge variant="neutral">{t("dashboard.todos.urgency.normal")}</DashboardBadge>;
}

export default function AFairePage() {
  return (
    <Suspense fallback={null}>
      <AFairePageInner />
    </Suspense>
  );
}

function AFairePageInner() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");
  const [filter, setFilter] = useState<FilterId>("active");
  const [tasks, setTasks] = useState<MeetingMinuteTaskDto[]>([]);
  const [summary, setSummary] = useState<Summary>({ overdue: 0, today: 0, upcoming: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const load = useCallback(async (nextFilter: FilterId) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/meeting-minute-tasks?filter=${nextFilter}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(t("dashboard.todos.loadError"));
      const data = await res.json();
      setTasks(data.tasks || []);
      setSummary(
        data.summary || { overdue: 0, today: 0, upcoming: 0, total: 0 }
      );
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : t("dashboard.todos.loadError"));
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(localeToIntl[locale]);
  };

  const formatDateTime = (value: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(localeToIntl[locale], { dateStyle: "short", timeStyle: "short" });
  };

  const filters = useMemo(
    () =>
      [
        { id: "active" as const, label: t("dashboard.todos.filters.active") },
        { id: "overdue" as const, label: t("dashboard.todos.filters.overdue") },
        { id: "upcoming" as const, label: t("dashboard.todos.filters.upcoming") },
        { id: "done" as const, label: t("dashboard.todos.filters.done") },
      ],
    [t]
  );

  const completeTask = async (id: string) => {
    if (completingId) return;
    setCompletingId(id);
    try {
      const res = await fetch(`/api/meeting-minute-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      if (!res.ok) throw new Error(t("dashboard.todos.completeError"));
      toast.success(t("dashboard.todos.completeSuccess"));
      await load(filter);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("dashboard.todos.completeError"));
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <PageLayout maxWidth="7xl">
      <PageHeader
        title={t("dashboard.todos.title")}
        subtitle={t("dashboard.todos.subtitle")}
      />

      <div className="grid grid-cols-3 gap-3 sm:max-w-xl">
        {[
          { label: t("dashboard.todos.urgency.overdue"), value: summary.overdue, tone: "text-rose-700" },
          { label: t("dashboard.todos.urgency.today"), value: summary.today, tone: "text-amber-700" },
          { label: t("dashboard.todos.urgency.upcoming"), value: summary.upcoming, tone: "text-[#1A23FF]" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">
              {item.label}
            </p>
            <p className={cn("mt-1 text-xl font-semibold tabular-nums", item.tone)}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              filter === item.id
                ? "border-[rgba(26,35,255,0.22)] bg-[rgba(26,35,255,0.08)] text-[#1A23FF]"
                : "border-[#E5E7EB] bg-white text-[#64748B] hover:text-[#0F172A]"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-[1.25rem] border border-[#E5E7EB] bg-white p-12 text-center text-sm text-[#64748B]">
          {t("dashboard.common.loading")}
        </div>
      ) : errorMessage ? (
        <GlassCard className="border-red-200/80 bg-red-50/50 text-center">
          <p className="font-medium text-red-700">{t("dashboard.common.loadFailed")}</p>
          <p className="mt-2 text-sm text-red-600/90">{errorMessage}</p>
        </GlassCard>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={
            filter === "done"
              ? t("dashboard.todos.emptyDone")
              : t("dashboard.todos.empty")
          }
        />
      ) : (
        <EntityCardList>
          {tasks.map((task) => (
            <EntityCard
              key={task.id}
              layout="row"
              className={highlight === task.id ? "border-[rgba(26,35,255,0.28)]" : undefined}
              title={task.description}
              badges={
                <>
                  {filter !== "done" ? urgencyBadge(task.urgency, t) : (
                    <DashboardBadge variant="success">{t("dashboard.todos.completed")}</DashboardBadge>
                  )}
                  {task.pointTitle ? (
                    <DashboardBadge variant="neutral">{task.pointTitle}</DashboardBadge>
                  ) : null}
                </>
              }
              meta={
                <div className="space-y-0.5 text-sm text-[#64748B]">
                  <p>
                    {task.responsibleName || t("dashboard.todos.noResponsible")}
                    {(() => {
                      const rel = relativeLabel(task.deadline, t);
                      if (rel) return ` · ${rel}`;
                      if (task.deadline) return ` · ${t("dashboard.todos.due")} ${formatDate(task.deadline)}`;
                      return "";
                    })()}
                  </p>
                  <p>
                    {task.meetingTitle}
                    {task.meetingDate ? ` — ${formatDate(task.meetingDate)}` : ""}
                  </p>
                  {filter === "done" && task.completedAt ? (
                    <p>{t("dashboard.todos.completedOn", { date: formatDateTime(task.completedAt) })}</p>
                  ) : null}
                </div>
              }
              actions={
                <>
                  {filter !== "done" ? (
                    <ActionButton
                      type="button"
                      loading={completingId === task.id}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
                      onClick={() => void completeTask(task.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t("dashboard.todos.complete")}
                    </ActionButton>
                  ) : null}
                  <ActionButton
                    href={`/tableau-de-bord/pv-seances/${task.meetingMinutesId}#point-${task.pointIndex}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
                  >
                    {t("dashboard.todos.viewPv")}
                  </ActionButton>
                </>
              }
            />
          ))}
        </EntityCardList>
      )}
    </PageLayout>
  );
}
