"use client";

import { Suspense } from "react";
import ShopDashboardClient from "@/components/shop/ShopDashboardClient";
import { PageLayout, PageHeader } from "@/components/ui";

function ShopFallback() {
  return (
    <PageLayout>
      <PageHeader title="Boutique" subtitle="Chargement…" />
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

export default function BoutiquePage() {
  return (
    <Suspense fallback={<ShopFallback />}>
      <ShopDashboardClient />
    </Suspense>
  );
}
