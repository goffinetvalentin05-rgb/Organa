"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import {
  DashboardBadge,
  EmptyState,
  GlassCard,
  PageHeader,
  PageLayout,
} from "@/components/ui";
import { useI18n } from "@/components/I18nProvider";
import { usePermissions } from "@/lib/auth/permissions-client";
import { formatChf } from "@/lib/shop/money";
import { Gift } from "@/lib/icons";
import { statusBadgeVariant, statusLabel } from "@/lib/support-sales/status";
import type { SupportSale } from "@/lib/support-sales/types";

export default function SupportSalesListClient() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { has, loading: permsLoading } = usePermissions();
  const canManage = has("manage_support_sales");
  const intlLocale = locale === "de" ? "de-CH" : locale === "en" ? "en-GB" : "fr-CH";
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<SupportSale[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support-sales", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chargement impossible");
      setSales(data.sales || []);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Impossible de charger les ventes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!permsLoading) void load();
  }, [permsLoading, load]);

  if (permsLoading || loading) {
    return (
      <PageLayout>
        <PageHeader
          title={t("dashboard.supportSales.title")}
          subtitle={t("dashboard.supportSales.subtitle")}
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white"
            />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={t("dashboard.supportSales.title")}
        subtitle={t("dashboard.supportSales.subtitle")}
        actions={
          canManage ? (
            <DashboardPrimaryButton href="/tableau-de-bord/ventes-soutien/nouvelle" size="sm">
              {t("dashboard.supportSales.create")}
            </DashboardPrimaryButton>
          ) : null
        }
      />

      {sales.length === 0 ? (
        <EmptyState
          icon={Gift}
          title={t("dashboard.supportSales.emptyTitle")}
          description={t("dashboard.supportSales.emptyDescription")}
          action={
            canManage ? (
              <DashboardPrimaryButton href="/tableau-de-bord/ventes-soutien/nouvelle">
                {t("dashboard.supportSales.create")}
              </DashboardPrimaryButton>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sales.map((sale) => (
            <button
              key={sale.id}
              type="button"
              onClick={() => router.push(`/tableau-de-bord/ventes-soutien/${sale.id}`)}
              className="text-left"
            >
              <GlassCard padding="sm" className="flex h-full flex-col transition hover:-translate-y-0.5">
                <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-2xl bg-[#F1F5F9]">
                  {sale.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sale.imageUrl} alt={sale.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#94A3B8]">
                      <Gift className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3">
                    <DashboardBadge variant={statusBadgeVariant(sale.status)}>
                      {statusLabel(sale.status)}
                    </DashboardBadge>
                  </div>
                </div>
                <p className="text-base font-semibold text-[#0F172A]">{sale.name}</p>
                <p className="mt-1 text-sm text-[#64748B]">{sale.productName}</p>
                <p className="mt-2 text-lg font-semibold text-[#1A23FF]">
                  {formatChf(sale.priceCents, intlLocale)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[#64748B]">
                  <p>
                    <span className="font-semibold text-[#0F172A]">{sale.stats.reservationsCount}</span>{" "}
                    réservations
                  </p>
                  <p>
                    <span className="font-semibold text-[#0F172A]">{sale.stats.quantitySold}</span> vendus
                  </p>
                  <p className="col-span-2 font-semibold text-[#0F172A]">
                    {formatChf(sale.stats.revenueCents, intlLocale)}
                  </p>
                  <p className="col-span-2">
                    {sale.reservationDeadline
                      ? `Fin le ${new Date(`${sale.reservationDeadline}T00:00:00`).toLocaleDateString(intlLocale)}`
                      : "Sans date limite"}
                  </p>
                </div>
              </GlassCard>
            </button>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
