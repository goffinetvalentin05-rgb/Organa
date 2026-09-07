"use client";

import { PageHeader, PageLayout } from "@/components/ui";
import { useI18n } from "@/components/I18nProvider";
import ClubPaymentsPanel from "@/components/payments/connect/ClubPaymentsPanel";

export default function CompteDePaiementPage() {
  const { t } = useI18n();

  return (
    <PageLayout>
      <PageHeader
        title={t("dashboard.paymentAccount.title")}
        subtitle={t("dashboard.paymentAccount.subtitle")}
      />
      <ClubPaymentsPanel variant="hub" />
    </PageLayout>
  );
}
