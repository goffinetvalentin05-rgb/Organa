"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import ClubPaymentsPanel from "@/components/payments/connect/ClubPaymentsPanel";
import {
  ActionButton,
  CheckboxRow,
  DashboardBadge,
  EmptyState,
  GlassCard,
  PageHeader,
  PageLayout,
  StatCard,
  TableCard,
  cn,
  dashboardDataTableClass,
  dashboardInputClass,
  dashboardSelectClass,
  dashboardTabActiveClass,
  dashboardTabInactiveClass,
  dashboardTextSecondaryClass,
} from "@/components/ui";
import { usePermissions } from "@/lib/auth/permissions-client";
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Download,
  Edit,
  Heart,
  Trash,
  Users,
  Wallet,
  X,
} from "@/lib/icons";
import { QRCodeSVG } from "qrcode.react";
import { formatChf } from "@/lib/shop/money";
import { durationLabel, formatSupporterNumberLabel, formatSwissDate } from "@/lib/supporters/format";
import { supporterDisplayStatus } from "@/lib/supporters/status";
import type {
  Supporter,
  SupporterOffer,
  SupporterStats,
  SupporterStatus,
} from "@/lib/supporters/types";
import SupporterOfferDialog, {
  defaultSeasonDates,
  emptyOfferForm,
  type OfferFormState,
} from "@/components/supporters/SupporterOfferDialog";

type TabId = "offres" | "supporters" | "parametres";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "offres", label: "Offres" },
  { id: "supporters", label: "Supporters" },
  { id: "parametres", label: "Paramètres" },
];

function formFromOffer(offer: SupporterOffer): OfferFormState {
  return {
    name: offer.name,
    description: offer.description || "",
    price: (offer.priceCents / 100).toFixed(2),
    durationType: offer.durationType,
    startDate: offer.startDate || defaultSeasonDates().start,
    endDate: offer.endDate || defaultSeasonDates().end,
    maxSupporters: offer.maxSupporters ? String(offer.maxSupporters) : "",
    isActive: offer.isActive,
    isFeatured: offer.isFeatured,
    showSupporterCount: offer.showSupporterCount,
    benefits: offer.benefits.length ? offer.benefits.map((b) => b.label) : [""],
  };
}

function statusBadge(status: ReturnType<typeof supporterDisplayStatus>) {
  if (status === "active") return <DashboardBadge variant="success">Actif</DashboardBadge>;
  if (status === "pending") return <DashboardBadge variant="warning">En attente</DashboardBadge>;
  if (status === "expired") return <DashboardBadge variant="neutral">Expiré</DashboardBadge>;
  return <DashboardBadge variant="danger">Annulé</DashboardBadge>;
}

export default function SupportersDashboardClient() {
  const searchParams = useSearchParams();
  const { has, loading: permsLoading } = usePermissions();
  const canManage = has("manage_supporters");

  const initialTab = (searchParams.get("tab") as TabId) || "offres";
  const [tab, setTab] = useState<TabId>(
    TABS.some((item) => item.id === initialTab) ? initialTab : "offres"
  );
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SupporterStats | null>(null);
  const [offers, setOffers] = useState<SupporterOffer[]>([]);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [publicPath, setPublicPath] = useState<string | null>(null);
  const [paymentsReady, setPaymentsReady] = useState(false);

  const [statusFilter, setStatusFilter] = useState<"all" | SupporterStatus>("all");
  const [offerFilter, setOfferFilter] = useState("all");
  const [query, setQuery] = useState("");

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editing, setEditing] = useState<SupporterOffer | null>(null);
  const [form, setForm] = useState<OfferFormState>(emptyOfferForm());
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Supporter | null>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [publishedNotice, setPublishedNotice] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, offersRes, membersRes, linkRes] = await Promise.all([
        fetch("/api/supporters/stats", { cache: "no-store" }),
        fetch("/api/supporters/offers", { cache: "no-store" }),
        fetch("/api/supporters", { cache: "no-store" }),
        fetch("/api/supporters/public-link", { cache: "no-store" }),
      ]);
      if (!statsRes.ok || !offersRes.ok || !membersRes.ok) {
        toast.error("Impossible de charger les supporters");
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
      if (offersRes.ok) {
        const data = await offersRes.json();
        setOffers(data.offers || []);
      }
      if (membersRes.ok) {
        const data = await membersRes.json();
        setSupporters(data.supporters || []);
      }
      if (linkRes.ok) {
        const data = await linkRes.json();
        setPublicPath(data.publicPath);
        setPaymentsReady(Boolean(data.paymentsReady));
      }
    } catch {
      toast.error("Impossible de charger les supporters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!permsLoading) void loadAll();
  }, [permsLoading, loadAll]);

  const publicUrl = useMemo(() => {
    if (!publicPath || typeof window === "undefined") return "";
    return `${window.location.origin}${publicPath}`;
  }, [publicPath]);

  const filteredSupporters = useMemo(() => {
    const q = query.trim().toLowerCase();
    return supporters.filter((s) => {
      const display = supporterDisplayStatus(s);
      if (statusFilter === "active" && display !== "active") return false;
      if (statusFilter === "expired" && display !== "expired") return false;
      if (statusFilter === "pending" && s.status !== "pending") return false;
      if (statusFilter === "cancelled" && s.status !== "cancelled") return false;
      if (offerFilter !== "all" && s.offerId !== offerFilter) return false;
      if (!q) return true;
      return (
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    });
  }, [supporters, statusFilter, offerFilter, query]);

  const openCreateOffer = () => {
    setEditing(null);
    setForm(emptyOfferForm());
    setPublishedNotice(false);
    setTab("offres");
    setIsOfferModalOpen(true);
  };

  const openEditOffer = (offer: SupporterOffer) => {
    setEditing(offer);
    setForm(formFromOffer(offer));
    setPublishedNotice(false);
    setIsOfferModalOpen(true);
  };

  const closeOfferModal = () => {
    if (saving) return;
    setIsOfferModalOpen(false);
  };

  const saveOffer = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: form.price,
        durationType: form.durationType,
        startDate: form.startDate,
        endDate: form.endDate,
        maxSupporters: form.maxSupporters || null,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        showSupporterCount: form.showSupporterCount,
        benefits: form.benefits.filter((b) => b.trim()),
      };
      const res = await fetch(
        editing ? `/api/supporters/offers/${editing.id}` : "/api/supporters/offers",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      toast.success(editing ? "Offre modifiée" : "Offre créée avec succès");
      setIsOfferModalOpen(false);
      setPublishedNotice(!editing);
      setTab("offres");
      await loadAll();
    } catch (e: unknown) {
      console.error("[SUPPORTERS][offer save]", e);
      toast.error(e instanceof Error ? e.message : "Impossible d’enregistrer l’offre");
    } finally {
      setSaving(false);
    }
  };

  const deleteOffer = async (offer: SupporterOffer) => {
    if (!window.confirm(`Désactiver l’offre « ${offer.name} » ?`)) return;
    const res = await fetch(`/api/supporters/offers/${offer.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Impossible de retirer l’offre");
      return;
    }
    toast.success("Offre retirée");
    await loadAll();
  };

  const copyLink = async () => {
    if (!publicUrl) {
      toast.error("Configurez d’abord le slug de la page publique du club.");
      return;
    }
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Lien copié");
  };

  const downloadQr = () => {
    const svg =
      document.getElementById("supporters-public-qr") ||
      document.getElementById("supporters-notice-qr");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "supporters-obillz.png";
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const openDetail = async (row: Supporter) => {
    setSelected(row);
    setCardUrl(null);
    const res = await fetch(`/api/supporters/${row.id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setSelected(data.supporter);
      setCardUrl(data.cardUrl);
    }
  };

  const patchSupporter = async (id: string, body: Record<string, unknown>, okMsg: string) => {
    const res = await fetch(`/api/supporters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Action impossible");
      return;
    }
    toast.success(okMsg);
    setSelected(data.supporter);
    setCardUrl(data.cardUrl);
    await loadAll();
  };

  return (
    <PageLayout>
      <PageHeader
        title="Supporters"
        subtitle="Créez une communauté autour de votre club et développez une nouvelle source de revenus."
        actions={
          canManage ? (
            <DashboardPrimaryButton type="button" onClick={openCreateOffer}>
              Nouvelle offre
            </DashboardPrimaryButton>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenus supporters"
          value={formatChf(stats?.revenueCents || 0)}
          icon={Wallet}
          accent="electric"
        />
        <StatCard
          label="Supporters actifs"
          value={stats?.activeCount ?? "—"}
          icon={Users}
          accent="cyan"
        />
        <StatCard
          label="Ce mois"
          value={`+${stats?.newThisMonth ?? 0}`}
          icon={Heart}
          accent="royal"
        />
        <StatCard
          label="Offre principale"
          value={stats?.topOfferName || "—"}
          icon={CheckCircle}
          accent="navy"
        />
      </div>

      {publishedNotice && publicUrl ? (
        <GlassCard className="p-5">
          <p className="font-semibold">Votre offre est en ligne.</p>
          <p className={cn("mt-1 text-sm", dashboardTextSecondaryClass)}>
            Lien : {publicUrl.replace(/^https?:\/\//, "")}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-white p-2">
              <QRCodeSVG id="supporters-notice-qr" value={publicUrl} size={112} includeMargin />
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton variant="surface" type="button" onClick={copyLink}>
                <Copy className="h-4 w-4" /> Copier le lien
              </ActionButton>
              <ActionButton variant="surface" type="button" onClick={downloadQr}>
                <Download className="h-4 w-4" /> Télécharger le QR
              </ActionButton>
            </div>
          </div>
        </GlassCard>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              tab === item.id ? dashboardTabActiveClass : dashboardTabInactiveClass
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white" />
      ) : null}

      {!loading && tab === "offres" ? (
        offers.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Aucune offre pour le moment"
            description="Créez votre première offre Supporter et partagez-la avec votre communauté."
            action={
              canManage ? (
                <DashboardPrimaryButton type="button" onClick={openCreateOffer}>
                  Créer une offre
                </DashboardPrimaryButton>
              ) : null
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {offers.map((offer) => (
              <GlassCard key={offer.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{offer.name}</h3>
                      {offer.isFeatured ? (
                        <DashboardBadge variant="info">Mise en avant</DashboardBadge>
                      ) : null}
                      {!offer.isActive ? (
                        <DashboardBadge variant="neutral">Inactive</DashboardBadge>
                      ) : (
                        <DashboardBadge variant="success">En ligne</DashboardBadge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[#64748B]">
                      {formatChf(offer.priceCents)} · {durationLabel(offer)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-[#1A23FF]">
                    {offer.activeCount ?? 0} actif{(offer.activeCount || 0) > 1 ? "s" : ""}
                  </p>
                </div>
                {offer.description ? (
                  <p className="mt-3 text-sm text-[#64748B]">{offer.description}</p>
                ) : null}
                <ul className="mt-4 space-y-1.5 text-sm">
                  {offer.benefits.map((b) => (
                    <li key={b.id} className="flex gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>{b.label}</span>
                    </li>
                  ))}
                </ul>
                {canManage ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <ActionButton variant="surface" type="button" onClick={() => openEditOffer(offer)}>
                      <Edit className="h-4 w-4" /> Modifier
                    </ActionButton>
                    <ActionButton variant="ghost" type="button" onClick={() => deleteOffer(offer)}>
                      <Trash className="h-4 w-4" /> Retirer
                    </ActionButton>
                  </div>
                ) : null}
              </GlassCard>
            ))}
          </div>
        )
      ) : null}

      {!loading && tab === "supporters" ? (
        supporters.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun supporter pour le moment."
            description="Créez votre première offre et partagez-la avec votre communauté."
            action={
              canManage ? (
                <DashboardPrimaryButton type="button" onClick={openCreateOffer}>
                  Créer une offre
                </DashboardPrimaryButton>
              ) : null
            }
          />
        ) : (
          <TableCard
            title="Adhésions"
            toolbar={
              <div className="flex flex-wrap gap-2">
                <select
                  className={dashboardSelectClass}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                >
                  <option value="all">Tous</option>
                  <option value="active">Actifs</option>
                  <option value="pending">En attente</option>
                  <option value="expired">Expirés</option>
                  <option value="cancelled">Annulés</option>
                </select>
                <select
                  className={dashboardSelectClass}
                  value={offerFilter}
                  onChange={(e) => setOfferFilter(e.target.value)}
                >
                  <option value="all">Toutes les offres</option>
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
                <input
                  className={cn(dashboardInputClass, "min-w-[180px]")}
                  placeholder="Rechercher prénom, nom, e-mail"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className={dashboardDataTableClass}>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Offre</th>
                    <th>Montant</th>
                    <th>Début</th>
                    <th>Expiration</th>
                    <th>Statut</th>
                    <th>Visibilité publique</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSupporters.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer hover:bg-[#F8FAFC]"
                      onClick={() => void openDetail(row)}
                    >
                      <td className="font-medium">
                        {row.firstName} {row.lastName}
                      </td>
                      <td>{row.offerName || "—"}</td>
                      <td>{row.amountPaidCents != null ? formatChf(row.amountPaidCents) : "—"}</td>
                      <td>{formatSwissDate(row.startDate) || "—"}</td>
                      <td>{formatSwissDate(row.endDate) || "—"}</td>
                      <td>{statusBadge(supporterDisplayStatus(row))}</td>
                      <td>{row.publicNameEnabled ? "Oui" : "Non"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCard>
        )
      ) : null}

      {!loading && tab === "parametres" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-5">
            <h2 className="text-base font-semibold">Lien public</h2>
            <p className={cn("mt-1 text-sm", dashboardTextSecondaryClass)}>
              Partagez cette page dans la buvette, sur des affiches, Instagram ou pendant les matchs.
            </p>
            {publicUrl ? (
              <>
                <p className="mt-4 break-all rounded-xl bg-[#F8FAFC] px-4 py-3 text-sm">{publicUrl}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionButton variant="surface" type="button" onClick={copyLink}>
                    <Copy className="h-4 w-4" /> Copier le lien
                  </ActionButton>
                  <ActionButton variant="surface" type="button" onClick={downloadQr}>
                    <Download className="h-4 w-4" /> Télécharger le QR
                  </ActionButton>
                </div>
                <div className="mt-6 flex justify-center rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white p-4">
                  <QRCodeSVG id="supporters-public-qr" value={publicUrl} size={180} includeMargin />
                </div>
              </>
            ) : (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Définissez le slug de la page publique du club pour obtenir un lien partageable.
              </p>
            )}
          </GlassCard>
          <div className="space-y-4">
            {!paymentsReady ? (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                Configurez Stripe pour encaisser les adhésions directement sur le compte du club.
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                Les paiements supporters arrivent directement sur le compte Stripe du club. Obillz ne
                prélève aucune commission supplémentaire.
              </div>
            )}
            <ClubPaymentsPanel variant="shop" />
          </div>
        </div>
      ) : null}

      <SupporterOfferDialog
        open={isOfferModalOpen}
        mode={editing ? "edit" : "create"}
        form={form}
        saving={saving}
        onChange={setForm}
        onClose={closeOfferModal}
        onSubmit={() => void saveOffer()}
      />

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-[#071634]/40"
          onClick={() => setSelected(null)}
        >
          <div
            className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {selected.firstName} {selected.lastName}
              </h2>
              <button type="button" onClick={() => setSelected(null)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[#94A3B8]">E-mail</dt>
                <dd>{selected.email}</dd>
              </div>
              <div>
                <dt className="text-[#94A3B8]">Téléphone</dt>
                <dd>{selected.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-[#94A3B8]">Offre</dt>
                <dd>
                  {selected.offerName}{" "}
                  {selected.amountPaidCents != null ? `· ${formatChf(selected.amountPaidCents)}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-[#94A3B8]">Statut</dt>
                <dd>{statusBadge(supporterDisplayStatus(selected))}</dd>
              </div>
              <div>
                <dt className="text-[#94A3B8]">Numéro</dt>
                <dd>{formatSupporterNumberLabel(selected.supporterNumber) || "—"}</dd>
              </div>
              <div>
                <dt className="text-[#94A3B8]">Début</dt>
                <dd>{formatSwissDate(selected.startDate) || "—"}</dd>
              </div>
              <div>
                <dt className="text-[#94A3B8]">Expiration</dt>
                <dd>{formatSwissDate(selected.endDate) || "—"}</dd>
              </div>
            </dl>
            {canManage ? (
              <div className="mt-6 space-y-3">
                {cardUrl ? (
                  <ActionButton variant="premiumInline" href={cardUrl} className="w-full">
                    Voir la carte
                  </ActionButton>
                ) : null}
                <CheckboxRow
                  checked={selected.publicNameEnabled}
                  onChange={(next) =>
                    void patchSupporter(
                      selected.id,
                      { publicNameEnabled: next },
                      next ? "Visibilité publique activée" : "Visibilité publique désactivée"
                    )
                  }
                  label="Apparaître sur le mur des supporters"
                />
                {supporterDisplayStatus(selected) === "active" ? (
                  <ActionButton
                    variant="dangerSoft"
                    className="w-full"
                    type="button"
                    onClick={() =>
                      void patchSupporter(selected.id, { action: "disable" }, "Carte désactivée")
                    }
                  >
                    Désactiver la carte
                  </ActionButton>
                ) : selected.status === "cancelled" ? (
                  <ActionButton
                    variant="surface"
                    className="w-full"
                    type="button"
                    onClick={() =>
                      void patchSupporter(selected.id, { action: "enable" }, "Carte réactivée")
                    }
                  >
                    Réactiver la carte
                  </ActionButton>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </PageLayout>
  );
}
