"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  FileText,
  User,
} from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import {
  PageLayout,
  PageHeader,
  EmptyState,
  GlassCard,
  DashboardBadge,
  dashboardSecondaryButtonClass,
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
  done: number;
};

const EMPTY_SUMMARY: Summary = { overdue: 0, today: 0, upcoming: 0, total: 0, done: 0 };

const ORIGIN_TYPES = [
  "committee",
  "general_assembly",
  "coaches",
  "sponsoring",
  "finance",
  "other",
] as const;

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

function originLabel(
  meetingType: string,
  t: (key: string) => string
) {
  const key = ORIGIN_TYPES.includes(meetingType as (typeof ORIGIN_TYPES)[number])
    ? meetingType
    : "other";
  return t(`dashboard.todos.origin.${key}`);
}

function urgencyClass(urgency: TaskUrgency, done: boolean) {
  if (done) return "text-emerald-600";
  if (urgency === "overdue") return "text-rose-600";
  if (urgency === "today") return "text-amber-600";
  if (urgency === "soon") return "text-[#1A23FF]";
  return "text-[#64748B]";
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
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const load = useCallback(
    async (nextFilter: FilterId) => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch(`/api/meeting-minute-tasks?filter=${nextFilter}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(t("dashboard.todos.loadError"));
        const data = await res.json();
        setTasks(data.tasks || []);
        setSummary({ ...EMPTY_SUMMARY, ...(data.summary || {}) });
      } catch (error: unknown) {
        setErrorMessage(error instanceof Error ? error.message : t("dashboard.todos.loadError"));
        setTasks([]);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

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

  const attentionText =
    summary.total === 0
      ? t("dashboard.todos.hero.allClear")
      : summary.total === 1
        ? t("dashboard.todos.hero.attentionOne")
        : t("dashboard.todos.hero.attentionMany", { count: summary.total });

  const stats = [
    {
      id: "overdue" as const,
      label: t("dashboard.todos.urgency.overdue"),
      value: summary.overdue,
      icon: AlertCircle,
      iconClass: "bg-rose-50 text-rose-600",
      filter: "overdue" as FilterId,
    },
    {
      id: "today" as const,
      label: t("dashboard.todos.urgency.today"),
      value: summary.today,
      icon: Clock,
      iconClass: "bg-amber-50 text-amber-600",
      filter: "active" as FilterId,
    },
    {
      id: "upcoming" as const,
      label: t("dashboard.todos.urgency.upcoming"),
      value: summary.upcoming,
      icon: Calendar,
      iconClass: "bg-[#EEF2FF] text-[#1A23FF]",
      filter: "upcoming" as FilterId,
    },
    {
      id: "done" as const,
      label: t("dashboard.todos.filters.done"),
      value: summary.done,
      icon: CheckCircle,
      iconClass: "bg-emerald-50 text-emerald-600",
      filter: "done" as FilterId,
    },
  ];

  return (
    <PageLayout maxWidth="7xl">
      <PageHeader title={t("dashboard.todos.title")} subtitle={t("dashboard.todos.subtitle")} />

      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
        <div className="relative flex min-h-[13.5rem] flex-col overflow-hidden rounded-[1.5rem] border border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFF] via-[#F4F7FF] to-[#EEF2FF] p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.04)] sm:min-h-[14.5rem] sm:p-7">
          <span className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#1A23FF]/[0.06]" />
          <span className="pointer-events-none absolute -bottom-14 right-6 h-40 w-40 rounded-full bg-[#3B82F6]/[0.05]" />
          <p className="relative text-sm font-medium text-[#64748B]">
            {t("dashboard.todos.hero.label")}
          </p>
          <p className="relative mt-2 max-w-lg text-[1.55rem] font-semibold tracking-tight text-[#0F172A] sm:text-[1.85rem]">
            {loading ? "—" : attentionText}
          </p>
          <div className="relative mt-auto flex flex-wrap gap-2 pt-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white/80 px-3 py-1 text-xs font-medium text-[#475569]">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              {t("dashboard.todos.hero.pillOverdue", { count: loading ? "—" : summary.overdue })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white/80 px-3 py-1 text-xs font-medium text-[#475569]">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {t("dashboard.todos.hero.pillToday", { count: loading ? "—" : summary.today })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white/80 px-3 py-1 text-xs font-medium text-[#475569]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1A23FF]" />
              {t("dashboard.todos.hero.pillUpcoming", { count: loading ? "—" : summary.upcoming })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.filter)}
                className={cn(
                  "flex min-w-0 flex-col rounded-2xl border bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.04)] transition sm:p-5",
                  item.id !== "today" && filter === item.filter
                    ? "border-[rgba(26,35,255,0.22)]"
                    : "border-[#E5E7EB] hover:border-[rgba(26,35,255,0.16)]"
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    item.iconClass
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                  {item.label}
                </p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-[#0F172A] sm:text-[1.75rem]">
                  {loading ? "—" : item.value}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex max-w-full flex-wrap gap-1 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] p-1">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                filter === item.id
                  ? "bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                  : "text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-[1.5rem] border border-[#E5E7EB] bg-white px-6 py-14 text-center text-sm text-[#64748B] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {t("dashboard.common.loading")}
        </div>
      ) : errorMessage ? (
        <GlassCard className="border-red-200/80 bg-red-50/50 text-center">
          <p className="font-medium text-red-700">{t("dashboard.common.loadFailed")}</p>
          <p className="mt-2 text-sm text-red-600/90">{errorMessage}</p>
        </GlassCard>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={filter === "done" ? FileText : CheckCircle}
          title={
            filter === "done"
              ? t("dashboard.todos.emptyDoneTitle")
              : t("dashboard.todos.emptyTitle")
          }
          description={
            filter === "done"
              ? t("dashboard.todos.emptyDoneDescription")
              : t("dashboard.todos.empty")
          }
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const done = filter === "done" || task.status === "done";
            const completing = completingId === task.id;
            const rel = done ? null : relativeLabel(task.deadline, t);
            const deadlineText = rel || (task.deadline ? `${t("dashboard.todos.due")} ${formatDate(task.deadline)}` : null);

            return (
              <article
                key={task.id}
                className={cn(
                  "rounded-[1.25rem] border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.04)] transition duration-200 sm:p-5",
                  done ? "border-[#E5E7EB] bg-[#FCFCFD]" : "border-[#E5E7EB]",
                  highlight === task.id && "border-[rgba(26,35,255,0.28)] ring-2 ring-[#1A23FF]/10",
                  completing && "scale-[0.995] opacity-55"
                )}
              >
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <button
                    type="button"
                    disabled={done || completing}
                    onClick={() => void completeTask(task.id)}
                    aria-label={t("dashboard.todos.complete")}
                    className={cn(
                      "group/check mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition",
                      done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-[#CBD5E1] bg-white text-[#1A23FF] hover:border-[#1A23FF] hover:bg-[#EEF2FF]",
                      completing && "animate-pulse"
                    )}
                  >
                    <Check
                      className={cn(
                        "h-3.5 w-3.5 transition",
                        done || completing ? "opacity-100" : "opacity-0 group-hover/check:opacity-100"
                      )}
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <h3
                          className={cn(
                            "text-[0.98rem] font-semibold leading-snug tracking-tight sm:text-base",
                            done ? "text-[#475569]" : "text-[#0F172A]"
                          )}
                        >
                          {task.description}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2">
                          {done ? (
                            <DashboardBadge variant="success">
                              {t("dashboard.todos.completed")}
                            </DashboardBadge>
                          ) : deadlineText ? (
                            <p
                              className={cn(
                                "text-sm font-medium",
                                urgencyClass(task.urgency, false)
                              )}
                            >
                              {deadlineText}
                            </p>
                          ) : (
                            <p className="text-sm text-[#94A3B8]">
                              {t("dashboard.todos.urgency.none")}
                            </p>
                          )}
                        </div>

                        <p className="flex items-center gap-2 text-sm text-[#64748B]">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B]">
                            <User className="h-3.5 w-3.5" />
                          </span>
                          {task.responsibleName || t("dashboard.todos.noResponsible")}
                        </p>

                        <div className="flex flex-wrap items-start gap-x-4 gap-y-1 text-sm text-[#64748B]">
                          <p className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-[#94A3B8]" />
                            <span>
                              {originLabel(task.meetingType, t)}
                              {task.meetingDate ? ` · ${formatDate(task.meetingDate)}` : ""}
                            </span>
                          </p>
                          {task.pointTitle ? (
                            <p>
                              <span className="text-[#94A3B8]">{t("dashboard.todos.point")} : </span>
                              {task.pointTitle}
                            </p>
                          ) : null}
                        </div>

                        {done && task.completedAt ? (
                          <p className="text-sm text-[#64748B]">
                            {t("dashboard.todos.completedOn", {
                              date: formatDateTime(task.completedAt),
                            })}
                          </p>
                        ) : null}
                      </div>

                      <Link
                        href={`/tableau-de-bord/pv-seances/${task.meetingMinutesId}#point-${task.pointIndex}`}
                        className={cn(
                          dashboardSecondaryButtonClass,
                          "h-9 shrink-0 rounded-full px-3.5 py-1.5 text-xs sm:self-start"
                        )}
                      >
                        {t("dashboard.todos.viewPv")}
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
