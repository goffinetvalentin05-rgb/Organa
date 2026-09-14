"use client";

import { Suspense } from "react";
import SupportersDashboardClient from "@/components/supporters/SupportersDashboardClient";
import { PageLayout, PageHeader } from "@/components/ui";

function Fallback() {
  return (
    <PageLayout>
      <PageHeader title="Supporters" subtitle="Chargement…" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white"
          />
        ))}
      </div>
    </PageLayout>
  );
}

export default function SupportersAdminPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <SupportersDashboardClient />
    </Suspense>
  );
}
