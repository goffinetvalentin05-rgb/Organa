"use client";

import { use } from "react";
import SupportSaleDashboardClient from "@/components/support-sales/SupportSaleDashboardClient";

export default function VenteSoutienDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <SupportSaleDashboardClient saleId={id} />;
}
