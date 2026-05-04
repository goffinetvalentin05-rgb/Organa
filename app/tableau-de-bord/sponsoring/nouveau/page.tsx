"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { PageLayout, PageHeader, GlassCard } from "@/components/ui";
import SponsorContractForm from "../SponsorContractForm";

export default function NouveauContratSponsorPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [clubName, setClubName] = useState("Votre club");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/sponsor-contracts", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.clubName) setClubName(data.clubName);
        }
      } finally {
        setReady(true);
      }
    };
    void run();
  }, []);

  const today = new Date().toISOString().split("T")[0];

  return (
    <PageLayout maxWidth="3xl">
      <div>
        <Link
          href="/tableau-de-bord/sponsoring"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("dashboard.sponsoring.backToList")}
        </Link>
        <PageHeader title={t("dashboard.sponsoring.form.titleNew")} subtitle={t("dashboard.sponsoring.form.subtitle")} />
      </div>

      {!ready ? (
        <GlassCard className="p-8 text-center text-slate-500">{t("dashboard.common.loading")}</GlassCard>
      ) : (
        <SponsorContractForm
          clubName={clubName}
          defaultValues={{ startDate: today, endMode: "fixed", endDate: today }}
          submitLabel={t("dashboard.sponsoring.form.createAction")}
          savingLabel={t("dashboard.common.saving")}
          onSubmit={async (payload) => {
            const res = await fetch("/api/sponsor-contracts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sponsorName: payload.sponsorName,
                title: payload.title,
                content: payload.content,
                amount: payload.amount,
                startDate: payload.startDate,
                endDate: payload.endDate,
                sponsorType: payload.sponsorType || undefined,
              }),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              toast.error(err.error || t("dashboard.sponsoring.form.createError"));
              throw new Error();
            }
            const data = await res.json();
            toast.success(t("dashboard.sponsoring.createSuccess"));
            router.push(`/tableau-de-bord/sponsoring/${data.contract?.id}`);
          }}
        />
      )}
    </PageLayout>
  );
}
