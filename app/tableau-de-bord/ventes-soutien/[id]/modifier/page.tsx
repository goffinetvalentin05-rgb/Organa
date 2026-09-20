"use client";

import { use, useEffect, useState } from "react";
import toast from "react-hot-toast";
import SupportSaleForm from "@/components/support-sales/SupportSaleForm";
import { PageHeader, PageLayout } from "@/components/ui";
import type { SupportSale } from "@/lib/support-sales/types";

export default function ModifierVenteSoutienPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [sale, setSale] = useState<SupportSale | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/support-sales/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Vente introuvable");
        toast.error(data.error || "Vente introuvable");
        return;
      }
      setSale(data.sale);
    })();
  }, [id]);

  if (error) {
    return (
      <PageLayout>
        <PageHeader title="Modifier la vente" subtitle={error} />
      </PageLayout>
    );
  }

  if (!sale) {
    return (
      <PageLayout>
        <PageHeader title="Modifier la vente" subtitle="Chargement…" />
      </PageLayout>
    );
  }

  return <SupportSaleForm mode="edit" sale={sale} />;
}
