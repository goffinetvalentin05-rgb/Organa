"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { PageLayout, PageHeader, GlassCard } from "@/components/ui";
import SponsorContractForm, { type SponsorContractFormValues } from "../../SponsorContractForm";

export default function ModifierContratSponsorPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "";

  const [clubName, setClubName] = useState("Votre club");
  const [defaults, setDefaults] = useState<Partial<SponsorContractFormValues> | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/sponsor-contracts/${id}`, { cache: "no-store" });
      if (!res.ok) {
        router.replace("/tableau-de-bord/sponsoring");
        return;
      }
      const data = await res.json();
      const c = data.contract;
      if (data.clubName) setClubName(data.clubName);
      setDefaults({
        sponsorName: c.sponsorName,
        title: c.title,
        amount: c.amount != null ? String(c.amount) : "",
        startDate: c.startDate,
        endMode: "fixed",
        endDate: c.endDate,
        durationMonths: "12",
        content: c.content ?? "",
        sponsorType: (c.sponsorType as SponsorContractFormValues["sponsorType"]) || "",
      });
    } catch {
      router.replace("/tableau-de-bord/sponsoring");
    }
  }, [id, router]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageLayout maxWidth="3xl">
      <div>
        <Link
          href={`/tableau-de-bord/sponsoring/${id}`}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("dashboard.sponsoring.backToDetail")}
        </Link>
        <PageHeader title={t("dashboard.sponsoring.form.titleEdit")} subtitle={t("dashboard.sponsoring.form.subtitle")} />
      </div>

      {!defaults ? (
        <GlassCard className="p-8 text-center text-slate-500">{t("dashboard.common.loading")}</GlassCard>
      ) : (
        <SponsorContractForm
          key={id}
          clubName={clubName}
          defaultValues={defaults}
          submitLabel={t("dashboard.sponsoring.form.saveAction")}
          savingLabel={t("dashboard.common.saving")}
          onSubmit={async (payload) => {
            const res = await fetch(`/api/sponsor-contracts/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sponsorName: payload.sponsorName,
                title: payload.title,
                content: payload.content,
                amount: payload.amount,
                startDate: payload.startDate,
                endDate: payload.endDate,
                sponsorType: payload.sponsorType || null,
              }),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              toast.error(err.error || t("dashboard.sponsoring.form.createError"));
              throw new Error();
            }
            toast.success(t("dashboard.sponsoring.form.saveAction"));
            router.push(`/tableau-de-bord/sponsoring/${id}`);
          }}
        />
      )}
    </PageLayout>
  );
}
