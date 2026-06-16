"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { PageLayout, PageHeader, GlassCard } from "@/components/ui";
import MeetingMinutesForm, { type MeetingMinutesFormValues } from "../../MeetingMinutesForm";
import { createEmptyMeetingPoint } from "@/lib/meeting-minutes";

export default function ModifierPvSeancePage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "";

  const [defaults, setDefaults] = useState<Partial<MeetingMinutesFormValues> | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/meeting-minutes/${id}`, { cache: "no-store" });
      if (!res.ok) {
        router.replace("/tableau-de-bord/pv-seances");
        return;
      }
      const data = await res.json();
      const m = data.minute;
      setDefaults({
        title: m.title,
        meetingDate: m.meetingDate,
        startTime: m.startTime || "",
        endTime: m.endTime || "",
        location: m.location || "",
        meetingType: m.meetingType,
        status: m.status,
        chairman: m.chairman || "",
        secretary: m.secretary || "",
        attendees: m.attendees || [],
        excused: m.excused || [],
        absent: m.absent || [],
        points: m.points?.length ? m.points : [createEmptyMeetingPoint()],
        miscellaneous: m.miscellaneous || "",
        nextMeeting: m.nextMeeting || "",
      });
    } catch {
      router.replace("/tableau-de-bord/pv-seances");
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageLayout maxWidth="3xl">
      <div>
        <Link
          href={`/tableau-de-bord/pv-seances/${id}`}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("dashboard.meetingMinutes.backToDetail")}
        </Link>
        <PageHeader
          title={t("dashboard.meetingMinutes.form.titleEdit")}
          subtitle={t("dashboard.meetingMinutes.form.subtitle")}
        />
      </div>

      {!defaults ? (
        <GlassCard className="p-8 text-center text-slate-500">{t("dashboard.common.loading")}</GlassCard>
      ) : (
        <MeetingMinutesForm
          key={id}
          defaultValues={defaults}
          submitLabel={t("dashboard.meetingMinutes.form.saveAction")}
          savingLabel={t("dashboard.common.saving")}
          onSubmit={async (payload) => {
            const res = await fetch(`/api/meeting-minutes/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              toast.error(err.error || t("dashboard.meetingMinutes.form.createError"));
              throw new Error();
            }
            toast.success(t("dashboard.meetingMinutes.form.saveAction"));
            router.push(`/tableau-de-bord/pv-seances/${id}`);
          }}
        />
      )}
    </PageLayout>
  );
}
