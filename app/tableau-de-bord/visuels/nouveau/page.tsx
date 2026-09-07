"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, PageLayout } from "@/components/ui";
import VisualEditor from "@/components/visuals/VisualEditor";
import { useI18n } from "@/components/I18nProvider";

function NewVisualEditor() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template") || "";
  return <VisualEditor templateId={templateId} />;
}

export default function NouveauVisuelPage() {
  const { t } = useI18n();
  return (
    <Suspense
      fallback={
        <PageLayout>
          <PageHeader title={t("dashboard.visuals.newTitle")} subtitle={t("dashboard.common.loading")} />
        </PageLayout>
      }
    >
      <NewVisualEditor />
    </Suspense>
  );
}
