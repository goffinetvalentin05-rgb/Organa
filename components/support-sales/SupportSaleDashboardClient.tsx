"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import {
  ActionButton,
  DashboardBadge,
  DetailPageHeader,
  EmptyState,
  GlassCard,
  PageLayout,
  StatCard,
  cn,
  dashboardModalClass,
  dashboardTabActiveClass,
  dashboardTabInactiveClass,
} from "@/components/ui";
import { useI18n } from "@/components/I18nProvider";
import { usePermissions } from "@/lib/auth/permissions-client";
import { formatCategoryLabel } from "@/lib/members/taxonomy";
import { formatChf } from "@/lib/shop/money";
import { CheckCircle, Copy, Download, Gift, Users } from "@/lib/icons";
import { statusBadgeVariant, statusLabel } from "@/lib/support-sales/status";
import type { SupportSaleDashboard, SupportSaleMemberRow } from "@/lib/support-sales/types";

type TabId = "members" | "distribution" | "share";

export default function SupportSaleDashboardClient({ saleId }: { saleId: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { has, loading: permsLoading } = usePermissions();
  const canManage = has("manage_support_sales");
  const intlLocale = locale === "de" ? "de-CH" : locale === "en" ? "en-GB" : "fr-CH";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SupportSaleDashboard | null>(null);
  const [tab, setTab] = useState<TabId>("members");
  const [selected, setSelected] = useState<SupportSaleMemberRow | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/support-sales/${saleId}/dashboard`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Chargement impossible");
      setData(json);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    if (!permsLoading) void load();
  }, [permsLoading, load]);

  const publicUrl = useMemo(() => {
    if (!data || typeof window === "undefined") return "";
    return `${window.location.origin}${data.sale.publicPath}`;
  }, [data]);

  const copy = async (value: string, label = "Lien copié") => {
    await navigator.clipboard.writeText(value);
    toast.success(label);
  };

  const setStatus = async (status: "draft" | "active") => {
    const res = await fetch(`/api/support-sales/${saleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Mise à jour impossible");
      return;
    }
    toast.success("Statut mis à jour");
    void load();
  };

  const completeSale = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/support-sales/${saleId}/complete`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Impossible de terminer la vente");
      setConfirmEnd(false);
      toast.success("Vente terminée");
      void load();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Impossible de terminer la vente");
    } finally {
      setCompleting(false);
    }
  };

  const removeSale = async () => {
    if (!confirm("Supprimer cette vente ?")) return;
    const res = await fetch(`/api/support-sales/${saleId}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Suppression impossible");
      return;
    }
    toast.success("Vente supprimée");
    router.push("/tableau-de-bord/ventes-soutien");
  };

  if (!permsLoading && !loading && !data) {
    return (
      <PageLayout>
        <DetailPageHeader
          backHref="/tableau-de-bord/ventes-soutien"
          backLabel="Ventes de soutien"
          title="Vente introuvable"
        />
      </PageLayout>
    );
  }

  if (permsLoading || loading || !data) {
    return (
      <PageLayout>
        <DetailPageHeader
          backHref="/tableau-de-bord/ventes-soutien"
          backLabel="Ventes de soutien"
          title="Chargement…"
        />
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

  const { sale, members } = data;
  const money = (cents: number) => formatChf(cents, intlLocale);

  return (
    <PageLayout>
      <DetailPageHeader
        backHref="/tableau-de-bord/ventes-soutien"
        backLabel="Ventes de soutien"
        title={sale.name}
        subject={sale.productName}
        status={<DashboardBadge variant={statusBadgeVariant(sale.status)}>{statusLabel(sale.status)}</DashboardBadge>}
        meta={
          sale.reservationDeadline
            ? `Fin le ${new Date(`${sale.reservationDeadline}T00:00:00`).toLocaleDateString(intlLocale)}`
            : "Sans date limite"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {sale.status === "ended" ? (
              <ActionButton
                variant="surface"
                onClick={() => {
                  window.location.href = `/api/pdf/vente-soutien/download?id=${sale.id}`;
                }}
              >
                <Download className="h-4 w-4" />
                Exporter le récapitulatif PDF
              </ActionButton>
            ) : null}
            {canManage && sale.status === "draft" ? (
              <DashboardPrimaryButton type="button" size="sm" icon="none" onClick={() => void setStatus("active")}>
                Publier
              </DashboardPrimaryButton>
            ) : null}
            {canManage && sale.status === "active" ? (
              <ActionButton variant="surface" onClick={() => setConfirmEnd(true)}>
                Terminer
              </ActionButton>
            ) : null}
            {canManage ? (
              <ActionButton variant="ghost" onClick={() => router.push(`/tableau-de-bord/ventes-soutien/${sale.id}/modifier`)}>
                Modifier
              </ActionButton>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Valeur des réservations" value={money(sale.stats.revenueCents)} icon={Gift} accent="electric" />
        <StatCard label="Quantité vendue" value={sale.stats.quantitySold} icon={CheckCircle} accent="cyan" />
        <StatCard label="Réservations" value={sale.stats.reservationsCount} icon={Gift} accent="royal" />
        <StatCard
          label="Membres ayant vendu"
          value={sale.stats.membersSoldCount}
          icon={Users}
          accent="navy"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["members", "Ventes par membre"],
            ["distribution", "Distribution"],
            ["share", "Liens à partager"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === id ? dashboardTabActiveClass : dashboardTabInactiveClass
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "members" ? (
        members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun membre associé"
            description="Ajoutez des membres à cette vente pour suivre leurs commandes."
          />
        ) : (
          <GlassCard padding="none">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-[rgba(15,23,42,0.06)] bg-[#FAFBFD] text-[#64748B]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Membre</th>
                    <th className="px-5 py-3 font-medium">Équipe</th>
                    <th className="px-5 py-3 font-medium">Acheteurs</th>
                    <th className="px-5 py-3 font-medium">Quantité vendue</th>
                    <th className="px-5 py-3 font-medium">Objectif</th>
                    <th className="px-5 py-3 font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(15,23,42,0.06)]">
                  {members.map((row) => {
                    const goal = row.goalPerMember;
                    const reached = goal != null && row.quantitySold >= goal;
                    return (
                      <tr
                        key={row.memberId}
                        className="cursor-pointer hover:bg-[#F8FAFC]"
                        onClick={() => setSelected(row)}
                      >
                        <td className="px-5 py-3 font-semibold text-[#0F172A]">{row.memberName}</td>
                        <td className="px-5 py-3 text-[#64748B]">
                          {row.memberCategory ? formatCategoryLabel(row.memberCategory, t) : "—"}
                        </td>
                        <td className="px-5 py-3">{row.buyersCount}</td>
                        <td className="px-5 py-3">{row.quantitySold}</td>
                        <td className="px-5 py-3">
                          {goal ? (
                            <span className={reached ? "font-semibold text-emerald-700" : "text-[#64748B]"}>
                              {row.quantitySold} / {goal}
                              {reached ? " — Objectif atteint" : ""}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-3 font-semibold">{money(row.amountCents)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )
      ) : null}

      {tab === "distribution" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {members
            .filter((row) => row.quantitySold > 0)
            .map((row) => (
              <GlassCard key={row.memberId} padding="md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[#0F172A]">{row.memberName}</p>
                    <p className="mt-1 text-sm text-[#64748B]">
                      {row.quantitySold} {sale.productName.toLowerCase()} à récupérer
                    </p>
                    <p className="text-sm text-[#64748B]">{row.buyersCount} acheteurs</p>
                  </div>
                  <p className="text-sm font-semibold text-[#1A23FF]">{money(row.amountCents)}</p>
                </div>
                <ul className="mt-4 space-y-1.5 text-sm text-[#334155]">
                  {row.reservations.map((reservation) => (
                    <li key={reservation.id}>
                      {reservation.buyerFirstName} × {reservation.quantity}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ))}
          {members.every((row) => row.quantitySold === 0) ? (
            <EmptyState
              icon={Gift}
              title="Aucune commande à distribuer"
              description="Les réservations apparaîtront ici avec la quantité à remettre à chaque membre."
            />
          ) : null}
        </div>
      ) : null}

      {tab === "share" ? (
        <div className="space-y-4">
          <GlassCard>
            <h2 className="text-lg font-semibold text-[#0F172A]">Lien public</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Les acheteurs choisissent ensuite le membre qui leur a proposé la vente.
            </p>
            <p className="mt-3 break-all text-sm font-medium text-[#1A23FF]">{publicUrl}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionButton variant="surface" onClick={() => void copy(publicUrl)}>
                <Copy className="h-4 w-4" /> Copier le lien
              </ActionButton>
              {sale.status !== "draft" ? (
                <ActionButton variant="ghost" href={sale.publicPath}>
                  Ouvrir la page
                </ActionButton>
              ) : (
                <p className="text-sm text-amber-700">Publiez la vente pour la rendre accessible.</p>
              )}
            </div>
          </GlassCard>
          <GlassCard padding="none">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-[rgba(15,23,42,0.06)] bg-[#FAFBFD] text-[#64748B]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Membre</th>
                    <th className="px-5 py-3 font-medium">Lien personnel</th>
                    <th className="px-5 py-3 font-medium">Partager</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(15,23,42,0.06)]">
                  {members.map((row) => {
                    const url =
                      typeof window === "undefined"
                        ? row.personalPath
                        : `${window.location.origin}${row.personalPath}`;
                    const wa = `https://wa.me/?text=${encodeURIComponent(`${sale.name} — réserve ici : ${url}`)}`;
                    return (
                      <tr key={row.memberId}>
                        <td className="px-5 py-3 font-semibold text-[#0F172A]">{row.memberName}</td>
                        <td className="px-5 py-3 text-[#64748B]">{row.personalPath}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-2">
                            <ActionButton variant="ghost" onClick={() => void copy(url)}>
                              Copier
                            </ActionButton>
                            <a
                              href={wa}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-10 items-center justify-center rounded-xl px-3 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                            >
                              WhatsApp
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
          {canManage ? (
            <ActionButton variant="dangerSoft" onClick={() => void removeSale()}>
              Supprimer la vente
            </ActionButton>
          ) : null}
        </div>
      ) : null}

      {confirmEnd ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#071634]/50 p-4 sm:items-center"
          onClick={() => !completing && setConfirmEnd(false)}
        >
          <div
            className={cn(dashboardModalClass, "w-full max-w-lg p-6")}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-[#0F172A]">Terminer cette vente ?</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#475569]">
              {sale.stats.quantitySold} produits ont été vendus pour un total de{" "}
              <strong>{money(sale.stats.revenueCents)}</strong>.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[#475569]">
              <li>Les nouvelles réservations seront désactivées</li>
              <li>Le récapitulatif PDF sera disponible</li>
              <li>
                <strong>{money(sale.stats.revenueCents)}</strong> seront ajoutés aux encaissements du club
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <ActionButton variant="ghost" disabled={completing} onClick={() => setConfirmEnd(false)}>
                Annuler
              </ActionButton>
              <DashboardPrimaryButton
                type="button"
                size="sm"
                icon="none"
                loading={completing}
                onClick={() => void completeSale()}
              >
                Terminer la vente
              </DashboardPrimaryButton>
            </div>
          </div>
        </div>
      ) : null}

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#071634]/50 p-4 sm:items-center"
          onClick={() => setSelected(null)}
        >
          <div
            className={cn(dashboardModalClass, "max-h-[90vh] w-full max-w-lg overflow-y-auto p-6")}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-[#0F172A]">{selected.memberName}</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              {selected.quantitySold} produits vendus · {selected.buyersCount} acheteurs
            </p>
            {selected.reservations.length === 0 ? (
              <p className="mt-6 text-sm text-[#64748B]">Aucune réservation pour l’instant.</p>
            ) : (
              <ul className="mt-6 space-y-3">
                {selected.reservations.map((reservation) => (
                  <li
                    key={reservation.id}
                    className="flex items-center justify-between rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-[#0F172A]">{reservation.buyerFirstName}</span>
                    <span className="text-[#64748B]">
                      {reservation.quantity} · {money(reservation.totalCents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex justify-end">
              <ActionButton variant="surface" onClick={() => setSelected(null)}>
                Fermer
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </PageLayout>
  );
}
