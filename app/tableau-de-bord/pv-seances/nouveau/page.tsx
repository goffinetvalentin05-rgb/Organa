"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { PageLayout, PageHeader } from "@/components/ui";
import MeetingMinutesForm from "../MeetingMinutesForm";

export default function NouveauPvSeancePage() {
  const { t } = useI18n();
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  return (
    <PageLayout maxWidth="3xl">
      <div>
        <Link
          href="/tableau-de-bord/pv-seances"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("dashboard.meetingMinutes.backToList")}
        </Link>
        <PageHeader
          title={t("dashboard.meetingMinutes.form.titleNew")}
          subtitle={t("dashboard.meetingMinutes.form.subtitle")}
        />
      </div>

      <MeetingMinutesForm
        defaultValues={{ meetingDate: today, meetingType: "committee", status: "draft" }}
        submitLabel={t("dashboard.meetingMinutes.form.createAction")}
        savingLabel={t("dashboard.common.saving")}
        onSubmit={async (payload) => {
          const res = await fetch("/api/meeting-minutes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            toast.error(err.error || t("dashboard.meetingMinutes.form.createError"));
            throw new Error();
          }
          const data = await res.json();
          toast.success(t("dashboard.meetingMinutes.createSuccess"));
          router.push(`/tableau-de-bord/pv-seances/${data.minute?.id}`);
        }}
      />
    </PageLayout>
  );
}
